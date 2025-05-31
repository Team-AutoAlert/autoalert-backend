const logger = require('../utils/logger');
const { ValidationError, NotFoundError, S3Error, AuthorizationError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
  }

  if (err instanceof S3Error) {
    return res.status(500).json({
      error: 'S3 Error',
      message: err.message
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: 'Authorization Error',
      message: err.message
    });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
};

module.exports = errorHandler;
