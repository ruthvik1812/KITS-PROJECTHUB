import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import projectRoutes from './routes/projects.js';
import groupRoutes from './routes/groups.js';
import generalRoutes from './routes/general.js';
import authRoutes from './routes/auth.js';
import ratingsRoutes from './routes/ratings.js';
import commentsRoutes from './routes/comments.js';
import wishlistRoutes from './routes/wishlist.js';
import crypto from 'crypto';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize SQLite database schema and seed data
initDatabase();

// --- Middleware ---
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

import path from 'path';
import fs from 'fs';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cookieParser());
app.use(
  session({
    name: 'kits_session',
    secret: process.env.SESSION_SECRET || 'kits-projecthub-session-secret-key-8-chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(uploadsDir));

// --- Server-issued anonymous visitor identifier (24h lifespan, zero browser fingerprinting) ---
app.use((req, res, next) => {
  let vid = req.cookies?.kits_vid;
  if (!vid || typeof vid !== 'string' || vid.length < 16) {
    vid = crypto.randomUUID();
    res.cookie('kits_vid', vid, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    if (!req.cookies) (req as any).cookies = {};
    req.cookies.kits_vid = vid;
  }
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/ratings', ratingsRoutes);
app.use('/api/projects/:projectId/comments', commentsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', generalRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✓ KITS ProjectHub SQL Backend running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Auth API:     http://localhost:${PORT}/api/auth`);
  console.log(`  Projects API: http://localhost:${PORT}/api/projects`);
  console.log(`  Groups API:   http://localhost:${PORT}/api/groups`);
});

export default app;
