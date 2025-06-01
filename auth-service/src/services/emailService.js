const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendVerificationEmail(email, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Verify Your Email',
            html: `
                <h1>Welcome to AutoAlert!</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Verification email sent to ${email}`);
        } catch (error) {
            logger.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    async sendPasswordResetEmail(email, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Reset Your Password',
            html: `
                <h1>Password Reset Request</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to ${email}`);
        } catch (error) {
            logger.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }
}

module.exports = new EmailService();
