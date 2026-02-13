// api/lib/db.js
// File-based database utility
// Saves data to JSON files in /data folder
// Loads data on startup

const fs = require('fs');
const path = require('path');

// Setup data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions to read/write JSON files
const readJSON = (filePath, defaultValue = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      writeJSON(filePath, defaultValue);
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
};

// Load data from files
const store = {
  users: readJSON(USERS_FILE, {}),
  posts: readJSON(POSTS_FILE, {}),
  comments: readJSON(COMMENTS_FILE, {}),
  votes: {},
  rateLimits: {} // track requests per user (in-memory only)
};

// Helper function to persist users
const saveUsers = () => writeJSON(USERS_FILE, store.users);

// Helper function to persist posts
const savePosts = () => writeJSON(POSTS_FILE, store.posts);

// Helper function to persist comments
const saveComments = () => writeJSON(COMMENTS_FILE, store.comments);

/**
 * User operations
 */
const users = {
  create: (id, data) => {
    store.users[id] = { ...data, id, createdAt: new Date().toISOString() };
    saveUsers();
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
      saveUsers();
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
    savePosts();
    return store.posts[id];
  },

  findById: (id) => store.posts[id] || null,

  update: (id, data) => {
    if (store.posts[id]) {
      store.posts[id] = { ...store.posts[id], ...data, updatedAt: new Date().toISOString() };
      savePosts();
      return store.posts[id];
    }
    return null;
  },

  delete: (id) => {
    delete store.posts[id];
    savePosts();
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
    saveComments();
    return store.comments[id];
  },

  findById: (id) => store.comments[id] || null,

  update: (id, data) => {
    if (store.comments[id]) {
      store.comments[id] = { ...store.comments[id], ...data, updatedAt: new Date().toISOString() };
      saveComments();
      return store.comments[id];
    }
    return null;
  },

  delete: (id) => {
    delete store.comments[id];
    saveComments();
  },

  byPost: (postId) => {
    const post = store.posts[postId];
    if (!post) return [];
    return post.comments.map(commentId => store.comments[commentId]).filter(Boolean);
  },

  addToPost: (postId, commentId) => {
    if (store.posts[postId]) {
      store.posts[postId].comments.push(commentId);
      savePosts();
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
    // If already upvoted, toggle off (remove upvote)
    if (post.upvotes.includes(userId)) {
      post.upvotes = post.upvotes.filter(id => id !== userId);
      savePosts();
      return true;
    }
    // Otherwise add upvote and remove any downvote
    post.upvotes.push(userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);
    savePosts();
    return true;
  },

  addPostDownvote: (postId, userId) => {
    const post = store.posts[postId];
    if (!post) return false;
    // If already downvoted, toggle off (remove downvote)
    if (post.downvotes.includes(userId)) {
      post.downvotes = post.downvotes.filter(id => id !== userId);
      savePosts();
      return true;
    }
    // Otherwise add downvote and remove any upvote
    post.downvotes.push(userId);
    post.upvotes = post.upvotes.filter(id => id !== userId);
    savePosts();
    return true;
  },

  removePostVote: (postId, userId) => {
    const post = store.posts[postId];
    if (!post) return false;
    post.upvotes = post.upvotes.filter(id => id !== userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);
    savePosts();
    return true;
  },

  addCommentUpvote: (commentId, userId) => {
    const comment = store.comments[commentId];
    if (!comment) return false;
    // If already upvoted, toggle off (remove upvote)
    if (comment.upvotes.includes(userId)) {
      comment.upvotes = comment.upvotes.filter(id => id !== userId);
      saveComments();
      return true;
    }
    // Otherwise add upvote and remove any downvote
    comment.upvotes.push(userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    saveComments();
    return true;
  },

  addCommentDownvote: (commentId, userId) => {
    const comment = store.comments[commentId];
    if (!comment) return false;
    // If already downvoted, toggle off (remove downvote)
    if (comment.downvotes.includes(userId)) {
      comment.downvotes = comment.downvotes.filter(id => id !== userId);
      saveComments();
      return true;
    }
    // Otherwise add downvote and remove any upvote
    comment.downvotes.push(userId);
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    saveComments();
    return true;
  },

  removeCommentVote: (commentId, userId) => {
    const comment = store.comments[commentId];
    if (!comment) return false;
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    saveComments();
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
