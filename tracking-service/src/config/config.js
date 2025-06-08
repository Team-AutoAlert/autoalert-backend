require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    mongoUri: process.env.MONGODB_URI,
    
    // Service URLs
    userServiceUrl: process.env.USER_SERVICE_URL,
    
    // Google Maps settings
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    
    // Other settings
    maxDistance: process.env.MAX_DISTANCE || 5000, // 5km in meters
}; 