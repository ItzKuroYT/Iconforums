// api/posts/index.js
// Get all posts or create a new post

const { verifyAuth } = require('../lib/auth');
const { posts, rateLimiting, users } = require('../lib/db');
const {
  isValidPostTitle,
  isValidPostBody,
  sanitize,
  escapeHtml,
  formatError,
  formatSuccess
} = require('../lib/validation');

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_POSTS || 10);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return handleGetPosts(req, res);
    } else if (req.method === 'POST') {
      return handleCreatePost(req, res);
    } else {
      return res.status(405).json(formatError('Method not allowed'));
    }
  } catch (error) {
    console.error('Posts error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};

function handleGetPosts(req, res) {
  const allPosts = posts.all().map(post => ({
    id: post.id,
    title: escapeHtml(post.title),
    body: escapeHtml(post.body),
    authorId: post.authorId,
    author: post.author,
    category: post.category,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    commentCount: post.comments.length,
    voteScore: (post.upvotes?.length || 0) - (post.downvotes?.length || 0),
    upvoteCount: post.upvotes?.length || 0,
    downvoteCount: post.downvotes?.length || 0
  }));

  return res.status(200).json(formatSuccess({ posts: allPosts }));
}

async function handleCreatePost(req, res) {
  const user = verifyAuth(req, res);

  if (!user) {
    return res.status(401).json(formatError('Authentication required', 401));
  }

  // Rate limiting
  if (!rateLimiting.check(user.id, 'post', RATE_LIMIT)) {
    return res.status(429).json(formatError('Too many posts. Try again later.', 429));
  }

  const { title, body, category } = req.body;

  // Validation
  if (!isValidPostTitle(title)) {
    return res.status(400).json(formatError('Title must be 3-200 characters'));
  }

  if (!isValidPostBody(body)) {
    return res.status(400).json(formatError('Body must be 10-10000 characters'));
  }

  if (!category || typeof category !== 'string') {
    return res.status(400).json(formatError('Category required'));
  }

  // Create post
  const postId = 'post_' + Date.now();
  const fullUser = users.findById(user.id);

  const post = posts.create(postId, {
    title: sanitize(title),
    body: sanitize(body),
    category: sanitize(category),
    authorId: user.id,
    author: fullUser.username
  });

  return res.status(201).json(formatSuccess({ post }, 201));
}
