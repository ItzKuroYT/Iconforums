// api/auth/login.js
// User login endpoint

const { verifyPassword, createToken, createCookie } = require('../lib/auth');
const { users } = require('../lib/db');
const {
  sanitize,
  isValidEmail,
  formatError,
  formatSuccess
} = require('../lib/validation');

module.exports = async (req, res) => {
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
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json(formatError('Email/username and password required'));
    }

    const credential = sanitize(emailOrUsername);
    const passwordInput = sanitize(password);

    // Find user by email or username
    let user;
    if (isValidEmail(credential)) {
      user = users.findByEmail(credential);
    } else {
      user = users.findByUsername(credential);
    }

    if (!user) {
      return res.status(401).json(formatError('Invalid credentials'));
    }

    // Verify password
    const passwordValid = await verifyPassword(passwordInput, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json(formatError('Invalid credentials'));
    }

    // Create token
    const token = createToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', createCookie(token));

    return res.status(200).json(formatSuccess({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    }));

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};
