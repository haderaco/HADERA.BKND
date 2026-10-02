const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Customer = require('../models/Customer');
const { requireCustomer } = require('../middleware/customerAuth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/* ==========================================================================
   CUSTOMER SIGNUP
   ========================================================================== */

router.post(
    '/auth/signup',
    authLimiter,
    async (req, res, next) => {
        try {
            const {
                name,
                email,
                phone,
                password,
                address,
                state,
                city
            } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email and password are required'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            const normalizedEmail =
                email.trim().toLowerCase();

            const existingCustomer =
                await Customer.findOne({
                    email: normalizedEmail
                });

            if (existingCustomer) {
                return res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            }

            const passwordHash =
                await bcrypt.hash(password, 12);

            const customer = await Customer.create({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone?.trim() || '',
                passwordHash,
                address: address?.trim() || '',
                state: state?.trim() || '',
                city: city?.trim() || ''
            });

            const token = jwt.sign(
                {
                    id: customer._id,
                    role: 'customer'
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '7d'
                }
            );

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                token,
                customer: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                    state: customer.state,
                    city: customer.city
                }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            }

            next(error);
        }
    }
);

/* ==========================================================================
   CUSTOMER LOGIN
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

            const customer =
                await Customer.findOne({
                    email: email.trim().toLowerCase()
                });

            if (!customer) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    customer.passwordHash
                );

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const token = jwt.sign(
                {
                    id: customer._id,
                    role: 'customer'
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
                customer: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                    state: customer.state,
                    city: customer.city
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/* ==========================================================================
   CURRENT CUSTOMER
   ========================================================================== */

router.get(
    '/auth/me',
    requireCustomer,
    async (req, res) => {
        res.json({
            success: true,
            customer: req.customer
        });
    }
);

/* ==========================================================================
   UPDATE CUSTOMER PROFILE
   ========================================================================== */

router.patch(
    '/profile',
    requireCustomer,
    async (req, res, next) => {
        try {
            const {
                name,
                phone,
                address,
                state,
                city
            } = req.body;

            const updates = {};

            if (name !== undefined) {
                updates.name = String(name).trim();
            }

            if (phone !== undefined) {
                updates.phone = String(phone).trim();
            }

            if (address !== undefined) {
                updates.address = String(address).trim();
            }

            if (state !== undefined) {
                updates.state = String(state).trim();
            }

            if (city !== undefined) {
                updates.city = String(city).trim();
            }

            const customer =
                await Customer.findByIdAndUpdate(
                    req.customer._id,
                    {
                        $set: updates
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                ).select('-passwordHash');

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                customer
            });
        } catch (error) {
            next(error);
        }
    }
);

/* ==========================================================================
   LOGOUT
   ========================================================================== */

router.post(
    '/auth/logout',
    requireCustomer,
    async (req, res) => {
        /*
          JWT authentication is stateless, so there is no server-side
          token to destroy here. The frontend removes the stored token.
        */

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
);

module.exports = router;
