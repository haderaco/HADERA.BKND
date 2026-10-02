const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

async function requireCustomer(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith('Bearer ')
        ) {
            return res.status(401).json({
                success: false,
                message: 'Customer authentication required'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const customer = await Customer.findById(
            decoded.id
        ).select('-passwordHash');

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Customer account not found'
            });
        }

        req.customer = customer;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired customer authentication token'
        });
    }
}

module.exports = {
    requireCustomer
};
