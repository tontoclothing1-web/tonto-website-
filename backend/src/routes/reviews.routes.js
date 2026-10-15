import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireSupabase } from '../config/supabase.js';
import { protect, adminOnly } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import ApiError from '../utils/ApiError.js';
import { REVIEWS_TABLE, mapReviewRowToCamel, mapReviewCamelToRow } from '../models/Review.js';

// Mounted at /api in app.js so routes match the spec exactly:
//   GET  /api/products/:id/reviews
//   POST /api/products/:id/reviews (protected)
//   PATCH /api/reviews/:id/approve (admin)
const router = Router();

// GET /api/products/:id/reviews — public, approved only (ProductDetailPage).
router.get(
  '/products/:id/reviews',
  [param('id').isString().trim().notEmpty().withMessage('product id is required')],
  validate,
  async (req, res, next) => {
    try {
      const sb = requireSupabase();
      const { id } = req.params;
      const { data, error } = await sb
        .from(REVIEWS_TABLE)
        .select('*')
        .eq('product_id', id)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const docs = (data || []).map(mapReviewRowToCamel);
      const avg =
        docs.length > 0
          ? docs.reduce((sum, r) => sum + r.rating, 0) / docs.length
          : 0;
      return res.json({
        success: true,
        count: docs.length,
        averageRating: Math.round(avg * 10) / 10,
        data: docs,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/products/:id/reviews — protected, enters moderation queue.
router.post(
  '/products/:id/reviews',
  protect,
  [
    param('id').isString().trim().notEmpty().withMessage('product id is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be an integer 1-5'),
    body('comment').optional().isString().trim().isLength({ max: 2000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const sb = requireSupabase();
      const { id: productId } = req.params;
      const { rating, comment = '' } = req.body;

      const { data: existing, error: findError } = await sb
        .from(REVIEWS_TABLE)
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const patch = mapReviewCamelToRow({
          rating,
          comment: String(comment).trim(),
          approved: false,
        });
        const { data, error } = await sb
          .from(REVIEWS_TABLE)
          .update(patch)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return res.json({ success: true, data: mapReviewRowToCamel(data), updated: true });
      }

      const row = mapReviewCamelToRow({
        productId,
        user_id: req.user.id,
        rating,
        comment: String(comment).trim(),
        approved: false,
      });
      const { data: doc, error } = await sb.from(REVIEWS_TABLE).insert(row).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data: mapReviewRowToCamel(doc) });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/reviews/:id/approve — admin moderation.
// `id` is the uuid column: a non-uuid value would make Postgres throw
// `invalid input syntax for type uuid` and surface as a 500, so reject early.
router.patch(
  '/reviews/:id/approve',
  protect,
  adminOnly,
  [param('id').isUUID().withMessage('review id must be a uuid')],
  validate,
  async (req, _res, next) => {
    try {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from(REVIEWS_TABLE)
        .update({ approved: true })
        .eq('id', req.params.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw ApiError.notFound('Review not found');
      return _res.json({ success: true, data: mapReviewRowToCamel(data) });
    } catch (err) {
      return next(err);
    }
  }
);

// Admin extras — moderation queue + reject/delete.
router.get('/reviews', protect, adminOnly, async (req, res, next) => {
  try {
    const sb = requireSupabase();
    let q = sb.from(REVIEWS_TABLE).select('*').order('created_at', { ascending: false }).limit(200);
    if (req.query.productId) q = q.eq('product_id', req.query.productId);
    if (req.query.approved === 'true') q = q.eq('approved', true);
    if (req.query.approved === 'false') q = q.eq('approved', false);
    const { data, error } = await q;
    if (error) throw error;
    const docs = (data || []).map(mapReviewRowToCamel);
    return res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    return next(err);
  }
});

router.delete(
  '/reviews/:id',
  protect,
  adminOnly,
  [param('id').isUUID().withMessage('review id must be a uuid')],
  validate,
  async (req, _res, next) => {
    try {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from(REVIEWS_TABLE)
        .delete()
        .eq('id', req.params.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw ApiError.notFound('Review not found');
      return _res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
