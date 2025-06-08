require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI,
  env: process.env.NODE_ENV || 'development',
  serviceName: 'user-service'
};
