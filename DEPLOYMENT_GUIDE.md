# Kepler TapTrack Deployment Guide

## Environment Setup

### Frontend (Vercel)

**Environment Variables to Set in Vercel Dashboard:**

```env
VITE_API_URL=https://kepler-taptrack-api.onrender.com/api
```

**Important:** 
- After setting this environment variable in Vercel, redeploy your application
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `VITE_API_URL` with the value of your Render backend URL

### Backend (Render)

**Environment Variables to Set in Render Dashboard:**

```env
DATABASE_URL=your_mongodb_atlas_connection_string
PORT=3001
NODE_ENV=production
```

**Important:**
- Make sure your MongoDB Atlas connection string is correct
- Ensure your IP whitelist in MongoDB Atlas includes Render's IPs or is set to allow all (0.0.0.0/0)

## Local Development

For local development, create a `.env.local` file:

```env
VITE_API_URL=http://localhost:3001/api
```

This file is automatically ignored by git.

## Deployment Checklist

### Before Deploying

- [ ] MongoDB Atlas connection string is correct
- [ ] Database is seeded with initial data (admin and teacher accounts)
- [ ] Environment variables are set in both Vercel and Render

### After Deploying

- [ ] Test login on desktop
- [ ] Test login on mobile
- [ ] Verify no "local network permission" prompts appear
- [ ] Check that teacher count is displayed correctly or removed
- [ ] Verify all API endpoints are accessible

## Common Issues

### "Invalid credentials" on mobile
**Solution:** Make sure `VITE_API_URL` in Vercel points to your Render backend, not localhost.

### "Want to look for and connect to any device on your local network" prompt
**Solution:** The frontend is trying to access localhost. Update `VITE_API_URL` in Vercel environment variables.

### Application exited early on Render
**Solution:** 
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Ensure all TypeScript dependencies are in `dependencies`, not `devDependencies`

### Cannot connect to database
**Solution:**
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas
- Ensure network access is configured correctly

## Support

For issues, check:
1. Vercel deployment logs
2. Render deployment logs
3. MongoDB Atlas connection logs
