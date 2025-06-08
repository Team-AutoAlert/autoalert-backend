const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { mongoUri } = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      dbName: 'user_service_db',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('User Service DB connected successfully');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
