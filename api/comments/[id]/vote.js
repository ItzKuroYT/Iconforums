// api/comments/[id]/vote.js
// Vote on a comment

const { verifyAuth } = require('../lib/auth');
const { comments, rateLimiting } = require('../lib/db');
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

    const { id: commentId } = req.query;
    const { type } = req.body; // 'upvote', 'downvote', or 'remove'

    // Rate limiting
    if (!rateLimiting.check(user.id, 'vote', RATE_LIMIT)) {
      return res.status(429).json(formatError('Too many votes. Try again later.', 429));
    }

    // Check comment exists
    const comment = comments.findById(commentId);
    if (!comment) {
      return res.status(404).json(formatError('Comment not found', 404));
    }

    // Validate vote type
    if (!['upvote', 'downvote', 'remove'].includes(type)) {
      return res.status(400).json(formatError('Invalid vote type'));
    }

    // Process vote
    let success = false;
    if (type === 'upvote') {
      success = votes.addCommentUpvote(commentId, user.id);
    } else if (type === 'downvote') {
      success = votes.addCommentDownvote(commentId, user.id);
    } else if (type === 'remove') {
      success = votes.removeCommentVote(commentId, user.id);
    }

    if (!success && type !== 'remove') {
      return res.status(400).json(formatError('You have already voted on this comment'));
    }

    const updatedComment = comments.findById(commentId);
    const voteScore = (updatedComment.upvotes?.length || 0) - (updatedComment.downvotes?.length || 0);

    return res.status(200).json(formatSuccess({
      voteScore,
      upvoteCount: updatedComment.upvotes?.length || 0,
      downvoteCount: updatedComment.downvotes?.length || 0,
      userVote: {
        upvoted: updatedComment.upvotes?.includes(user.id) || false,
        downvoted: updatedComment.downvotes?.includes(user.id) || false
      }
    }));

  } catch (error) {
    console.error('Comment vote error:', error);
    return res.status(500).json(formatError('Internal server error', 500));
  }
};

// Vote functions
const votes = {
  addCommentUpvote: (commentId, userId) => {
    const comment = comments.findById(commentId);
    if (!comment) return false;
    if (comment.upvotes.includes(userId)) return false;
    comment.upvotes.push(userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    return true;
  },

  addCommentDownvote: (commentId, userId) => {
    const comment = comments.findById(commentId);
    if (!comment) return false;
    if (comment.downvotes.includes(userId)) return false;
    comment.downvotes.push(userId);
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    return true;
  },

  removeCommentVote: (commentId, userId) => {
    const comment = comments.findById(commentId);
    if (!comment) return false;
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    return true;
  }
};
