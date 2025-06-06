const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Service URLs - These should be moved to config file in production
const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    USER: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    ORDER: process.env.ORDER_SERVICE_URL || 'http://localhost:3007',
    PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3008',
    TRACKING: process.env.TRACKING_SERVICE_URL || 'http://localhost:3006',
    NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    TUTORIAL: process.env.TUTORIAL_SERVICE_URL || 'http://localhost:3004',
    COMMUNICATION: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3003'
};

// Auth Service Routes
router.use('/auth', createProxyMiddleware({
    target: SERVICES.AUTH,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '/'
    }
}));

// User Service Routes
router.use('/users', createProxyMiddleware({
    target: SERVICES.USER,
    changeOrigin: true,
    pathRewrite: {
        '^/users': '/'
    }
}));

// Order Service Routes
router.use('/orders', createProxyMiddleware({
    target: SERVICES.ORDER,
    changeOrigin: true,
    pathRewrite: {
        '^/orders': '/'
    }
}));

// Payment Service Routes
router.use('/payments', createProxyMiddleware({
    target: SERVICES.PAYMENT,
    changeOrigin: true,
    pathRewrite: {
        '^/payments': '/'
    }
}));

// Tracking Service Routes
router.use('/tracking', createProxyMiddleware({
    target: SERVICES.TRACKING,
    changeOrigin: true,
    pathRewrite: {
        '^/tracking': '/'
    }
}));

// Notification Service Routes
router.use('/notifications', createProxyMiddleware({
    target: SERVICES.NOTIFICATION,
    changeOrigin: true,
    pathRewrite: {
        '^/notifications': '/'
    }
}));

// Tutorial Service Routes
router.use('/tutorials', createProxyMiddleware({
    target: SERVICES.TUTORIAL,
    changeOrigin: true,
    pathRewrite: {
        '^/tutorials': '/'
    }
}));

// Communication Service Routes
router.use('/communications', createProxyMiddleware({
    target: SERVICES.COMMUNICATION,
    changeOrigin: true,
    pathRewrite: {
        '^/communications': '/'
    }
}));

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API Gateway is running' });
});

module.exports = router;
