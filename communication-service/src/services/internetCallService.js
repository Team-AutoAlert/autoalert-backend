const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const logger = require('../utils/logger');
const { CommunicationError } = require('../utils/errors');
let agoraConfig;

try {
  agoraConfig = require('../config/agora');
} catch (error) {
  logger.error('Failed to load Agora configuration:', error);
}

class InternetCallService {
  constructor() {
    if (!agoraConfig) {
      logger.warn('InternetCallService initialized without Agora configuration');
    }
  }

  /**
   * Generate a token for Agora RTC
   * @param {string} channelName - Unique channel name for the call
   * @param {string} uid - User ID (number as string)
   * @param {string} role - User role (publisher/subscriber)
   * @param {string} mediaType - Type of media (audio/video)
   * @returns {string} - Access token
   */
  generateToken(channelName, uid, role = 'publisher', mediaType = 'audio') {
    try {
      if (!agoraConfig) {
        throw new CommunicationError(
          'Agora configuration not available',
          'Please check your environment variables and server logs'
        );
      }

      if (!channelName || !uid) {
        throw new CommunicationError(
          'Invalid parameters',
          'Channel name and user ID are required'
        );
      }

      // Set token expiry (1 hour from now)
      const expirationTimeInSeconds = 3600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      // Generate token with appropriate privileges based on media type
      const token = RtcTokenBuilder.buildTokenWithUid(
        agoraConfig.appId,
        agoraConfig.appCertificate,
        channelName,
        parseInt(uid),
        role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
        privilegeExpiredTs
      );

      logger.info(`Agora ${mediaType} token generated for channel: ${channelName}, uid: ${uid}`);
      return token;
    } catch (error) {
      logger.error('Error generating Agora token:', error);
      throw new CommunicationError(
        'Failed to generate Agora token',
        error.message || 'Check server logs for details'
      );
    }
  }

  /**
   * Initialize a call session
   * @param {string} channelName - Unique channel name for the call
   * @param {Object} participants - Object containing participant details
   * @param {string} mediaType - Type of media (audio/video)
   * @returns {Object} - Call session details
   */
  async initializeCallSession(channelName, participants, mediaType = 'audio') {
    try {
      if (!channelName || !participants) {
        throw new CommunicationError(
          'Invalid parameters',
          'Channel name and participants are required'
        );
      }

      if (!['audio', 'video'].includes(mediaType)) {
        throw new CommunicationError(
          'Invalid media type',
          'Media type must be either audio or video'
        );
      }

      const callSession = {
        channelName,
        participants: {},
        startTime: new Date().toISOString(),
        mediaType
      };

      // Generate tokens for each participant
      for (const [role, userId] of Object.entries(participants)) {
        if (!userId) {
          throw new CommunicationError(
            'Invalid participant',
            `User ID is required for role: ${role}`
          );
        }

        const token = this.generateToken(channelName, userId, role, mediaType);
        callSession.participants[userId] = {
          token,
          role,
          uid: userId
        };
      }

      logger.info(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} call session initialized: ${channelName}`);
      return callSession;
    } catch (error) {
      logger.error('Error initializing call session:', error);
      throw new CommunicationError(
        'Failed to initialize call session',
        error.message || 'Check server logs for details'
      );
    }
  }

  /**
   * Add participant to existing call
   * @param {string} channelName - Channel name of existing call
   * @param {string} userId - User ID of new participant
   * @param {string} role - Role of new participant
   * @param {string} mediaType - Type of media (audio/video)
   * @returns {Object} - Participant details with token
   */
  async addParticipant(channelName, userId, role = 'publisher', mediaType = 'audio') {
    try {
      if (!channelName || !userId) {
        throw new CommunicationError(
          'Invalid parameters',
          'Channel name and user ID are required'
        );
      }

      if (!['audio', 'video'].includes(mediaType)) {
        throw new CommunicationError(
          'Invalid media type',
          'Media type must be either audio or video'
        );
      }

      const token = this.generateToken(channelName, userId, role, mediaType);
      
      const participantDetails = {
        token,
        role,
        uid: userId,
        channelName,
        mediaType
      };

      logger.info(`Participant added to ${mediaType} call: ${channelName}, uid: ${userId}`);
      return participantDetails;
    } catch (error) {
      logger.error('Error adding participant:', error);
      throw new CommunicationError(
        'Failed to add participant',
        error.message || 'Check server logs for details'
      );
    }
  }
}

module.exports = new InternetCallService(); 