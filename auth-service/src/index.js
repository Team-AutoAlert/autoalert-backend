const express = require('express');
const cors = require('cors');
const { port } = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

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

// Start server
app.listen(port, () => {
  logger.info(`Auth service running on port ${port}`);
});
