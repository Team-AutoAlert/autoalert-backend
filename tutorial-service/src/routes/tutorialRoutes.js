const express = require('express');
const tutorialController = require('../controllers/tutorialController');
const { handleUploadErrors } = require('../middleware/fileUpload');
const router = express.Router();

// Upload new tutorial
router.post('/', handleUploadErrors, tutorialController.uploadTutorial);

// Get all tutorials with filtering and pagination
router.get('/', tutorialController.getAllTutorials);

// Get tutorial by ID
router.get('/:id', tutorialController.getTutorialById);

// Update tutorial
router.put('/:id', handleUploadErrors, tutorialController.updateTutorial);

// Delete tutorial
router.delete('/:id', tutorialController.deleteTutorial);

// Rate tutorial
router.post('/:id/rate', tutorialController.rateTutorial);

// Get download URL
router.get('/:id/download', tutorialController.getDownloadUrl);

// Get tutorials by category
router.get('/category/:category', tutorialController.getTutorialsByCategory);

// Get tutorials by target audience
router.get('/audience/:audience', tutorialController.getTutorialsByAudience);

// Get tutorials created by user
router.get('/user/:userId', tutorialController.getTutorialsByUser);

module.exports = router; 