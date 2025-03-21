const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'pdf', 'document', 'image', 'other'],
    default: 'video'
  },
  fileUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  s3Key: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['driver', 'mechanic', 'all'],
    default: 'all'
  },
  tags: [{
    type: String,
    trim: true
  }],
  duration: {
    type: Number,
    default: 0  // Duration in seconds for videos
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  downloadable: {
    type: Boolean,
    default: false
  },
  fileSize: {
    type: Number,  // Size in bytes
    default: 0
  },
  fileType: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Text index for search
tutorialSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  category: 'text'
});

module.exports = mongoose.model('Tutorial', tutorialSchema); 