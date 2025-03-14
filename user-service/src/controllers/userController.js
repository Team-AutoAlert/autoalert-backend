const userService = require('../services/userService');
const { validateUser, validateUserProfile } = require('../middleware/validation');
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
}

module.exports = new UserController(); 