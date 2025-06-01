const express = require('express');
const cors = require('cors');
const { port } = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service' });
});

// Error handler
app.use(errorHandler);

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});
