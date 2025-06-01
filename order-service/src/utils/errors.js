class SOSAlertError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'SOSAlertError';
        this.statusCode = statusCode;
    }
}

class ValidationError extends SOSAlertError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class NotFoundError extends SOSAlertError {
    constructor(message) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

class ServiceUnavailableError extends SOSAlertError {
    constructor(message) {
        super(message, 503);
        this.name = 'ServiceUnavailableError';
    }
}

module.exports = {
    SOSAlertError,
    ValidationError,
    NotFoundError,
    ServiceUnavailableError
}; 