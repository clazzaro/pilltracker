const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const database = require('../src/config/database');

// Sample data
const users = [
  {
    email: 'demo@customer.com',
    password: 'demo123',
    name: 'Demo Customer',
    company: 'Acme Corporation',
    phone: '+1-555-0100'
  },
  {
    email: 'john.doe@techcorp.com',
    password: 'demo123',
    name: 'John Doe',
    company: 'TechCorp Industries',
    phone: '+1-555-0101'
  },
  {
    email: 'jane.smith@startup.io',
    password: 'demo123',
    name: 'Jane Smith',
    company: 'Startup.io',
    phone: '+1-555-0102'
  }
];

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ticketStatuses = ['open', 'in_progress', 'resolved', 'closed'];
const ticketPriorities = ['low', 'medium', 'high', 'urgent'];
const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    await database.connect();
    
    // Initialize schema
    console.log('Initializing database schema...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Use exec for multiple statements
    await new Promise((resolve, reject) => {
      database.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Clear existing data
    console.log('Clearing existing data...');
    await database.run('DELETE FROM ticket_comments');
    await database.run('DELETE FROM invoices');
    await database.run('DELETE FROM tickets');
    await database.run('DELETE FROM orders');
    await database.run('DELETE FROM users');
    
    // Reset autoincrement counters
    await database.run('DELETE FROM sqlite_sequence WHERE name IN ("users", "orders", "tickets", "invoices", "ticket_comments")');
    
    // Insert users
    console.log('Creating users...');
    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await database.run(
        'INSERT INTO users (email, password, name, company, phone) VALUES (?, ?, ?, ?, ?)',
        [user.email, hashedPassword, user.name, user.company, user.phone]
      );
      userIds.push(result.id);
      console.log(`  ✓ Created user: ${user.email}`);
    }
    
    // Insert orders (50+ orders)
    console.log('Creating orders...');
    const orderCount = 60;
    const startDate = new Date('2023-01-01');
    const endDate = new Date();
    
    for (let i = 1; i <= orderCount; i++) {
      const userId = randomElement(userIds);
      const orderNumber = `ORD-${String(1000 + i).padStart(5, '0')}`;
      const status = randomElement(orderStatuses);
      const total = (Math.random() * 1000 + 50).toFixed(2);
      const itemsCount = Math.floor(Math.random() * 5) + 1;
      const createdAt = randomDate(startDate, endDate).toISOString();
      
      // Generate tracking number for all orders except cancelled and pending
      const trackingNumber = (status !== 'cancelled' && status !== 'pending')
        ? `1Z${Math.random().toString(36).substring(2, 9).toUpperCase()}${Math.floor(Math.random() * 10000000)}`
        : null;
      
      await database.run(
        `INSERT INTO orders (user_id, order_number, status, total, items_count, shipping_address, tracking_number, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, orderNumber, status, total, itemsCount, '123 Main St, City, State 12345', trackingNumber, createdAt]
      );
    }
    console.log(`  ✓ Created ${orderCount} orders`);
    
    // Insert support tickets (20+ tickets)
    console.log('Creating support tickets...');
    const ticketSubjects = [
      'Unable to login to account',
      'Order not received',
      'Billing question',
      'Feature request: Dark mode',
      'Product quality issue',
      'Shipping delay inquiry',
      'Account settings not saving',
      'Payment method update needed',
      'Invoice discrepancy',
      'Technical support needed',
      'Refund request',
      'Product information needed',
      'Subscription cancellation',
      'Password reset issue',
      'Mobile app not working'
    ];
    
    const ticketCount = 25;
    for (let i = 1; i <= ticketCount; i++) {
      const userId = randomElement(userIds);
      const ticketNumber = `TKT-${String(2000 + i).padStart(5, '0')}`;
      const subject = randomElement(ticketSubjects);
      const description = `This is a sample support ticket description for ${subject}. The customer is experiencing issues and needs assistance.`;
      const status = randomElement(ticketStatuses);
      const priority = randomElement(ticketPriorities);
      const createdAt = randomDate(startDate, endDate).toISOString();
      
      await database.run(
        `INSERT INTO tickets (user_id, ticket_number, subject, description, status, priority, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, ticketNumber, subject, description, status, priority, createdAt]
      );
    }
    console.log(`  ✓ Created ${ticketCount} support tickets`);
    
    // Insert invoices (30+ invoices)
    console.log('Creating invoices...');
    const invoiceCount = 35;
    for (let i = 1; i <= invoiceCount; i++) {
      const userId = randomElement(userIds);
      const invoiceNumber = `INV-${String(3000 + i).padStart(5, '0')}`;
      const amount = (Math.random() * 2000 + 100).toFixed(2);
      const status = randomElement(invoiceStatuses);
      const createdAt = randomDate(startDate, endDate);
      const dueDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
      const paidDate = status === 'paid' ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
      const description = `Monthly service invoice for ${createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      
      await database.run(
        `INSERT INTO invoices (user_id, invoice_number, amount, status, due_date, paid_date, description, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, invoiceNumber, amount, status, dueDate.toISOString().split('T')[0], 
         paidDate ? paidDate.toISOString().split('T')[0] : null, description, createdAt.toISOString()]
      );
    }
    console.log(`  ✓ Created ${invoiceCount} invoices`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo credentials:');
    console.log('  Email: demo@customer.com');
    console.log('  Password: demo123');
    console.log('\nOther test accounts:');
    console.log('  Email: john.doe@techcorp.com');
    console.log('  Password: demo123');
    console.log('  Email: jane.smith@startup.io');
    console.log('  Password: demo123');
    
    await database.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

// Made with Bob
