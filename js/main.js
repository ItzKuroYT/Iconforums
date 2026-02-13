// js/main.js - Main application logic

const State = {
  currentCategory: 'all',
  posts: [],
  isLoading: false
};

const UI = {
  showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
  },

  hideAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
  },

  showPostDetail(postId) {
    const modal = document.getElementById('postDetailModal');
    const content = document.getElementById('postDetailContent');
    content.innerHTML = '<div class="spinner">Loading...</div>';
    modal.classList.remove('hidden');

    API.getPost(postId).then(response => {
      const post = response.data.post;
      let html = `
        <h2>${escapeHtml(post.title)}</h2>
        <div style="display: flex; gap: 12px; font-size: 12px; color: var(--muted); margin: 12px 0;">
          <span>${post.category}</span>
          <span>by ${escapeHtml(post.author)}</span>
          <span>${new Date(post.createdAt).toLocaleString()}</span>
        </div>

        <div style="margin: 16px 0; line-height: 1.6;">
          ${escapeHtml(post.body).replace(/\n/g, '<br>')}
        </div>

        ${Auth.isAuthenticated() ? `
          <div class="vote-section">
            <button class="vote-btn ${post.userVote?.upvoted ? 'active' : ''}" id="upvoteBtn">👍 ${post.upvoteCount}</button>
            <button class="vote-btn ${post.userVote?.downvoted ? 'active' : ''}" id="downvoteBtn">👎 ${post.downvoteCount}</button>
            <span class="vote-count">Score: ${post.voteScore}</span>
          </div>
        ` : ''}

        <div class="comments-section">
          <h3>Comments (${post.commentCount})</h3>
          <div class="comment-list" id="commentsList"></div>

          ${Auth.isAuthenticated() ? `
            <form id="addCommentForm" class="comment-form">
              <textarea id="commentBody" placeholder="Add a comment..." maxlength="2000" required></textarea>
              <button type="submit" class="btn btn-primary" style="align-self: flex-start;">Post Comment</button>
            </form>
          ` : '<p style="color: var(--muted); font-size: 14px;">Sign in to comment</p>'}
        </div>
      `;

      content.innerHTML = html;

      // Render comments
      post.comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.innerHTML = `
          <div class="comment-author">${escapeHtml(comment.author)}</div>
          <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
          <div class="comment-body">${escapeHtml(comment.body)}</div>
          ${Auth.isAuthenticated() ? `
            <div style="display: flex; gap: 8px; font-size: 12px;">
              <button class="vote-btn comment-upvote" data-id="${comment.id}" ${comment.userVote?.upvoted ? 'style="background: rgba(79, 209, 197, 0.2); color: var(--accent);"' : ''}>👍 ${comment.upvoteCount}</button>
              <button class="vote-btn comment-downvote" data-id="${comment.id}" ${comment.userVote?.downvoted ? 'style="background: rgba(79, 209, 197, 0.2); color: var(--accent);"' : ''}>👎 ${comment.downvoteCount}</button>
            </div>
          ` : ''}
        `;
        document.getElementById('commentsList').appendChild(commentEl);
      });

      // Bind events
      if (Auth.isAuthenticated()) {
        document.getElementById('upvoteBtn').addEventListener('click', () => this.votePost(postId, 'upvote'));
        document.getElementById('downvoteBtn').addEventListener('click', () => this.votePost(postId, 'downvote'));
        document.getElementById('addCommentForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.addComment(postId);
        });
        document.querySelectorAll('.comment-upvote').forEach(btn => {
          btn.addEventListener('click', () => this.voteComment(btn.dataset.id, 'upvote'));
        });
        document.querySelectorAll('.comment-downvote').forEach(btn => {
          btn.addEventListener('click', () => this.voteComment(btn.dataset.id, 'downvote'));
        });
      }
    }).catch(error => {
      content.innerHTML = `<div style="color: red;">Error loading post: ${error.message}</div>`;
    });
  },

  votePost(postId, type) {
    API.votePost(postId, type).then(() => {
      this.showPostDetail(postId);
    }).catch(error => {
      alert('Vote failed: ' + error.message);
    });
  },

  voteComment(commentId, type) {
    API.voteComment(commentId, type).then(response => {
      // Refresh the parent post detail
      const modal = document.getElementById('postDetailModal');
      // Get the post ID from the current modal content (would need to store it)
      // For now, just show a simple success message
      // In production, you'd want better state management
    }).catch(error => {
      alert('Vote failed: ' + error.message);
    });
  },

  addComment(postId) {
    const body = document.getElementById('commentBody').value.trim();
    if (!body) {
      alert('Comment cannot be empty');
      return;
    }

    API.addComment(postId, body).then(() => {
      this.showPostDetail(postId);
      document.getElementById('commentBody').value = '';
    }).catch(error => {
      alert('Comment failed: ' + error.message);
    });
  }
};

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

