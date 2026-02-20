const database = require('../config/database');

async function getAllTickets(req, res, next) {
  try {
    const userId = req.user.id;
    const status = req.query.status;
    
    let query = `SELECT id, ticket_number, subject, description, status, priority, created_at, updated_at
                 FROM tickets 
                 WHERE user_id = ?`;
    const params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const tickets = await database.all(query, params);
    
    res.json({ tickets });
  } catch (error) {
    next(error);
  }
}

async function getTicketById(req, res, next) {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;

    const ticket = await database.get(
      `SELECT id, ticket_number, subject, description, status, priority, created_at, updated_at
       FROM tickets 
       WHERE id = ? AND user_id = ?`,
      [ticketId, userId]
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get comments
    const comments = await database.all(
      `SELECT tc.id, tc.comment, tc.created_at, u.name as user_name
       FROM ticket_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.ticket_id = ?
       ORDER BY tc.created_at ASC`,
      [ticketId]
    );

    res.json({ ...ticket, comments });
  } catch (error) {
    next(error);
  }
}

async function createTicket(req, res, next) {
  try {
    const userId = req.user.id;
    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    // Generate ticket number
    const lastTicket = await database.get(
      'SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1'
    );
    
    let ticketNum = 2000;
    if (lastTicket) {
      const lastNum = parseInt(lastTicket.ticket_number.split('-')[1]);
      ticketNum = lastNum + 1;
    }
    
    const ticketNumber = `TKT-${String(ticketNum).padStart(5, '0')}`;

    const result = await database.run(
      `INSERT INTO tickets (user_id, ticket_number, subject, description, status, priority) 
       VALUES (?, ?, ?, ?, 'open', ?)`,
      [userId, ticketNumber, subject, description, priority || 'medium']
    );

    const ticket = await database.get(
      'SELECT * FROM tickets WHERE id = ?',
      [result.id]
    );

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Verify ticket belongs to user
    const ticket = await database.get(
      'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
      [ticketId, userId]
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const result = await database.run(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [ticketId, userId, comment]
    );

    const newComment = await database.get(
      `SELECT tc.id, tc.comment, tc.created_at, u.name as user_name
       FROM ticket_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.id = ?`,
      [result.id]
    );

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  addComment
};

// Made with Bob
