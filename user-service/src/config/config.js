require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// Default to local MongoDB for development
const defaultMongoUri = 'mongodb://localhost:27017/autoalert';

// For production, use the Atlas connection string with the database name
const productionMongoUri = 'mongodb+srv://madhusase19028:2k2w6u5KTa5mn648@cluster-1.sgx6mzo.mongodb.net/user-service';

module.exports = {
  port: process.env.PORT || 3001,
  mongoUri: env === 'production' ? productionMongoUri : (process.env.MONGODB_URI || defaultMongoUri),
  env: env,
  serviceName: 'user-service'
};
