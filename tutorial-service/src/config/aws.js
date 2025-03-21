const AWS = require('aws-sdk');
const logger = require('../utils/logger');
const { aws } = require('./config');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: aws.accessKeyId,
  secretAccessKey: aws.secretAccessKey,
  region: aws.region
});

// Create S3 service object
const s3 = new AWS.S3();

// Verify S3 configuration
const verifyS3Configuration = async () => {
  try {
    await s3.headBucket({ Bucket: aws.s3Bucket }).promise();
    logger.info(`AWS S3 bucket '${aws.s3Bucket}' connected successfully`);
  } catch (error) {
    logger.error(`AWS S3 bucket '${aws.s3Bucket}' connection error:`, error);
    process.exit(1);
  }
};

// Initialize AWS
const initAWS = async () => {
  try {
    await verifyS3Configuration();
  } catch (error) {
    logger.error('AWS initialization error:', error);
    process.exit(1);
  }
};

// Call initAWS but don't wait for it, to prevent blocking app startup
initAWS();

module.exports = {
  s3,
  bucket: aws.s3Bucket
}; 
