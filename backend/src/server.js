require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const database = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const ordersRoutes = require('./routes/orders.routes');
const ticketsRoutes = require('./routes/tickets.routes');
const billingRoutes = require('./routes/billing.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Customer Portal API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/billing', billingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();
    console.log('✅ Database connected');

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📋 API endpoints:`);
      console.log(`   - POST   /api/auth/login`);
      console.log(`   - GET    /api/auth/me`);
      console.log(`   - GET    /api/orders`);
      console.log(`   - GET    /api/orders/:id`);
      console.log(`   - GET    /api/tickets`);
      console.log(`   - POST   /api/tickets`);
      console.log(`   - GET    /api/tickets/:id`);
      console.log(`   - POST   /api/tickets/:id/comments`);
      console.log(`   - GET    /api/billing/invoices`);
      console.log(`   - GET    /api/billing/invoices/:id`);
      console.log(`   - GET    /api/billing/invoices/:id/download`);
      console.log(`\n🔐 Demo credentials:`);
      console.log(`   Email: demo@customer.com`);
      console.log(`   Password: demo123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

// Made with Bob
