const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const tutorialSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().required(),
  type: Joi.string().valid('video', 'pdf', 'document', 'image', 'other').required(),
  targetAudience: Joi.string().valid('driver', 'mechanic', 'all').default('all'),
  tags: Joi.array().items(Joi.string().trim()),
  duration: Joi.number().min(0),
  category: Joi.string().required().trim(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
  isPublished: Joi.boolean().default(true),
  downloadable: Joi.boolean().default(false),
  createdBy: Joi.string().required()
});

const validateTutorial = async (data) => {
  try {
    return await tutorialSchema.validateAsync(data);
  } catch (error) {
    throw new ValidationError('Invalid tutorial data', error.details);
  }
};

const updateTutorialSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string(),
  targetAudience: Joi.string().valid('driver', 'mechanic', 'all'),
  tags: Joi.array().items(Joi.string().trim()),
  duration: Joi.number().min(0),
  category: Joi.string().trim(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  isPublished: Joi.boolean(),
  downloadable: Joi.boolean()
});

const validateUpdateTutorial = async (data) => {
  try {
    return await updateTutorialSchema.validateAsync(data);
  } catch (error) {
    throw new ValidationError('Invalid tutorial update data', error.details);
  }
};

module.exports = {
  validateTutorial,
  validateUpdateTutorial
}; 