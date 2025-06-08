const Joi = require('joi');

const deviceSchema = Joi.object({
    userId: Joi.string().required(),
    phoneNumber: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/)
});

const notificationSchema = Joi.object({
    userId: Joi.string().required(),
    message: Joi.string().required().max(160) // SMS length limit
});

const bulkNotificationSchema = Joi.object({
    userIds: Joi.array().items(Joi.string()).required(),
    message: Joi.string().required().max(160)
});

module.exports = {
    validateDevice: (data) => deviceSchema.validate(data),
    validateNotification: (data) => notificationSchema.validate(data),
    validateBulkNotification: (data) => bulkNotificationSchema.validate(data)
};
