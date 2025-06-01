const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const sosAlertRoutes = require('./routes/sosAlertRoutes');
const nearbyMechanicRoutes = require('./routes/nearbyMechanicRoutes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: logger.stream }));

// Routes
app.use('/api/sos-alerts', sosAlertRoutes);
app.use('/api/nearby-mechanics', nearbyMechanicRoutes);


// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(config.mongoUri)
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Promise Rejection:', error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app; 