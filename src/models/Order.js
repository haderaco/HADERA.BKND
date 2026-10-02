const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },

    product: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      image: {
        type: String,
        default: ''
      },
      category: {
        type: String,
        default: ''
      }
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    customer: {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },
      phone: {
        type: String,
        required: true
      },
      whatsapp: {
        type: String,
        default: ''
      },
      state: {
        type: String,
        default: ''
      },
      city: {
        type: String,
        default: ''
      },
      address: {
        type: String,
        required: true
      },
      notes: {
        type: String,
        default: ''
      }
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: [
        'pending',
        'paid',
        'failed'
      ],
      default: 'pending'
    },

    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'completed',
        'cancelled'
      ],
      default: 'pending'
    },

    adminSeen: {
      type: Boolean,
      default: false,
      index: true
    },

    paymentProvider: {
      type: String,
      default: ''
    },

    paymentReference: {
      type: String,
      default: ''
    },

    transactionId: {
      type: String,
      default: ''
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model('Order', orderSchema);