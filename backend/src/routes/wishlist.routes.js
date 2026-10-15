import { Router } from 'express';
import { body } from 'express-validator';
import { requireSupabase } from '../config/supabase.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import ApiError from '../utils/ApiError.js';
import {
  listWishlist,
  findWishlistEntry,
  createWishlistEntry,
  removeWishlistEntry,
  listAllWishlist,
} from '../models/Wishlist.js';
import { findCheckoutRows } from '../models/Product.js';

const router = Router();

// Resolve owner scope: authenticated user wins, otherwise guest deviceId.
const resolveOwner = (req, bodyDeviceId) => {
  if (req.user?.id) return { userId: req.user.id };
  const deviceId =
    (typeof req.query.deviceId === 'string' && req.query.deviceId.trim()) ||
    (typeof bodyDeviceId === 'string' && bodyDeviceId.trim()) ||
    '';
  if (!deviceId) {
    throw ApiError.unauthorized('Sign in or pass ?deviceId=<guest-id> to use the wishlist.');
  }
  return { deviceId };
};

// GET /api/wishlist[?deviceId=...] — my wishlist (protected + guest support).
// Frontend today: localStorage `tonto_saved_items` (string[] of product ids).
router.get('/', optionalAuth, async (req, _res, next) => {
  try {
    requireSupabase();
    const owner = resolveOwner(req);
    const docs = await listWishlist(owner);
    return _res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    return next(err);
  }
});

// POST /api/wishlist { productId, deviceId? } — save a piece (idempotent).
router.post(
  '/',
  optionalAuth,
  [body('productId').isString().trim().notEmpty().isLength({ max: 120 }).withMessage('productId is required'),
   body('deviceId').optional().isString().trim().isLength({ max: 80 })],
  validate,
  async (req, res, next) => {
    try {
      requireSupabase();
      const owner = resolveOwner(req, req.body.deviceId);
      const productId = String(req.body.productId).trim();
      // Only real, still-sellable pieces may be saved: the admin shortlist
      // counter is read as demand signal, and free-form ids would poison it.
      const [row] = await findCheckoutRows([productId]);
      if (!row || row.active === false) {
        throw ApiError.badRequest('That piece is not in the live catalogue.');
      }
      try {
        const doc = await createWishlistEntry({ ...owner, productId });
        return res.status(201).json({ success: true, data: doc });
      } catch (err) {
        if (err.code === '23505' || err.statusCode === 409) {
          const existing = await findWishlistEntry(owner, productId);
          return res.status(200).json({ success: true, data: existing, alreadySaved: true });
        }
        throw err;
      }
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/wishlist/:productId[?deviceId=...] — remove a piece.
// Also accepts DELETE /api/wishlist?productId=&deviceId= for clients that
// cannot send path params with a body (kept for backwards compat).
router.delete('/:productId', optionalAuth, async (req, _res, next) => {
  try {
    requireSupabase();
    const productId = (req.params.productId || '').trim();
    if (!productId) throw ApiError.badRequest('productId param is required');
    const owner = resolveOwner(req);
    const deletedCount = await removeWishlistEntry(owner, productId);
    if (deletedCount === 0) throw ApiError.notFound('Wishlist entry not found');
    return _res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/', optionalAuth, async (req, _res, next) => {
  try {
    requireSupabase();
    const productId = (
      req.query.productId ||
      req.body?.productId ||
      ''
    ).toString().trim();
    if (!productId) throw ApiError.badRequest('productId query/body field is required');
    const owner = resolveOwner(req, req.body?.deviceId);
    const deletedCount = await removeWishlistEntry(owner, productId);
    if (deletedCount === 0) throw ApiError.notFound('Wishlist entry not found');
    return _res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    return next(err);
  }
});

// Admin helper — moderation/count (not used by storefront).
router.get('/admin/all', protect, adminOnly, async (_req, res, next) => {
  try {
    requireSupabase();
    const docs = await listAllWishlist(500);
    return res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    return next(err);
  }
});

export default router;
