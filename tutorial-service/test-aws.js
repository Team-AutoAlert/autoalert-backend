require('dotenv').config();
const AWS = require('aws-sdk');

// Function to test AWS S3 connectivity
async function testAwsS3() {
  console.log('AWS S3 Connection Test');
  console.log('=====================');
  
  // 1. Check if AWS credentials exist
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in .env file');
    console.log('Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your .env file');
    return false;
  }
  
  // 2. Check if bucket name exists
  if (!process.env.AWS_S3_BUCKET) {
    console.error('❌ AWS_S3_BUCKET not found in .env file');
    console.log('Please add AWS_S3_BUCKET to your .env file');
    return false;
  }
  
  // 3. Log configuration (masked)
  console.log('Configuration:');
  console.log(`- Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`- Bucket: ${process.env.AWS_S3_BUCKET}`);
  console.log(`- Access Key ID: ${maskString(process.env.AWS_ACCESS_KEY_ID)}`);
  console.log(`- Secret Access Key: ${maskString(process.env.AWS_SECRET_ACCESS_KEY)}`);
  
  // 4. Configure AWS SDK
  const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    httpOptions: {
      timeout: 5000, // 5 second timeout
      connectTimeout: 5000 // 5 second timeout
    },
    maxRetries: 3
  };
  
  AWS.config.update(awsConfig);
  
  // 5. Create S3 client
  const s3 = new AWS.S3();
  
  try {
    console.log('\nTesting bucket access...');
    
    // 6. Test if bucket exists
    console.log(`- Checking if bucket '${process.env.AWS_S3_BUCKET}' exists...`);
    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
    console.log('✅ Bucket exists and is accessible');
    
    // 7. Try to list objects
    console.log('- Listing objects (max 5)...');
    const listResult = await s3.listObjectsV2({ 
      Bucket: process.env.AWS_S3_BUCKET,
      MaxKeys: 5 
    }).promise();
    
    console.log(`✅ Successfully listed objects (found ${listResult.Contents.length} objects)`);
    
    // 8. Try to upload a test file
    console.log('- Testing file upload...');
    const testKey = `test-file-${Date.now()}.txt`;
    const testContent = 'This is a test file to verify S3 upload permissions.';
    
    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    }).promise();
    
    console.log(`✅ Successfully uploaded test file with key: ${testKey}`);
    
    // 9. Try to delete the test file
    console.log('- Testing file deletion...');
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: testKey
    }).promise();
    
    console.log(`✅ Successfully deleted test file with key: ${testKey}`);
    
    console.log('\n✅ All S3 operations completed successfully!');
    console.log('Your AWS S3 configuration is working correctly.');
    return true;
    
  } catch (error) {
    console.error(`\n❌ AWS S3 Error: ${error.message}`);
    
    if (error.code === 'NetworkingError' || error.code === 'TimeoutError') {
      console.log('\nNetwork connectivity issue detected:');
      console.log('1. Check your internet connection');
      console.log('2. Ensure your network allows outbound connections to AWS');
      console.log('3. Check if you need to configure a proxy server');
    } else if (error.code === 'NoSuchBucket') {
      console.log('\nBucket does not exist:');
      console.log(`1. Verify the bucket '${process.env.AWS_S3_BUCKET}' exists in your AWS account`);
      console.log(`2. Check if the bucket is in region '${process.env.AWS_REGION || 'us-east-1'}'`);
      console.log('3. Create the bucket if it does not exist');
    } else if (error.code === 'AccessDenied') {
      console.log('\nAccess denied:');
      console.log('1. Verify your AWS credentials are correct');
      console.log('2. Ensure your IAM user has the following permissions:');
      console.log('   - s3:ListBucket');
      console.log('   - s3:GetObject');
      console.log('   - s3:PutObject');
      console.log('   - s3:DeleteObject');
      console.log('3. Check if bucket policies are restricting access');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.log('\nInvalid access key:');
      console.log('1. Your AWS_ACCESS_KEY_ID is invalid or does not exist');
      console.log('2. Generate new credentials in the AWS IAM console');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.log('\nSignature mismatch:');
      console.log('1. Your AWS_SECRET_ACCESS_KEY is incorrect');
      console.log('2. Generate new credentials in the AWS IAM console');
    }
    
    console.log('\nFull error details:');
    console.log(error);
    return false;
  }
}

// Helper function to mask sensitive data
function maskString(str) {
  if (!str) return 'not provided';
  if (str.length <= 8) return '********';
  return str.substring(0, 4) + '...' + str.substring(str.length - 4);
}

// Run the test
testAwsS3().then(success => {
  process.exit(success ? 0 : 1);
}); 