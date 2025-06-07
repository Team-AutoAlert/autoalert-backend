const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const logger = require('./utils/logger');
const admin = require('./config/firebase');
const config = require('./config/config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint - basic service info
app.get('/', (req, res) => {
  res.json({
    service: 'AutoAlert Auth Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    service: 'auth-service',
    firebase: 'connected'
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const port = process.env.PORT || 3002;
app.listen(port, () => {
  logger.info(`Auth service listening on port ${port}`);
  logger.info(`Environment: ${config.env}`);
});
