const express = require('express');
const router = express.Router();
const { run, all, get } = require('../db');
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, req.app.get('jwtSecret'));
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireStaff(req, res, next) {
  if (!req.user || !req.user.is_staff) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// GET /api/posts?q=&category=&limit=&offset=
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const category = req.query.category || '';
    let rows = await all(req.app.db, 'SELECT p.*, u.username as author_username, u.email as author_email FROM posts p JOIN users u ON p.author_id = u.id ORDER BY p.pinned DESC, p.created_at DESC');
    if (category) rows = rows.filter(r => r.category === category);
    if (q) rows = rows.filter(r => (r.title + ' ' + r.content + ' ' + r.author_username).toLowerCase().includes(q));
    const mapped = rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      pinned: !!r.pinned,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: { id: r.author_id, username: r.author_username, email: r.author_email }
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) return res.status(400).json({ error: 'Missing fields' });
    const now = new Date().toISOString();
    const r = await run(req.app.db, 'INSERT INTO posts (title,content,category,author_id,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)', [title, content, category, req.user.id, 0, now, now]);
    const postId = r.lastID;
    const p = await get(req.app.db, 'SELECT p.*, u.username as author_username, u.email as author_email FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?', [postId]);
    res.status(201).json({ id: p.id, title: p.title, content: p.content, category: p.category, pinned: !!p.pinned, created_at: p.created_at, author: { id: p.author_id, username: p.author_username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await get(req.app.db, 'SELECT p.*, u.username as author_username, u.email as author_email FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Not found' });
    // vote sum
    const v = await get(req.app.db, 'SELECT SUM(value) as score, COUNT(*) as votes FROM votes WHERE post_id = ?', [req.params.id]);
    const score = v ? (v.score || 0) : 0;
    const votesCount = v ? (v.votes || 0) : 0;
    // comments
    const comments = await all(req.app.db, 'SELECT c.id, c.content, c.created_at, u.id as author_id, u.username as author_username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC', [req.params.id]);

    res.json({ id: p.id, title: p.title, content: p.content, category: p.category, pinned: !!p.pinned, created_at: p.created_at, author: { id: p.author_id, username: p.author_username }, votes: { score: score, count: votesCount }, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/comments (auth required)
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Missing content' });
    const now = new Date().toISOString();
    const r = await run(req.app.db, 'INSERT INTO comments (post_id, author_id, content, created_at) VALUES (?,?,?,?)', [postId, req.user.id, content, now]);
    const commentId = r.lastID;
    const c = await get(req.app.db, 'SELECT c.id, c.content, c.created_at, u.id as author_id, u.username as author_username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.id = ?', [commentId]);
    res.status(201).json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/vote (auth required) body: { value: 1 | -1 }
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    let { value } = req.body;
    value = Number(value) === 1 ? 1 : -1; // normalize
    // check existing
    const existing = await get(req.app.db, 'SELECT * FROM votes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);
    const now = new Date().toISOString();
    if (existing) {
      if (existing.value === value) {
        // same vote -> remove (toggle off)
        await run(req.app.db, 'DELETE FROM votes WHERE id = ?', [existing.id]);
      } else {
        // change
        await run(req.app.db, 'UPDATE votes SET value = ?, updated_at = ? WHERE id = ?', [value, now, existing.id]);
      }
    } else {
      await run(req.app.db, 'INSERT INTO votes (post_id, user_id, value, created_at, updated_at) VALUES (?,?,?,?,?)', [postId, req.user.id, value, now, now]);
    }
    // return new score
    const v = await get(req.app.db, 'SELECT SUM(value) as score, COUNT(*) as votes FROM votes WHERE post_id = ?', [postId]);
    const score = v ? (v.score || 0) : 0;
    const votesCount = v ? (v.votes || 0) : 0;
    res.json({ score, count: votesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/posts/:id (staff only)
router.delete('/:id', requireAuth, requireStaff, async (req, res) => {
  try {
    await run(req.app.db, 'DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/pin (staff only) - toggles
router.post('/:id/pin', requireAuth, requireStaff, async (req, res) => {
  try {
    const p = await get(req.app.db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const newVal = p.pinned ? 0 : 1;
    await run(req.app.db, 'UPDATE posts SET pinned = ?, updated_at = ? WHERE id = ?', [newVal, new Date().toISOString(), req.params.id]);
    const p2 = await get(req.app.db, 'SELECT p.*, u.username as author_username FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?', [req.params.id]);
    res.json({ id: p2.id, pinned: !!p2.pinned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
