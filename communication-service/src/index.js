const express = require('express');
const cors = require('cors');
const { port } = require('./config/config');
const communicationRoutes = require('./routes/communicationRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/communications', communicationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'communication-service' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Communication service running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});
