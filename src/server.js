require('dotenv').config();

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const dns = require('dns');

dns.setServers([
  '1.1.1.1',
  '1.0.0.1'
]);


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');

const { errorHandler } = require('./middleware/errorHandler');

const {
  apiLimiter
} = require('./middleware/rateLimiter');


const adminRoutes =
  require('./routes/admin');

const productRoutes =
  require('./routes/products');

const adminProductRoutes =
  require('./routes/adminProducts');

const orderRoutes =
  require('./routes/orders');

const paymentRoutes =
  require('./routes/payments');

const paymentWebhookRoutes =
  require('./routes/paymentWebhook');

const appointmentRoutes =
  require('./routes/appointments');

const contactRoutes =
  require('./routes/contact');

const categoryRoutes =
  require('./routes/categories');

const adminOrderRoutes =
  require('./routes/adminOrders');

const adminAppointmentRoutes =
  require('./routes/adminAppointments');

const settingsRoutes =
  require('./routes/settings');

const customerRoutes =
  require('./routes/customer');

const customerOrderRoutes =
  require('./routes/customerOrders');

const authRoutes = require(
  './routes/auth');

validateEnv();


const app = express();


// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);


// Security headers
app.use(helmet());


// Flutterwave webhook
// MUST remain before express.json()
// because the webhook needs the raw request body.
app.use(
  '/api/payments/webhook',
  express.raw({
    type: 'application/json'
  }),
  paymentWebhookRoutes
);


// JSON request body
app.use(
  express.json({
    verify: (req, res, buffer) => {
      req.rawBody = Buffer.from(buffer);
    }
  })
);


// URL-encoded request body
app.use(
  express.urlencoded({
    extended: true
  })
);


// General API rate limiting
app.use('/api', apiLimiter);


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HADÉRA API is running'
  });
});


// Routes
app.use('/api/admin', adminRoutes);

app.use('/api/products', productRoutes);

app.use(
  '/api/admin/products',
  adminProductRoutes
);

app.use('/api/orders', orderRoutes);

app.use('/api/payments', paymentRoutes);

app.use(
  '/api/appointments',
  appointmentRoutes
);

app.use('/api/contact', contactRoutes);

app.use('/api/categories', categoryRoutes);

app.use(
  '/api/admin/orders',
  adminOrderRoutes
);

app.use(
  '/api/admin/appointments',
  adminAppointmentRoutes
);

app.use(
  '/api/admin/settings',
  settingsRoutes
);

app.use(
  '/api/customer', customerRoutes
);

app.use(
  '/api/customer/orders', customerOrderRoutes
);

app.use(
  '/api/auth', authRoutes
);

// Centralized error handler
app.use(errorHandler);


const PORT =
  process.env.PORT || 5000;


async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `HADÉRA API running on port ${PORT}`
    );
  });
}


startServer();