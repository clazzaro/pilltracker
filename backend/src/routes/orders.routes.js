const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all orders
router.get('/', ordersController.getAllOrders);

// Search orders - intentionally missing, Bob will add this for CP-101
// router.get('/search', ordersController.searchOrders);

// Get order by ID
router.get('/:id', ordersController.getOrderById);

module.exports = router;

// Made with Bob
