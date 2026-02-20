const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all invoices
router.get('/invoices', billingController.getAllInvoices);

// Get invoice by ID
router.get('/invoices/:id', billingController.getInvoiceById);

// Download invoice (intentionally broken - CP-102)
router.get('/invoices/:id/download', billingController.downloadInvoice);

module.exports = router;

// Made with Bob
