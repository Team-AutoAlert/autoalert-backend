const { CommunicationError } = require('../utils/errors');

function validateAgoraConfig() {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new CommunicationError(
      'Agora configuration missing',
      'Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables'
    );
  }

  return {
    appId,
    appCertificate,
    // Agora assigns each channel a random uid between 1 and 2^32-1
    uid: 0 // Set to 0 to let Agora assign one
  };
}

module.exports = validateAgoraConfig(); 