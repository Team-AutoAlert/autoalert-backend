const express = require('express');
const router = express.Router();
const orderRoutes = require('./orderRoutes');
const sosRoutes = require('./sosRoutes');
const onSiteRoutes = require('./onSiteRoutes');
const billRoutes = require('./billRoutes');

// Mount routes
router.use('/orders', orderRoutes);
router.use('/sos', sosRoutes);
router.use('/onsite', onSiteRoutes);
router.use('/bills', billRoutes);

module.exports = router; 