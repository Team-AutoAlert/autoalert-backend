const admin = require('../config/firebase');
const logger = require('../utils/logger');
const axios = require('axios');
const { userServiceUrl } = require('../config/config');
const { AuthError } = require('../utils/errors');

const register = async (req, res) => {
    let firebaseUser = null;
    try {
        const { userId, email, password, role, firstName, lastName, phoneNumber } = req.body;

        logger.info(`Attempting to create user with ID: ${userId}`);

        // Create user in Firebase
        firebaseUser = await admin.auth().createUser({
            uid: userId,
            email,
            password,
            displayName: `${firstName} ${lastName}`,
            phoneNumber,
            emailVerified: false
        });

        logger.info(`Firebase user created successfully: ${userId}`);

        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, { role });

        // Prepare user profile
        const userProfile = {
            userId,
            email,
            role,
            firstName,
            lastName,
            phoneNumber,
            status: 'inactive',
            location: {
                type: 'Point',
                coordinates: [0, 0]
            }
        };

        logger.info(`Attempting to create user profile in user service for: ${userId}`);

        // Create user in user service
        const userServiceResponse = await axios.post(
            `${process.env.USER_SERVICE_URL}/api/users`,
            userProfile
        );

        logger.info(`User profile created successfully in user service: ${userId}`);

        // Generate verification link
        const emailVerificationLink = await admin.auth().generateEmailVerificationLink(email);

        // Try to send verification email/SMS
        try {
            await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send-verification`, {
                userId,
                email,
                phoneNumber,
                emailVerificationLink
            });
            logger.info(`Verification notifications sent for user: ${userId}`);
        } catch (notificationError) {
            logger.error(`Failed to send verification notifications: ${notificationError.message}`);
            // Continue with registration even if notification fails
        }

        // Generate custom token
        const token = await admin.auth().createCustomToken(userId);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email and phone for verification.',
            userId,
            token,
            user: userServiceResponse.data
        });

    } catch (error) {
        logger.error('Registration error:', error);

        // Cleanup if Firebase user was created but other steps failed
        if (firebaseUser) {
            try {
                await admin.auth().deleteUser(firebaseUser.uid);
                logger.info(`Cleaned up Firebase user after failed registration: ${firebaseUser.uid}`);
            } catch (cleanupError) {
                logger.error('Failed to cleanup Firebase user:', cleanupError);
            }
        }

        // Send detailed error response
        const errorMessage = error.response?.data?.message || error.message;
        res.status(400).json({
            success: false,
            error: 'Registration failed',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get the user from Firebase
        const userRecord = await admin.auth().getUserByEmail(email);

        // Check if email is verified
        if (!userRecord.emailVerified) {
            return res.status(403).json({
                success: false,
                error: 'Account not verified',
                message: 'Please verify your email before logging in'
            });
        }

        // Generate custom token for login
        const token = await admin.auth().createCustomToken(userRecord.uid);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                userId: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: userRecord.customClaims?.role || 'driver'
            }
        });
    } catch (error) {
        logger.error('Login failed:', error);
        res.status(400).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;

        // Get the user record by email
        const userRecord = await admin.auth().getUserByEmail(email);

        // Check if email is already verified
        if (userRecord.emailVerified) {
            // Update user status in user service
            await axios.patch(`${userServiceUrl}/api/users/${userRecord.uid}/verify-email`, {
                verified: true
            });

            return res.json({
                success: true,
                message: 'Email verified successfully'
            });
        }

        // If not verified, generate a new verification link
        const emailVerificationLink = await admin.auth().generateEmailVerificationLink(email);
        
        // Send the verification link
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send-verification`, {
            userId: userRecord.uid,
            email,
            emailVerificationLink,
            resendEmailOnly: true
        });

        res.status(400).json({
            success: false,
            message: 'Email not verified. A new verification link has been sent to your email.'
        });
    } catch (error) {
        logger.error('Email verification check failed:', error);
        res.status(400).json({
            success: false,
            error: 'Email verification failed',
            message: error.message
        });
    }
};

const verifyPhone = async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                error: 'Both userId and code are required'
            });
        }

        // First verify the code with notification service
        const verifyResponse = await axios.post(
            `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/verify-sms`,
            {
                userId,
                code
            }
        );

        if (!verifyResponse.data.success) {
            return res.status(400).json({
                success: false,
                message: verifyResponse.data.message || 'Invalid verification code'
            });
        }

        // If code is valid, update user's phone verification status
        const userResponse = await axios.patch(
            `${process.env.USER_SERVICE_URL}/api/users/${userId}/verify-phone`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
                }
            }
        );

        if (!userResponse.data.success) {
            throw new Error('Failed to update user verification status');
        }

        res.json({
            success: true,
            message: 'Phone number verified successfully',
            data: userResponse.data.data
        });

    } catch (error) {
        logger.error('Phone verification failed:', error);
        res.status(error.response?.status || 500).json({
            success: false,
            error: 'Phone verification failed',
            message: error.response?.data?.message || error.message
        });
    }
};

// Add method to validate phone verification code
const validatePhoneVerificationCode = async (userId, code) => {
    try {
        // For testing purposes, accept any 6-digit code
        // In production, you should implement proper code verification
        return code.length === 6 && /^\d+$/.test(code);
    } catch (error) {
        logger.error('Code validation failed:', error);
        return false;
    }
};

// Password reset
const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Generate password reset link
        await admin.auth().generatePasswordResetLink(email);
        
        res.json({
            success: true,
            message: 'Password reset link sent to your email'
        });
    } catch (error) {
        logger.error('Password reset failed:', error);
        res.status(400).json({
            success: false,
            error: 'Password reset failed',
            message: error.message
        });
    }
};

// Verify token
const verifyToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        res.json({
            valid: true,
            userId: decodedToken.uid,
            role: decodedToken.role || 'driver'
        });
    } catch (error) {
        logger.error('Token verification error:', error);
        res.json({ 
            valid: false,
            error: 'Invalid token'
        });
    }
};

// Update user role
const updateRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        
        // Update Firebase custom claims
        await admin.auth().setCustomUserClaims(userId, { role });
        
        // Update user-service
        await axios.put(`${process.env.USER_SERVICE_URL}/api/users/${userId}`, { role });
        
        logger.info(`Role updated for user: ${userId}`);
        
        res.json({
            success: true,
            message: 'Role updated successfully'
        });
    } catch (error) {
        logger.error('Role update error:', error);
        res.status(400).json({
            success: false,
            error: 'Role update failed',
            message: error.message
        });
    }
};

const resendPhoneVerification = async (req, res) => {
    try {
        const { userId, phoneNumber } = req.body;

        // Send verification email and SMS
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send-verification`, {
            userId,
            phoneNumber,
            resendSMSOnly: true // This flag tells notification service to only send SMS
        });

        res.json({
            success: true,
            message: 'Verification code resent successfully'
        });
    } catch (error) {
        logger.error('Resend verification failed:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to resend verification code',
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    verifyPhone,
    verifyToken,
    resetPassword,
    updateRole,
    resendPhoneVerification
}; 