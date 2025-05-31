class AuthError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.originalError = originalError;
  }
}

module.exports = {
  AuthError
}; 