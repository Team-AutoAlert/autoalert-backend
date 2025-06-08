const express = require('express');
const communicationController = require('../controllers/communicationController');
const router = express.Router();

// Video routes
router.post('/video/rooms', communicationController.createVideoRoom);
router.post('/video/join', communicationController.joinVideoRoom);
router.post('/video/rooms/:roomSid/end', communicationController.endVideoRoom);
router.get('/video/rooms/:roomSid', communicationController.getRoomDetails);

// Voice routes
router.post('/voice/calls', communicationController.initiateVoiceCall);
router.post('/voice/join', communicationController.joinInternetCall);
router.post('/voice/token', communicationController.getVoiceToken);
router.post('/voice-twiml', communicationController.generateVoiceTwiML);
router.get('/voice-twiml', communicationController.generateVoiceTwiML);

// Callbacks
router.post('/room-status-callback', communicationController.roomStatusCallback);
router.post('/call-status-callback', communicationController.roomStatusCallback);

module.exports = router;
