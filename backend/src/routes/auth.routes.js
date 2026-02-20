const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;

// Made with Bob
