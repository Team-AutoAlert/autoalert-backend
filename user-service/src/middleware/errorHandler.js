const logger = require('../utils/logger');
const { ValidationError, UserNotFoundError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err instanceof UserNotFoundError) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
};

module.exports = errorHandler; 