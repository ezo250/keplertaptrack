# Deployment Guide for Render

This guide will help you deploy the Kepler TapTrack application to Render.

## Prerequisites

- GitHub repository: `https://github.com/ezo250/keplertaptrack.git`
- MongoDB Atlas database (already configured)
- Render account (https://render.com)

## Deployment Steps

### 1. Deploy Backend API (Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   - **Name:** `kepler-taptrack-api`
   - **Region:** Choose closest to you
   - **Branch:** `master`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:**
     ```
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```
     npm start
     ```
   - **Instance Type:** Free (or choose paid plan)

5. **Environment Variables** - Add these in the "Environment" section:
   ```
   DATABASE_URL=mongodb+srv://rukaraphilipe:Alain12345@cluster0.m78tfow.mongodb.net/kepler-taptrack?retryWrites=true&w=majority&appName=KeplerTapTrack
   PORT=3001
   NODE_ENV=production
   ```

6. Click **"Create Web Service"**

7. Wait for deployment to complete. You'll get a URL like:
   ```
   https://kepler-taptrack-api.onrender.com
   ```

### 2. Deploy Frontend (Static Site)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure the service:

   - **Name:** `kepler-taptrack-frontend`
   - **Branch:** `master`
   - **Root Directory:** (leave empty)
   - **Build Command:**
     ```
     npm install && npm run build
     ```
   - **Publish Directory:**
     ```
     dist
     ```

5. **Environment Variables** - Add this:
   ```
   VITE_API_URL=https://kepler-taptrack-api.onrender.com/api
   ```
   *(Replace with your actual backend URL from Step 1)*

6. Click **"Create Static Site"**

7. Your frontend will be deployed to a URL like:
   ```
   https://kepler-taptrack-frontend.onrender.com
   ```

### 3. Seed the Database (First Time Only)

After backend deployment, you need to seed the database:

1. Go to your backend service in Render Dashboard
2. Click on **"Shell"** tab
3. Run this command:
   ```bash
   npm run seed
   ```

This will create:
- Super Admin: `admin@kepler.edu` / `admin123`
- Teacher: `teacher@kepler.edu` / `teacher123`

### 4. Configure CORS (If needed)

If you encounter CORS issues, update `server/src/index.ts` to allow your frontend domain:

```typescript
app.use(cors({
  origin: ['https://kepler-taptrack-frontend.onrender.com', 'http://localhost:8080'],
  credentials: true
}));
```

Commit and push the changes.

## Important Notes

### Free Tier Limitations
- Render's free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30-50 seconds
- Consider upgrading to paid tier for production use

### Auto-Deploy
- Both services will auto-deploy on every push to `master` branch
- You can disable auto-deploy in service settings if needed

### Custom Domains
- You can add custom domains in the service settings
- Both frontend and backend support custom domains

### Environment Variables
- Never commit sensitive data to Git
- Always use environment variables for secrets
- Update `.env` files locally but use Render's UI for production

## Troubleshooting

### Backend Issues
1. Check logs in Render Dashboard → Your Service → Logs
2. Verify DATABASE_URL is correct
3. Ensure Prisma generated successfully (check build logs)

### Frontend Issues
1. Check if VITE_API_URL is correct
2. Verify backend is running and accessible
3. Check browser console for CORS errors

### Database Connection
1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Check connection string format
3. Test connection locally first

## Monitoring

- **Backend Logs:** Available in Render Dashboard
- **Frontend Logs:** Build logs in Render Dashboard
- **Database:** Monitor in MongoDB Atlas

## Production Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Database seeded with initial data
- [ ] Environment variables configured
- [ ] CORS configured for frontend domain
- [ ] Test login with admin and teacher accounts
- [ ] Test device pickup/return functionality
- [ ] Monitor logs for errors

## Support

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Check Render community: https://community.render.com
3. Review application logs in Render Dashboard

## Updating the Application

To deploy updates:
1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin master
   ```
3. Render will automatically deploy both services

---

**Congratulations! Your Kepler TapTrack application is now deployed! 🚀**
