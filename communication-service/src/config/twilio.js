const twilio = require('twilio');
const logger = require('../utils/logger');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Validate Twilio configuration
if (!accountSid || !authToken || !apiKey || !apiSecret) {
  logger.error('Missing Twilio credentials');
  process.exit(1);
}

logger.info('Twilio client initialized');

module.exports = {
  client,
  accountSid,
  authToken,
  apiKey,
  apiSecret
};
