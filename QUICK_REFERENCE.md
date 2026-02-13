# Quick Reference Guide

## API Endpoints

### Authentication
```
POST   /api/auth/signup       → Register user
POST   /api/auth/login        → Login user  
POST   /api/auth/logout       → Logout user
GET    /api/auth/check        → Check auth status
```

### Posts
```
GET    /api/posts             → Get all posts
POST   /api/posts             → Create post (auth required)
GET    /api/posts/[id]        → Get single post
POST   /api/posts/[id]/vote   → Vote on post (auth required)
```

### Comments
```
POST   /api/posts/[id]/comments       → Add comment (auth required)
POST   /api/comments/[id]/vote        → Vote on comment (auth required)
```

## Environment Variables

```
JWT_SECRET=your_secret_key              # REQUIRED
NODE_ENV=production                     # development or production
RATE_LIMIT_POSTS=10                     # posts per hour
RATE_LIMIT_COMMENTS=30                  # comments per hour
RATE_LIMIT_VOTES=50                     # votes per hour
MAX_POST_TITLE_CHARS=200
MAX_POST_BODY_CHARS=10000
MAX_COMMENT_CHARS=2000
```

## Validation Rules

| Field | Min | Max | Format |
|-------|-----|-----|--------|
| Email | - | - | valid@email.com |
| Username | 3 | 20 | alphanumeric + _ |
| Password | 8 | - | letters + numbers |
| Post Title | 3 | 200 | any |
| Post Body | 10 | 10000 | any |
| Comment | 1 | 2000 | any |

## Response Format

### Success
```json
{
  "data": { /* response data */ },
  "status": 200
}
```

### Error
```json
{
  "error": "Error message",
  "status": 400
}
```

## HTTP Status Codes

```
200 OK              Success
201 Created         Resource created
400 Bad Request     Validation error
401 Unauthorized    Auth required or invalid
404 Not Found       Resource not found
405 Method Not Allowed
409 Conflict        Duplicate resource
429 Too Many Requests   Rate limit exceeded
500 Server Error    Unexpected error
```

## Key Objects

### User
```javascript
{
  id: "user_1234567890",
  email: "user@example.com",
  username: "username",
  createdAt: "2024-02-13T10:30:00.000Z"
}
```

### Post
```javascript
{
  id: "post_1234567890",
  title: "Post Title",
  body: "Post content...",
  category: "Bugs",
  author: "username",
  authorId: "user_id",
  cratedAt: "2024-02-13T10:30:00.000Z",
  commentCount: 5,
  voteScore: 10,
  upvoteCount: 12,
  downvoteCount: 2,
  comments: ["comment_id_1", "comment_id_2"],
  upvotes: ["user_id_1", "user_id_2"],
  downvotes: ["user_id_3"],
  userVote: { upvoted: false, downvoted: false }
}
```

### Comment
```javascript
{
  id: "comment_1234567890",
  body: "Comment text",
  postId: "post_id",
  author: "username",
  authorId: "user_id",
  createdAt: "2024-02-13T10:30:00.000Z",
  voteScore: 5,
  upvoteCount: 6,
  downvoteCount: 1,
  upvotes: ["user_id_1"],
  downvotes: ["user_id_2"],
  userVote: { upvoted: false, downvoted: false }
}
```

## Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Start dev server (port 3000)
vercel logs             # View server logs
```

### Deployment
```bash
git add .
git commit -m "message"
git push origin main    # Deploy via GitHub (if linked to Vercel)

# Or via CLI
vercel --prod           # Deploy to production
```

## Files to Edit

### Change theme colors
→ `style.css` (lines 1-10)

### Add new API endpoint
→ Create new file in `api/` with route name

### Change rate limits
→ `.env.local` (RATE_LIMIT_* variables)

### Change character limits
→ `.env.local` (MAX_*_CHARS variables)

### Add new category
→ `index.html` (post category select dropdown)

## Useful Code Snippets

### Call API from JavaScript
```javascript
const response = await API.getPosts();
const posts = response.data.posts;
```

### Check Authentication
```javascript
if (Auth.isAuthenticated()) {
  // User is logged in
}
```

### Create a Post
```javascript
await API.createPost(title, body, category);
```

### Vote on Post
```javascript
await API.votePost(postId, 'upvote');  // or 'downvote', 'remove'
```

### Get Post Details
```javascript
const response = await API.getPost(postId);
const post = response.data.post;
```

## Browser API Usage

### Get Element
```javascript
document.getElementById('postTitle')
document.querySelector('.post-card')
```

### Add Event Listener
```javascript
button.addEventListener('click', () => { /* action */ });
form.addEventListener('submit', (e) => { e.preventDefault(); /* action */ });
```

### Show/Hide Element
```javascript
element.classList.remove('hidden');  // Show
element.classList.add('hidden');     // Hide
```

### Clear Form
```javascript
document.getElementById('newPostForm').reset();
```

## Debugging Commands

### Check if running
```bash
curl http://localhost:3000
```

### Test API endpoint
```bash
curl http://localhost:3000/api/posts
```

### Get auth status
```bash
curl http://localhost:3000/api/auth/check
```

### View logs
```bash
vercel logs
```

## Common Error Solutions

| Error | Solution |
|-------|----------|
| Cannot find module | `npm install [package]` |
| Port already in use | Kill process: `lsof -i :3000` |
| JWT_SECRET not set | Add to `.env.local` |
| 401 Unauthorized | Login first |
| 429 Too Many Requests | Wait 1 hour |
| Can't create post | Must be logged in |
| Character limit exceeded | Reduce input length |

## Rate Limits (per user per hour)

- Posts: 10
- Comments: 30
- Votes: 50

## Character Limits

- Post title: 3-200 characters
- Post body: 10-10,000 characters
- Comments: 1-2,000 characters

## Security Notes

🔒 **JWT_SECRET** - Keep secret, minimum 32 chars
🔒 **Passwords** - Hashed with bcrypt (never stored plain)
🔒 **Cookies** - HTTP-only (secure from XSS)
🔒 **Tokens** - Expire in 7 days
🔒 **Input** - Validated on frontend + backend

## Deploy Checklist

- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Push code to GitHub
- [ ] Go to vercel.com/dashboard
- [ ] Import repository
- [ ] Set environment variables
- [ ] Click Deploy
- [ ] Test all features
- [ ] View logs for errors

## File Locations

| File | Purpose |
|------|---------|
| index.html | Main UI |
| style.css | Styling |
| js/api.js | API client |
| js/auth.js | Auth logic |
| js/main.js | App logic |
| api/auth/*.js | Auth endpoints |
| api/posts/*.js | Post endpoints |
| api/comments/*.js | Comment endpoints |
| api/lib/*.js | Utilities |

## Links

- GitHub: `https://github.com/[username]/iconforums`
- Vercel: `https://vercel.com/dashboard`
- Live App: `https://iconforums-[id].vercel.app`
- API Docs: See README.md
- Dev Guide: See GETTING_STARTED.md
- Deploy Guide: See DEPLOYMENT.md

---

**Keep this handy! 📋**
