const twilio = require('twilio');
const { client, apiKey, apiSecret, accountSid } = require('../config/twilio');
const logger = require('../utils/logger');
const { CommunicationError } = require('../utils/errors');

class TwilioService {
  /**
   * Create a video room
   * @param {string} roomName - Name of the room
   * @param {string} type - Type of room (group, p2p)
   * @returns {Promise<object>} - Room details
   */
  async createVideoRoom(roomName, type = 'group') {
    try {
      const room = await client.video.v1.rooms.create({
        uniqueName: roomName,
        type: type === 'p2p' ? 'peer-to-peer' : 'group',
        statusCallback: `${process.env.SERVICE_URL}/api/communications/room-status-callback`
      });

      logger.info(`Video room created: ${room.sid}`);
      return room;
    } catch (error) {
      logger.error('Error creating video room:', error);
      throw new CommunicationError('Failed to create video room', error);
    }
  }

  /**
   * Generate access token for video room
   * @param {string} identity - User identity
   * @param {string} roomName - Room name
   * @returns {string} - Access token
   */
  generateVideoToken(identity, roomName) {
    try {
      const AccessToken = twilio.jwt.AccessToken;
      const VideoGrant = AccessToken.VideoGrant;

      // Create an access token
      const token = new AccessToken(accountSid, apiKey, apiSecret);
      
      // Set the identity of the token
      token.identity = identity;

      // Grant access to Video
      const videoGrant = new VideoGrant({
        room: roomName
      });
      
      token.addGrant(videoGrant);

      logger.info(`Video token generated for user: ${identity}, room: ${roomName}`);
      return token.toJwt();
    } catch (error) {
      logger.error('Error generating video token:', error);
      throw new CommunicationError('Failed to generate video token', error);
    }
  }

  /**
   * Create a voice call
   * @param {string} to - Recipient phone number
   * @param {string} from - Sender phone number
   * @returns {Promise<object>} - Call details
   */
  async createVoiceCall(to, from) {
    try {
      const call = await client.calls.create({
        url: `${process.env.SERVICE_URL}/api/communications/voice-twiml`,
        to,
        from
      });

      logger.info(`Voice call initiated: ${call.sid}`);
      return call;
    } catch (error) {
      logger.error('Error creating voice call:', error);
      throw new CommunicationError('Failed to create voice call', error);
    }
  }

  /**
   * Generate voice TwiML
   * @param {string} message - Message to say
   * @returns {string} - TwiML
   */
  generateVoiceTwiML(message = 'Hello from AutoAlert. Connecting you now.') {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    response.say(message);
    response.pause({ length: 1 });
    
    logger.info('Voice TwiML generated');
    return response.toString();
  }

  /**
   * Generate access token for voice call
   * @param {string} identity - User identity
   * @returns {string} - Access token
   */
  generateVoiceToken(identity) {
    try {
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      // Create an access token
      const token = new AccessToken(accountSid, apiKey, apiSecret);
      
      // Set the identity of the token
      token.identity = identity;

      // Grant access to Voice
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_APP_SID,
        incomingAllow: true
      });
      
      token.addGrant(voiceGrant);

      logger.info(`Voice token generated for user: ${identity}`);
      return token.toJwt();
    } catch (error) {
      logger.error('Error generating voice token:', error);
      throw new CommunicationError('Failed to generate voice token', error);
    }
  }

  /**
   * Get room details
   * @param {string} roomSid - Room SID
   * @returns {Promise<object>} - Room details
   */
  async getRoomDetails(roomSid) {
    try {
      const room = await client.video.v1.rooms(roomSid).fetch();
      logger.info(`Room details fetched: ${roomSid}`);
      return room;
    } catch (error) {
      logger.error(`Error fetching room details for ${roomSid}:`, error);
      throw new CommunicationError('Failed to fetch room details', error);
    }
  }

  /**
   * End a video room
   * @param {string} roomSid - Room SID
   * @returns {Promise<object>} - Room details
   */
  async endRoom(roomSid) {
    try {
      const room = await client.video.v1.rooms(roomSid).update({ status: 'completed' });
      logger.info(`Room ended: ${roomSid}`);
      return room;
    } catch (error) {
      logger.error(`Error ending room ${roomSid}:`, error);
      throw new CommunicationError('Failed to end room', error);
    }
  }
}

module.exports = new TwilioService();
