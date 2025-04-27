const SOSService = require('../services/SOSService');

class SOSController {
  async createSOSAlert(req, res) {
    try {
      const { orderId, ...sosData } = req.body;
      const sosAlert = await SOSService.createSOSAlert(orderId, sosData);
      res.status(201).json(sosAlert);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSOSAlertById(req, res) {
    try {
      const sosAlert = await SOSService.getSOSAlertById(req.params.sosAlertId);
      res.json(sosAlert);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async startCall(req, res) {
    try {
      const sosAlert = await SOSService.startCall(req.params.sosAlertId);
      res.json(sosAlert);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async endCall(req, res) {
    try {
      const sosAlert = await SOSService.endCall(req.params.sosAlertId);
      res.json(sosAlert);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateResolutionStatus(req, res) {
    try {
      const { resolutionStatus, notes } = req.body;
      const sosAlert = await SOSService.updateResolutionStatus(
        req.params.sosAlertId,
        resolutionStatus,
        notes
      );
      res.json(sosAlert);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SOSController(); 