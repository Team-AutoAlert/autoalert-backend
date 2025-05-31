const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const trackingRoutes = require('./routes/trackingRoutes');
const socketService = require('./services/socketService');
const logger = require('./utils/logger');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize socket.io
socketService.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/tracking', trackingRoutes);

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
    logger.info(`Tracking service running on port ${PORT}`);
});
