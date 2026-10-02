const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'main'
    },

    businessName: {
      type: String,
      default: 'HADÉRA'
    },

    tagline: {
      type: String,
      default: ''
    },

    email: {
      type: String,
      default: ''
    },

    phone: {
      type: String,
      default: ''
    },

    whatsapp: {
      type: String,
      default: ''
    },

    address: {
      type: String,
      default: ''
    },

    instagram: {
      type: String,
      default: ''
    },

    facebook: {
      type: String,
      default: ''
    },

    tiktok: {
      type: String,
      default: ''
    },

    paymentProvider: {
      type: String,
      enum: ['flutterwave', 'paystack'],
      default: 'flutterwave'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', settingsSchema);