const express = require('express');
const Order = require('../models/Order');
const {
  createFlutterwavePayment,
  verifyFlutterwaveTransaction,
  getFlutterwaveCheckoutUrl
} = require('../services/flutterwave');
const {
  completePaidOrder
} = require('../services/paymentCompletion');
const router = express.Router();
/* ==========================================================================
   INITIALIZE PAYMENT
   ========================================================================== */
router.post(
  '/initialize',
  async (req, res, next) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      const order =
        await Order.findOne({
          orderId
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (
        order.paymentStatus === 'paid'
      ) {
        return res.status(400).json({
          success: false,
          message: 'This order has already been paid'
        });
      }

      if (
        !order.amount ||
        Number(order.amount) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order amount'
        });
      }

      const txRef =
        `HADERA-${order.orderId}-${Date.now()}`;

      const callbackUrl =
        process.env.PAYMENT_CALLBACK_URL;

      if (!callbackUrl) {
        throw new Error(
          'PAYMENT_CALLBACK_URL is not configured'
        );
      }

      const paymentResponse =
        await createFlutterwavePayment({
          amount: order.amount,
          currency: 'NGN',

          customer: {
            name:
              order.customer.name,
            email:
              order.customer.email,
            phone:
              order.customer.phone
          },

          txRef,
          redirectUrl:
            callbackUrl
        });

      const checkoutUrl =
        getFlutterwaveCheckoutUrl(
          paymentResponse
        );

      if (!checkoutUrl) {
        throw new Error(
          'Flutterwave did not return a checkout URL'
        );
      }

      order.paymentProvider =
        'flutterwave';

      order.paymentReference =
        txRef;

      await order.save();

      res.json({
        success: true,

        payment: {
          orderId:
            order.orderId,

          txRef,

          checkoutUrl
        }
      });
    } catch (error) {
      next(error);
    }

  }
);
/* ==========================================================================
   FLUTTERWAVE CALLBACK
   ========================================================================== */
router.get(
  '/callback',
  async (req, res, next) => {
    try {
      const {
        status,
        tx_ref,
        transaction_id
      } = req.query;
      const successUrl =
        process.env.PAYMENT_SUCCESS_URL;

      if (!successUrl) {
        throw new Error(
          'PAYMENT_SUCCESS_URL is not configured'
        );
      }

      if (
        !tx_ref ||
        !transaction_id
      ) {
        return res.redirect(
          `${successUrl}?status=failed`
        );
      }

      const order =
        await Order.findOne({
          paymentReference: tx_ref
        });

      if (!order) {
        return res.redirect(
          `${successUrl}?status=failed&reason=order_not_found`
        );
      }

      /*
        Flutterwave can redirect with a failed/cancelled
        status before verification is attempted.
      */
      if (
        status &&
        status !== 'successful'
      ) {
        order.paymentStatus =
          'failed';

        await order.save();

        return res.redirect(
          `${successUrl}?status=failed&orderId=${encodeURIComponent(
            order.orderId
          )}`
        );
      }

      const verification =
        await verifyFlutterwaveTransaction(
          transaction_id
        );

      const data =
        verification?.data;

      if (!data) {
        return res.redirect(
          `${successUrl}?status=failed&orderId=${encodeURIComponent(
            order.orderId
          )}`
        );
      }

      const verifiedStatus =
        data.status;

      const verifiedCurrency =
        data.currency;

      const verifiedAmount =
        Number(data.amount);

      const expectedAmount =
        Number(order.amount);

      const verifiedReference =
        data.tx_ref ||
        data.tx_ref;

      const amountMatches =
        Number.isFinite(
          verifiedAmount
        ) &&
        verifiedAmount ===
        expectedAmount;

      const referenceMatches =
        verifiedReference ===
        order.paymentReference;

      const currencyMatches =
        verifiedCurrency === 'NGN';

      if (
        verifiedStatus !==
        'successful' ||
        !amountMatches ||
        !referenceMatches ||
        !currencyMatches
      ) {
        order.paymentStatus =
          'failed';

        await order.save();

        return res.redirect(
          `${successUrl}?status=failed&orderId=${encodeURIComponent(
            order.orderId
          )}`
        );
      }

      await completePaidOrder({
        order,
        transactionId:
          transaction_id
      });

      return res.redirect(
        `${successUrl}?status=success&orderId=${encodeURIComponent(
          order.orderId
        )}&transactionId=${encodeURIComponent(
          transaction_id
        )}`
      );
    } catch (error) {
      next(error);
    }

  }
);
module.exports = router;

