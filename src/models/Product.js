const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },

    publicId: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    location: {
      type: String,
      trim: true,
      default: ''
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    availability: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available'
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    images: {
      type: [productImageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);