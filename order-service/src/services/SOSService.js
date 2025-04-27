const SOSAlert = require('../models/SOSAlert');
const Order = require('../models/Order');
const { notifyUser } = require('../utils/notificationService');

class SOSService {
  async createSOSAlert(orderId, sosData) {
    try {
      const sosAlert = new SOSAlert({
        orderId,
        ...sosData
      });
      await sosAlert.save();
      await notifyUser(sosAlert.orderId.vehicleOwnerId, 'SOS Alert created');
      return sosAlert;
    } catch (error) {
      throw new Error(`Error creating SOS alert: ${error.message}`);
    }
  }

  async getSOSAlertById(sosAlertId) {
    try {
      const sosAlert = await SOSAlert.findById(sosAlertId);
      if (!sosAlert) {
        throw new Error('SOS Alert not found');
      }
      return sosAlert;
    } catch (error) {
      throw new Error(`Error fetching SOS alert: ${error.message}`);
    }
  }

  async startCall(sosAlertId) {
    try {
      const sosAlert = await SOSAlert.findByIdAndUpdate(
        sosAlertId,
        {
          'callDetails.status': 'IN_PROGRESS',
          'callDetails.startTime': new Date()
        },
        { new: true }
      );
      if (!sosAlert) {
        throw new Error('SOS Alert not found');
      }
      await notifyUser(sosAlert.orderId.vehicleOwnerId, 'Call started');
      return sosAlert;
    } catch (error) {
      throw new Error(`Error starting call: ${error.message}`);
    }
  }

  async endCall(sosAlertId) {
    try {
      const sosAlert = await SOSAlert.findById(sosAlertId);
      if (!sosAlert) {
        throw new Error('SOS Alert not found');
      }

      const endTime = new Date();
      const duration = (endTime - sosAlert.callDetails.startTime) / (1000 * 60); // Convert to minutes

      const updatedSOS = await SOSAlert.findByIdAndUpdate(
        sosAlertId,
        {
          'callDetails.status': 'COMPLETED',
          'callDetails.endTime': endTime,
          'callDetails.duration': duration
        },
        { new: true }
      );

      await notifyUser(updatedSOS.orderId.vehicleOwnerId, 'Call ended');
      return updatedSOS;
    } catch (error) {
      throw new Error(`Error ending call: ${error.message}`);
    }
  }

  async updateResolutionStatus(sosAlertId, resolutionStatus, notes) {
    try {
      const sosAlert = await SOSAlert.findByIdAndUpdate(
        sosAlertId,
        {
          resolutionStatus,
          resolutionNotes: notes
        },
        { new: true }
      );
      if (!sosAlert) {
        throw new Error('SOS Alert not found');
      }
      await notifyUser(sosAlert.orderId.vehicleOwnerId, `SOS resolution status updated to ${resolutionStatus}`);
      return sosAlert;
    } catch (error) {
      throw new Error(`Error updating resolution status: ${error.message}`);
    }
  }
}

module.exports = new SOSService(); 