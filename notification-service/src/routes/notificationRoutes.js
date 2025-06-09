const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const VerificationCode = require('../models/VerificationCode');
const logger = require('../utils/logger');
const { sendSMS } = require('../utils/smsService');
const { sendEmail } = require('../utils/emailService');
const mongoose = require('mongoose');
const admin = require('../config/firebase');

// Device registration
router.post('/devices', notificationController.registerDevice);

// Send notifications
router.post('/send', notificationController.sendNotification);
router.post('/send/bulk', notificationController.sendBulkNotification);

// Test Firebase setup
router.post('/test-firebase', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'FCM token is required'
            });
        }

        // Send a test message
        const message = {
            notification: {
                title: 'Test Notification',
                body: 'This is a test notification from Auto Alert'
            },
            data: {
                type: 'test',
                timestamp: new Date().toISOString()
            },
            token: token
        };

        const result = await admin.messaging().send(message);
        
        res.json({
            success: true,
            messageId: result,
            message: 'Test notification sent successfully'
        });
    } catch (error) {
        logger.error('Test notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verification routes
router.post('/send-verification', async (req, res) => {
    try {
        const { userId, phoneNumber, email, emailVerificationLink, resendSMSOnly, resendEmailOnly } = req.body;
        
        // Generate SMS code only
        const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Send SMS verification if phone number is provided and not email-only
        if (phoneNumber && !resendEmailOnly) {
            // Save SMS code
            const smsVerification = new VerificationCode({
                userId,
                code: smsCode,
                type: 'sms'
            });
            await smsVerification.save();

            // Send SMS
            await sendSMS(phoneNumber, `Your AutoAlert verification code is: ${smsCode}`);
            logger.info(`SMS verification code sent to ${phoneNumber}`);
        }

        // Send email verification if email is provided and not sms-only
        if (email && !resendSMSOnly && emailVerificationLink) {
            // Send email with verification link
            await sendEmail(
                email,
                'Verify Your Email - Auto Alert',
                `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer { color: #666; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Auto Alert!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${emailVerificationLink}" class="button">Verify Email</a>
        <p class="footer">If you didn't create an account, you can safely ignore this email.<br>
        This link will expire in 24 hours.</p>
    </div>
</body>
</html>`
            );
            logger.info(`Email verification link sent to ${email}`);
        }

        res.json({
            success: true,
            message: 'Verification code(s) sent successfully'
        });

    } catch (error) {
        logger.error('Send verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send verification code',
            message: error.message
        });
    }
});

// Verify SMS code
router.post('/verify-sms', async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                message: 'userId and code are required'
            });
        }
        
        // Find the verification code
        const storedCode = await VerificationCode.findOne({ 
            userId,
            code,
            type: 'sms',
            isUsed: false,
            createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } // Check if code is not expired (10 minutes)
        });

        if (!storedCode) {
            logger.info(`Invalid or expired code attempt for userId: ${userId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code. Please request a new code.'
            });
        }

        // Mark code as used
        storedCode.isUsed = true;
        await storedCode.save();

        logger.info(`Phone verification successful for userId: ${userId}`);
        
        res.json({
            success: true,
            verified: true,
            message: 'Phone number verified successfully'
        });
    } catch (error) {
        logger.error('SMS verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
        });
    }
});

// Verify email code
router.post('/verify-email', async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                message: 'userId and code are required'
            });
        }

        const storedCode = await VerificationCode.findOne({
            userId,
            code,
            type: 'email',
            isUsed: false
        });

        if (!storedCode) {
            return res.json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        storedCode.isUsed = true;
        await storedCode.save();

        res.json({
            success: true,
            verified: true,
            message: 'Code verified successfully'
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
        });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

// Debug endpoint for MongoDB connection status
router.get('/debug/mongodb', (req, res) => {
    try {
        const connectionState = {
            readyState: mongoose.connection.readyState,
            stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
            database: mongoose.connection.db?.databaseName || 'not connected',
            host: mongoose.connection.host || 'not connected',
            uri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'not set'
        };

        // Get all collections
        if (mongoose.connection.db) {
            mongoose.connection.db.listCollections().toArray((err, collections) => {
                if (err) {
                    logger.error('Error listing collections:', err);
                    connectionState.collections = `Error: ${err.message}`;
                } else {
                    connectionState.collections = collections.map(c => c.name);
                }
                res.json(connectionState);
            });
        } else {
            connectionState.collections = [];
            res.json(connectionState);
        }
    } catch (error) {
        logger.error('Error in debug endpoint:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
