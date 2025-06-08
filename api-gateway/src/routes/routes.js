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

// Common proxy options for services with third-party integrations
const thirdPartyProxyConfig = {
    changeOrigin: true,
    timeout: 60000, // Increased timeout for third-party calls
    proxyTimeout: 60000,
    secure: false, // Allow insecure SSL certificates
    ws: true, // Enable WebSocket support
    xfwd: true, // Add x-forward headers
    onProxyReq: (proxyReq, req, res) => {
        // Preserve original headers
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
        // Handle POST requests
        if (req.body && req.method === 'POST') {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error connecting to the service',
            error: process.env.NODE_ENV === 'development' ? err.message : {}
        });
    }
};

// Regular proxy config for simple services
const regularProxyConfig = {
    changeOrigin: true,
    timeout: 30000,
    secure: true
};

// Auth Service Routes (with third-party config for Firebase)
router.use('/auth', createProxyMiddleware({
    target: SERVICES.AUTH,
    pathRewrite: {
        '^/auth': '/'
    },
    ...thirdPartyProxyConfig,
    onProxyReq: (proxyReq, req, res) => {
        // Special handling for Firebase auth
        if (req.body && req.method === 'POST') {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}));

// Communication Service Routes (with third-party config for Twilio)
router.use('/communications', createProxyMiddleware({
    target: SERVICES.COMMUNICATION,
    pathRewrite: {
        '^/communications': '/'
    },
    ...thirdPartyProxyConfig,
    onProxyReq: (proxyReq, req, res) => {
        // Special handling for Twilio
        if (req.body && req.method === 'POST') {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}));

// Regular service routes with standard config
const regularServices = [
    { path: '/users', target: SERVICES.USER },
    { path: '/orders', target: SERVICES.ORDER },
    { path: '/payments', target: SERVICES.PAYMENT },
    { path: '/tracking', target: SERVICES.TRACKING },
    { path: '/notifications', target: SERVICES.NOTIFICATION },
    { path: '/tutorials', target: SERVICES.TUTORIAL }
];

regularServices.forEach(service => {
    router.use(service.path, createProxyMiddleware({
        target: service.target,
        pathRewrite: {
            [`^${service.path}`]: '/'
        },
        ...regularProxyConfig
    }));
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API Gateway is running' });
});

module.exports = router;
