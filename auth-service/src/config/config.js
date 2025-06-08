require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// Production URLs
const productionUrls = {
  userService: 'https://autoalert-user-service-dtfedwetdvaahzft.eastus-01.azurewebsites.net/api',
  notificationService: 'https://autoalert-notification-service-e9abdzg2bee5gcd2.eastus-01.azurewebsites.net'  // This will be updated when notification service is deployed
};

// Development URLs
const developmentUrls = {
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3001/api',
  notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/api'
};

// Select URLs based on environment
const serviceUrls = env === 'production' ? productionUrls : developmentUrls;

const config = {
  port: process.env.PORT || 3002,
  env: env,
  userServiceUrl: serviceUrls.userService,
  notificationServiceUrl: serviceUrls.notificationService,
  serviceRegistry: process.env.SERVICE_REGISTRY_URL,
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  firebase: {
    type: process.env.FIREBASE_TYPE || "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  }
};

module.exports = config; 
