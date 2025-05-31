require('dotenv').config();

const config = {
  port: process.env.PORT || 3002,
  env: process.env.NODE_ENV || 'development',
  userServiceUrl: process.env.USER_SERVICE_URL,
  serviceRegistry: process.env.SERVICE_REGISTRY_URL,
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
};

module.exports = config; 