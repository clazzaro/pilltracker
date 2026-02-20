const database = require('../config/database');

async function getAllInvoices(req, res, next) {
  try {
    const userId = req.user.id;
    
    const invoices = await database.all(
      `SELECT id, invoice_number, amount, status, due_date, paid_date, description, created_at
       FROM invoices 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
}

async function getInvoiceById(req, res, next) {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    const invoice = await database.get(
      `SELECT id, invoice_number, amount, status, due_date, paid_date, description, created_at
       FROM invoices 
       WHERE id = ? AND user_id = ?`,
      [invoiceId, userId]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

// INTENTIONALLY BROKEN - Missing CORS headers for file download (CP-102)
// Bob will fix this bug
async function downloadInvoice(req, res, next) {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    const invoice = await database.get(
      'SELECT * FROM invoices WHERE id = ? AND user_id = ?',
      [invoiceId, userId]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate simple PDF content (mock)
    const pdfContent = `
INVOICE ${invoice.invoice_number}
================================

Amount: $${invoice.amount}
Status: ${invoice.status}
Due Date: ${invoice.due_date}
Description: ${invoice.description}

Thank you for your business!
    `.trim();

    // BUG: Missing proper CORS headers and content-disposition
    // This will cause the download to fail in the browser
    res.setHeader('Content-Type', 'application/pdf');
    // Missing: res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    // Missing: res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    res.send(Buffer.from(pdfContent));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  downloadInvoice
};

// Made with Bob
