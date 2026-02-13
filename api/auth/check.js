// api/auth/check.js
// Check current user authentication status

const { verifyAuth } = require('../lib/auth');
const { users } = require('../lib/db');
const { formatSuccess, formatError } = require('../lib/validation');

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(formatError('Method not allowed'));
  }

  try {
    const user = verifyAuth(req, res);

    if (!user) {
      return res.status(200).json(formatSuccess({ isAuthenticated: false, user: null }));
    }

    // Get full user object
    const fullUser = users.findById(user.id);

    return res.status(200).json(formatSuccess({
      isAuthenticated: true,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        username: fullUser.username
      }
    }));

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};
