const AWS = require('aws-sdk');
const logger = require('../utils/logger');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const bucket = process.env.AWS_S3_BUCKET;

class S3Service {
  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} key - S3 key (path)
   * @param {string} contentType - File content type
   * @returns {Promise<{url: string, key: string}>} - S3 URL and key
   */
  async uploadFile(fileBuffer, key, contentType) {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
      };

      const data = await s3.upload(params).promise();
      logger.info(`File uploaded successfully to S3: ${key}`);
      return {
        url: data.Location,
        key: key
      };
    } catch (error) {
      logger.error(`Error uploading file to S3: ${key}`, error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Delete file from S3
   * @param {string} key - S3 key (path)
   * @returns {Promise<void>}
   */
  async deleteFile(key) {
    try {
      const params = {
        Bucket: bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
      logger.info(`File deleted successfully from S3: ${key}`);
    } catch (error) {
      logger.error(`Error deleting file from S3: ${key}`, error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate temporary URL for file access
   * @param {string} key - S3 key (path)
   * @param {number} expiresIn - URL expiration time in seconds
   * @returns {string} - Temporary URL
   */
  generateTemporaryUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: expiresIn
      };

      const url = s3.getSignedUrl('getObject', params);
      logger.info(`Temporary URL generated for S3: ${key}`);
      return url;
    } catch (error) {
      logger.error(`Error generating temporary URL for S3: ${key}`, error);
      throw new Error('Failed to generate temporary URL');
    }
  }
}

module.exports = new S3Service(); 