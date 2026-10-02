const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        phone: {
            type: String,
            trim: true,
            default: ''
        },

        passwordHash: {
            type: String,
            required: true
        },

        address: {
            type: String,
            trim: true,
            default: ''
        },

        state: {
            type: String,
            trim: true,
            default: ''
        },

        city: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Customer', customerSchema);
