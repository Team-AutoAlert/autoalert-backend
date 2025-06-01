const axios = require('axios');
const logger = require('../utils/logger');

class AuthServiceClient {
    constructor() {
        this.baseURL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
    }

    async verifyToken(token) {
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/verify-token`, { token });
            return response.data;
        } catch (error) {
            logger.error('Token verification failed:', error.message);
            throw new Error('Token verification failed');
        }
    }

    async validateUser(userId) {
        try {
            const response = await axios.get(`${this.baseURL}/api/auth/validate-user/${userId}`);
            return response.data;
        } catch (error) {
            logger.error('User validation failed:', error.message);
            throw new Error('User validation failed');
        }
    }
}

module.exports = new AuthServiceClient();
