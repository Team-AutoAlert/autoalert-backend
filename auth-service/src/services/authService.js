const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Auth = require('../models/Auth');
const userService = require('./userService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');
const logger = require('../utils/logger');

class AuthService {
    async register(userData) {
        try {
            // Check if user already exists
            const existingAuth = await Auth.findOne({ email: userData.email });
            if (existingAuth) {
                throw new Error('Email already registered');
            }

            // Create user in user-service
            const user = await userService.createUser({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                phoneNumber: userData.phoneNumber
            });

            // Create auth record
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const auth = new Auth({
                userId: user.userId,
                email: userData.email,
                password: userData.password,
                verificationToken,
                verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            });
            await auth.save();

            // Send verification email
            await sendVerificationEmail(userData.email, verificationToken);

            return { userId: user.userId, email: userData.email };
        } catch (error) {
            logger.error('Registration failed:', error);
            throw error;
        }
    }

    async verifyEmail(token) {
        const auth = await Auth.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!auth) {
            throw new Error('Invalid or expired verification token');
        }

        auth.isVerified = true;
        auth.verificationToken = undefined;
        auth.verificationExpires = undefined;
        await auth.save();

        // Update user status in user-service
        await userService.updateUserStatus(auth.userId, 'active');

        return { message: 'Email verified successfully' };
    }

    async login(email, password) {
        const auth = await Auth.findOne({ email });
        if (!auth) {
            throw new Error('Invalid credentials');
        }

        if (!auth.isVerified) {
            throw new Error('Please verify your email first');
        }

        if (auth.lockUntil && auth.lockUntil > Date.now()) {
            throw new Error('Account is temporarily locked');
        }

        const isMatch = await auth.comparePassword(password);
        if (!isMatch) {
            auth.loginAttempts += 1;
            if (auth.loginAttempts >= 5) {
                auth.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
            }
            await auth.save();
            throw new Error('Invalid credentials');
        }

        // Reset login attempts on successful login
        auth.loginAttempts = 0;
        auth.lastLogin = Date.now();
        await auth.save();

        const token = jwt.sign(
            { userId: auth.userId, email: auth.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { token, userId: auth.userId };
    }

    async requestPasswordReset(email) {
        const auth = await Auth.findOne({ email });
        if (!auth) {
            throw new Error('User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        auth.resetPasswordToken = resetToken;
        auth.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await auth.save();

        await sendPasswordResetEmail(email, resetToken);

        return { message: 'Password reset email sent' };
    }

    async resetPassword(token, newPassword) {
        const auth = await Auth.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!auth) {
            throw new Error('Invalid or expired reset token');
        }

        auth.password = newPassword;
        auth.resetPasswordToken = undefined;
        auth.resetPasswordExpires = undefined;
        await auth.save();

        return { message: 'Password reset successful' };
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const auth = await Auth.findOne({ userId: decoded.userId });
            if (!auth) {
                throw new Error('User not found');
            }
            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = new AuthService();
