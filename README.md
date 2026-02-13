# IconForums - Full-Stack Forum Application

A modern, full-featured forum web application built with vanilla HTML, CSS, and JavaScript on the frontend, and Vercel Serverless Functions on the backend.

## Features

### Authentication System
- ✅ User registration with email validation
- ✅ Login with email or username
- ✅ Secure password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ HTTP-only cookie storage
- ✅ Protected routes requiring authentication

### Forum Features
- ✅ Create posts with title and body
- ✅ Browse posts by category
- ✅ Add comments to posts
- ✅ Upvote and downvote posts
- ✅ Upvote and downvote comments
- ✅ Vote count display
- ✅ Prevent duplicate voting from same user
- ✅ Username display on posts and comments

### Security & Validation
- ✅ Frontend validation for all inputs
- ✅ Backend validation on all API routes
- ✅ Character limit enforcement (configurable)
- ✅ Rate limiting to prevent spam
- ✅ SQL injection prevention (using parameterized queries when DB is integrated)
- ✅ XSS protection with HTML escaping

### Categories
- General Discussion
- Bugs
- Patches
- Looking for Team
- Market

## Project Structure

```
IconForums/
├── index.html              # Main forum page
├── style.css              # Global styles
├── package.json           # Dependencies
├── vercel.json            # Vercel deployment config
├── .env.example           # Environment variables template
├── js/
│   ├── api.js            # API client library
│   ├── auth.js           # Authentication logic
│   └── main.js           # Main application logic
└── api/
    ├── lib/
    │   ├── auth.js       # JWT and password utilities
    │   ├── db.js         # Database operations
    │   └── validation.js # Input validation
    ├── auth/
    │   ├── signup.js     # User registration
    │   ├── login.js      # User login
    │   ├── logout.js     # User logout
    │   └── check.js      # Auth status check
    ├── posts/
    │   ├── index.js      # Get/create posts
    │   ├── [id].js       # Get single post
    │   ├── [id]/
    │   │   ├── comments.js  # Add comment
    │   │   └── vote.js      # Vote on post
    └── comments/
        └── [id]/
            └── vote.js      # Vote on comment
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel account (for deployment)

### Local Development

1. **Clone/setup the project**
   ```bash
   cd IconForums
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Update `.env.local`** with your configuration:
   ```
   JWT_SECRET=your_super_secret_key_here_change_in_production
   NODE_ENV=development
   ```

5. **Install Vercel CLI** (for local testing)
   ```bash
   npm install -g vercel
   ```

6. **Run development server**
   ```bash
   vercel dev
   ```
   The app will be available at `http://localhost:3000`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens | Required |
| `NODE_ENV` | Environment (development/production) | production |
| `RATE_LIMIT_POSTS` | Max posts per user per hour | 10 |
| `RATE_LIMIT_COMMENTS` | Max comments per user per hour | 30 |
| `RATE_LIMIT_VOTES` | Max votes per user per hour | 50 |
| `MAX_POST_TITLE_CHARS` | Max characters for post title | 200 |
| `MAX_POST_BODY_CHARS` | Max characters for post body | 10000 |
| `MAX_COMMENT_CHARS` | Max characters for comments | 2000 |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/check` - Check authentication status

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/[id]` - Get specific post
- `POST /api/posts` - Create new post (requires auth)
- `POST /api/posts/[id]/vote` - Vote on post (requires auth)

### Comments
- `POST /api/posts/[id]/comments` - Add comment (requires auth)
- `POST /api/comments/[id]/vote` - Vote on comment (requires auth)

## Deployment to Vercel

### 1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### 2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables from `.env.example`
   - Click "Deploy"

### 3. **Deploy via CLI**
   ```bash
   vercel --prod
   ```

### 4. **Configure Environment Variables**
   In Vercel Dashboard > Settings > Environment Variables, add:
   - `JWT_SECRET` - Generate a strong random string
   - Other variables from `.env.example`

## Database Integration

Currently uses **in-memory storage** for demo purposes. For production, integrate with:

### Options:
- **Vercel KV** (Recommended) - Redis-like DB integrated with Vercel
- **MongoDB** - NoSQL database
- **PostgreSQL** - Relational database
- **Firebase** - Google's BaaS platform

### To integrate Vercel KV:
1. Enable Vercel KV in your Vercel project
2. Update `/api/lib/db.js` to use the KV client
3. Replace in-memory operations with KV operations

## Password Security

Passwords are hashed using **bcryptjs** with a cost factor of 10. Never store plain text passwords!

## Validation Rules

### Username
- 3-20 characters
- Letters, numbers, and underscores only
- Must be unique

### Password
- Minimum 8 characters
- Must contain letters
- Must contain numbers

### Post Title
- 3-200 characters

### Post Body
- 10-10,000 characters

### Comments
- 1-2,000 characters

## Rate Limiting

Rate limits are per-user per-hour and apply to:
- **Posts**: 10 per hour (configurable)
- **Comments**: 30 per hour (configurable)
- **Votes**: 50 per hour (configurable)

## Error Handling

All API endpoints return consistent JSON responses:

### Success Response
```json
{
  "data": { /* response data */ },
  "status": 200
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 400
}
```

## Featured Users & Permissions

Currently all authenticated users have equal permissions. To add role-based permissions:

1. Add `role` field to user model
2. Add middleware to check permissions
3. Implement admin panel for role management

## Future Enhancements

- [ ] Integrate with Vercel KV or PostgreSQL
- [ ] Add real-time notifications
- [ ] Implement user profiles
- [ ] Add post editing/deletion
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Advanced search
- [ ] Post pinning for moderators
- [ ] User reputation system
- [ ] Thread following

## Security Considerations

### Current Implementation
- ✅ Passwords hashed with bcrypt
- ✅ JWT for stateless authentication
- ✅ HTTP-only cookies for token storage
- ✅ Input validation on frontend and backend
- ✅ Rate limiting to prevent abuse
- ✅ CORS configured

### For Production
1. **Enable HTTPS** (Vercel does this automatically)
2. **Set strong JWT_SECRET** (minimum 32 random characters)
3. **Enable database encryption** at rest
4. **Regular security audits**
5. **Monitor for suspicious activity**
6. **Implement content moderation**
7. **Set up error logging and monitoring**

## Testing

### Manual Testing Checklist
- [ ] Sign up with new user
- [ ] Login with email
- [ ] Login with username
- [ ] Create a post
- [ ] View post details
- [ ] Add comment to post
- [ ] Upvote post
- [ ] Downvote post
- [ ] Upvote comment
- [ ] Downvote comment
- [ ] Logout
- [ ] View posts while logged out

## Troubleshooting

### Common Issues

**API returns 401 Unauthorized**
- Check that JWT_SECRET is set in environment
- Verify token is being sent with requests
- Clear browser cookies and re-login

**Posts don't appear**
- Check network tab in browser DevTools
- Verify API endpoint URL is correct
- Check server logs: `vercel logs`

**Rate limiting errors**
- Wait 1 hour for rate limit to reset
- Check RATE_LIMIT_* environment variables

## Support & Contributing

For issues, questions, or contributions:
1. Check existing issues
2. Create a detailed bug report
3. Submit pull requests
4. Follow existing code style

## License

MIT License - See LICENSE file for details

## Author

Built with vanilla JavaScript and Vercel Serverless Functions

---

**Happy Forumming! 🚀**
