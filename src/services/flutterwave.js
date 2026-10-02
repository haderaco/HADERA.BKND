const FLUTTERWAVE_BASE_URL =
  'https://api.flutterwave.com/v3';


async function flutterwaveRequest(
  endpoint,
  options = {}
) {
  const secretKey =
    process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'FLUTTERWAVE_SECRET_KEY is not configured.'
    );
  }

  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        Authorization:
          `Bearer ${secretKey}`,

        'Content-Type':
          'application/json',

        Accept:
          'application/json',

        ...(options.headers || {})
      }
    }
  );

  const responseText =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(responseText);
  } catch {
    throw new Error(
      `Flutterwave request failed (${response.status}): ${responseText}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Flutterwave request failed (${response.status})`
    );
  }

  return data;
}


/* ==========================================================================
   INITIALIZE PAYMENT
   ========================================================================== */

async function createFlutterwavePayment({
  amount,
  currency = 'NGN',
  customer,
  txRef,
  redirectUrl
}) {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {
    throw new Error(
      'A valid payment amount is required.'
    );
  }

  if (!txRef) {
    throw new Error(
      'Payment transaction reference is required.'
    );
  }

  if (!redirectUrl) {
    throw new Error(
      'Payment redirect URL is required.'
    );
  }

  if (!customer?.email) {
    throw new Error(
      'Customer email is required.'
    );
  }

  const payload = {
    tx_ref: txRef,

    amount:
      String(numericAmount),

    currency,

    redirect_url:
      redirectUrl,

    customer: {
      email:
        customer.email,

      name:
        customer.name || '',

      phonenumber:
        customer.phone || ''
    },

    customizations: {
      title:
        'HADÉRA',

      description:
        'HADÉRA Order Payment'
    }
  };

  return flutterwaveRequest(
    '/payments',
    {
      method: 'POST',

      body:
        JSON.stringify(payload)
    }
  );
}


/* ==========================================================================
   VERIFY TRANSACTION
   ========================================================================== */

async function verifyFlutterwaveTransaction(
  transactionId
) {
  if (!transactionId) {
    throw new Error(
      'Flutterwave transaction ID is required.'
    );
  }

  return flutterwaveRequest(
    `/transactions/${encodeURIComponent(
      transactionId
    )}/verify`,
    {
      method: 'GET'
    }
  );
}


/* ==========================================================================
   GET CHECKOUT URL
   ========================================================================== */

function getFlutterwaveCheckoutUrl(
  paymentResponse
) {
  return (
    paymentResponse?.data?.link ||
    null
  );
}


module.exports = {
  createFlutterwavePayment,
  verifyFlutterwaveTransaction,
  getFlutterwaveCheckoutUrl,
  flutterwaveRequest
};