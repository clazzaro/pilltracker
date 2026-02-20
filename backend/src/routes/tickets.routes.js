const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all tickets
router.get('/', ticketsController.getAllTickets);

// Create new ticket
router.post('/', ticketsController.createTicket);

// Get ticket by ID
router.get('/:id', ticketsController.getTicketById);

// Add comment to ticket
router.post('/:id/comments', ticketsController.addComment);

module.exports = router;

// Made with Bob
