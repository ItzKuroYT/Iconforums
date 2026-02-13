// js/api.js - API Client Library

const API = {
  BASE: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.BASE}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include', // Include cookies for auth
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Auth
  async signup(email, username, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: { email, username, password }
    });
  },

  async login(emailOrUsername, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { emailOrUsername, password }
    });
  },

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  },

  async checkAuth() {
    return this.request('/auth/check');
  },

  // Posts
  async getPosts() {
    return this.request('/posts');
  },

  async getPost(id) {
    return this.request(`/posts/${id}`);
  },

  async createPost(title, body, category) {
    return this.request('/posts', {
      method: 'POST',
      body: { title, body, category }
    });
  },

  // Comments
  async addComment(postId, body) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { body }
    });
  },

  // Voting
  async votePost(postId, type) {
    return this.request(`/posts/${postId}/vote`, {
      method: 'POST',
      body: { type }
    });
  },

  async voteComment(commentId, type) {
    return this.request(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: { type }
    });
  }
};
