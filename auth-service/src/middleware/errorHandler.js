const logger = require('../utils/logger');
const { AuthError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof AuthError) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: err.message
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
};

module.exports = errorHandler; 