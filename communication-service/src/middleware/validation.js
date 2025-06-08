const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const roomRequestSchema = Joi.object({
  roomName: Joi.string().required(),
  userId: Joi.string().required(),
  role: Joi.string().valid('driver', 'mechanic').required(),
  type: Joi.string().valid('group', 'p2p').default('group')
});

const callRequestSchema = Joi.object({
  to: Joi.string().when('callType', {
    is: 'traditional',
    then: Joi.required()
  }),
  from: Joi.string().when('callType', {
    is: 'traditional',
    then: Joi.required()
  }),
  userId: Joi.string().required(),
  callType: Joi.string().valid('traditional', 'agora').default('traditional'),
  mediaType: Joi.string().valid('audio', 'video').when('callType', {
    is: 'agora',
    then: Joi.required()
  }),
  channelName: Joi.string().when('callType', {
    is: 'agora',
    then: Joi.required()
  }),
  participants: Joi.object().when('callType', {
    is: 'agora',
    then: Joi.required()
  })
});

const validateRoomRequest = async (data) => {
  try {
    return await roomRequestSchema.validateAsync(data);
  } catch (error) {
    throw new ValidationError('Invalid room request data', error.details);
  }
};

const validateCallRequest = async (data) => {
  try {
    return await callRequestSchema.validateAsync(data);
  } catch (error) {
    throw new ValidationError('Invalid call request data', error.details);
  }
};

module.exports = {
  validateRoomRequest,
  validateCallRequest
};
