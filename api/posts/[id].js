// api/posts/[id].js
// Get a single post

const { verifyAuth } = require('../lib/auth');
const { posts, comments } = require('../lib/db');
const { escapeHtml, formatError, formatSuccess } = require('../lib/validation');

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(formatError('Method not allowed'));
  }

  try {
    const { id } = req.query;
    const post = posts.findById(id);

    if (!post) {
      return res.status(404).json(formatError('Post not found', 404));
    }

    const user = verifyAuth(req, res);
    const userVote = user ? {
      upvoted: post.upvotes?.includes(user.id) || false,
      downvoted: post.downvotes?.includes(user.id) || false
    } : null;

    // Get comments
    const postComments = post.comments.map(commentId => {
      const comment = comments.findById(commentId);
      return {
        id: comment.id,
        body: escapeHtml(comment.body),
        author: comment.author,
        authorId: comment.authorId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        voteScore: (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0),
        upvoteCount: comment.upvotes?.length || 0,
        downvoteCount: comment.downvotes?.length || 0,
        userVote: user ? {
          upvoted: comment.upvotes?.includes(user.id) || false,
          downvoted: comment.downvotes?.includes(user.id) || false
        } : null
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const responsePost = {
      id: post.id,
      title: escapeHtml(post.title),
      body: escapeHtml(post.body),
      category: post.category,
      authorId: post.authorId,
      author: post.author,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentCount: post.comments.length,
      voteScore: (post.upvotes?.length || 0) - (post.downvotes?.length || 0),
      upvoteCount: post.upvotes?.length || 0,
      downvoteCount: post.downvotes?.length || 0,
      userVote,
      comments: postComments
    };

    return res.status(200).json(formatSuccess({ post: responsePost }));

  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};
