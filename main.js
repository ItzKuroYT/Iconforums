// main.js
// GitHub Copilot
// Forum client-side logic using localStorage (no backend).
// Assumes corresponding HTML elements (forms, inputs, containers) exist.

(() => {
    // Config
    const CATEGORIES = ["Bugs", "Patches", "Looking for team", "Market"];
    const LS_USERS = "ig_users";
    const LS_POSTS = "ig_posts";
    const LS_STAFF = "ig_staff";
    const LS_SESSION = "ig_session";

    // Helpers for localStorage
    const load = (key, fallback) => {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch {
            return fallback;
        }
    };
    const save = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // Initialize storage if needed
    if (!load(LS_USERS, null)) save(LS_USERS, []);
    if (!load(LS_POSTS, null)) save(LS_POSTS, []);
    if (!load(LS_STAFF, null)) {
        // Example: initial staff list can include the email that first creates admin
        save(LS_STAFF, []);
    }

    // Session
    const getSession = () => load(LS_SESSION, null);
    const setSession = (user) => save(LS_SESSION, user);
    const clearSession = () => localStorage.removeItem(LS_SESSION);

    // Data models
    const getUsers = () => load(LS_USERS, []);
    const setUsers = (u) => save(LS_USERS, u);
    const getPosts = () => load(LS_POSTS, []);
    const setPosts = (p) => save(LS_POSTS, p);
    const getStaffEmails = () => load(LS_STAFF, []);
    const setStaffEmails = (s) => save(LS_STAFF, s);

    // Utilities
    const nowISO = () => new Date().toISOString();
    const sanitize = (s) => (s || "").toString().trim();
    const isStaffEmail = (email) => getStaffEmails().includes(email);

    // Username rules:
    // - 3..20 chars
    // - letters, numbers, underscores
    // - must be unique; if taken, signup fails and suggestion is offered to append numbers/underscore
    const usernameValid = (username) => /^[A-Za-z0-9_]{3,20}$/.test(username);

    const usernameAvailable = (username) => {
        const users = getUsers();
        return !users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    };

    const suggestUsername = (base) => {
        base = base.replace(/[^A-Za-z0-9_]/g, "").slice(0, 16) || "user";
        for (let i = 1; i < 1000; i++) {
            const candidate = base + (i === 1 ? "_" : i);
            if (usernameAvailable(candidate)) return candidate;
        }
        return base + "_" + Date.now();
    };

    // Auth: simple email/password (hashed password not implemented; this is demo only)
    function signup(email, password, username) {
        email = sanitize(email).toLowerCase();
        password = sanitize(password);
        username = sanitize(username);

        if (!email || !password || !username) return { ok: false, err: "Missing fields" };
        if (!usernameValid(username)) return { ok: false, err: "Username must be 3-20 chars: letters, numbers, underscores" };
        if (!usernameAvailable(username)) {
            const suggestion = suggestUsername(username);
            return { ok: false, err: "Username taken. Try: " + suggestion, suggestion };
        }

        const users = getUsers();
        if (users.some((u) => u.email === email)) return { ok: false, err: "Email already registered" };

        const user = {
            id: "u_" + Date.now(),
            email,
            password, // NOTE: storing plaintext in localStorage is insecure. Use a backend in real apps.
            username,
            createdAt: nowISO()
        };
        users.push(user);
        setUsers(users);

        // auto-mark as staff if email in staff list
        const sessionUser = { id: user.id, email: user.email, username: user.username, isStaff: isStaffEmail(user.email) };
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