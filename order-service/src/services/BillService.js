const Bill = require('../models/Bill');
const Order = require('../models/Order');
const { notifyUser } = require('../utils/notificationService');
const { initiatePayment } = require('../utils/paymentService');

class BillService {
  async createBill(billData) {
    try {
      const bill = new Bill(billData);
      await bill.save();
      await notifyUser(bill.vehicleOwnerId, 'New bill generated for your service');
      return bill;
    } catch (error) {
      throw new Error(`Error creating bill: ${error.message}`);
    }
  }

  async getBillById(billId) {
    try {
      const bill = await Bill.findById(billId);
      if (!bill) {
        throw new Error('Bill not found');
      }
      return bill;
    } catch (error) {
      throw new Error(`Error fetching bill: ${error.message}`);
    }
  }

  async approveBill(billId) {
    try {
      const bill = await Bill.findByIdAndUpdate(
        billId,
        { status: 'APPROVED' },
        { new: true }
      );
      if (!bill) {
        throw new Error('Bill not found');
      }
      await notifyUser(bill.vehicleOwnerId, 'Bill has been approved');
      await initiatePayment(bill);
      return bill;
    } catch (error) {
      throw new Error(`Error approving bill: ${error.message}`);
    }
  }

  async disputeBill(billId, reason) {
    try {
      const bill = await Bill.findByIdAndUpdate(
        billId,
        {
          status: 'DISPUTED',
          'disputeDetails.reason': reason,
          'disputeDetails.status': 'PENDING'
        },
        { new: true }
      );
      if (!bill) {
        throw new Error('Bill not found');
      }
      await notifyUser(bill.mechanicId, 'Bill has been disputed');
      return bill;
    } catch (error) {
      throw new Error(`Error disputing bill: ${error.message}`);
    }
  }

  async resolveDispute(billId, resolution) {
    try {
      const bill = await Bill.findByIdAndUpdate(
        billId,
        {
          'disputeDetails.status': 'RESOLVED',
          'disputeDetails.resolution': resolution
        },
        { new: true }
      );
      if (!bill) {
        throw new Error('Bill not found');
      }
      await notifyUser(bill.vehicleOwnerId, 'Bill dispute has been resolved');
      return bill;
    } catch (error) {
      throw new Error(`Error resolving dispute: ${error.message}`);
    }
  }

  async markBillAsPaid(billId, paymentId) {
    try {
      const bill = await Bill.findByIdAndUpdate(
        billId,
        {
          status: 'PAID',
          paymentId
        },
        { new: true }
      );
      if (!bill) {
        throw new Error('Bill not found');
      }
      await notifyUser(bill.mechanicId, 'Bill has been paid');
      return bill;
    } catch (error) {
      throw new Error(`Error marking bill as paid: ${error.message}`);
    }
  }
}

module.exports = new BillService(); 