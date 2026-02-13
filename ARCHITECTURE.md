# IconForums - Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                   End User Browser                  │
├─────────────────────────────────────────────────────┤
│  HTML (index.html) + CSS (style.css)                │
│  Frontend JS (js/api.js, auth.js, main.js)          │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/HTTPS Fetch
                 │
┌────────────────▼────────────────────────────────────┐
│              Vercel Edge Network                    │
│  (CORS, SSL/TLS, DDoS Protection, Caching)          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         Vercel Serverless Functions                 │
│  /api/* routes → Node.js Runtime (V18+)             │
├─────────────────────────────────────────────────────┤
│  • Auth endpoints (signup, login, logout, check)    │
│  • Post endpoints (list, create, get, vote)         │
│  • Comment endpoints (add, vote)                    │
│  • Shared utilities (auth, db, validation)          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│          In-Memory Data Store                       │
│  (For demo/development)                             │
│  Production: Integrate Vercel KV / PostgreSQL       │
└─────────────────────────────────────────────────────┘
```

## Request-Response Lifecycle

### 1. Authentication Flow

```
User Input (Email/Password)
    ↓
Frontend Validation (js/validation.js)
    ↓
API Request: POST /api/auth/login
    ↓
Backend Process:
  • Validate input
  • Find user by email/username
  • Hash & compare password with bcrypt
  • Create JWT token (7-day expiry)
  • Set HTTP-only cookie
    ↓
Response: { data: { user, token }, status: 200 }
    ↓
Frontend: Store in auth state, update UI
```

### 2. Post Creation Flow

```
User Input (Title, Body, Category)
    ↓
Frontend Character Validation
    ↓
Auth Check (Auth.isAuthenticated())
    ↓
API Request: POST /api/posts with JWT
    ↓
Backend Process:
  • Verify JWT token
  • Validate input length
  • Rate limit check (10/hour)
  • Create post object
  • Store in database
    ↓
Response: { data: { post }, status: 201 }
    ↓
Frontend: Add to posts list, refresh UI
```

### 3. Voting Flow

```
User Clicks Vote Button
    ↓
Auth Check (must be logged in)
    ↓
API Request: POST /api/posts/[id]/vote with JWT
    ↓
Backend Process:
  • Verify JWT
  • Get post
  • Check for duplicate vote
  • Remove opposite vote if switching
  • Add new vote
  • Calculate score
    ↓
Response: { data: { voteScore, upvoteCount, downvoteCount }, status: 200 }
    ↓
Frontend: Update vote buttons state
```

## Data Model

### User
```
{
  id: string (unique),
  email: string (unique),
  username: string (unique, 3-20 chars),
  passwordHash: string (bcrypt hashed),
  createdAt: ISO string
}
```

### Post
```
{
  id: string (unique),
  title: string (3-200 chars),
  body: string (10-10000 chars),
  category: string (predefined list),
  authorId: string (references User.id),
  author: string (cached username),
  createdAt: ISO string,
  updatedAt: ISO string,
  comments: string[] (references Comment.id array),
  upvotes: string[] (User IDs who upvoted),
  downvotes: string[] (User IDs who downvoted)
}
```

### Comment
```
{
  id: string (unique),
  body: string (1-2000 chars),
  postId: string (references Post.id),
  authorId: string (references User.id),
  author: string (cached username),
  createdAt: ISO string,
  updatedAt: ISO string,
  upvotes: string[] (User IDs who upvoted),
  downvotes: string[] (User IDs who downvoted)
}
```

## Authentication Architecture

### Token-Based (JWT)

1. **Creation**
   - User logs in with email + password
   - Server verifies password with bcrypt.compare()
   - Server creates JWT: `sign({ id, email, username }, JWT_SECRET, { expiresIn: '7d' })`
   - Server sends JWT in HTTP-only cookie

2. **Storage**
   - Browser automatically includes cookie in requests
   - Cannot access via JavaScript (secure from XSS)
   - Sent only to same-origin requests

3. **Verification**
   - Server extracts token from cookie
   - Server verifies with: `verify(token, JWT_SECRET)`
   - Returns decoded payload { id, email, username } or null

### Cookie Security

```
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiIs...
  Path=/                           # Available for entire app
  HttpOnly;                        # Cannot access from JavaScript
  Secure;                          # Only sent over HTTPS (production)
  SameSite=Strict;                 # CSRF protection
  Max-Age=604800                   # 7 days
```

## Rate Limiting Architecture

```
Rate Limiter (per user, per action type, per hour)
    ↓
Store: { "user_id:action": { times: [timestamp1, timestamp2, ...] } }
    ↓
Check Request:
  1. Get all requests in last hour (3600000ms)
  2. Count requests
  3. If count >= limit, reject with 429
  4. Otherwise, add timestamp and allow
```

## Validation Strategy

### Frontend (UX)
- Real-time character counters
- Input type validation
- Prevent form submission on error
- Show helpful error messages

### Backend (Security) ← REQUIRED
- Validate every input
- Enforce character limits
- Check data types
- Sanitize strings (trim, escape HTML)
- Verify authentication on protected routes
- Rate limit enforcement

## Security Layers

```
Layer 1: Network
  • HTTPS (TLS/SSL) - Data in transit encrypted
  • Vercel CDN - DDoS protection, IP filtering

Layer 2: API Gateway
  • CORS policy - Restrict cross-origin requests
  • Rate limiting - Prevent brute force

Layer 3: Authentication
  • Password hashing (bcrypt) - Plain text never stored
  • JWT tokens - Stateless, expiring tokens
  • HTTP-only cookies - XSS resistant

Layer 4: Validation
  • Input validation - Type and format checking
  • Character limits - Prevent buffer overflow
  • HTML escaping - Prevent stored XSS

Layer 5: Authorization
  • Verify auth token on protected routes
  • Check user ownership of resources
  • Enforce rate limits per user
```

## Error Handling Flow

```
Request
  ↓
Try-Catch Block
  ↓ (Error caught)
Check Error Type:
  ├─ Validation Error → 400 Bad Request
  ├─ Not Found → 404 Not Found
  ├─ Unauthorized → 401 Unauthorized
  ├─ Rate Limit → 429 Too Many Requests
  └─ Server Error → 500 Internal Server Error
  ↓
Format Response: { error: "message", status: code }
  ↓
Send JSON Response
  ↓
Frontend: Display error message to user
```

## State Management

### Frontend State
```javascript
Auth.currentUser    // Current logged-in user or null
State.posts         // Array of all posts
State.currentCategory // Currently selected category
```

### Backend State (in-memory)
```javascript
store.users         // All registered users
store.posts         // All posts
store.comments      // All comments
store.votes         // Vote relationships
store.rateLimits    // Rate limit tracking
```

## Frontend Component Flow

```
Window Load
  ↓
Auth.init()
  ├─ Check /api/auth/check
  ├─ Set Auth.currentUser if authenticated
  └─ Call Auth.updateUI()
  ↓
Auth.updateUI()
  ├─ Show login button or user profile
  ├─ Show/hide post form
  └─ Bind event listeners
  ↓
setupEventListeners()
  ├─ Auth form submit handlers
  ├─ Post form submit handlers
  ├─ Category button handlers
  ├─ Vote button handlers
  └─ Modal handlers
  ↓
loadPosts()
  ├─ Fetch /api/posts
  ├─ Render posts in DOM
  └─ Bind click handlers
  ↓
User Interaction:
  ├─ Click category → loadPosts() with filter
  ├─ Click post → UI.showPostDetail(id)
  ├─ Click upvote → API.votePost() → reload detail
  ├─ Submit comment → API.addComment() → reload detail
  └─ Edit auth form → Auth.login/signup() → Update UI
```

## Backend Route Handler Pattern

```
export default async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 2. Method check
  if (req.method !== 'POST') return 405
  
  // 3. Extract and validate
  const user = verifyAuth(req, res);
  if (!user) return 401
  
  // 4. Validate input
  const { field } = req.body;
  if (!isValidInput(field)) return 400
  
  // 5. Rate limit check
  if (!rateLimiting.check(user.id, 'action', limit)) return 429
  
  // 6. Business logic
  const result = performAction(field);
  
  // 7. Response
  return res.status(200).json({ data: result, status: 200 });
}
```

## Database Integration Path

### Current (Demo)
```
API Route → In-Memory store (api/lib/db.js) → Response
```

### Production (Recommended)
```
API Route → Database Client (Vercel KV / PostgreSQL) → Database → Response
```

### Integration Steps
1. Create KV database in Vercel
2. Update api/lib/db.js to use Redis client
3. Replace CRUD operations with Redis commands
4. Test all endpoints

## Performance Optimization

### Frontend
- ✅ Vanilla JS (no framework overhead)
- ⭐ Implement: Lazy loading post images
- ⭐ Implement: Pagination for large post lists
- ⭐ Implement: Service Worker for offline support

### Backend
- ✅ Serverless (auto-scaling)
- ✅ HTTP-only cookies (no extra headers)
- ⭐ Implement: Database indexing
- ⭐ Implement: Response caching
- ⭐ Implement: Database query optimization

### Network
- ✅ Vercel CDN (static assets)
- ✅ Gzip compression
- ⭐ Implement: Image optimization
- ⭐ Implement: Resource minification

## Testing Architecture

### Unit Tests (File-level)
- api/lib/validation.js - Test validators
- api/lib/auth.js - Test password hashing

### Integration Tests (Endpoint-level)
- TEST: POST /api/auth/signup with valid/invalid data
- TEST: POST /api/posts with/without auth
- TEST: POST /api/posts/[id]/vote prevents duplicates

### E2E Tests (User flow)
- TEST: Sign up → Login → Create post → Comment → Vote

## Monitoring & Debugging

### Development
- Browser DevTools Network tab
- Browser Console (JS errors)
- Terminal logs (Server errors)
- vercel logs (Production)

### Production
- Vercel Analytics (metrics, Web Vitals)
- Error tracking (Sentry, Rollbar)
- Uptime monitoring (Uptime Robot)
- Log aggregation (ELK, Splunk)

## Deployment Architecture

### Development
```
Local Machine
  ↓
npm run dev (Vercel local)
  ↓
http://localhost:3000
```

### Production
```
GitHub Repository
  ↓
Push to main branch
  ↓
Vercel detects push
  ↓
Build & Deploy
  ↓
https://yourapp.vercel.app
```

## Scaling Considerations

### Current Limitations
- In-memory store: Lost on redeploy
- Single server: No persistence between deployments
- Suitable for: Demo, MVP, education

### Production Requirements
- Persistent database (PostgreSQL, MongoDB)
- Redis cache layer
- Load balancing
- Database replication
- Regular backups

---

**This architecture is modular and can be extended for production use. ✅**
