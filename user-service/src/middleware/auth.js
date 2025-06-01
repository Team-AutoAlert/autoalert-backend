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

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'No authorization header'
            });
        }

        // Check for internal API key
        if (authHeader === `Bearer ${process.env.INTERNAL_API_KEY}`) {
            return next();
        }

        return res.status(401).json({
            success: false,
            error: 'Invalid authorization'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: error.message
        });
    }
};

module.exports = { authenticate, auth };
