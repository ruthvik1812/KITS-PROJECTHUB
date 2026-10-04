import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { initDatabase } from './backend/src/db/database.js';
import projectRoutes from './backend/src/routes/projects.js';
import groupRoutes from './backend/src/routes/groups.js';
import generalRoutes from './backend/src/routes/general.js';
import authRoutes from './backend/src/routes/auth.js';
import ratingsRoutes from './backend/src/routes/ratings.js';
import commentsRoutes from './backend/src/routes/comments.js';
import wishlistRoutes from './backend/src/routes/wishlist.js';
import { errorHandler } from './backend/src/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize SQLite database schema and seed data
initDatabase();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cookieParser() as any);
app.use(
  session({
    name: 'kits_session',
    secret: process.env.SESSION_SECRET || 'kits-projecthub-session-secret-key-8-chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }) as any
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(uploadsDir));

// --- Server-issued anonymous visitor identifier (24h lifespan) ---
app.use((req, res, next) => {
  let vid = req.cookies?.kits_vid;
  if (!vid || typeof vid !== 'string' || vid.length < 16) {
    vid = crypto.randomUUID();
    res.cookie('kits_vid', vid, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false,
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
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// --- Frontend Integration (Vite Middleware in dev / Static files in prod) ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'frontend/dist');

  if (isProduction && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'frontend/vite.config.ts'),
      root: path.resolve(__dirname, 'frontend'),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/uploads')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'frontend/index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  // Global centralized error handler ensuring no raw errors or stack traces leak to client
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ KITS ProjectHub running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
