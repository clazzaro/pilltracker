const database = require('../config/database');

async function getAllOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [userId]
    );

    // Get orders
    const orders = await database.all(
      `SELECT id, order_number, status, total, items_count, shipping_address, tracking_number, created_at, updated_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// NOTE: Search functionality intentionally missing - Bob will add this for CP-101
// async function searchOrders(req, res, next) {
//   // This endpoint will be added by Bob
// }

async function getOrderById(req, res, next) {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await database.get(
      `SELECT id, order_number, status, total, items_count, shipping_address, created_at, updated_at
       FROM orders 
       WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllOrders,
  getOrderById
  // searchOrders will be added by Bob
};

// Made with Bob
