require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3004,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  userServiceUrl: process.env.USER_SERVICE_URL,
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  serviceRegistry: process.env.SERVICE_REGISTRY_URL,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET
  }
}; 