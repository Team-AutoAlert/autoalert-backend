const axios = require('axios');
const logger = require('../utils/logger');

class UserServiceClient {
    constructor() {
        this.baseURL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    }

    async createUser(userData) {
        try {
            const response = await axios.post(`${this.baseURL}/api/users`, userData);
            return response.data;
        } catch (error) {
            logger.error('User creation failed:', error.message);
            throw new Error('User creation failed');
        }
    }

    async getUserByEmail(email) {
        try {
            const response = await axios.get(`${this.baseURL}/api/users/email/${email}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    async updateUserStatus(userId, status) {
        try {
            const response = await axios.patch(`${this.baseURL}/api/users/${userId}/status`, { status });
            return response.data;
        } catch (error) {
            logger.error('User status update failed:', error.message);
            throw new Error('User status update failed');
        }
    }
}

module.exports = new UserServiceClient();
