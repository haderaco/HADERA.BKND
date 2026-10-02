const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const ContactMessage = require('../models/ContactMessage');

const {
  requireAdmin
} = require('../middleware/auth');

const {
  authLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();


/* ==========================================================================
   ADMIN LOGIN
   ========================================================================== */

router.post(
  '/auth/login',
  authLimiter,
  async (req, res, next) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      console.log('ADMIN EMAIL:', normalizedEmail);

      const admin =
        await Admin.findOne({
          email: normalizedEmail
        });

      console.log(
        'ADMIN FOUND:',
        !!admin
      );

      if (!admin) {
        console.log(
          'ADMIN LOGIN FAILED: ADMIN NOT FOUND'
        );

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log(
        'ADMIN HASH EXISTS:',
        !!admin.passwordHash
      );

      console.log(
        'ADMIN HASH PREFIX:',
        admin.passwordHash?.substring(0, 7)
      );

      const passwordMatches =
        await bcrypt.compare(
          password,
          admin.passwordHash
        );

      console.log(
        'ADMIN PASSWORD MATCH:',
        passwordMatches
      );

      if (!passwordMatches) {
        console.log(
          'ADMIN LOGIN FAILED: PASSWORD DOES NOT MATCH HASH'
        );

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token =
        jwt.sign(
          {
            id: admin._id,
            role: admin.role
          },
          process.env.JWT_SECRET,
          {
            expiresIn:
              process.env.JWT_EXPIRES_IN || '7d'
          }
        );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });

    } catch (error) {
      next(error);
    }
  }
);


/* ==========================================================================
   CURRENT ADMIN
   ========================================================================== */

router.get(
  '/auth/me',
  requireAdmin,
  async (req, res) => {
    res.json({
      success: true,
      admin: req.admin
    });
  }
);


/* ==========================================================================
   LOGOUT
   ========================================================================== */

router.post(
  '/auth/logout',
  requireAdmin,
  async (req, res) => {
    res.json({
      success: true,
      message:
        'Logged out successfully'
    });
  }
);


/* ==========================================================================
   DASHBOARD
   ========================================================================== */

router.get(
  '/dashboard',
  requireAdmin,
  async (req, res, next) => {
    try {
      const [
        totalProducts,
        availableProducts,
        soldProducts,

        totalOrders,
        paidOrders,
        pendingOrders,

        totalAppointments,
        pendingAppointments,

        totalMessages,
        newMessages,

        unseenOrders,
        unseenAppointments,

        revenueResult,

        recentOrders,
        recentAppointments,

        ordersByDay
      ] = await Promise.all([
        Product.countDocuments(),

        Product.countDocuments({
          availability:
            'available'
        }),

        Product.countDocuments({
          availability:
            'sold'
        }),


        Order.countDocuments(),

        Order.countDocuments({
          paymentStatus:
            'paid'
        }),

        Order.countDocuments({
          paymentStatus:
            'pending'
        }),


        Appointment.countDocuments(),

        Appointment.countDocuments({
          status:
            'pending'
        }),


        ContactMessage.countDocuments(),

        ContactMessage.countDocuments({
          status:
            'new'
        }),


        Order.countDocuments({
          adminSeen: {
            $ne: true
          }
        }),

        Appointment.countDocuments({
          adminSeen: {
            $ne: true
          }
        }),


        Order.aggregate([
          {
            $match: {
              paymentStatus:
                'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: '$amount'
              }
            }
          }
        ]),


        Order.find()
          .sort({
            createdAt: -1
          })
          .limit(5)
          .lean(),


        Appointment.find()
          .sort({
            createdAt: -1
          })
          .limit(5)
          .lean(),


        getOrdersByDay()
      ]);


      const revenue =
        revenueResult[0]?.total ||
        0;


      res.json({
        success: true,

        dashboard: {
          stats: {
            totalProducts,
            availableProducts,
            soldProducts,

            totalOrders,
            paidOrders,
            pendingOrders,

            totalAppointments,
            pendingAppointments,

            totalMessages,
            newMessages,

            unseenOrders,
            unseenAppointments,

            revenue
          },

          products: {
            total:
              totalProducts,
            available:
              availableProducts,
            sold:
              soldProducts
          },

          orders: {
            total:
              totalOrders,
            paid:
              paidOrders,
            pending:
              pendingOrders,
            unseen:
              unseenOrders
          },

          appointments: {
            total:
              totalAppointments,
            pending:
              pendingAppointments,
            unseen:
              unseenAppointments
          },

          messages: {
            total:
              totalMessages,
            new:
              newMessages
          },

          revenue,

          recentOrders,

          recentAppointments,

          ordersByDay
        }
      });
    } catch (error) {
      next(error);
    }
  }
);


/* ==========================================================================
   ORDERS CHART
   Last 7 calendar days
   ========================================================================== */

async function getOrdersByDay() {
  const now =
    new Date();

  const start =
    new Date(now);

  start.setHours(
    0,
    0,
    0,
    0
  );

  start.setDate(
    start.getDate() - 6
  );

  const rows =
    await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: now
          }
        }
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format:
                '%Y-%m-%d',
              date:
                '$createdAt'
            }
          },

          value: {
            $sum: 1
          }
        }
      },

      {
        $sort: {
          _id: 1
        }
      }
    ]);


  const lookup =
    new Map(
      rows.map(row => [
        row._id,
        row.value
      ])
    );


  const result = [];

  for (
    let i = 0;
    i < 7;
    i++
  ) {
    const date =
      new Date(start);

    date.setDate(
      start.getDate() + i
    );

    const key =
      date
        .toISOString()
        .slice(0, 10);

    result.push({
      label:
        date.toLocaleDateString(
          'en-NG',
          {
            weekday:
              'short'
          }
        ),

      value:
        lookup.get(key) || 0
    });
  }

  return result;
}

module.exports = router;