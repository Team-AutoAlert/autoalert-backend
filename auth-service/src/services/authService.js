const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Auth = require('../models/Auth');
const userService = require('./userService');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class AuthService {
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    }

    async register(userData) {
        try {
            // Check if user already exists
            const existingAuth = await Auth.findOne({
                $or: [
                    { email: userData.email },
                    { phoneNumber: userData.phoneNumber }
                ]
            });
            
            if (existingAuth) {
                throw new Error('Email or phone number already registered');
            }

            // Create user in user-service
            const user = await userService.createUser({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                phoneNumber: userData.phoneNumber
            });

            // Generate verification tokens
            const emailToken = crypto.randomBytes(32).toString('hex');
            const phoneCode = this.generateVerificationCode();

            // Create auth record
            const auth = new Auth({
                userId: user.userId,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                password: userData.password,
                emailVerificationToken: emailToken,
                emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                phoneVerificationCode: phoneCode,
                phoneVerificationExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
            });
            await auth.save();

            // Send verification email and SMS
            await Promise.all([
                emailService.sendVerificationEmail(userData.email, emailToken),
                notificationService.sendVerificationSMS(userData.phoneNumber, phoneCode)
            ]);

            return {
                userId: user.userId,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                message: 'Verification email and SMS sent'
            };
        } catch (error) {
            logger.error('Registration failed:', error);
            throw error;
        }
    }

    async verifyEmail(token) {
        const auth = await Auth.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!auth) {
            throw new Error('Invalid or expired verification token');
        }

        auth.isEmailVerified = true;
        auth.emailVerificationToken = undefined;
        auth.emailVerificationExpires = undefined;

        // Activate account if both email and phone are verified
        if (auth.isPhoneVerified) {
            auth.isActive = true;
            await userService.updateUserStatus(auth.userId, 'active');
        }

        await auth.save();
        return { message: 'Email verified successfully' };
    }

    async verifyPhone(phoneNumber, code) {
        const auth = await Auth.findOne({
            phoneNumber,
            phoneVerificationCode: code,
            phoneVerificationExpires: { $gt: Date.now() }
        });

        if (!auth) {
            throw new Error('Invalid or expired verification code');
        }

        auth.isPhoneVerified = true;
        auth.phoneVerificationCode = undefined;
        auth.phoneVerificationExpires = undefined;

        // Activate account if both email and phone are verified
        if (auth.isEmailVerified) {
            auth.isActive = true;
            await userService.updateUserStatus(auth.userId, 'active');
        }

        await auth.save();
        return { message: 'Phone number verified successfully' };
    }

    async resendPhoneVerification(phoneNumber) {
        const auth = await Auth.findOne({ phoneNumber });
        if (!auth) {
            throw new Error('User not found');
        }

        if (auth.isPhoneVerified) {
            throw new Error('Phone number already verified');
        }

        const code = this.generateVerificationCode();
        auth.phoneVerificationCode = code;
        auth.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await auth.save();

        await notificationService.sendVerificationSMS(phoneNumber, code);
        return { message: 'Verification code sent' };
    }

    async login(email, password) {
        const auth = await Auth.findOne({ email });
        if (!auth) {
            throw new Error('Invalid credentials');
        }

        if (!auth.isActive) {
            throw new Error('Account not fully verified. Please verify both email and phone number.');
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

        await emailService.sendPasswordResetEmail(email, resetToken);

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
