const express = require('express');

const Appointment = require('../models/Appointment');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();


// ============================================================
// GET ALL APPOINTMENTS
// ============================================================

router.get(
  '/',
  requireAdmin,
  async (req, res, next) => {
    try {
      /*
       * Fetch appointments first.
       */
      const appointments =
        await Appointment
          .find()
          .sort({ createdAt: -1 });

      /*
       * Opening the Appointments page means the admin
       * has seen the currently existing appointments.
       */
      await Appointment.updateMany(
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
      appointments.forEach(appointment => {
        appointment.adminSeen = true;
      });

      res.json({
        success: true,
        appointments
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// UPDATE APPOINTMENT STATUS
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
        'completed',
        'cancelled'
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment status'
        });
      }

      const appointment =
        await Appointment.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              status,
              adminSeen: true
            }
          },
          {
            returnDocument: 'after',
            runValidators: true
          }
        );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      res.json({
        success: true,
        message:
          'Appointment status updated successfully',
        appointment
      });
    } catch (error) {
      next(error);
    }
  }
);


module.exports = router;