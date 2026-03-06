import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import cookieParser from 'cookie-parser';
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
import activityRoutes from './routes/activities';
import pipelineRoutes from './routes/pipeline';
import { initIO } from './socket';

process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err); });
process.on('uncaughtException', (err) => { console.error('Uncaught exception:', err); process.exit(1); });

dotenv.config({ override: false });

import { env } from './config/env';

// ── Validate required env vars ──
const MONGODB_URI = env.MONGODB_URI;
const JWT_SECRET = env.JWT_SECRET;
const isProduction = env.NODE_ENV === 'production';
const PORT = env.PORT || env.INTERNAL_PORT || 3001;
console.log(`[BOOT] MODE=${isProduction ? 'production' : 'development'}, PORT=${PORT}`);

const app = express();
const httpServer = http.createServer(app);

// ── Trust reverse proxy chain (Railway/edge/load balancer) ──
app.set('trust proxy', isProduction ? 1 : false);

// ── Attach Socket.IO ──
initIO(httpServer);

// ── Security middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

const allowedOriginsString = env.ALLOWED_ORIGINS || '';
const parsedOrigins = allowedOriginsString
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(url => url.length > 0);

const inferredOrigins = [
  env.APP_URL?.trim().replace(/\/$/, ''),
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim().replace(/\/$/, '')}` : undefined,
].filter((origin): origin is string => Boolean(origin));

const allowedOrigins = Array.from(new Set([...parsedOrigins, ...inferredOrigins]));

const corsOptions = {
  origin: isProduction
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow: no origin (same-origin/SSR), or exact match from ALLOWED_ORIGINS
      const normalizedOrigin = origin?.trim().replace(/\/$/, '');
      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.error(`CORS BLOCKED Origin: ${origin}`);
        callback(null, false);
      }
    }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

function deepSanitizeHtml(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, {
      allowedTags: [], // Strip all HTML tags
      allowedAttributes: {}
    });
  }
  if (Array.isArray(obj)) return obj.map(deepSanitizeHtml);
  if (obj !== null && typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      clean[key] = deepSanitizeHtml(obj[key]);
    }
    return clean;
  }
  return obj;
}

app.use((req: Request, _res: Response, nextMiddleware: NextFunction) => {
  if (req.body) req.body = deepSanitizeHtml(req.body);
  // Express 5: req.query is a getter — shadow it with a data property
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: deepSanitizeHtml(req.query as Record<string, unknown>),
      writable: true,
      configurable: true,
    });
  }
  if (req.params) req.params = deepSanitizeHtml(req.params);
  nextMiddleware();
});

// Prevent NoSQL injection
app.use(mongoSanitize());

// General API: 100 req / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.method === 'OPTIONS',
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', apiLimiter);

// Strict auth limiter: 5 req / 15 min per IP on sensitive endpoints
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  // Count failed attempts only, so successful login/refresh doesn't burn quota
  skipSuccessfulRequests: true,
  message: { error: 'Too many auth attempts, please try again in 15 minutes' },
});
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/auth/reset-password', strictAuthLimiter);
app.use('/api/auth/impersonate', strictAuthLimiter);

app.disable('x-powered-by');

app.use((req: Request, _res: Response, nextMiddleware: NextFunction) => {
  if (req.url.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  nextMiddleware();
});

import { auditLogMiddleware } from './middleware/auditLog';

// ── Routes ──
// Apply AuditLog to required areas (only logs mutations per its internal logic)
app.use('/api/auth/impersonate', auditLogMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/leads', auditLogMiddleware, leadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/calls', auditLogMiddleware, callRoutes);
app.use('/api/agents', auditLogMiddleware, agentRoutes);
app.use('/api/meetings', auditLogMiddleware, meetingRoutes);
app.use('/api/outreach', auditLogMiddleware, outreachRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/notes', noteRoutes);

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

// ── Auto-seed admin user if database is empty ──
import User from './models/User';
import PipelineStage from './models/PipelineStage';

const DEFAULT_PIPELINE_STAGES = [
  { name: 'New', order: 1, color: '#6B7280', probability: 5, isDefault: true, description: 'Freshly added lead' },
  { name: 'Contacted', order: 2, color: '#3B82F6', probability: 15, description: 'Initial contact made' },
  { name: 'Qualified', order: 3, color: '#8B5CF6', probability: 30, description: 'Lead is qualified' },
  { name: 'Proposal', order: 4, color: '#F59E0B', probability: 50, description: 'Proposal sent' },
  { name: 'Negotiation', order: 5, color: '#EF4444', probability: 70, description: 'In negotiations' },
  { name: 'Won', order: 6, color: '#10B981', probability: 100, description: 'Deal closed — won' },
  { name: 'Lost', order: 7, color: '#DC2626', probability: 0, description: 'Deal closed — lost' },
];

async function autoSeedPipelineStages() {
  try {
    const stageCount = await PipelineStage.countDocuments();
    if (stageCount > 0) {
      console.log(`[SEED] ${stageCount} pipeline stages already exist — skipping.`);
    } else {
      await PipelineStage.insertMany(DEFAULT_PIPELINE_STAGES);
      console.log(`[SEED] ✅ Created ${DEFAULT_PIPELINE_STAGES.length} default pipeline stages.`);
    }

    // Assign default stage to any leads missing pipelineStage
    const defaultStage = await PipelineStage.findOne({ isDefault: true, isActive: true }).sort({ order: 1 });
    if (defaultStage) {
      const result = await (await import('./models/Lead.js')).default.updateMany(
        { $or: [{ pipelineStage: null }, { pipelineStage: { $exists: false } }], isDeleted: { $ne: true } },
        { $set: { pipelineStage: defaultStage._id } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[SEED] ✅ Assigned default stage "${defaultStage.name}" to ${result.modifiedCount} lead(s) missing pipelineStage.`);
      }
    }

    // Normalize legacy "CSV Import" source values → "csv_upload"
    const Lead = (await import('./models/Lead.js')).default;
    const sourceFixResult = await Lead.updateMany(
      { source: { $nin: ['csv_upload', 'manual', 'website', 'referral', 'linkedin', 'other'] } },
      { $set: { source: 'csv_upload' } }
    );
    if (sourceFixResult.modifiedCount > 0) {
      console.log(`[SEED] ✅ Normalized ${sourceFixResult.modifiedCount} lead(s) with invalid source values to "csv_upload".`);
    }
  } catch (err) {
    console.error('[SEED] ❌ Pipeline stage seed failed:', err);
  }
}

