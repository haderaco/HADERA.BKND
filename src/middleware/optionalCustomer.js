const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
async function optionalCustomer(
    req,
    res,
    next
) {
    try {
        const authHeader =
            req.headers.authorization;
        if (
            !authHeader ||
            !authHeader.startsWith('Bearer ')
        ) {
            req.customer = null;
            return next();
        }

        const token =
            authHeader.split(' ')[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const customer =
            await Customer.findById(
                decoded.id
            );

        if (!customer) {
            req.customer = null;
            return next();
        }

        req.customer = customer;

        next();

    } catch {
        /*
          Invalid customer token should not break
          guest checkout. It simply becomes a guest order.
        */
        req.customer = null;
        next();
    }
}
module.exports = {
    optionalCustomer
};