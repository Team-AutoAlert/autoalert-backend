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

// Log MongoDB URI (make sure to mask sensitive info)
const maskedUri = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@')
    : 'Not set';
logger.info(`Attempting MongoDB connection with URI: ${maskedUri}`);

// Connect to MongoDB with more detailed error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // 5 second timeout
})
.then(() => {
    logger.info('Successfully connected to MongoDB');
    // Log database name
    const dbName = mongoose.connection.db.databaseName;
    logger.info(`Connected to database: ${dbName}`);
})
.catch(err => {
    logger.error('MongoDB connection error:', {
        error: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack
    });
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});

// Health check route with detailed MongoDB status
app.get('/health', (req, res) => {
    const mongoStatus = {
        state: mongoose.connection.readyState,
        stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        database: mongoose.connection.db?.databaseName || 'not connected',
        host: mongoose.connection.host || 'not connected'
    };

    res.json({
        status: 'UP',
        timestamp: new Date(),
        mongodb: mongoStatus,
        environment: process.env.NODE_ENV || 'not set'
    });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    logger.info(`Notification service running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