async function autoSeedAdmin() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[SEED] Database already has ${userCount} user(s), skipping auto-seed.`);
      return;
    }
    console.log('[SEED] No users found — creating default admin user…');

    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const teamPassword = process.env.SEED_TEAM_PASSWORD;
    if (!adminPassword || !teamPassword) {
      console.log('[SEED] SEED_ADMIN_PASSWORD or SEED_TEAM_PASSWORD not set — skipping auto-seed.');
      return;
    }

    await User.create([
      { name: 'Chiren', email: 'chiren@ualliances.com', password: adminPassword, avatar: 'CH', role: 'admin' },
      { name: 'Rajesh Patel', email: 'rajesh@ualliances.com', password: teamPassword, avatar: 'RP', role: 'sdr' },
      { name: 'Priya Sharma', email: 'priya@ualliances.com', password: teamPassword, avatar: 'PS', role: 'sdr' },
      { name: 'Amit Desai', email: 'amit@ualliances.com', password: teamPassword, avatar: 'AD', role: 'closer' },
      { name: 'Deepa Joshi', email: 'deepa@ualliances.com', password: teamPassword, avatar: 'DJ', role: 'hr' },
      { name: 'Karan Shah', email: 'karan@ualliances.com', password: teamPassword, avatar: 'KS', role: 'lead_gen' },
      { name: 'Sanjay Gupta', email: 'sanjay@ualliances.com', password: teamPassword, avatar: 'SG', role: 'manager' },
    ]);
    console.log('[SEED] ✅ Created 7 default users (admin + team)');
    console.log('[SEED]   Admin: chiren@ualliances.com');
    console.log('[SEED]   Team:  rajesh/priya (sdr), amit (closer), deepa (hr), karan (lead_gen), sanjay (manager)');
  } catch (err) {
    console.error('[SEED] ❌ Auto-seed failed:', err);
  }
}

// ── Bind Port IMMEDIATELY, then connect to Mongo ──
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Unified Server (Next.js + Express) running publicly on port ${PORT}`);

  // Connect to DB asynchronously after we are listening so Railway doesn't timeout
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    })
    .then(async () => {
      mongoose.set('maxTimeMS', 5000); // Set global default query timeout
      console.log('✅ Connected to MongoDB');
      // Auto-create users if DB is empty (first deploy / fresh database)
      await autoSeedAdmin();
      // Auto-create pipeline stages if none exist
      await autoSeedPipelineStages();
    })
    .catch((err) => {
      console.error('❌ MONGODB CONNECTION ERROR: Failed to connect to database.');
      if (!isProduction) {
        // In development, we can log a bit more detail without being as risky, 
        // but still avoid the full URI if it contains credentials.
        console.error(`[DEV ERROR] ${err.message.replace(/\/\/.*:.*@/, '//****:****@')}`);
      }
      // We don't exit(1) immediately to allow Railway to see logs and display 503 instead of immediate 502s
    });
});

export default app;