async function loadPosts() {
  State.isLoading = true;
  const spinner = document.getElementById('loadingSpinner');
  const postsList = document.getElementById('postsList');
  const noPostsMsg = document.getElementById('noPostsMessage');
  const errorMsg = document.getElementById('errorMessage');

  spinner.classList.remove('hidden');
  postsList.innerHTML = '';
  noPostsMsg.classList.add('hidden');
  errorMsg.classList.add('hidden');

  try {
    const response = await API.getPosts();
    State.posts = response.data.posts;

    const filteredPosts = State.currentCategory === 'all'
      ? State.posts
      : State.posts.filter(p => p.category === State.currentCategory);

    if (filteredPosts.length === 0) {
      noPostsMsg.classList.remove('hidden');
    } else {
      filteredPosts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'post-card';
        postEl.innerHTML = `
          <div class="post-header">
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
          </div>
          <div class="post-meta">
            <span>${post.category}</span>
            <span>by ${escapeHtml(post.author)}</span>
            <span>${new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <div class="post-preview">${escapeHtml(post.body).substring(0, 200)}${post.body.length > 200 ? '...' : ''}</div>
          <div class="post-stats">
            <span>💬 ${post.commentCount} comments</span>
            <span>👍 ${post.upvoteCount} • 👎 ${post.downvoteCount}</span>
          </div>
        `;
        postEl.addEventListener('click', () => UI.showPostDetail(post.id));
        postsList.appendChild(postEl);
      });
    }
  } catch (error) {
    errorMsg.textContent = 'Error loading posts: ' + error.message;
    errorMsg.classList.remove('hidden');
  }

  spinner.classList.add('hidden');
  State.isLoading = false;
}

function setupEventListeners() {
  // Auth modal
  document.getElementById('authModal').addEventListener('click', (e) => {
    if (e.target.id === 'authModal') UI.hideAuthModal();
  });
  document.querySelector('.modal-close').addEventListener('click', () => UI.hideAuthModal());

  // Auth tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
      btn.classList.add('active');
      const tabName = btn.dataset.tab;
      document.getElementById(tabName + 'Form').classList.remove('hidden');
    });
  });

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    const result = await Auth.login(email, password);
    if (result.success) {
      UI.hideAuthModal();
      loadPosts();
    } else {
      document.getElementById('loginMessage').textContent = 'Error: ' + result.error;
      document.getElementById('loginMessage').classList.add('error');
    }
  });

  // Signup form
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    const result = await Auth.signup(email, username, password);
    if (result.success) {
      UI.hideAuthModal();
      loadPosts();
    } else {
      document.getElementById('signupMessage').textContent = 'Error: ' + result.error;
      document.getElementById('signupMessage').classList.add('error');
    }
  });

  // New post form
  document.getElementById('newPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const body = document.getElementById('postBody').value.trim();
    const category = document.getElementById('postCategory').value;

    if (!Auth.isAuthenticated()) {
      alert('Please log in to post');
      return;
    }

    try {
      await API.createPost(title, body, category);
      document.getElementById('newPostForm').reset();
      loadPosts();
    } catch (error) {
      alert('Error creating post: ' + error.message);
    }
  });

  // Character counters
  document.getElementById('postTitle').addEventListener('input', (e) => {
    document.getElementById('titleCount').textContent = e.target.value.length;
  });

  document.getElementById('postBody').addEventListener('input', (e) => {
    document.getElementById('bodyCount').textContent = e.target.value.length;
  });

  // Category buttons
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.currentCategory = btn.dataset.category;
      loadPosts();
    });
  });

  // Post detail modal close
  document.getElementById('postDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'postDetailModal') {
      document.getElementById('postDetailModal').classList.add('hidden');
    }
  });

  const postDetailClose = document.querySelectorAll('#postDetailModal .modal-close');
  postDetailClose.forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('postDetailModal').classList.add('hidden');
    });
  });
}

// Initialize app
window.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  setupEventListeners();
  loadPosts();
});
