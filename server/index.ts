import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import callRoutes from './routes/calls';
import agentRoutes from './routes/agents';
import notificationRoutes from './routes/notifications';
import taskRoutes from './routes/tasks';
import hrRoutes from './routes/hr';
import noteRoutes from './routes/notes';
import meetingRoutes from './routes/meetings';
import outreachRoutes from './routes/outreach';
import { initIO } from './socket';

dotenv.config({ override: false });

// ── Validate required env vars ──
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
if (!MONGODB_URI) { console.error('FATAL: MONGODB_URI is not set'); process.exit(1); }
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set and at least 32 characters');
  process.exit(1);
}

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.API_PORT || process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
console.log(`[BOOT] PORT=${PORT}, NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);

// ── Trust Railway's reverse proxy ──
app.set('trust proxy', 1);

// ── Attach Socket.IO ──
initIO(httpServer);

// ── Security middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));

const allowedOriginsString = process.env.ALLOWED_ORIGINS || '';
const parsedOrigins = allowedOriginsString
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(url => url.length > 0);

const corsOptions = {
  origin: isProduction
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || parsedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS BLOCKED Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Prevent NoSQL injection
function sanitize(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitize(obj[key]);
  }
  return clean;
}
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') req.body = sanitize(req.body);
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string' && req.params[key].startsWith('$')) {
        req.params[key] = '';
      }
    }
  }
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

app.disable('x-powered-by');

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/outreach', outreachRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
});

// ── Connect to MongoDB and start server ──
mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running publicly on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('FATAL MongoDB connection error:', err.message);
    process.exit(1);
  });

export default app;
