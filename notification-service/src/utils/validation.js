const Joi = require('joi');

const deviceSchema = Joi.object({
    userId: Joi.string().required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(null),
    fcmToken: Joi.string().allow(null)
});

const notificationSchema = Joi.object({
    userId: Joi.string().required(),
    message: Joi.string().required(),
    data: Joi.object().default({})
});

const bulkNotificationSchema = Joi.object({
    userIds: Joi.array().items(Joi.string()).required(),
    message: Joi.string().required(),
    data: Joi.object().default({})
});

module.exports = {
    validateDevice: (data) => deviceSchema.validate(data),
    validateNotification: (data) => notificationSchema.validate(data),
    validateBulkNotification: (data) => bulkNotificationSchema.validate(data)
};
