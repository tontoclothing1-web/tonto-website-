import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// ---- Routers are imported statically on purpose ----
// This file used to loop over a table of filenames, `fs.existsSync()` each one
// and `await import()` it inside a try/catch at module top level. That meant a
// syntax error or a bad import in any route file was logged as
// "[app] skipped /api/orders" and the server kept serving 404s for it — and the
// top-level await delayed the whole module graph. A missing router must now
// crash the boot, not go quietly.
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import orderRoutes from './routes/orders.routes.js';
import cartRoutes from './routes/cart.routes.js';
import enquiryRoutes from './routes/enquiries.routes.js';
import leadRoutes from './routes/leads.routes.js';
import promoRoutes from './routes/promos.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import looksRoutes from './routes/looks.routes.js';
import reviewsRoutes from './routes/reviews.routes.js'; // mounted at /api (see below)
import accountRoutes from './routes/account.routes.js';
import policiesRoutes from './routes/policies.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import storeRoutes from './routes/store.routes.js';

const app = express();

// Trust reverse proxy (Render/Railway/Vercel) for rate-limit + secure cookies.
app.set('trust proxy', 1);
// Smaller responses + less fingerprinting.
app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:', 'http://localhost:*', 'ws://localhost:*'],
        frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Standard Permissions-Policy matching Vercel edge deployment
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
});

// Gzip JSON/static before anything else touches the body.
app.use(compression({ threshold: 1024 }));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (curl, SSR, same-origin) or explicitly listed → allow.
      // Any localhost port is allowed only outside production (vite drifts ports).
      if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost(origin))) {
        return callback(null, true);
      }
      // A blocked origin is a client-side policy problem, not a server crash:
      // answering 403 keeps it out of the error log and out of a 500 page.
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Verbose 'dev' logging locally, single-line 'tiny' in production, silent in tests.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
}

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Real client IP for the store's own analytics-friendly 429 handling.
    message: { success: false, message: 'Too many requests — please slow down.' },
  })
);

// ---- Health ----
app.get('/api/health', (_req, res) =>
  res.json({
    success: true,
    service: 'tonto-clothing-backend',
    time: new Date().toISOString(),
    db: process.env.SUPABASE_URL ? 'configured' : 'not-configured',
  })
);
app.get('/api', (_req, res) =>
  res.json({
    success: true,
    service: 'tonto-clothing-backend',
    docs: '/api/health • see backend/README.md for the endpoint table',
  })
);

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/looks', looksRoutes);
app.use('/api', reviewsRoutes); // GET|POST /api/products/:id/reviews, PATCH /api/reviews/:id/approve
app.use('/api/account', accountRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/store', storeRoutes);

// An unknown /api path must never fall through to the SPA index.html.
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'No such endpoint. See backend/README.md.' });
});

// Centralized error formatter for all /api routes
app.use(errorHandler);

export default app;
