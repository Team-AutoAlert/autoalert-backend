const logger = require('../utils/logger');
const { SOSAlertError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        error: err
    });

    // Handle known errors
    if (err instanceof SOSAlertError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry error',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Handle axios errors
    if (err.isAxiosError) {
        return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Handle all other errors
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorHandler; 