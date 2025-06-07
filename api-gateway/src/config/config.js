require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    services: {
        auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
        user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
        order: process.env.ORDER_SERVICE_URL || 'http://localhost:3007',
        payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3008',
        tracking: process.env.TRACKING_SERVICE_URL || 'http://localhost:3006',
        notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
        tutorial: process.env.TUTORIAL_SERVICE_URL || 'http://localhost:3004',
        communication: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3003'
    },

    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
};

module.exports = config; 