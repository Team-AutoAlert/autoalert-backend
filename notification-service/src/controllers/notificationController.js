const notificationService = require('../services/notificationService');
const { validateDevice, validateNotification, validateBulkNotification } = require('../utils/validation');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const verificationCodes = new Map(); // In production, use Redis or a database

class NotificationController {
    constructor() {
        // Initialize email transporter
        this.emailTransporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Initialize Twilio client
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Bind methods to the instance
        this.sendVerification = this.sendVerification.bind(this);
        this.sendEmailVerification = this.sendEmailVerification.bind(this);
        this.sendSMSVerification = this.sendSMSVerification.bind(this);
    }

    async registerDevice(req, res) {
        try {
            const { error } = validateDevice(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userId, phoneNumber } = req.body;
            const device = await notificationService.registerDevice(userId, phoneNumber);
            res.status(201).json(device);
        } catch (error) {
            logger.error('Error in registerDevice:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendNotification(req, res) {
        try {
            const { error } = validateNotification(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userId, message } = req.body;
            const result = await notificationService.sendSMS(userId, message);
            res.json(result);
        } catch (error) {
            logger.error('Error in sendNotification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendBulkNotification(req, res) {
        try {
            const { error } = validateBulkNotification(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userIds, message } = req.body;
            const result = await notificationService.sendBulkSMS(userIds, message);
            res.json(result);
        } catch (error) {
            logger.error('Error in sendBulkNotification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendVerification(req, res) {
        try {
            const { userId, email, phoneNumber, emailVerificationLink } = req.body;

            logger.info(`Sending verification notifications to user: ${userId}`);

            // Send email verification
            await this.sendEmailVerification(email, emailVerificationLink);
            logger.info(`Email verification sent to: ${email}`);

            // Send SMS verification
            await this.sendSMSVerification(phoneNumber);
            logger.info(`SMS verification sent to: ${phoneNumber}`);

            res.json({
                success: true,
                message: 'Verification notifications sent successfully'
            });
        } catch (error) {
            logger.error('Error sending verification:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send verification notifications',
                message: error.message
            });
        }
    }

    async sendEmailVerification(email, verificationLink) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify Your Email - Auto Alert',
                html: `
                    <h1>Welcome to Auto Alert!</h1>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="${verificationLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>If you didn't create an account, you can safely ignore this email.</p>
                    <p>This link will expire in 24 hours.</p>
                `
            };

            await this.emailTransporter.sendMail(mailOptions);
            logger.info(`Verification email sent successfully to: ${email}`);
        } catch (error) {
            logger.error(`Failed to send verification email to ${email}:`, error);
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
    }

    async sendSMSVerification(phoneNumber) {
        try {
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store the code (in production, use Redis or a database)
            verificationCodes.set(phoneNumber, {
                code: verificationCode,
                timestamp: Date.now()
            });

            await this.twilioClient.messages.create({
                body: `Your Auto Alert verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });

            logger.info(`Verification SMS sent successfully to: ${phoneNumber}`);
        } catch (error) {
            logger.error(`Failed to send verification SMS to ${phoneNumber}:`, error);
            throw new Error(`Failed to send verification SMS: ${error.message}`);
        }
    }
}

module.exports = new NotificationController();
