const OnSiteService = require('../services/OnSiteService');

class OnSiteController {
  async createOnSiteService(req, res) {
    try {
      const { orderId, ...serviceData } = req.body;
      const service = await OnSiteService.createOnSiteService(orderId, serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOnSiteServiceById(req, res) {
    try {
      const service = await OnSiteService.getOnSiteServiceById(req.params.serviceId);
      res.json(service);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateArrivalTime(req, res) {
    try {
      const { estimatedArrivalTime } = req.body;
      const service = await OnSiteService.updateArrivalTime(
        req.params.serviceId,
        estimatedArrivalTime
      );
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markArrived(req, res) {
    try {
      const service = await OnSiteService.markArrived(req.params.serviceId);
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async startService(req, res) {
    try {
      const service = await OnSiteService.startService(req.params.serviceId);
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async completeService(req, res) {
    try {
      const { serviceNotes, partsUsed, laborHours } = req.body;
      const service = await OnSiteService.completeService(
        req.params.serviceId,
        serviceNotes,
        partsUsed,
        laborHours
      );
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new OnSiteController(); 