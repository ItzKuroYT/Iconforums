// api/posts/[id]/vote.js
// Vote on a post

const { verifyAuth } = require('../lib/auth');
const { posts, rateLimiting } = require('../lib/db');
const { formatError, formatSuccess } = require('../lib/validation');

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_VOTES || 50);

module.exports = (req, res) => {
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
    const { type } = req.body; // 'upvote', 'downvote', or 'remove'

    // Rate limiting
    if (!rateLimiting.check(user.id, 'vote', RATE_LIMIT)) {
      return res.status(429).json(formatError('Too many votes. Try again later.', 429));
    }

    // Check post exists
    const post = posts.findById(postId);
    if (!post) {
      return res.status(404).json(formatError('Post not found', 404));
    }

    // Validate vote type
    if (!['upvote', 'downvote', 'remove'].includes(type)) {
      return res.status(400).json(formatError('Invalid vote type'));
    }

    // Process vote
    let success = false;
    if (type === 'upvote') {
      success = votes.addPostUpvote(postId, user.id);
    } else if (type === 'downvote') {
      success = votes.addPostDownvote(postId, user.id);
    } else if (type === 'remove') {
      success = votes.removePostVote(postId, user.id);
    }

    if (!success && type !== 'remove') {
      return res.status(400).json(formatError('You have already voted on this post'));
    }

    const updatedPost = posts.findById(postId);
    const voteScore = (updatedPost.upvotes?.length || 0) - (updatedPost.downvotes?.length || 0);

    return res.status(200).json(formatSuccess({
      voteScore,
      upvoteCount: updatedPost.upvotes?.length || 0,
      downvoteCount: updatedPost.downvotes?.length || 0,
      userVote: {
        upvoted: updatedPost.upvotes?.includes(user.id) || false,
        downvoted: updatedPost.downvotes?.includes(user.id) || false
      }
    }));

  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};

// Vote functions
const votes = {
  addPostUpvote: (postId, userId) => {
    const post = posts.findById(postId);
    if (!post) return false;
    if (post.upvotes.includes(userId)) return false;
    post.upvotes.push(userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);
    return true;
  },

  addPostDownvote: (postId, userId) => {
    const post = posts.findById(postId);
    if (!post) return false;
    if (post.downvotes.includes(userId)) return false;
    post.downvotes.push(userId);
    post.upvotes = post.upvotes.filter(id => id !== userId);
    return true;
  },

  removePostVote: (postId, userId) => {
    const post = posts.findById(postId);
    if (!post) return false;
    post.upvotes = post.upvotes.filter(id => id !== userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);
    return true;
  }
};
