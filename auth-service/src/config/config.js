require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
  port: process.env.PORT || 3002,
  env: env,
  userServiceUrl: env === 'production' 
    ? 'https://autoalert-user-service-dtfedwetdvaahzft.eastus-01.azurewebsites.net/api'
    : (process.env.USER_SERVICE_URL || 'http://localhost:3001/api'),
  serviceRegistry: process.env.SERVICE_REGISTRY_URL,
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require('../../firebase-service-account.json')
  }
};

module.exports = config; 