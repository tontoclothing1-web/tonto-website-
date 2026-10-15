import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';

import connectDB from './config/db.js';
import app from './app.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// --- local uploads (dev) — mirrors storefront /assets/uploads ---
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res) => res.set('Cache-Control', 'public, max-age=86400, immutable'),
  })
);

// --- production: serve built storefront (root dist/) on the same port ---
// Run `npm run build` from the repo root first. Dev mode (vite :3000) ignores this.
const DIST_DIR = path.resolve(__dirname, '../../dist');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  // /assets holds two very different things: Vite's fingerprinted bundles
  // (index-a1b2c3.js — safe to pin for a year) and the storefront's public/
  // imagery copied through verbatim (hero-banner-clean.jpg — same name every
  // campaign). Blanket `immutable` meant a re-shot product photo stayed stale
  // for a year on every visitor, so cache by filename shape instead.
  const FINGERPRINTED = /-[A-Za-z0-9_]{8,}\.[A-Za-z0-9]+$/;
  app.use(
    '/assets',
    express.static(path.join(DIST_DIR, 'assets'), {
      etag: true,
      setHeaders: (res, filePath) => {
        res.set(
          'Cache-Control',
          FINGERPRINTED.test(filePath)
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=3600, must-revalidate'
        );
      },
    })
  );
  // Everything else (favicons, fonts...) → short cache, revalidate.
  app.use(
    express.static(DIST_DIR, {
      maxAge: 0,
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Never cache HTML shells — always pick up fresh deploys.
          res.set('Cache-Control', 'no-cache');
        } else {
          res.set('Cache-Control', 'public, max-age=3600');
        }
      },
    })
  );
  // SPA fallback (hash + /admin routes) — anything not /api serves index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[server] serving storefront from ${DIST_DIR}`);
}

// --- errors (must stay after all routes + static) ---
app.use(notFound);
app.use(errorHandler);

// --- boot (DB optional: works without SUPABASE_URL) ---
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`[server] TONTO API listening on :${PORT} (frontend: ${FRONTEND_URL})`);
});

/**
 * Graceful shutdown. Without this, `node --watch` / a Render deploy kill the
 * process mid-request and every in-flight checkout dies with a connection reset
 * instead of finishing. SIGTERM is what orchestrators actually send.
 */
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received — closing connections`);
  server.close(() => {
    console.log('[server] closed');
    process.exit(0);
  });
  // Anything still hanging after 10s gets cut off.
  setTimeout(() => {
    console.warn('[server] forced exit after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] uncaught exception:', err);
  shutdown('uncaughtException');
});

export default app;
