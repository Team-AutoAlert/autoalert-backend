require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS SDK
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
};

console.log('Using AWS config:', {
  region: awsConfig.region,
  bucket: process.env.AWS_S3_BUCKET,
  // Don't log the full credentials
  accessKeyIdPrefix: awsConfig.accessKeyId ? awsConfig.accessKeyId.substring(0, 5) + "..." : "not set",
});

AWS.config.update(awsConfig);

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET;

async function testS3() {
  try {
    console.log('Testing S3 connectivity...');
    
    // Test if bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Successfully connected to bucket: ${bucketName}`);
    
    // List objects in bucket (limit to first 10)
    const data = await s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 10 }).promise();
    console.log(`Found ${data.Contents.length} objects in bucket`);
    
    console.log('S3 test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ S3 Error:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testS3().then(success => {
  if (!success) {
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify the S3 bucket exists in your AWS account');
    console.log('3. Ensure your IAM user has s3:ListBucket and s3:HeadBucket permissions');
  }
  
  // Exit the process when done
  process.exit(success ? 0 : 1);
});