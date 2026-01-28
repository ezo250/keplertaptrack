# Kepler TapTrack - Device Management System

Professional device tracking system for Kepler College campus attendance management.

## Features

- 🔐 **Role-Based Authentication** - Super Admin & Teacher access levels
- 👨‍💼 **Super Admin Dashboard** - Complete system management and oversight
- 👩‍🏫 **Teacher Dashboard** - Quick device pickup and return
- 📊 **Real-time Tracking** - Monitor device status and availability
- 📅 **Timetable Management** - Schedule and class management
- 📈 **Activity History** - Complete audit trail of all transactions
- ✨ **Animated UI** - Professional, modern interface with smooth animations

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** - Fast build tool
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Server state management
- **React Router** - Navigation
- **Framer Motion** - Animations

### Backend
- **Express** - Node.js web framework
- **Prisma** - Type-safe ORM
- **SQLite** - Database (easily upgradeable to PostgreSQL/MongoDB)
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kepler-device-flow-main
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Setup backend and database**
   ```bash
   npm run setup
   ```
   This will:
   - Install server dependencies
   - Generate Prisma client
   - Create and migrate the database
   - Seed initial data

### Running the Application

**Run both frontend and backend together:**
```bash
npm run dev:both
```

This will start:
- Frontend on http://localhost:8080
- Backend API on http://localhost:3001

**Or run them separately:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

### Default Credentials

**Super Admin:**
- Email: `admin@kepler.edu`
- Password: `admin123`

**Teacher:**
- Email: `teacher@kepler.edu`
- Password: `teacher123`

## Project Structure

```
kepler-device-flow-main/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── layout/          # Layout components (Sidebar, Header, Footer)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── modals/          # Modal dialogs
│   │   └── ui/              # shadcn UI components
│   ├── contexts/            # React contexts (Auth, Data)
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   └── teacher/         # Teacher pages
│   ├── services/            # API service layer
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Main app component
├── server/                   # Backend source code
│   ├── prisma/              # Prisma schema and migrations
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── index.ts         # Express server setup
│   │   └── seed.ts          # Database seeding script
│   └── package.json         # Server dependencies
├── public/                   # Static assets
└── package.json             # Frontend dependencies
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Backend
- `npm run dev:server` - Start backend server
- `npm run setup` - Setup backend, database, and seed data

### Combined
- `npm run dev:both` - Run both frontend and backend

## Database Management

The application uses Prisma with SQLite by default. To manage the database:

```bash
cd server

# Open Prisma Studio (visual database editor)
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name migration_name

# Reset database and re-seed
npx prisma migrate reset
npm run seed
```

## Migrating to MongoDB Atlas

To migrate to MongoDB Atlas:

1. Update `server/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mongodb"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `server/.env`:
   ```
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"
   ```

3. Run migrations:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Developed By

**Amani Alain**

---

© 2024 Kepler College. All rights reserved.
