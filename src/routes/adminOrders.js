const express = require('express');

const Order = require('../models/Order');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();


// ============================================================
// GET ALL ORDERS
// ============================================================

router.get(
  '/',
  requireAdmin,
  async (req, res, next) => {
    try {
      /*
       * Fetch orders first.
       */
      const orders =
        await Order
          .find()
          .sort({ createdAt: -1 });

      /*
       * Opening the Orders page means the admin has seen
       * the currently existing orders.
       */
      await Order.updateMany(
        {
          $or: [
            { adminSeen: false },
            { adminSeen: { $exists: false } }
          ]
        },
        {
          $set: {
            adminSeen: true
          }
        }
      );

      /*
       * Return them as seen immediately.
       */
      orders.forEach(order => {
        order.adminSeen = true;
      });

      res.json({
        success: true,
        orders
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

router.patch(
  '/:id/status',
  requireAdmin,
  async (req, res, next) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        'pending',
        'confirmed',
        'processing',
        'completed',
        'cancelled'
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status'
        });
      }

      const order =
        await Order.findOneAndUpdate(
          {
            orderId: req.params.id
          },
          {
            $set: {
              orderStatus: status,
              adminSeen: true
            }
          },
          {
            returnDocument: 'after',
            runValidators: true
          }
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order status updated successfully',
        order
      });
    } catch (error) {
      console.error(
        'Order status update failed:',
        error
      );

      next(error);
    }
  }
);


module.exports = router;