require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { openDatabase, init } = require('./db');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'forum.db');

async function main() {
  const app = express();
  app.set('jwtSecret', JWT_SECRET);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // basic rate limiter
  const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
  app.use(limiter);

  // open DB and init schema
  const db = openDatabase(DB_FILE);
  await init(db);
  app.db = db;

  // seed admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    // simple inline seed - safe to call repeatedly
    const { get, run } = require('./db');
    (async () => {
      const row = await get(db, 'SELECT id FROM users WHERE email = ?', [adminEmail]);
      if (!row) {
        const { hashPassword } = require('./auth');
        const pw = await hashPassword(adminPassword);
        await run(db, 'INSERT INTO users (email, username, password_hash, is_staff, created_at) VALUES (?,?,?,?,?)', [adminEmail, 'admin', pw, 1, new Date().toISOString()]);
        console.log('Seeded admin user:', adminEmail);
      }
    })();
  }

  // mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postsRoutes);

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
