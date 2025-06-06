const Tutorial = require('../models/Tutorial');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');
const { validateTutorial, validateUpdateTutorial } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');
const path = require('path');
const axios = require('axios');
const { userServiceUrl } = require('../config/config');

class TutorialController {
  /**
   * Upload a new tutorial
   */
  async uploadTutorial(req, res, next) {
    try {
      // Validate tutorial data
      const tutorialData = await validateTutorial(req.body);
      
      if (!req.files || !req.files.tutorial) {
        return res.status(400).json({ error: 'No tutorial file uploaded' });
      }
      
      const tutorialFile = req.files.tutorial[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
      
      // COMMENTED OUT: User verification
      /*
      try {
        await axios.get(`${userServiceUrl}/api/users/${req.body.createdBy}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }
      */
      
      // Generate S3 key for tutorial
      const timestamp = Date.now();
      const filename = `${timestamp}-${tutorialFile.originalname.replace(/\s+/g, '-')}`;
      const s3Key = `tutorials/${tutorialData.type}/${filename}`;
      
      // Upload tutorial file to S3
      const fileUrl = await s3Service.uploadFile(
        tutorialFile.buffer,
        s3Key,
        tutorialFile.mimetype
      );

      let thumbnailUrl = null;
      let thumbnailS3Key = null;

      // Handle thumbnail upload if provided
      if (thumbnailFile) {
        const thumbnailFilename = `${timestamp}-thumbnail-${thumbnailFile.originalname.replace(/\s+/g, '-')}`;
        thumbnailS3Key = `tutorials/thumbnails/${thumbnailFilename}`;
        
        thumbnailUrl = await s3Service.uploadFile(
          thumbnailFile.buffer,
          thumbnailS3Key,
          thumbnailFile.mimetype
        );
      }
      
      // Create tutorial in database
      const tutorial = new Tutorial({
        ...tutorialData,
        fileUrl,
        s3Key,
        thumbnailUrl,
        thumbnailS3Key,
        createdBy: req.body.createdBy,
        fileSize: tutorialFile.size,
        fileType: tutorialFile.mimetype
      });
      
      await tutorial.save();
      
      logger.info(`Tutorial uploaded: ${tutorial._id}`);
      
      res.status(201).json({
        _id: tutorial._id,
        title: tutorial.title,
        description: tutorial.description,
        type: tutorial.type,
        fileUrl,
        thumbnailUrl,
        createdAt: tutorial.createdAt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tutorials with pagination and filtering
   */
  async getAllTutorials(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category,
        level,
        targetAudience,
        search,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = req.query;
      
      // Build query
      const query = {};
      
      if (type) query.type = type;
      if (category) query.category = category;
      if (level) query.level = level;
      if (targetAudience) query.targetAudience = targetAudience;
      
      // Text search
      if (search) {
        query.$text = { $search: search };
      }
      
      // Create sort object
      const sort = {};
      sort[sortBy] = sortDirection === 'asc' ? 1 : -1;
      
      // Execute query with pagination
      const tutorials = await Tutorial.find(query)
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
      
      // Get total count
      const total = await Tutorial.countDocuments(query);
      
      res.json({
        tutorials,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tutorial by ID
   */
  async getTutorialById(req, res, next) {
    try {
      const tutorial = await Tutorial.findById(req.params.id);
      
      if (!tutorial) {
        throw new NotFoundError('Tutorial not found');
      }
      
      // Increment view count
      tutorial.views += 1;
      await tutorial.save();
      
      res.json(tutorial);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tutorial
   */
  async updateTutorial(req, res, next) {
    try {
      const tutorialData = await validateUpdateTutorial(req.body);
      
      const tutorial = await Tutorial.findById(req.params.id);
      
      if (!tutorial) {
        throw new NotFoundError('Tutorial not found');
      }
      
      // Check if user is the creator
      /* 
      if (tutorial.createdBy !== req.body.userId) {
        return res.status(403).json({ error: 'Not authorized to update this tutorial' });
      }
      */
      
      // Update tutorial
      Object.assign(tutorial, tutorialData);
      
      // Handle file updates if files are provided
      if (req.files) {
        // Handle main tutorial file update
        if (req.files.tutorial) {
          const tutorialFile = req.files.tutorial[0];
          
          // Delete old file
          await s3Service.deleteFile(tutorial.s3Key);
          
          // Generate new S3 key
          const timestamp = Date.now();
          const filename = `${timestamp}-${tutorialFile.originalname.replace(/\s+/g, '-')}`;
          const s3Key = `tutorials/${tutorial.type}/${filename}`;
          
          // Upload new file
          const fileUrl = await s3Service.uploadFile(
            tutorialFile.buffer,
            s3Key,
            tutorialFile.mimetype
          );
          
          // Update tutorial with new file info
          tutorial.fileUrl = fileUrl;
          tutorial.s3Key = s3Key;
          tutorial.fileSize = tutorialFile.size;
          tutorial.fileType = tutorialFile.mimetype;
        }

        // Handle thumbnail update
        if (req.files.thumbnail) {
          const thumbnailFile = req.files.thumbnail[0];
          
          // Delete old thumbnail if exists
          if (tutorial.thumbnailS3Key) {
            await s3Service.deleteFile(tutorial.thumbnailS3Key);
          }
          
          // Generate new thumbnail S3 key
          const timestamp = Date.now();
          const thumbnailFilename = `${timestamp}-thumbnail-${thumbnailFile.originalname.replace(/\s+/g, '-')}`;
          const thumbnailS3Key = `tutorials/thumbnails/${thumbnailFilename}`;
          
          // Upload new thumbnail
          const thumbnailUrl = await s3Service.uploadFile(
            thumbnailFile.buffer,
            thumbnailS3Key,
            thumbnailFile.mimetype
          );
          
          // Update tutorial with new thumbnail info
          tutorial.thumbnailUrl = thumbnailUrl;
          tutorial.thumbnailS3Key = thumbnailS3Key;
        }
      }
      
      await tutorial.save();
      
      logger.info(`Tutorial updated: ${tutorial._id}`);
      
      res.json({
        _id: tutorial._id,
        title: tutorial.title,
        description: tutorial.description,
        type: tutorial.type,
        fileUrl: tutorial.fileUrl,
        thumbnailUrl: tutorial.thumbnailUrl,
        updatedAt: tutorial.updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tutorial
   */
  async deleteTutorial(req, res, next) {
    try {
      const tutorial = await Tutorial.findById(req.params.id);
      
      if (!tutorial) {
        throw new NotFoundError('Tutorial not found');
      }
      
      // Check if user is the creator
      /*
      if (tutorial.createdBy !== req.body.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this tutorial' });
      }
      */
      
      // Delete files from S3
      await s3Service.deleteFile(tutorial.s3Key);
      if (tutorial.thumbnailS3Key) {
        await s3Service.deleteFile(tutorial.thumbnailS3Key);
      }
      
      // Delete tutorial from database
      await tutorial.deleteOne();
      
      logger.info(`Tutorial deleted: ${tutorial._id}`);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rate tutorial
   */
  async rateTutorial(req, res, next) {
    try {
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      
      const tutorial = await Tutorial.findById(req.params.id);
      
      if (!tutorial) {
        throw new NotFoundError('Tutorial not found');
      }
      
      // Calculate new average rating
      const newCount = tutorial.ratings.count + 1;
      const newAverage = ((tutorial.ratings.average * tutorial.ratings.count) + rating) / newCount;
      
      // Update tutorial
      tutorial.ratings = {
        average: newAverage,
        count: newCount
      };
      
      await tutorial.save();
      
      res.json({
        _id: tutorial._id,
        ratings: tutorial.ratings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get download URL
   */
  async getDownloadUrl(req, res, next) {
    try {
      const tutorial = await Tutorial.findById(req.params.id);
      
      if (!tutorial) {
        throw new NotFoundError('Tutorial not found');
      }
      
      if (!tutorial.downloadable) {
        return res.status(403).json({ error: 'This tutorial is not downloadable' });
      }
      
      // Generate temporary URL
      const url = s3Service.generateTemporaryUrl(tutorial.s3Key, 3600); // 1 hour
      
      res.json({
        _id: tutorial._id,
        title: tutorial.title,
        downloadUrl: url,
        expiresIn: 3600 // 1 hour
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tutorials by category
   */
  async getTutorialsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const tutorials = await Tutorial.find({ category }).sort({ createdAt: -1 });
      
      res.json(tutorials);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tutorials by target audience
   */
  async getTutorialsByAudience(req, res, next) {
    try {
      const { audience } = req.params;
      
      if (!['driver', 'mechanic', 'all'].includes(audience)) {
        return res.status(400).json({ error: 'Invalid audience type' });
      }
      
      const tutorials = await Tutorial.find({
        $or: [
          { targetAudience: audience },
          { targetAudience: 'all' }
        ]
      }).sort({ createdAt: -1 });
      
      res.json(tutorials);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tutorials created by user
   */
  async getTutorialsByUser(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      /*
      try {
        await axios.get(`${userServiceUrl}/api/users/${userId}`);
      } catch (error) {
        return res.status(404).json({ error: 'User not found' });
      }
      */
      
      const tutorials = await Tutorial.find({ createdBy: userId }).sort({ createdAt: -1 });
      
      res.json(tutorials);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TutorialController(); 