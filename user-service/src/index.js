const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint - always respond even if DB is down
app.get('/', (req, res) => {
  res.json({
    service: 'AutoAlert User Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      documentation: 'Coming soon'
    }
  });
});

// Health check endpoint - respond even if DB is down
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    service: 'user-service'
  });
});

// Routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Connect to MongoDB with retries
const startServer = async () => {
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 5000; // 5 seconds
  let retries = 0;

  const tryConnect = async () => {
    try {
      await connectDB();
      const port = process.env.PORT || 3001;
      app.listen(port, () => {
        logger.info(`User service listening on port ${port}`);
      });
    } catch (error) {
      logger.error(`Failed to start server (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      if (retries < MAX_RETRIES) {
        retries++;
        logger.info(`Retrying in ${RETRY_INTERVAL/1000} seconds...`);
        setTimeout(tryConnect, RETRY_INTERVAL);
      } else {
        logger.error('Max retries reached. Starting server without DB connection.');
        // Start server anyway to handle health checks
        const port = process.env.PORT || 3001;
        app.listen(port, () => {
          logger.info(`User service listening on port ${port} (DB connection failed)`);
        });
      }
    }
  };

  tryConnect();
};

startServer();
