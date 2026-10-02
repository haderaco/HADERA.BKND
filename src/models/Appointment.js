const mongoose = require('mongoose');

const appointmentSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },

      phone: {
        type: String,
        required: true,
        trim: true
      },

      service: {
        type: String,
        required: true,
        trim: true
      },

      date: {
        type: String,
        required: true
      },

      time: {
        type: String,
        required: true
      },

      message: {
        type: String,
        default: ''
      },

      status: {
        type: String,
        enum: [
          'pending',
          'confirmed',
          'completed',
          'cancelled'
        ],
        default: 'pending'
      },

      adminSeen: {
        type: Boolean,
        default: false,
        index: true
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    'Appointment',
    appointmentSchema
  );
