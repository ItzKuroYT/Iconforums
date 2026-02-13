// api/auth/signup.js
// User registration endpoint

const { hashPassword, createToken, createCookie } = require('../lib/auth');
const { users, rateLimiting } = require('../lib/db');
const { 
  isValidEmail, 
  isValidPassword, 
  isValidUsername,
  sanitize,
  formatError,
  formatSuccess
} = require('../lib/validation');

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_POSTS || 10); // reuse for signup

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
    const { email, username, password } = req.body;

    // Validate inputs
    const emailSanitized = sanitize(email);
    const usernameSanitized = sanitize(username);
    const passwordSanitized = sanitize(password);

    if (!isValidEmail(emailSanitized)) {
      return res.status(400).json(formatError('Invalid email format'));
    }

    if (!isValidUsername(usernameSanitized)) {
      return res.status(400).json(formatError('Username must be 3-20 characters (letters, numbers, underscores)'));
    }

    if (!isValidPassword(passwordSanitized)) {
      return res.status(400).json(formatError('Password must be at least 8 characters with letters and numbers'));
    }

    // Check email already exists
    if (users.findByEmail(emailSanitized)) {
      return res.status(409).json(formatError('Email already registered'));
    }

    // Check username already exists
    if (users.findByUsername(usernameSanitized)) {
      return res.status(409).json(formatError('Username already taken'));
    }

    // Hash password
    const passwordHash = await hashPassword(passwordSanitized);

    // Create user
    const userId = 'user_' + Date.now();
    const user = users.create(userId, {
      email: emailSanitized,
      username: usernameSanitized,
      passwordHash,
      createdAt: new Date().toISOString()
    });

    // Create token
    const token = createToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', createCookie(token));

    return res.status(201).json(formatSuccess({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    }, 201));

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};
