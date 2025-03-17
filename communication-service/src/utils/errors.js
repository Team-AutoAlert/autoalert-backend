class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class CommunicationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'CommunicationError';
    this.originalError = originalError;
  }
}

module.exports = {
  ValidationError,
  CommunicationError
}; 