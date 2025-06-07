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

// Root endpoint
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

// Routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    service: 'user-service'
  });
});

// Connect to MongoDB with retries
const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`User service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    // Wait 5 seconds before retrying
    setTimeout(startServer, 5000);
  }
};

startServer();
