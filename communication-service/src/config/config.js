require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3003,
  env: process.env.NODE_ENV || 'development',
  userServiceUrl: process.env.USER_SERVICE_URL,
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  serviceRegistry: process.env.SERVICE_REGISTRY_URL
};
