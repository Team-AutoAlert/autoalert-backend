const admin = require('../config/firebase');
const logger = require('../utils/logger');
const axios = require('axios');
const { userServiceUrl } = require('../config/config');
const { AuthError } = require('../utils/errors');

class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      const { email, password, role, firstName, lastName, phoneNumber } = req.body;

      // Create user in Firebase
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        phoneNumber
      });

      // Set custom claims (role)
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      // Create user profile in user-service
      const userProfile = {
        userId: userRecord.uid,
        email,
        role,
        firstName,
        lastName,
        phoneNumber
      };

      // Call user-service to create profile
      await axios.post(`${userServiceUrl}/api/users`, userProfile);

      // Generate custom token
      const token = await admin.auth().createCustomToken(userRecord.uid);

      logger.info(`User registered successfully: ${userRecord.uid}`);

      res.status(201).json({
        message: 'Registration successful',
        userId: userRecord.uid,
        token
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(new AuthError('Registration failed', error));
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { idToken } = req.body;

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Get user details
      const userRecord = await admin.auth().getUser(decodedToken.uid);

      logger.info(`User logged in: ${userRecord.uid}`);

      res.json({
        userId: userRecord.uid,
        email: userRecord.email,
        role: decodedToken.role || 'driver',
        displayName: userRecord.displayName
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(new AuthError('Login failed', error));
    }
  }

  // Password reset
  async resetPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      await admin.auth().generatePasswordResetLink(email);
      
      logger.info(`Password reset link sent to: ${email}`);
      
      res.json({
        message: 'Password reset link sent successfully'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      next(new AuthError('Password reset failed', error));
    }
  }

  // Verify token
  async verifyToken(req, res) {
    try {
      const { token } = req.body;
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      res.json({
        valid: true,
        userId: decodedToken.uid,
        role: decodedToken.role
      });
    } catch (error) {
      logger.error('Token verification error:', error);
      res.json({ valid: false });
    }
  }

  // Update user role
  async updateRole(req, res, next) {
    try {
      const { userId, role } = req.body;
      
      // Update Firebase custom claims
      await admin.auth().setCustomUserClaims(userId, { role });
      
      // Update user-service
      await axios.put(`${userServiceUrl}/api/users/${userId}`, { role });
      
      logger.info(`Role updated for user: ${userId}`);
      
      res.json({
        message: 'Role updated successfully'
      });
    } catch (error) {
      logger.error('Role update error:', error);
      next(new AuthError('Role update failed', error));
    }
  }
}

module.exports = new AuthController(); 