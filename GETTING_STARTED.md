# Getting Started with IconForums

Welcome! This guide will help you get IconForums running locally for development.

## Quick Start (5 minutes)

### 1. Clone/Navigate to Project
```bash
cd IconForums
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
JWT_SECRET=test-secret-key-not-for-production-123456789012345
NODE_ENV=development
```

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Detailed Setup

### Prerequisites Check
```bash
node --version  # Should be v18+
npm --version   # Should be v8+
git --version   # Should be present
```

### Installation Steps

#### 1. **Install Node Packages**
```bash
npm install
```

This installs:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `@vercel/node` - Serverless runtime

#### 2. **Create Environment File**
```bash
cp .env.example .env.local
```

Edit `.env.local` with these required values:
```
JWT_SECRET=your_secret_key_here_minimum_32_chars_recommended
NODE_ENV=development
RATE_LIMIT_POSTS=10
RATE_LIMIT_COMMENTS=30
RATE_LIMIT_VOTES=50
MAX_POST_TITLE_CHARS=200
MAX_POST_BODY_CHARS=10000
MAX_COMMENT_CHARS=2000
```

#### 3. **Install Vercel CLI** (Optional but recommended)
```bash
npm install -g vercel
```

## Running the Application

### Development Mode

#### Option 1: Using Vercel CLI (Recommended)
```bash
npm run dev
```
This runs Vercel's local development server which simulates the production environment.

#### Option 2: Using npm
If you don't have Vercel CLI:
```bash
npx vercel dev
```

### Access the App
Once running, open your browser to:
```
http://localhost:3000
```

## Testing the Application

### 1. Sign Up
- Click "Login / Sign Up" button
- Click "Sign Up" tab
- Enter:
  - Email: `test@example.com`
  - Username: `testuser`
  - Password: `Password123`
- Click "Create Account"

### 2. Create a Post
- Enter post title (e.g., "Welcome to IconForums")
- Enter post body (minimum 10 characters)
- Select a category
- Click "Post"

### 3. Interact with Posts
- Click on any post to view details
- Add a comment
- Upvote/downvote the post or comments
- View comment count and vote scores

### 4. Test Different Categories
- Use category buttons on the left sidebar
- Posts should filter by selected category

### 5. Test Authentication
- Logout by clicking "Logout" button
- Notice that posting form disappears
- Login again with same credentials
- Note that vote buttons appear for unauthenticated users

## Project Structure Explained

```
IconForums/
├── index.html              # Main forum UI
├── style.css              # Styling
├── package.json           # Dependencies
│
├── js/                    # Frontend JavaScript
│   ├── api.js            # HTTP client for API calls
│   ├── auth.js           # User authentication logic
│   └── main.js           # Main app logic & UI
│
└── api/                   # Backend (Serverless Functions)
    ├── lib/              # Shared utilities
    │   ├── auth.js      # JWT & password hashing
    │   ├── db.js        # Data persistence
    │   └── validation.js # Input validation
    │
    ├── auth/            # Authentication endpoints
    │   ├── signup.js
    │   ├── login.js
    │   ├── logout.js
    │   └── check.js
    │
    ├── posts/           # Post endpoints
    │   ├── index.js     # List & create posts
    │   ├── [id].js      # Get single post
    │   └── [id]/
    │       ├── comments.js
    │       └── vote.js
    │
    └── comments/        # Comment voting
        └── [id]/
            └── vote.js
```

## Frontend Code Flow

### 1. **index.html**
- Defines the HTML structure
- All UI elements for forum, auth, etc.

### 2. **js/api.js**
- API client with methods for each endpoint
- Handles request/response formatting
- Includes credentials for cookie-based auth

### 3. **js/auth.js**
- Manages user session state
- Handles signup/login/logout
- Updates UI based on auth status

### 4. **js/main.js**
- Loads and displays posts
- Binds event listeners to buttons
- Handles post creation, commenting, voting
- Shows post details in modal

## Backend Code Flow

### 1. **Serverless Function Handling**
Each endpoint is a separate serverless function:

```
Request → Route matching → Validation → Business logic → Response
```

### 2. **Authentication Flow**
```
Signup/Login → Password hash → JWT created → Cookie sent → Stored in browser
```

### 3. **Request Flow**
```
Browser request → Vercel function → Validate auth → Process → Return JSON
```

