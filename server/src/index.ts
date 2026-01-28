import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import teacherRoutes from './routes/teachers';
import timetableRoutes from './routes/timetable';
import historyRoutes from './routes/history';
import notificationRoutes from './routes/notifications';

const app = express();
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
const PORT = process.env.PORT || 3001;

// Verify environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// CORS configuration - Allow requests from Vercel and localhost
const allowedOrigins = [
  'https://keplertaptrack.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
];

// Support comma-separated list of frontends via FRONTEND_URLS or single FRONTEND_URL
const envOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

allowedOrigins.push(...envOrigins);

// Helper to allow dynamic patterns (e.g., Vercel preview URLs and any localhost)
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true; // allow non-browser clients
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (allowedOrigins.includes(origin)) return true;

    // Allow any Vercel subdomain (useful for preview deployments)
    if (hostname.endsWith('.vercel.app')) return true;

    // Allow localhost and 127.0.0.1 on any port
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    return false;
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (isAllowedOrigin(origin || '')) {
      callback(null, true);
    } else {
      if (origin) {
        console.log(`⚠️ Blocked CORS request from origin: ${origin}`);
      }
      console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Accept-Language',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
};

// Middleware - Apply CORS before any routes
app.use(cors(corsOptions));

// Explicitly handle all OPTIONS requests for preflight
app.options('*', cors(corsOptions));

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

// Database connection check and server start
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Kepler TapTrack API server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

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

// Start the server
startServer();

export { prisma };
