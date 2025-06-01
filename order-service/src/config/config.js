require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    mongoUri: process.env.MONGO_URI,
    
    // Service URLs
    authServiceUrl: process.env.AUTH_SERVICE_URL,
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL,
    communicationServiceUrl: process.env.COMMUNICATION_SERVICE_URL,
    userServiceUrl: process.env.USER_SERVICE_URL,
    paymentServiceUrl: process.env.PAYMENT_SERVICE_URL,
    trackingServiceUrl: process.env.TRACKING_SERVICE_URL,
    
    // JWT settings
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    
    // Rate settings
    baseRatePerMinute: process.env.BASE_RATE_PER_MINUTE,
    
    // Timeout settings
    mechanicResponseTimeout: process.env.MECHANIC_RESPONSE_TIMEOUT || 30000, // 30 seconds
    
    // Other settings
    maxRetries: process.env.MAX_RETRIES || 3,
    retryDelay: process.env.RETRY_DELAY || 1000 // 1 second
}; 