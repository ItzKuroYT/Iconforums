// api/auth/logout.js
// User logout endpoint

const { clearCookie } = require('../lib/auth');
const { formatSuccess, formatError } = require('../lib/validation');

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(formatError('Method not allowed'));
  }

  try {
    // Clear cookie
    res.setHeader('Set-Cookie', clearCookie());

    return res.status(200).json(formatSuccess({
      message: 'Logged out successfully'
    }));

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};
