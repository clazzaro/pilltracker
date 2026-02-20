const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { generateToken } = require('../config/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await database.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Remove password from response
    delete user.password;

    res.json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await database.get(
      'SELECT id, email, name, company, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  // With JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
}

module.exports = {
  login,
  getMe,
  logout
};

// Made with Bob
