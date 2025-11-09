const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

function signToken(payload, secret, expiresIn = '8h') {
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

function authMiddleware(secret) {
  return (req, res, next) => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = h.slice(7);
    const payload = verifyToken(token, secret);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  };
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { signToken, verifyToken, authMiddleware, hashPassword, comparePassword };
