const mongoose = require('mongoose');

const Product = require('../models/Product');

const {
  sendOrderConfirmation,
  sendAdminNewOrder
} = require('./orderEmails');


async function completePaidOrder({
  order,
  transactionId
}) {
  /*
   * Fast idempotency check.
   */
  if (order.paymentStatus === 'paid') {
    return {
      alreadyCompleted: true,
      order
    };
  }

  const session =
    await mongoose.startSession();

  let completedOrder = null;
  let alreadyCompleted = false;

  try {
    await session.withTransaction(
      async () => {
        /*
         * Atomically claim this order for payment completion.
         *
         * Only an order that is still pending can be claimed.
         * If the callback and webhook arrive at the same time,
         * only one of them will successfully transition it.
         */
        const claimedOrder =
          await mongoose.model('Order').findOneAndUpdate(
            {
              _id: order._id,
              paymentStatus: 'pending'
            },
            {
              $set: {
                paymentStatus: 'paid',
                orderStatus: 'confirmed',
                transactionId:
                  String(transactionId || ''),
                paidAt: new Date()
              }
            },
            {
              returnDocument: 'after',
              session,
              runValidators: true
            }
          );

        /*
         * Another request already completed the order.
         */
        if (!claimedOrder) {
          const currentOrder =
            await mongoose.model('Order')
              .findById(order._id)
              .session(session);

          if (
            currentOrder?.paymentStatus === 'paid'
          ) {
            alreadyCompleted = true;
            completedOrder = currentOrder;
            return;
          }

          throw new Error(
            'Unable to claim order for payment completion.'
          );
        }

        /*
         * Reduce stock atomically.
         */
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: claimedOrder.product.id,
              quantity: {
                $gte: claimedOrder.quantity
              }
            },
            {
              $inc: {
                quantity: -claimedOrder.quantity
              }
            },
            {
              returnDocument: 'after',
              session,
              runValidators: true
            }
          );

        if (!updatedProduct) {
          throw new Error(
            'Unable to update product stock. The requested quantity is no longer available.'
          );
        }

        /*
         * Mark product as sold when stock reaches zero.
         */
        if (
          updatedProduct.quantity === 0
        ) {
          await Product.updateOne(
            {
              _id: updatedProduct._id
            },
            {
              $set: {
                availability: 'sold'
              }
            },
            {
              session
            }
          );
        }

        completedOrder = claimedOrder;
      }
    );
  } finally {
    await session.endSession();
  }

  /*
   * If another request already completed payment,
   * do not send duplicate emails.
   */
  if (alreadyCompleted) {
    return {
      alreadyCompleted: true,
      order: completedOrder
    };
  }

  /*
   * Email failure must never undo a successful payment.
   */
  try {
    await sendOrderConfirmation(
      completedOrder
    );
  } catch (error) {
    console.error(
      'Customer confirmation email failed:',
      error.message
    );
  }

  try {
    await sendAdminNewOrder(
      completedOrder
    );
  } catch (error) {
    console.error(
      'Admin order email failed:',
      error.message
    );
  }

  return {
    alreadyCompleted: false,
    order: completedOrder
  };
}


module.exports = {
  completePaidOrder
};