const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: html
        });
        logger.info(`Email sent to ${to}`);
        return result;
    } catch (error) {
        logger.error('Email sending failed:', error);
        throw error;
    }
};

module.exports = { sendEmail };
