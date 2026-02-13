# Deployment Guide - IconForums

Complete step-by-step guide to deploy IconForums to Vercel.

## Prerequisites

Before you start, ensure you have:
- GitHub account (for code repository)
- Vercel account (free tier available at https://vercel.com)
- Git installed locally
- Node.js 18+ installed

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository
```bash
cd IconForums
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 1.2 Create .env.local File
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
JWT_SECRET=use_openssl_rand_base64_32_to_generate_strong_key
NODE_ENV=production
```

To generate a strong JWT_SECRET:
```bash
openssl rand -base64 32
```

### 1.3 Commit Files
```bash
git add .
git commit -m "Initial commit: Full-stack forum application"
```

## Step 2: Push to GitHub

### 2.1 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `iconforums`
3. Description: "Full-stack discussion forum built with vanilla JS and Vercel serverless functions"
4. Choose Public or Private
5. Click "Create repository"

### 2.2 Push Local Repository
```bash
git remote add origin https://github.com/YOUR_USERNAME/iconforums.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com/dashboard
   - Click "New Project"

2. **Import Repository**
   - Click "Import Git Repository"
   - Search for "iconforums"
   - Click "Import"

3. **Configure Project**
   - **Project Name**: iconforums
   - **Framework Preset**: Other
   - **Root Directory**: ./

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add each variable from `.env.example`:
     - `JWT_SECRET`: Your generated secret (critical!)
     - `NODE_ENV`: production
     - `RATE_LIMIT_POSTS`: 10
     - `RATE_LIMIT_COMMENTS`: 30
     - `RATE_LIMIT_VOTES`: 50
     - `MAX_POST_TITLE_CHARS`: 200
     - `MAX_POST_BODY_CHARS`: 10000
     - `MAX_COMMENT_CHARS`: 2000

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)

### Option B: Via Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod
```

## Step 4: Verify Deployment

### 4.1 Check Deployment Status
1. Go to your Vercel project dashboard
2. Look for "Deployments" section
3. Most recent deployment should show "Ready"

### 4.2 Test Your Application
1. Click the deployment URL (format: `https://iconforums-xxxxx.vercel.app`)
2. Test the following:
   - Create an account (Sign Up)
   - Login
   - Create a post
   - Add a comment
   - Vote on posts/comments
   - Logout

### 4.3 Check Logs
```bash
vercel logs <project-name>
```

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain
1. In Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Follow DNS instructions (varies by domain provider)
4. DNS changes can take 24-48 hours to propagate

## Step 6: Monitor & Maintain

### 6.1 View Analytics
- Vercel Dashboard > Analytics
- Monitor API response times
- Check error rates

### 6.2 View Logs
- Vercel Dashboard > Deployments > Logs
- Check for errors or warnings

### 6.3 Performance Monitoring
- Vercel provides Web Vitals metrics
- Use external tools like Sentry for error tracking

## Troubleshooting Deployment

### Issue: Build Fails

**Error: "Cannot find module 'bcryptjs'"**
```bash
Solution: npm install bcryptjs jsonwebtoken
```

**Error in API route 502 Bad Gateway**
- Check environment variables are set
- Review function logs in Vercel dashboard
- Ensure all environment variables match `.env.example`

### Issue: 401 Unauthorized Errors

**JWT_SECRET not set**
- Go to Vercel Dashboard > Settings > Environment Variables
- Ensure `JWT_SECRET` is added
- Redeploy: `vercel redeploy`

### Issue: Form Submissions Fail

**CORS errors**
- Check browser console for exact error
- Files are already configured for CORS
- Verify API URL is correct

**Authentication issues**
- Clear browser cookies
- Try incognito/private browsing
- Check that JWT_SECRET matches between frontend and backend

## Post-Deployment Checklist

- [ ] Deployment shows "Ready"
- [ ] Can access main forum page
- [ ] Can create account
- [ ] Can login/logout
- [ ] Can create post (when logged in)
- [ ] Can add comments
- [ ] Can vote on posts/comments
- [ ] Environment variables are set
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up (optional)

## Rollback to Previous Version

If deployment breaks:

1. **Via Vercel Dashboard**
   - Deployments tab
   - Find previous working version
   - Click "Promote to Production"

2. **Via CLI**
   ```bash
   vercel list              # See all deployments
   vercel promote [url]     # Promote to production
   ```

## Database Integration (Future)

When ready to replace in-memory storage:

### Option 1: Vercel KV (Redis)
```bash
# Project > Storage > Create Database > Vercel KV
# Environment variables auto-added
# Update /api/lib/db.js to use Redis client
```

### Option 2: PostgreSQL
```bash
# Project > Storage > Create Database > Postgres
# Update /api/lib/db.js with pg client
npm install pg
```

### Option 3: MongoDB Atlas
```bash
# Create cluster at https://www.mongodb.com/cloud
# Get connection string
# Update /api/lib/db.js with mongoose
npm install mongoose
```

## Scaling & Performance

- **API Rate Limiting**: Adjust RATE_LIMIT_* variables
- **Database Queries**: Add indexing on frequently searched fields
- **Caching**: Implement Vercel's ISR (Incremental Static Regeneration) if needed
- **CDN**: Vercel automatically serves static assets via their CDN

## Security Hardening

Before production use:

1. **Change JWT_SECRET** to a strong random value
2. **Set NODE_ENV** to "production"
3. **Enable HTTPS** (automatic with Vercel)
4. **Set up monitoring** with Sentry or similar
5. **Enable WAF** rules in Vercel Security
6. **Regular backups** if using persistent database
7. **Monitor logs** for suspicious activity

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Serverless Functions**: https://vercel.com/docs/functions/about
- **Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Troubleshooting**: https://vercel.com/support

## Next Steps After Deployment

1. **Monitor Performance**
   - Set up error tracking
   - Monitor API response times
   - Track user metrics

2. **Gather Feedback**
   - Add feedback form
   - Monitor user behavior
   - Iterate based on feedback

3. **Plan Features**
   - User profiles
   - Post editing/deletion
   - Advanced search
   - Notifications

4. **Scale Database**
   - Upgrade from KV to PostgreSQL when needed
   - Set up proper indexing
   - Implement query optimization

---

**You're ready to deploy! 🚀**

For questions or issues, check the main README.md or contact support.
