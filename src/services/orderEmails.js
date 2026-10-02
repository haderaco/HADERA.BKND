const {
  sendEmail
} = require('./email');


async function sendOrderConfirmation(order) {
  await sendEmail({
    to: order.customer.email,
    subject:
      `HADÉRA Order Confirmed — ${order.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Order Confirmed</h2>

        <p>
          Hello ${order.customer.name},
        </p>

        <p>
          Your HADÉRA order has been successfully confirmed.
        </p>

        <p>
          <strong>Order:</strong>
          ${order.orderId}
        </p>

        <p>
          <strong>Product:</strong>
          ${order.product.name}
        </p>

        <p>
          <strong>Quantity:</strong>
          ${order.quantity}
        </p>

        <p>
          <strong>Total:</strong>
          ₦${Number(order.amount).toLocaleString()}
        </p>

        <p>
          Thank you for shopping with HADÉRA.
        </p>
      </div>
    `
  });
}


async function sendAdminNewOrder(order) {
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject:
      `New HADÉRA Order — ${order.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>New Paid Order</h2>

        <p>
          <strong>Order:</strong>
          ${order.orderId}
        </p>

        <p>
          <strong>Customer:</strong>
          ${order.customer.name}
        </p>

        <p>
          <strong>Email:</strong>
          ${order.customer.email}
        </p>

        <p>
          <strong>Phone:</strong>
          ${order.customer.phone}
        </p>

        <p>
          <strong>Product:</strong>
          ${order.product.name}
        </p>

        <p>
          <strong>Quantity:</strong>
          ${order.quantity}
        </p>

        <p>
          <strong>Total:</strong>
          ₦${Number(order.amount).toLocaleString()}
        </p>

        <p>
          <strong>Address:</strong>
          ${order.customer.address}
        </p>
      </div>
    `
  });
}


module.exports = {
  sendOrderConfirmation,
  sendAdminNewOrder
};