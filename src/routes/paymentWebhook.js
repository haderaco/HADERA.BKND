const express = require('express');
const crypto = require('crypto');

const Order = require('../models/Order');

const {
  verifyFlutterwaveTransaction
} = require('../services/flutterwave');

const {
  completePaidOrder
} = require('../services/paymentCompletion');

const router = express.Router();


/* ==========================================================================
   VERIFY FLUTTERWAVE WEBHOOK SIGNATURE
   ========================================================================== */

function verifyWebhookSignature(req) {
  const signature =
    req.headers['flutterwave-signature'];

  const secret =
    process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

  if (!signature || !secret) {
    return false;
  }

  /*
   * The signature must be calculated from the exact
   * raw request body Flutterwave sent.
   */
  const rawBody =
    Buffer.isBuffer(req.body)
      ? req.body
      : req.rawBody;

  if (!rawBody) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

  const receivedBuffer =
    Buffer.from(
      String(signature),
      'utf8'
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      'utf8'
    );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}


/* ==========================================================================
   WEBHOOK
   ========================================================================== */

router.post(
  '/',
  async (req, res) => {
    try {
      /*
       * Verify the signature before trusting the payload.
       */
      if (!verifyWebhookSignature(req)) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid webhook signature'
        });
      }

      const rawBody =
        Buffer.isBuffer(req.body)
          ? req.body
          : req.rawBody;

      if (!rawBody) {
        return res.status(400).json({
          success: false,
          message:
            'Webhook body is missing'
        });
      }

      let payload;

      try {
        payload =
          JSON.parse(
            rawBody.toString('utf8')
          );
      } catch {
        return res.status(400).json({
          success: false,
          message:
            'Invalid webhook JSON payload'
        });
      }

      const transaction =
        payload?.data || payload;

      const transactionId =
        transaction?.id ||
        transaction?.transaction_id;

      const txRef =
        transaction?.tx_ref ||
        transaction?.txRef;

      if (
        !transactionId ||
        !txRef
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Webhook transaction information is incomplete'
        });
      }

      /*
       * Find our order using the transaction reference.
       */
      const order =
        await Order.findOne({
          paymentReference: txRef
        });

      if (!order) {
        /*
         * Acknowledge the webhook rather than repeatedly
         * retrying an event for an unknown transaction.
         */
        return res.status(200).json({
          success: false,
          message: 'Order not found'
        });
      }

      /*
       * Already paid means there is nothing else to do.
       */
      if (
        order.paymentStatus === 'paid'
      ) {
        return res.status(200).json({
          success: true,
          message:
            'Payment already processed'
        });
      }

      /*
       * Never trust the webhook payload alone.
       * Verify directly with Flutterwave.
       */
      const verification =
        await verifyFlutterwaveTransaction(
          transactionId
        );

      const verified =
        verification?.data;

      if (!verified) {
        return res.status(400).json({
          success: false,
          message:
            'Flutterwave verification returned no transaction data'
        });
      }

      const verifiedAmount =
        Number(verified.amount);

      const expectedAmount =
        Number(order.amount);

      const statusMatches =
        verified.status ===
        'successful';

      const currencyMatches =
        verified.currency === 'NGN';

      const amountMatches =
        Number.isFinite(
          verifiedAmount
        ) &&
        verifiedAmount ===
        expectedAmount;

      const referenceMatches =
        verified.tx_ref ===
        order.paymentReference;

      if (
        !statusMatches ||
        !currencyMatches ||
        !amountMatches ||
        !referenceMatches
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment verification failed'
        });
      }

      /*
       * Atomic completion prevents callback + webhook
       * from processing the same payment twice.
       */
      const result =
        await completePaidOrder({
          order,
          transactionId
        });

      return res.status(200).json({
        success: true,
        message:
          result.alreadyCompleted
            ? 'Payment already processed'
            : 'Webhook processed successfully'
      });
    } catch (error) {
      console.error(
        'Payment webhook error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Webhook processing failed'
      });
    }
  }
);


module.exports = router;