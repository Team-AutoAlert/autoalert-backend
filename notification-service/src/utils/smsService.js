const twilio = require('twilio');
const logger = require('./logger');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: message,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        logger.info(`SMS sent to ${to}, SID: ${result.sid}`);
        return result;
    } catch (error) {
        logger.error('SMS sending failed:', error);
        throw error;
    }
};

module.exports = { sendSMS };
