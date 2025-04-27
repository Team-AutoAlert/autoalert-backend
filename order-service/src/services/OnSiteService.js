const OnSiteService = require('../models/OnSiteService');
const Order = require('../models/Order');
const { notifyUser } = require('../utils/notificationService');

class OnSiteServiceHandler {
  async createOnSiteService(orderId, serviceData) {
    try {
      const onSiteService = new OnSiteService({
        orderId,
        ...serviceData
      });
      await onSiteService.save();
      await notifyUser(onSiteService.orderId.vehicleOwnerId, 'On-site service request created');
      return onSiteService;
    } catch (error) {
      throw new Error(`Error creating on-site service: ${error.message}`);
    }
  }

  async getOnSiteServiceById(serviceId) {
    try {
      const service = await OnSiteService.findById(serviceId);
      if (!service) {
        throw new Error('On-site service not found');
      }
      return service;
    } catch (error) {
      throw new Error(`Error fetching on-site service: ${error.message}`);
    }
  }

  async updateArrivalTime(serviceId, estimatedArrivalTime) {
    try {
      const service = await OnSiteService.findByIdAndUpdate(
        serviceId,
        { estimatedArrivalTime },
        { new: true }
      );
      if (!service) {
        throw new Error('On-site service not found');
      }
      await notifyUser(service.orderId.vehicleOwnerId, `Mechanic estimated arrival time: ${estimatedArrivalTime}`);
      return service;
    } catch (error) {
      throw new Error(`Error updating arrival time: ${error.message}`);
    }
  }

  async markArrived(serviceId) {
    try {
      const service = await OnSiteService.findByIdAndUpdate(
        serviceId,
        {
          actualArrivalTime: new Date(),
          serviceStatus: 'ARRIVED'
        },
        { new: true }
      );
      if (!service) {
        throw new Error('On-site service not found');
      }
      await notifyUser(service.orderId.vehicleOwnerId, 'Mechanic has arrived at your location');
      return service;
    } catch (error) {
      throw new Error(`Error marking arrival: ${error.message}`);
    }
  }

  async startService(serviceId) {
    try {
      const service = await OnSiteService.findByIdAndUpdate(
        serviceId,
        {
          serviceStartTime: new Date(),
          serviceStatus: 'IN_PROGRESS'
        },
        { new: true }
      );
      if (!service) {
        throw new Error('On-site service not found');
      }
      await notifyUser(service.orderId.vehicleOwnerId, 'Service has started');
      return service;
    } catch (error) {
      throw new Error(`Error starting service: ${error.message}`);
    }
  }

  async completeService(serviceId, serviceNotes, partsUsed, laborHours) {
    try {
      const service = await OnSiteService.findByIdAndUpdate(
        serviceId,
        {
          serviceEndTime: new Date(),
          serviceStatus: 'COMPLETED',
          serviceNotes,
          partsUsed,
          laborHours
        },
        { new: true }
      );
      if (!service) {
        throw new Error('On-site service not found');
      }
      await notifyUser(service.orderId.vehicleOwnerId, 'Service has been completed');
      return service;
    } catch (error) {
      throw new Error(`Error completing service: ${error.message}`);
    }
  }
}

module.exports = new OnSiteServiceHandler(); 