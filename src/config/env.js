const requiredEnv = [
    'MONGODB_URI',
    'JWT_SECRET',
    'FRONTEND_URL'
];

function validateEnv() {
    const missing = requiredEnv.filter(
        (key) => !process.env[key]
    );

    if (missing.length > 0) {
        console.error(
            `Missing required environment variables: ${missing.join(', ')}`
        );

        process.exit(1);
    }
}

module.exports = { validateEnv };