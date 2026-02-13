// js/auth.js - Authentication handling

const Auth = {
  currentUser: null,

  async init() {
    try {
      const response = await API.checkAuth();
      if (response.data.isAuthenticated) {
        this.currentUser = response.data.user;
        this.updateUI();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.currentUser = null;
    }
  },

  async signup(email, username, password) {
    try {
      const response = await API.signup(email, username, password);
      this.currentUser = response.data.user;
      this.updateUI();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async login(emailOrUsername, password) {
    try {
      const response = await API.login(emailOrUsername, password);
      this.currentUser = response.data.user;
      this.updateUI();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    try {
      await API.logout();
      this.currentUser = null;
      this.updateUI();
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      this.currentUser = null;
      this.updateUI();
      return { success: true };
    }
  },

  isAuthenticated() {
    return this.currentUser !== null;
  },

  updateUI() {
    const authStatus = document.getElementById('authStatus');
    const newPostForm = document.getElementById('newPostForm');

    if (this.currentUser) {
      authStatus.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span>${this.currentUser.username}</span>
          <button id="logoutBtn" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">Logout</button>
        </div>
      `;
      document.getElementById('logoutBtn').addEventListener('click', () => {
        this.logout().then(() => location.reload());
      });
      newPostForm.style.display = 'flex';
    } else {
      authStatus.innerHTML = `
        <button id="loginBtn" class="btn btn-primary" style="padding: 10px 16px;">Login / Sign Up</button>
      `;
      document.getElementById('loginBtn').addEventListener('click', () => {
        UI.showAuthModal();
      });
      newPostForm.style.display = 'none';
    }
  }
};
