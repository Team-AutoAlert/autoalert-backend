const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first, before any other imports
dotenv.config({ path: path.join(__dirname, '../.env') });

// Verify environment variables
const requiredEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Error: ${varName} is not set in environment variables`);
        process.exit(1);
    }
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const notificationRoutes = require('./routes/notificationRoutes');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    logger.info(`Notification service running on port ${PORT}`);
});

module.exports = app;
