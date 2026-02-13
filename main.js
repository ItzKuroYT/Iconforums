// js/api.js - API Client Library
// All communication with backend API routes

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

        setSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    function login(email, password) {
        email = sanitize(email).toLowerCase();
        password = sanitize(password);
        const users = getUsers();
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) return { ok: false, err: "Invalid credentials" };

        const sessionUser = { id: user.id, email: user.email, username: user.username, isStaff: isStaffEmail(user.email) };
        setSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    function logout() {
        clearSession();
        return { ok: true };
    }

    // Staff management: only staff can add staff by email
    function addStaffByEmail(requesterEmail, newStaffEmail) {
        requesterEmail = sanitize(requesterEmail).toLowerCase();
        newStaffEmail = sanitize(newStaffEmail).toLowerCase();
        if (!isStaffEmail(requesterEmail)) return { ok: false, err: "Not authorized" };
        const staff = new Set(getStaffEmails());
        staff.add(newStaffEmail);
        setStaffEmails(Array.from(staff));
        // if user exists and is currently logged in, update session flag where applicable
        const users = getUsers();
        const u = users.find((x) => x.email === newStaffEmail);
        if (u) {
            // nothing to edit on user object, session flag updated when they login
        }
        return { ok: true };
    }

    // Posts
    function createPost(title, content, category) {
        const session = getSession();
        if (!session) return { ok: false, err: "Login required" };
        title = sanitize(title);
        content = sanitize(content);
        category = sanitize(category);
        if (!title || !content) return { ok: false, err: "Title and content required" };
        if (!CATEGORIES.includes(category)) return { ok: false, err: "Invalid category" };
        const posts = getPosts();
        const post = {
            id: "p_" + Date.now(),
            title,
            content,
            category,
            authorId: session.id,
            authorUsername: session.username,
            createdAt: nowISO(),
            updatedAt: nowISO()
        };
        posts.unshift(post); // newest first
        setPosts(posts);
        return { ok: true, post };
    }

    // Search & filtering
    function searchPosts(query = "", category = null) {
        const q = sanitize(query).toLowerCase();
        const posts = getPosts();
        return posts.filter((p) => {
            if (category && category !== "All" && p.category !== category) return false;
            if (!q) return true;
            return (
                p.title.toLowerCase().includes(q) ||
                p.content.toLowerCase().includes(q) ||
                p.authorUsername.toLowerCase().includes(q)
            );
        });
    }

    // Render helpers: these expect certain container elements exist in HTML
    function renderCategories(selectElementId) {
        const el = document.getElementById(selectElementId);
        if (!el) return;
        el.innerHTML = "";
        const allOpt = document.createElement("option");
        allOpt.value = "All";
        allOpt.textContent = "All";
        el.appendChild(allOpt);
        CATEGORIES.forEach((c) => {
            const o = document.createElement("option");
            o.value = c;
            o.textContent = c;
            el.appendChild(o);
        });
    }

    function renderPosts(containerId, posts) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        if (!posts.length) {
            container.textContent = "No posts yet.";
            return;
        }
        posts.forEach((p) => {
            const card = document.createElement("div");
            card.className = "post-card";
            const h = document.createElement("h3");
            h.textContent = p.title;
            const meta = document.createElement("div");
            meta.className = "meta";
            meta.textContent = `${p.category} • by ${p.authorUsername} • ${new Date(p.createdAt).toLocaleString()}`;
            const body = document.createElement("p");
            body.textContent = p.content;
            card.appendChild(h);
            card.appendChild(meta);
            card.appendChild(body);
            container.appendChild(card);
        });
    }

    // Bind events if specific elements exist
    function bindUI() {
        // Signup
        const signupForm = document.getElementById("signupForm");
        if (signupForm) {
            signupForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const email = signupForm.querySelector('[name="email"]').value;
                const password = signupForm.querySelector('[name="password"]').value;
                const username = signupForm.querySelector('[name="username"]').value;
                const res = signup(email, password, username);
                const msg = signupForm.querySelector(".message");
                if (res.ok) {
                    if (msg) msg.textContent = "Signup successful. Logged in as " + res.user.username;
                    updateUI();
                } else {
                    if (msg) msg.textContent = "Error: " + res.err;
                }
            });
        }

        // Login
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const email = loginForm.querySelector('[name="email"]').value;
                const password = loginForm.querySelector('[name="password"]').value;
                const res = login(email, password);
                const msg = loginForm.querySelector(".message");
                if (res.ok) {
                    if (msg) msg.textContent = "Logged in as " + res.user.username;
                    updateUI();
                } else {
                    if (msg) msg.textContent = "Error: " + res.err;
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                logout();
                updateUI();
            });
        }

        // Create post
        const postForm = document.getElementById("createPostForm");
        if (postForm) {
            renderCategories("postCategory");
            postForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const title = postForm.querySelector('[name="title"]').value;
                const content = postForm.querySelector('[name="content"]').value;
                const categoryEl = postForm.querySelector('[name="category"]') || document.getElementById("postCategory");
                const category = categoryEl ? categoryEl.value : CATEGORIES[0];
                const res = createPost(title, content, category);
                const msg = postForm.querySelector(".message");
                if (res.ok) {
                    if (msg) msg.textContent = "Post created.";
                    updatePosts();
                    postForm.reset();
                } else {
                    if (msg) msg.textContent = "Error: " + res.err;
                }
            });
        }

        // Search & filter
        const searchForm = document.getElementById("searchForm");
        if (searchForm) {
            renderCategories("searchCategory");
            const input = searchForm.querySelector('[name="q"]') || document.getElementById("searchInput");
            const categoryEl = searchForm.querySelector('[name="category"]') || document.getElementById("searchCategory");
            const resultsId = (searchForm.getAttribute("data-results-id")) || "postsContainer";
            const doSearch = () => {
                const q = input ? input.value : "";
                const cat = categoryEl ? categoryEl.value : null;
                const results = searchPosts(q, cat);
                renderPosts(resultsId, results);
            };
            searchForm.addEventListener("submit", (e) => {
                e.preventDefault();
                doSearch();
            });
            // live search
            if (input) input.addEventListener("input", () => doSearch());
            if (categoryEl) categoryEl.addEventListener("change", () => doSearch());
        }

        // Staff add
        const staffForm = document.getElementById("staffForm");
        if (staffForm) {
            staffForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const email = staffForm.querySelector('[name="email"]').value;
                const session = getSession();
                const msg = staffForm.querySelector(".message");
                if (!session) {
                    if (msg) msg.textContent = "Login as staff to add staff.";
                    return;
                }
                const res = addStaffByEmail(session.email, email);
                if (res.ok) {
                    if (msg) msg.textContent = "Added staff: " + email;
                    updateUI();
                } else {
                    if (msg) msg.textContent = "Error: " + res.err;
                }
            });
        }
    }

    // Update posts rendering
    function updatePosts() {
        const posts = getPosts();
        renderPosts("postsContainer", posts);
    }

    // Update UI elements related to session and staff
    function updateUI() {
        const session = getSession();
        const loginPanel = document.getElementById("loginPanel");
        const userPanel = document.getElementById("userPanel");
        const usernameDisplay = document.getElementById("usernameDisplay");
        const staffBadge = document.getElementById("staffBadge");
        if (loginPanel) loginPanel.style.display = session ? "none" : "block";
        if (userPanel) userPanel.style.display = session ? "block" : "none";
        if (usernameDisplay) usernameDisplay.textContent = session ? session.username : "";
        if (staffBadge) staffBadge.style.display = session && session.isStaff ? "inline-block" : "none";

        // If staff changed list while logged in, update session flag
        if (session) {
            const updated = { ...session, isStaff: isStaffEmail(session.email) };
            setSession(updated);
            if (usernameDisplay) usernameDisplay.textContent = updated.username;
            if (staffBadge) staffBadge.style.display = updated.isStaff ? "inline-block" : "none";
        }

        // Update posts
        updatePosts();
    }

    // Initial rendering and bindings
    function init() {
        // render category selects if exist
        renderCategories("postCategory");
        renderCategories("searchCategory");

        bindUI();
        updateUI();
    }

    // Expose some functions to window for debugging or simple control
    window.ForumAPI = {
        signup,
        login,
        logout,
        createPost,
        searchPosts,
        addStaffByEmail,
        getUsers,
        getPosts,
        getStaffEmails,
        getSession,
        CATEGORIES
    };

    // Run init on DOMContentLoaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();