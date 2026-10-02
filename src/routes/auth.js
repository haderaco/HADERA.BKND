const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| UNIFIED LOGIN
|--------------------------------------------------------------------------
| Determines whether the credentials belong to an Admin or Customer.
|--------------------------------------------------------------------------
*/

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        /*
        |--------------------------------------------------------------------------
        | 1. CHECK ADMIN
        |--------------------------------------------------------------------------
        */

        const admin = await Admin.findOne({
            email: normalizedEmail
        });

        if (admin) {
            const passwordMatches =
                await bcrypt.compare(
                    password,
                    admin.passwordHash
                );

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const token = jwt.sign(
                {
                    id: admin._id,
                    role: 'admin'
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '7d'
                }
            );

            return res.json({
                success: true,
                message: 'Login successful',
                role: 'admin',
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                }
            });
        }

        /*
        |--------------------------------------------------------------------------
        | 2. CHECK CUSTOMER
        |--------------------------------------------------------------------------
        */

        const customer = await Customer.findOne({
            email: normalizedEmail
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

        return res.json({
            success: true,
            message: 'Login successful',
            role: 'customer',
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
});

module.exports = router;