require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');

validateEnv();

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'HADÉRA API is running'
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`HADÉRA API running on port ${PORT}`);
    });
}

startServer();