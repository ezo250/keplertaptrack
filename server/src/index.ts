import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import deviceRoutes, { checkAndUpdateOverdueDevices } from './routes/devices';
import teacherRoutes from './routes/teachers';
import timetableRoutes from './routes/timetable';
import historyRoutes from './routes/history';
import notificationRoutes from './routes/notifications';

const app = express();
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
const PORT = parseInt(process.env.PORT || '3001', 10);

// Verify environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log(`🔧 Starting server on port: ${PORT}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
console.log(`🔧 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
console.log(`🔧 Frontend URLs: ${process.env.FRONTEND_URLS || 'Not set'}`);

// Bind to all interfaces for Render deployment
const HOST = '0.0.0.0';

// CORS middleware - MUST be FIRST
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://keplertaptrack.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kepler TapTrack API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kepler TapTrack API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kepler TapTrack API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server immediately without waiting for database
app.listen(PORT, HOST, () => {
  console.log(`🚀 Kepler TapTrack API server running on ${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: https://keplertaptrack.vercel.app`);
  
  // Test database connection after server starts
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully');
      
      // Start periodic overdue check (every 1 minute)
      console.log('⏰ Starting periodic overdue check (every 1 minute)...');
      setInterval(async () => {
        try {
          await checkAndUpdateOverdueDevices();
        } catch (error) {
          console.error('❌ Error during periodic overdue check:', error);
        }
      }, 60 * 1000); // Run every 60 seconds
      
      // Run initial check immediately
      checkAndUpdateOverdueDevices().catch((error) => {
        console.error('❌ Error during initial overdue check:', error);
      });
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});



export { prisma };
