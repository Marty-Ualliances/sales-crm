import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import next from 'next';

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

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || Number(process.env.INTERNAL_PORT) || 3001;
console.log(`[BOOT] MODE=${isProduction ? 'production' : 'development'}, PORT=${PORT}`);

const app = express();
const httpServer = http.createServer(app);

// ── Trust Railway's reverse proxy ──
app.set('trust proxy', 1);

// ── Attach Socket.IO ──
initIO(httpServer);

// ── Security middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false, // Disabled for Next.js
}));

const allowedOriginsString = process.env.ALLOWED_ORIGINS || '';
const parsedOrigins = allowedOriginsString
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(url => url.length > 0);

const corsOptions = {
  origin: isProduction
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow: no origin (same-origin/SSR), configured origins, railway.app, localhost
      if (
        !origin ||
        parsedOrigins.includes(origin) ||
        origin.includes('railway.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        callback(null, true);
      } else {
        console.error(`CORS BLOCKED Origin: ${origin}`);
        callback(null, false); // Reject without throwing (avoids 500)
      }
    }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

app.use(cors(corsOptions));
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
app.use((req: Request, _res: Response, nextMiddleware: NextFunction) => {
  if (req.body && typeof req.body === 'object') req.body = sanitize(req.body);
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string' && req.params[key].startsWith('$')) {
        req.params[key] = '';
      }
    }
  }
  nextMiddleware();
});

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

app.use((req: Request, _res: Response, nextMiddleware: NextFunction) => {
  if (req.url.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  nextMiddleware();
});

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api', (req: Request, res: Response) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// ── Next.js Integration ──
const nextApp = next({ dev: !isProduction });
const nextHandler = nextApp.getRequestHandler();
let nextReady = false;

// Prepare Next.js in the background without blocking the port binding
nextApp.prepare().then(() => {
  nextReady = true;
  console.log('✅ Next.js is fully prepared and ready.');
}).catch((err) => {
  console.error('FATAL Next.js prepare failed:', err);
  process.exit(1);
});

// Catch-all for Next.js
app.use((req: Request, res: Response) => {
  if (!nextReady) {
    res.status(503).send('Server is starting up (building pages). Please refresh in 10 seconds...');
    return;
  }
  return nextHandler(req, res);
});

// Global API error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
});

// ── Bind Port IMMEDIATELY, then connect to Mongo ──
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Unified Server (Next.js + Express) running publicly on port ${PORT}`);

  // Connect to DB asynchronously after we are listening so Railway doesn't timeout
  mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
      console.error('❌ MONGODB CONNECTION ERROR:', err.message);
      // We don't exit(1) immediately to allow Railway to see logs and display 503 instead of immediate 502s
    });
});

export default app;
