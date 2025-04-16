const Joi = require('joi');

const deviceSchema = Joi.object({
    userId: Joi.string().required(),
    deviceToken: Joi.string().required(),
    platform: Joi.string().valid('android', 'ios', 'web').required()
});

const notificationSchema = Joi.object({
    userId: Joi.string().required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    data: Joi.object().default({})
});

const topicNotificationSchema = Joi.object({
    topic: Joi.string().required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    data: Joi.object().default({})
});

module.exports = {
    validateDevice: (data) => deviceSchema.validate(data),
    validateNotification: (data) => notificationSchema.validate(data),
    validateTopicNotification: (data) => topicNotificationSchema.validate(data)
};
