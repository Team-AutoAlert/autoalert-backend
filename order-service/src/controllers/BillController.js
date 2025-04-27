const BillService = require('../services/BillService');

class BillController {
  async createBill(req, res) {
    try {
      const bill = await BillService.createBill(req.body);
      res.status(201).json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBillById(req, res) {
    try {
      const bill = await BillService.getBillById(req.params.billId);
      res.json(bill);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async approveBill(req, res) {
    try {
      const bill = await BillService.approveBill(req.params.billId);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async disputeBill(req, res) {
    try {
      const { reason } = req.body;
      const bill = await BillService.disputeBill(req.params.billId, reason);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async resolveDispute(req, res) {
    try {
      const { resolution } = req.body;
      const bill = await BillService.resolveDispute(req.params.billId, resolution);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markBillAsPaid(req, res) {
    try {
      const { paymentId } = req.body;
      const bill = await BillService.markBillAsPaid(req.params.billId, paymentId);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new BillController(); 