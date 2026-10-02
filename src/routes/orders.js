const express = require('express');
const crypto = require('crypto');

const Product = require('../models/Product');

const Order = require('../models/Order');

const {
  optionalCustomer
} = require('../middleware/optionalCustomer');

const router = express.Router();

/* ==========================================================================
CREATE ORDER
========================================================================== */

router.post(
  '/',
  optionalCustomer,
  async (req, res, next) => {
    try {
      const {
        productId,
        quantity,
        name,
        email,
        phone,
        whatsapp,
        state,
        city,
        address,
        notes
      } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product is required'
        });
      }

      const parsedQuantity =
        Number(quantity);

      if (
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      if (
        !name ||
        !email ||
        !phone ||
        !address
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name, email, phone and address are required'
        });
      }

      const product =
        await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (
        product.availability === 'sold' ||
        product.quantity < parsedQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            'The requested quantity is not available'
        });
      }

      const amount =
        Number(product.price) *
        parsedQuantity;

      const orderId =
        `HD-${Date.now()}-${crypto
          .randomBytes(3)
          .toString('hex')
          .toUpperCase()}`;

      const order =
        await Order.create({
          orderId,

          /*
            This is the important part.
            Authenticated customers get their actual
            MongoDB customer ID attached to the order.
            Guests remain null.
          */
          customerId:
            req.customer?._id || null,

          product: {
            id: product._id,
            name: product.name,
            price: product.price,
            image:
              product.images?.[0]?.url || '',
            category:
              product.category || ''
          },

          quantity: parsedQuantity,

          customer: {
            name: String(name).trim(),
            email: String(email)
              .trim()
              .toLowerCase(),
            phone: String(phone).trim(),
            whatsapp:
              String(whatsapp || '').trim(),
            state:
              String(state || '').trim(),
            city:
              String(city || '').trim(),
            address:
              String(address).trim(),
            notes:
              String(notes || '').trim()
          },

          amount,

          paymentStatus: 'pending',
          orderStatus: 'pending'
        });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order
      });
    } catch (error) {
      next(error);
    }

  }
);

/* ==========================================================================
GET ORDER
========================================================================== */

router.get(
  '/:orderId',
  async (req, res, next) => {
    try {
      const order = await Order.findOne({
        orderId: req.params.orderId
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