// api/lib/auth.js
// JWT and authentication utilities

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';
const JWT_EXPIRY = '7d';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Create JWT token
 * @param {object} payload - Data to encode in token
 * @returns {string} JWT token
 */
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from HTTP-only cookie or Authorization header
 * @param {object} req - Express/Vercel request object
 * @returns {string|null} Token or null
 */
function extractToken(req) {
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Middleware to verify authentication
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 * @returns {object|null} User object or null
 */
function verifyAuth(req, res) {
  const token = extractToken(req);
  if (!token) return null;

  const user = verifyToken(token);
  return user;
}

/**
 * Create Set-Cookie header for HTTP-only cookie
 * @param {string} token - JWT token
 * @returns {string} Set-Cookie header value
 */
function createCookie(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? 'Secure;' : '';
  const sameSite = isProduction ? 'SameSite=Strict;' : 'SameSite=Lax;';

  return `auth_token=${token}; Path=/; HttpOnly; ${secure}${sameSite} Max-Age=604800`;
}

/**
 * Create clear cookie header
 * @returns {string} Set-Cookie header value
 */
function clearCookie() {
  return 'auth_token=; Path=/; HttpOnly; Max-Age=0';
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  extractToken,
  verifyAuth,
  createCookie,
  clearCookie,
  JWT_SECRET
};
