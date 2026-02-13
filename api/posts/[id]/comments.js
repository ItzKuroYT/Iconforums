// api/posts/[id]/comments.js
// Add a comment to a post

const { verifyAuth } = require('../lib/auth');
const { posts, comments, rateLimiting, users } = require('../lib/db');
const {
  isValidComment,
  sanitize,
  formatError,
  formatSuccess
} = require('../lib/validation');

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_COMMENTS || 30);

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
    const user = verifyAuth(req, res);

    if (!user) {
      return res.status(401).json(formatError('Authentication required', 401));
    }

    const { id: postId } = req.query;
    const { body } = req.body;

    // Check post exists
    const post = posts.findById(postId);
    if (!post) {
      return res.status(404).json(formatError('Post not found', 404));
    }

    // Rate limiting
    if (!rateLimiting.check(user.id, 'comment', RATE_LIMIT)) {
      return res.status(429).json(formatError('Too many comments. Try again later.', 429));
    }

    // Validation
    if (!isValidComment(body)) {
      return res.status(400).json(formatError('Comment must be 1-2000 characters'));
    }

    // Create comment
    const commentId = 'comment_' + Date.now();
    const fullUser = users.findById(user.id);

    const comment = comments.create(commentId, {
      body: sanitize(body),
      postId,
      authorId: user.id,
      author: fullUser.username
    });

    // Add to post
    comments.addToPost(postId, commentId);

    return res.status(201).json(formatSuccess({ comment }, 201));

  } catch (error) {
    console.error('Comment error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};
