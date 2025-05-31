const { s3, bucket } = require('../config/aws');
const logger = require('../utils/logger');
const { S3Error } = require('../utils/errors');

class S3Service {
  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} key - S3 key (path)
   * @param {string} contentType - File content type
   * @returns {Promise<string>} - S3 URL
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
      return data.Location;
    } catch (error) {
      logger.error(`Error uploading file to S3: ${key}`, error);
      throw new S3Error('Failed to upload file to S3', error);
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
      throw new S3Error('Failed to delete file from S3', error);
    }
  }

  /**
   * Generate pre-signed URL for direct upload
   * @param {string} key - S3 key (path)
   * @param {string} contentType - File content type
   * @param {number} expiresIn - URL expiration time in seconds
   * @returns {Promise<string>} - Pre-signed URL
   */
  generatePresignedUrl(key, contentType, expiresIn = 3600) {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn
      };

      const url = s3.getSignedUrl('putObject', params);
      logger.info(`Pre-signed URL generated for S3: ${key}`);
      return url;
    } catch (error) {
      logger.error(`Error generating pre-signed URL for S3: ${key}`, error);
      throw new S3Error('Failed to generate pre-signed URL', error);
    }
  }

  /**
   * Get file from S3
   * @param {string} key - S3 key (path)
   * @returns {Promise<object>} - S3 object
   */
  async getFile(key) {
    try {
      const params = {
        Bucket: bucket,
        Key: key
      };

      const data = await s3.getObject(params).promise();
      logger.info(`File retrieved successfully from S3: ${key}`);
      return data;
    } catch (error) {
      logger.error(`Error retrieving file from S3: ${key}`, error);
      throw new S3Error('Failed to retrieve file from S3', error);
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
      throw new S3Error('Failed to generate temporary URL', error);
    }
  }
}

module.exports = new S3Service(); 