const multer = require('multer');
const path = require('path');
const { ValidationError } = require('../utils/errors');

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'video': ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    'pdf': ['application/pdf'],
    'document': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  };

  // For thumbnail, always allow image types
  if (file.fieldname === 'thumbnail') {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (imageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new ValidationError('Thumbnail must be an image file (jpeg, png, gif, webp)'));
  }

  // For tutorial file, check based on tutorial type
  const fileType = req.body.type || 'other';
  
  // Check if file type is allowed
  if (fileType === 'other' || (allowedTypes[fileType] && allowedTypes[fileType].includes(file.mimetype))) {
    return cb(null, true);
  }
  
  cb(new ValidationError(`File type not allowed for ${fileType} tutorial. Accepted types: ${allowedTypes[fileType]?.join(', ')}`));
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB file size limit
  }
});

// Multiple file upload middleware
const uploadTutorialFiles = upload.fields([
  { name: 'tutorial', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Handle multer errors
const handleUploadErrors = (req, res, next) => {
  uploadTutorialFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

module.exports = { handleUploadErrors }; 