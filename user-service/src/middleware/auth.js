const authService = require('../services/authService');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = await authService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Authentication failed:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authenticate;
