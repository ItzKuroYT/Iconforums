const express = require('express');
const router = express.Router();
const { get, run } = require('../db');
const { signToken, hashPassword, comparePassword } = require('../auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
  const { email, username, password } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });

    // check existing email/username
    const existingEmail = await get(req.app.db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) return res.status(400).json({ error: 'Email exists' });
    const existingName = await get(req.app.db, 'SELECT id FROM users WHERE username = ?', [username]);
    if (existingName) return res.status(400).json({ error: 'Username exists' });

  const pwHash = await hashPassword(password);
  const now = new Date().toISOString();
  // Automatically grant staff/admin role to a specific email or the seeded ADMIN_EMAIL
  const autoAdminEmail = (process.env.AUTO_ADMIN_EMAIL || 'isaaccooper926@gmail.com').toLowerCase();
  const envAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const isStaffFlag = (email.toLowerCase() === autoAdminEmail) || (envAdmin && email.toLowerCase() === envAdmin);
  const r = await run(req.app.db, 'INSERT INTO users (email, username, password_hash, is_staff, created_at) VALUES (?,?,?,?,?)', [email, username, pwHash, isStaffFlag ? 1 : 0, now]);
  const userId = r.lastID;
  const token = signToken({ id: userId, email, username, is_staff: !!isStaffFlag }, req.app.get('jwtSecret'));
  return res.status(201).json({ token, user: { id: userId, email, username, is_staff: !!isStaffFlag } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const identifier = (email || username || '').trim();
    if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' });
    // allow login by email or username
    const user = await get(req.app.db, 'SELECT id,email,username,password_hash,is_staff FROM users WHERE email = ? OR username = ?', [identifier, identifier]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email, username: user.username, is_staff: !!user.is_staff }, req.app.get('jwtSecret'));
    return res.json({ token, user: { id: user.id, email: user.email, username: user.username, is_staff: !!user.is_staff } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/me
const jwt = require('jsonwebtoken');
router.get('/me', async (req, res) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, req.app.get('jwtSecret'));
    return res.json({ user: payload });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
