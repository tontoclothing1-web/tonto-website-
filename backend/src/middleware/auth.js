import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import authConfig from '../config/auth.js';
import ApiError from '../utils/ApiError.js';
import { get as cacheGet, set as cacheSet } from '../utils/cache.js';

/**
 * The single source of truth for request authentication.
 *
 * History: this file, `middleware/admin.js` and `utils/commerceAuth.js` each
 * carried their own copy of these guards, and the copies disagreed —
 * `commerceAuth.requireAdmin` also accepted a shared admin passcode through the
 * `X-Admin-Passcode` header *or* an `adminPasscode` field in the request body.
 * Anyone who found the passcode (it shipped in `.env.example` and was the
 * default when the env var was missing) had write access to every admin route
 * with no token, no session and no revocation path. It is gone: admin access
 * now requires a real JWT from `POST /api/auth/admin/login`.
 */

export const extractToken = (req) => {
  const header = req.headers?.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
};

/** Verify the Bearer token. Throws 401 when absent or invalid. */
export const decodeToken = (req) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Not authorized — missing Bearer token');
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret, { algorithms: ['HS256'] });
    const id = decoded.id || decoded._id || decoded.sub || null;
    if (!id) throw ApiError.unauthorized('Not authorized — malformed token');
    return { id: String(id), email: decoded.email || null, role: decoded.role || 'customer' };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Not authorized — invalid or expired token');
  }
};

// Constant-time compare so a passcode check cannot be bruted one byte at a time.
export const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

/**
 * Require a valid token. When Supabase answers, the *database* role wins over
 * the token role, so demoting an admin takes effect on their next request
 * instead of whenever their 7-day token happens to expire.
 */
export const protect = async (req, _res, next) => {
  try {
    req.user = decodeToken(req);

    try {
      const { findUserById } = await import('../models/User.js');
      const doc = await findUserById(req.user.id);
      if (!doc) {
        if (req.user.role === 'admin') {
          req.user.doc = { id: req.user.id, name: 'TONTO Admin', email: req.user.email || 'admin@tonto.local', role: 'admin' };
          return next();
        }
        throw ApiError.unauthorized('Account no longer exists');
      }
      req.user.role = doc.role || req.user.role;
      req.user.doc = { id: doc.id, name: doc.name, email: doc.email, role: req.user.role };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Supabase unreachable — keep the token claims so read-only traffic can
      // still be attributed. Anything that needs the DB calls requireSupabase()
      // and answers 503 anyway.
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

/** Attach req.user when a valid token is present; never rejects (guest flows). */
export const optionalAuth = (req, _res, next) => {
  try {
    req.user = decodeToken(req);
  } catch {
    req.user = null;
  }
  next();
};

/** 401 when there is no valid token. */
export const requireAuth = (req, _res, next) => {
  try {
    req.user = decodeToken(req);
  } catch (err) {
    return next(err);
  }
  return next();
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLE_TTL_MS = 30 * 1000;

/**
 * Live role for a token subject: `null` means the account row is gone, `undefined`
 * means we could not ask (Supabase unset or a transient outage). Cached for 30s
 * so an admin list view does not turn into one DB roundtrip per request.
 */
async function liveRole(id) {
  if (!UUID_RE.test(String(id || ''))) return undefined;
  const key = `role:${id}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const { findUserById } = await import('../models/User.js');
  const doc = await findUserById(id);
  if (!doc) return null;
  const role = doc.role || 'customer';
  cacheSet(key, role, ROLE_TTL_MS);
  return role;
}

/**
 * Admin guard: JWT only, and the *database* role wins over the token claim so a
 * demoted (or deleted) admin stops being an admin within 30s instead of whenever
 * their token expires.
 */
export const requireAdmin = async (req, _res, next) => {
  try {
    const user = req.user?.id ? req.user : decodeToken(req);
    let role = user.role;
    try {
      const fresh = await liveRole(user.id);
      if (fresh === null) return next(ApiError.unauthorized('Account no longer exists'));
      if (fresh) role = fresh;
    } catch {
      // No DB to ask — fall back to the verified token claim.
    }
    if (role !== 'admin') return next(ApiError.forbidden('Admin access required'));
    req.user = { ...user, role };
    return next();
  } catch (err) {
    return next(err);
  }
};

/** Admin guard for routes that mounted `[protect, adminOnly]`. */
export const adminOnly = requireAdmin;

/** Wrap async route handlers — forwards rejections to Express error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default {
  extractToken,
  decodeToken,
  safeCompare,
  asyncHandler,
  protect,
  optionalAuth,
  requireAuth,
  requireAdmin,
  adminOnly,
};
