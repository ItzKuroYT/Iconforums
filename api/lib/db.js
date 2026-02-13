// api/lib/db.js
// Simple in-memory database utility
// Can be replaced with Vercel KV, MongoDB, PostgreSQL, etc.

// In-memory store
const store = {
  users: {},
  posts: {},
  comments: {},
  votes: {},
  rateLimits: {} // track requests per user
};

/**
 * User operations
 */
const users = {
  create: (id, data) => {
    store.users[id] = { ...data, id, createdAt: new Date().toISOString() };
    return store.users[id];
  },

  findById: (id) => store.users[id] || null,

  findByEmail: (email) => {
    return Object.values(store.users).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findByUsername: (username) => {
    return Object.values(store.users).find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  update: (id, data) => {
    if (store.users[id]) {
      store.users[id] = { ...store.users[id], ...data };
      return store.users[id];
    }
    return null;
  },

  all: () => Object.values(store.users)
};

/**
 * Post operations
 */
const posts = {
  create: (id, data) => {
    store.posts[id] = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      upvotes: [],
      downvotes: []
    };
    return store.posts[id];
  },

  findById: (id) => store.posts[id] || null,

  update: (id, data) => {
    if (store.posts[id]) {
      store.posts[id] = { ...store.posts[id], ...data, updatedAt: new Date().toISOString() };
      return store.posts[id];
    }
    return null;
  },

  delete: (id) => {
    delete store.posts[id];
  },

  all: () => Object.values(store.posts).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ),

  byAuthor: (userId) => Object.values(store.posts).filter(p => p.authorId === userId),

  getCommentCount: (postId) => (store.posts[postId]?.comments || []).length,

  getVoteScore: (postId) => {
    const post = store.posts[postId];
    if (!post) return 0;
    return (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
  }
};

/**
 * Comment operations
 */
const comments = {
  create: (id, data) => {
    store.comments[id] = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: [],
      downvotes: []
    };
    return store.comments[id];
  },

  findById: (id) => store.comments[id] || null,

  update: (id, data) => {
    if (store.comments[id]) {
      store.comments[id] = { ...store.comments[id], ...data, updatedAt: new Date().toISOString() };
      return store.comments[id];
    }
    return null;
  },

  delete: (id) => {
    delete store.comments[id];
  },

  byPost: (postId) => {
    const post = store.posts[postId];
    if (!post) return [];
    return post.comments.map(commentId => store.comments[commentId]).filter(Boolean);
  },

  addToPost: (postId, commentId) => {
    if (store.posts[postId]) {
      store.posts[postId].comments.push(commentId);
    }
  },

  getVoteScore: (commentId) => {
    const comment = store.comments[commentId];
    if (!comment) return 0;
    return (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0);
  }
};

/**
 * Vote operations
 */
const votes = {
  addPostUpvote: (postId, userId) => {
    const post = store.posts[postId];
    if (!post) return false;
    if (post.upvotes.includes(userId)) return false;
    post.upvotes.push(userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);
    return true;
  },

  addPostDownvote: (postId, userId) => {
    const post = store.posts[postId];
    if (!post) return false;
    if (post.downvotes.includes(userId)) return false;
    post.downvotes.push(userId);
    post.upvotes = post.upvotes.filter(id => id !== userId);
    return true;
  },

  removePostVote: (postId, userId) => {
    const post = store.posts[postId];
    if (!post) return false;
    post.upvotes = post.upvotes.filter(id => id !== userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);
    return true;
  },

  addCommentUpvote: (commentId, userId) => {
    const comment = store.comments[commentId];
    if (!comment) return false;
    if (comment.upvotes.includes(userId)) return false;
    comment.upvotes.push(userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    return true;
  },

  addCommentDownvote: (commentId, userId) => {
    const comment = store.comments[commentId];
    if (!comment) return false;
    if (comment.downvotes.includes(userId)) return false;
    comment.downvotes.push(userId);
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    return true;
  },

  removeCommentVote: (commentId, userId) => {
    const comment = store.comments[commentId];
    if (!comment) return false;
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    return true;
  },

  userHasUpvoted: (postId, userId) => store.posts[postId]?.upvotes.includes(userId) || false,
  userHasDownvoted: (postId, userId) => store.posts[postId]?.downvotes.includes(userId) || false
};

/**
 * Rate limiting operations
 */
const rateLimiting = {
  check: (userId, action, limit) => {
    const now = Date.now();
    const key = `${userId}:${action}`;
    const window = 3600000; // 1 hour

    if (!store.rateLimits[key]) {
      store.rateLimits[key] = { times: [] };
    }

    // Clean old entries
    store.rateLimits[key].times = store.rateLimits[key].times.filter(t => now - t < window);

    if (store.rateLimits[key].times.length >= limit) {
      return false; // Rate limit exceeded
    }

    store.rateLimits[key].times.push(now);
    return true;
  },

  reset: (userId, action) => {
    const key = `${userId}:${action}`;
    delete store.rateLimits[key];
  }
};

module.exports = {
  users,
  posts,
  comments,
  votes,
  rateLimiting,
  store // For debugging/resetting
};
