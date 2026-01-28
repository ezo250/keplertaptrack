# Kepler TapTrack - Setup Guide

Complete setup guide for the Kepler TapTrack Device Management System.

## Quick Start (Recommended)

Run this single command to set up everything:

```bash
npm install && npm run setup && npm run dev:both
```

That's it! The app will be running at:
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

## Step-by-Step Setup

### 1. Install Frontend Dependencies

```bash
npm install
```

This installs all React, Vite, and UI library dependencies including:
- React & React DOM
- shadcn/ui components
- Tailwind CSS
- TanStack Query
- Framer Motion
- And more...

### 2. Setup Backend

```bash
npm run setup
```

This single command:
1. Navigates to the server folder
2. Installs all backend dependencies (Express, Prisma, bcryptjs, etc.)
3. Generates Prisma client
4. Creates the SQLite database
5. Runs migrations to create tables
6. Seeds the database with initial data:
   - Admin user (admin@kepler.edu / admin123)
   - 5 Teachers
   - 10 Devices (TAP-001 to TAP-010)
   - Sample timetable entries

### 3. Run the Application

**Option A: Run both frontend and backend together (Recommended)**
```bash
npm run dev:both
```

**Option B: Run separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
npm run dev
```

## Testing the Application

### Default Login Credentials

**Super Admin Dashboard:**
- Email: `admin@kepler.edu`
- Password: `admin123`
- Access: Full system control

**Teacher Dashboard:**
- Email: `teacher@kepler.edu`
- Password: `teacher123`
- Access: Device pickup/return

### Super Admin Features
1. View system overview with statistics
2. Manage teachers (add, edit, remove)
3. Manage devices (add, remove, view status)
4. View timetable for all teachers
5. Access complete device history

### Teacher Features
1. Quick device pickup
2. Quick device return
3. View available devices at station
4. View devices currently in possession
5. View personal class schedule

## Database Management

### View Database (Prisma Studio)

```bash
cd server
npx prisma studio
```

Opens a visual database editor at http://localhost:5555

### Reset Database

```bash
cd server
npx prisma migrate reset
npm run seed
```

This will:
- Drop all tables
- Re-create the schema
- Seed with fresh initial data

### Backup Database

The database file is located at `server/prisma/dev.db`. Simply copy this file to create a backup.

## Customization

### Add More Users

Edit `server/src/seed.ts` and add more teachers or admins, then run:

```bash
cd server
npm run seed
```

### Add More Devices

You can add devices through the Super Admin dashboard, or edit the seed file.

### Customize Branding

1. **Logo**: Replace `public/kepler-logo.png` with your logo
2. **Favicon**: Replace `public/favicon.svg` with your icon
3. **Colors**: Edit `src/index.css` to change the Kepler blue color theme
4. **App Name**: Update `index.html` title and meta tags

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

### Backend (server/.env)
```
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
```

## Troubleshooting

### "Cannot connect to database"
- Make sure you ran `npm run setup`
- Check if the database file exists at `server/prisma/dev.db`
- Try resetting: `cd server && npx prisma migrate reset`

### "Port already in use"
- Frontend port 8080 is in use: Change in `vite.config.ts`
- Backend port 3001 is in use: Change `PORT` in `server/.env`

### "Module not found" errors
- Run `npm install` in the root folder
- Run `cd server && npm install` for backend dependencies
- Run `cd server && npx prisma generate` to regenerate Prisma client

### Login not working
- Ensure backend is running
- Check browser console for API errors
- Verify `VITE_API_URL` in `.env` matches your backend URL

## Production Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy the `dist` folder
3. Set environment variable `VITE_API_URL` to your backend URL

### Backend (Railway/Render/Heroku)
1. Deploy the `server` folder
2. Set `DATABASE_URL` for PostgreSQL or MongoDB
3. Update Prisma schema provider accordingly
4. Run `npx prisma migrate deploy`
5. Run `npm run seed` for initial data

## Migrating to PostgreSQL

1. Get a PostgreSQL database URL (e.g., from Railway, Supabase, Neon)

2. Update `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Update `server/.env`:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

4. Run migrations:
```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run seed
```

## Migrating to MongoDB Atlas

1. Create a MongoDB Atlas cluster and get connection string

2. Update `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// Add @map and @db.ObjectId to id fields
model User {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  // ... rest of the fields
}
```

3. Update `server/.env`:
```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"
```

4. Push schema and seed:
```bash
cd server
npx prisma generate
npx prisma db push
npm run seed
```

## Support

For issues or questions:
- Check the main `README.md`
- Review the code comments
- Raise an issue in the repository

---

Developed by **Amani Alain**
