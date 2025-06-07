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

// Routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
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