## Common Development Tasks

### Add a New Field to Posts
1. Update HTML form in `index.html`
2. Add validation in `api/lib/validation.js`
3. Update `api/posts/index.js` to handle field
4. Update frontend `js/main.js` to display field

### Change Rate Limits
Edit `.env.local`:
```
RATE_LIMIT_POSTS=20        # Increase to 20 posts/hour
RATE_LIMIT_COMMENTS=50     # Increase to 50 comments/hour
```

### Add New Category
In `index.html`, update the select dropdown:
```html
<option value="New Category">New Category</option>
```

### Change Character Limits
Edit `.env.local`:
```
MAX_POST_TITLE_CHARS=150
MAX_POST_BODY_CHARS=5000
MAX_COMMENT_CHARS=1500
```

## Debugging

### Browser Console Errors
1. Open DevTools (F12)
2. Check Console tab for errors
3. Common issues:
   - JWT_SECRET not set
   - API endpoint URL incorrect
   - Network requests failing

### Check Network Tab
1. Open DevTools → Network tab
2. Try an action (create post, vote, etc.)
3. Look for failed requests
4. Check Response tab to see error message

### View Server Logs
```bash
# In terminal where dev server is running
# Look for error messages
# Or use:
vercel logs
```

### Test API Directly (curl)
```bash
# Get posts
curl http://localhost:3000/api/posts

# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123"
  }'
```

## Common Issues & Solutions

### Issue: "Cannot find module 'bcryptjs'"
**Solution:**
```bash
npm install bcryptjs jsonwebtoken
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Run on different port
PORT=3001 npm run dev

# Or kill process using port 3000
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

### Issue: JWT_SECRET error
**Solution:**
Check `.env.local` has `JWT_SECRET=some-value`

### Issue: "CORS error" in browser console
**Solution:**
Already configured in API routes. Check:
1. API endpoint URL is correct
2. Network tab shows the request
3. Check server logs

### Issue: Can't login after signup
**Solution:**
1. Use same credentials you signed up with
2. Try different username (it must be unique)
3. Check password has letters AND numbers

## File Editing

### Frontend Files (Safe to modify)
- `index.html` - Add UI elements
- `style.css` - Change styling
- `js/main.js` - Change UI behavior
- `js/api.js` - Modify API calls

### Backend Files (Test carefully)
- `api/lib/*.js` - Core logic
- `api/*/` - Endpoints

### Configuration Files
- `.env.local` - Environment variables
- `package.json` - Dependencies
- `vercel.json` - Deployment config

## Next Steps

1. **Learn the codebase**
   - Read through `js/main.js` to understand UI logic
   - Read `api/posts/index.js` to understand API

2. **Make your first change**
   - Change the app title in `index.html`
   - Save and refresh browser

3. **Deploy to Vercel**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)

4. **Add features**
   - User profiles
   - Post editing
   - Advanced search

## Resources

- [MDN JavaScript Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Vercel Docs](https://vercel.com/docs)
- [JWT Explanation](https://jwt.io/introduction)
- [bcryptjs Docs](https://github.com/dcodeIO/bcrypt.js)

## Getting Help

1. Check existing issues on GitHub
2. Review error messages in browser console
3. Check network requests in DevTools
4. Review code comments in the files
5. Check README.md for more info

## Tips & Tricks

### Hot Reload
- Changes to `index.html`, `style.css` reload automatically
- Changes to `js/*.js` require page refresh
- Changes to `api/*.js` require server restart

### Browser Storage
- Check localStorage: DevTools → Application → Local Storage
- Check cookies: DevTools → Application → Cookies
- This is where JWT token is stored (in cookies)

### Mock Data
- In-memory database stores data while server runs
- Data resets when server restarts
- Use same credentials if you restart during testing

## Checklist Before Deploying

- [ ] Can create account
- [ ] Can login
- [ ] Can create post (when logged in)
- [ ] Can see posts while logged out
- [ ] Can add comments (when logged in)
- [ ] Can vote (when logged in)
- [ ] Can logout
- [ ] No console errors
- [ ] Environment variables set
- [ ] No hardcoded secrets

---

**Happy coding! 🚀**

Questions? Check the [README.md](README.md) or [DEPLOYMENT.md](DEPLOYMENT.md)
