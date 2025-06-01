const userService = require('../services/userService');
const { validateUser, validateUserProfile, validateVehicle } = require('../middleware/validation');
const logger = require('../utils/logger');

class UserController {
  async createUser(req, res, next) {
    try {
      const validatedData = await validateUser(req.body);
      const result = await userService.createUser(validatedData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req, res, next) {
    try {
      const profile = await userService.getUserProfile(req.params.userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const validatedData = await validateUser(req.body, true);
      const user = await userService.updateUser(req.params.userId, validatedData);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserProfile(req, res, next) {
    try {
      const validatedData = await validateUserProfile(req.body);
      const profile = await userService.updateUserProfile(req.params.userId, validatedData);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await userService.listUsers(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addVehicle(req, res, next) {
    try {
      const validatedData = await validateVehicle(req.body);
      const result = await userService.addVehicle(req.params.userId, validatedData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getVehicles(req, res, next) {
    try {
      const vehicles = await userService.getVehicles(req.params.userId);
      res.json(vehicles);
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const validatedData = await validateVehicle(req.body);
      const vehicle = await userService.updateVehicle(
        req.params.userId,
        req.params.vehicleId,
        validatedData
      );
      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      await userService.deleteVehicle(req.params.userId, req.params.vehicleId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async findByPhone(req, res, next) {
    try {
      const { phoneNumber } = req.query;
      const profile = await userService.findUserByPhone(phoneNumber);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async getUserProfileWithPhone(req, res, next) {
    try {
      const profile = await userService.getUserProfileWithPhone(req.params.userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController(); 