const admin = require('../config/firebase');
const logger = require('../utils/logger');
const { AuthError } = require('../utils/errors');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      throw new AuthError('No token provided');
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AuthError('Unauthorized access');
    }
    next();
  };
};

module.exports = { verifyToken, checkRole }; 
