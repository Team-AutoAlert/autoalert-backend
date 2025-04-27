const Order = require('../models/Order');
const SOSAlert = require('../models/SOSAlert');
const OnSiteService = require('../models/OnSiteService');
const Bill = require('../models/Bill');
const { notifyUser } = require('../utils/notificationService');
const { initiatePayment } = require('../utils/paymentService');

class OrderService {
  async createOrder(orderData) {
    try {
      const order = new Order(orderData);
      await order.save();
      return order;
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  async getOrderById(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      if (!order) {
        throw new Error('Order not found');
      }
      await notifyUser(order.vehicleOwnerId, `Order status updated to ${status}`);
      return order;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }

  async assignMechanic(orderId, mechanicId) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { mechanicId, status: 'ACCEPTED' },
        { new: true }
      );
      if (!order) {
        throw new Error('Order not found');
      }
      await notifyUser(order.vehicleOwnerId, 'Mechanic assigned to your order');
      return order;
    } catch (error) {
      throw new Error(`Error assigning mechanic: ${error.message}`);
    }
  }

  async searchNearbyMechanics(location, maxDistance = 5000) {
    try {
      const mechanics = await Order.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location
            },
            $maxDistance: maxDistance
          }
        },
        status: 'PENDING'
      });
      return mechanics;
    } catch (error) {
      throw new Error(`Error searching nearby mechanics: ${error.message}`);
    }
  }

  async closeOrder(orderId, finalStatus) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: finalStatus },
        { new: true }
      );
      if (!order) {
        throw new Error('Order not found');
      }
      await notifyUser(order.vehicleOwnerId, `Order closed with status: ${finalStatus}`);
      return order;
    } catch (error) {
      throw new Error(`Error closing order: ${error.message}`);
    }
  }
}

module.exports = new OrderService(); 