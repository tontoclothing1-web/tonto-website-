import rateLimit from 'express-rate-limit';

/**
 * Rate limiters for the endpoints that cost money or leak data when abused:
 * credential checks, admin login, and the public write paths (orders,
 * enquiries, offer claims, waitlist, newsletter). The global /api limiter in
 * app.js is far too loose to stop credential stuffing on its own.
 *
 * `trust proxy` is set in app.js, so req.ip is the real client behind Render /
 * Railway / a CDN.
 */

const jsonMessage = (message) => ({ success: false, message });

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

/** POST /api/auth/login | register | admin/login — 8 attempts / 15 min / IP. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skipSuccessfulRequests: true,
  message: jsonMessage('Too many sign-in attempts. Try again in a few minutes.'),
});

/** Admin passcode exchange — tighter, and never succeeds by accident. */
export const adminLoginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: jsonMessage('Too many admin login attempts. Try again later.'),
});

/** Checkout + quote: 20 orders / hour / IP is generous for a clothing store. */
export const checkoutLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: jsonMessage('Too many checkout attempts from this device. Please wait an hour.'),
});

/** Public lead capture (enquiry, offer claim, waitlist, newsletter). */
export const publicWriteLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  limit: 15,
  message: jsonMessage('Too many submissions from this device. Please try again shortly.'),
});

/** Uploads are expensive (storage + egress) — 30 files / hour / IP. */
export const uploadLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: jsonMessage('Upload limit reached. Try again later.'),
});

export default { authLimiter, adminLoginLimiter, checkoutLimiter, publicWriteLimiter, uploadLimiter };
