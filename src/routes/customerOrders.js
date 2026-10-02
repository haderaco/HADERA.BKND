const express = require('express');

const Order = require('../models/Order');
const {
    requireCustomer
} = require('../middleware/customerAuth');

const router = express.Router();


/* ==========================================================================
   GET CUSTOMER ORDERS
   ========================================================================== */

router.get(
    '/',
    requireCustomer,
    async (req, res, next) => {
        try {
            const orders = await Order
                .find({
                    customerId: req.customer._id
                })
                .sort({
                    createdAt: -1
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


/* ==========================================================================
   GET ONE CUSTOMER ORDER
   ========================================================================== */

router.get(
    '/:orderId',
    requireCustomer,
    async (req, res, next) => {
        try {
            const order =
                await Order.findOne({
                    orderId: req.params.orderId,
                    customerId: req.customer._id
                });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                order
            });
        } catch (error) {
            next(error);
        }
    }
);


module.exports = router;