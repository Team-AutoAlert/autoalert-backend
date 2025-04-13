const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const config = require('./config/config');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/payment', paymentRoutes);

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Handle 404 routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT} in ${config.server.nodeEnv} mode`);
});
