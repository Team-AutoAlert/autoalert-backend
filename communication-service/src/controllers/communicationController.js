const twilioService = require('../services/twilioService');
const internetCallService = require('../services/internetCallService');
const logger = require('../utils/logger');
const axios = require('axios');
const { userServiceUrl, authServiceUrl } = require('../config/config');
const { validateRoomRequest, validateCallRequest } = require('../middleware/validation');

class CommunicationController {
  /**
   * Create a video room and generate access token
   */
  async createVideoRoom(req, res, next) {
    try {
      const { roomName, userId, role, type } = await validateRoomRequest(req.body);
      
      // Verify user exists
      try {
        await axios.get(`${userServiceUrl}/api/users/${userId}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create room
      const room = await twilioService.createVideoRoom(roomName, type);
      
      // Generate token
      const identity = `${userId}-${role}`;
      const token = twilioService.generateVideoToken(identity, roomName);

      res.status(201).json({
        roomSid: room.sid,
        roomName: room.uniqueName,
        token,
        identity
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Join an existing video room
   */
  async joinVideoRoom(req, res, next) {
    try {
      const { roomName, userId, role } = await validateRoomRequest(req.body);
      
      // Verify user exists
      try {
        await axios.get(`${userServiceUrl}/api/users/${userId}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate token
      const identity = `${userId}-${role}`;
      const token = twilioService.generateVideoToken(identity, roomName);

      res.json({
        roomName,
        token,
        identity
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * End a video room
   */
  async endVideoRoom(req, res, next) {
    try {
      const { roomSid } = req.params;
      
      const room = await twilioService.endRoom(roomSid);
      
      res.json({
        roomSid: room.sid,
        status: room.status,
        message: 'Room ended successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiate a call (traditional or internet)
   */
  async initiateVoiceCall(req, res, next) {
    try {
      const { to, from, userId, callType, mediaType, channelName, participants } = await validateCallRequest(req.body);
      
      // Verify user exists
      try {
        await axios.get(`${userServiceUrl}/api/users/${userId}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      let callResponse;
      if (callType === 'agora') {
        // For Agora calls, initialize a call session
        callResponse = await internetCallService.initializeCallSession(channelName, participants, mediaType);
        res.status(201).json({
          channelName: callResponse.channelName,
          participants: callResponse.participants,
          startTime: callResponse.startTime,
          callType,
          mediaType: callResponse.mediaType
        });
      } else {
        // For traditional calls, use Twilio
        const call = await twilioService.createVoiceCall(to, from);
        res.status(201).json({
          callSid: call.sid,
          status: call.status,
          direction: call.direction,
          from: call.from,
          to: call.to,
          callType: 'traditional',
          mediaType: 'audio'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Join an existing internet call
   */
  async joinInternetCall(req, res, next) {
    try {
      const { channelName, userId, role, mediaType } = req.body;

      // Verify user exists
      try {
        await axios.get(`${userServiceUrl}/api/users/${userId}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      const participantDetails = await internetCallService.addParticipant(channelName, userId, role, mediaType);
      
      res.json({
        ...participantDetails,
        callType: 'agora'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate voice TwiML for incoming calls
   */
  async generateVoiceTwiML(req, res, next) {
    try {
      const { message } = req.query;
      const twiml = twilioService.generateVoiceTwiML(message);
      
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate voice token for client (traditional or internet)
   */
  async getVoiceToken(req, res, next) {
    try {
      const { userId, role, callType = 'traditional' } = req.body;
      
      // Verify user exists
      try {
        await axios.get(`${userServiceUrl}/api/users/${userId}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      const identity = `${userId}-${role}`;
      const token = callType === 'whatsapp' 
        ? internetCallService.generateInternetCallToken(identity)
        : twilioService.generateVoiceToken(identity);
      
      res.json({
        token,
        identity,
        callType
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Room status callback
   */
  async roomStatusCallback(req, res, next) {
    try {
      const { RoomSid, RoomName, RoomStatus } = req.body;
      
      logger.info(`Room status update: ${RoomName} (${RoomSid}) - ${RoomStatus}`);
      
      // Store room status in database or notify other services if needed
      
      res.status(200).send();
    } catch (error) {
      logger.error('Error in room status callback:', error);
      res.status(200).send(); // Always return 200 to Twilio
    }
  }

  /**
   * Get room details
   */
  async getRoomDetails(req, res, next) {
    try {
      const { roomSid } = req.params;
      
      const room = await twilioService.getRoomDetails(roomSid);
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommunicationController();
