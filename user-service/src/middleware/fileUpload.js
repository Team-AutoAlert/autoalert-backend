const multer = require('multer');
const { ValidationError } = require('../utils/errors');

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types for documents
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ValidationError('File type not allowed. Accepted types: PDF, JPEG, PNG'));
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new ValidationError('File too large. Maximum size is 5MB.'));
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Multiple file upload middleware
const uploadMechanicDocs = upload.fields([
  { name: 'nicDocument', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]);

// Handle multer errors
const handleUploadErrors = (req, res, next) => {
  uploadMechanicDocs(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
};

module.exports = { handleUploadErrors }; 