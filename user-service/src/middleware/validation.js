const Joi = require('joi');

const userSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid('driver', 'mechanic').required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().required(),
  profilePicture: Joi.string().allow(null),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string()
  }),
  location: Joi.object({
    type: Joi.string().valid('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2)
  })
});

const validateUser = async (data, isUpdate = false) => {
  const schema = isUpdate ? userSchema.fork(
    Object.keys(userSchema.describe().keys),
    (schema) => schema.optional()
  ) : userSchema;
  
  return await schema.validateAsync(data, { abortEarly: false });
};

module.exports = {
  validateUser
}; 