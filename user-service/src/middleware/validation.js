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
  address: Joi.string().required(),
  language: Joi.string().valid('en', 'si', 'ta').default('en'),
  location: Joi.object({
    type: Joi.string().valid('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2)
  })
});

const vehicleSchema = Joi.object({
  brand: Joi.string().required(),
  model: Joi.string().required(),
  fuelType: Joi.string().valid('Petrol', 'Diesel', 'Electric', 'Hybrid').required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  registrationNumber: Joi.string().required(),
  lastServiceDate: Joi.date(),
  nextServiceDue: Joi.date()
});

const userProfileSchema = Joi.object({
  role: Joi.string().valid('driver', 'mechanic').required(),
  phoneNumber: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
  driverDetails: Joi.when('role', {
    is: 'driver',
    then: Joi.object({
      licenseNumber: Joi.string(),
      licenseExpiry: Joi.date(),
      preferredServiceTypes: Joi.array().items(Joi.string()),
      vehicleCount: Joi.number().integer().min(0),
      vehicles: Joi.array().items(vehicleSchema)
    })
  }),
  mechanicDetails: Joi.when('role', {
    is: 'mechanic',
    then: Joi.object({
      specializations: Joi.array().items(
        Joi.string().valid('Engine', 'Transmission', 'Brakes', 'Electrical', 'General', 'Body Work')
      ),
      workshopName: Joi.string(),
      serviceRadius: Joi.number(),
      workingHours: Joi.object()
    })
  })
});

const validateUser = async (data, isUpdate = false) => {
  const schema = isUpdate ? userSchema.fork(
    Object.keys(userSchema.describe().keys),
    (schema) => schema.optional()
  ) : userSchema;
  
  return await schema.validateAsync(data, { abortEarly: false });
};

const validateUserProfile = async (data) => {
  return await userProfileSchema.validateAsync(data, { abortEarly: false });
};

module.exports = {
  validateUser,
  validateUserProfile,
  validateVehicle: (data) => vehicleSchema.validateAsync(data, { abortEarly: false })
}; 