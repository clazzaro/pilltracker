const fs = require('fs');
const path = require('path');
const database = require('../src/config/database');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Connect to database
    await database.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema using exec (better for multiple statements)
    await new Promise((resolve, reject) => {
      database.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Database initialized successfully!');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - orders');
    console.log('  - tickets');
    console.log('  - ticket_comments');
    console.log('  - invoices');
    
    await database.close();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;

// Made with Bob
