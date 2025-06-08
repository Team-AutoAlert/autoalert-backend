class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class S3Error extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'S3Error';
    this.originalError = originalError;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  S3Error,
  AuthorizationError
}; 