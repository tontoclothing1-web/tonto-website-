import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireSupabase } from '../config/supabase.js';
import { protect, adminOnly, optionalAuth, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import ApiError from '../utils/ApiError.js';
import { sendCached, del as cacheDel } from '../utils/cache.js';
import {
  LOOKS_TABLE,
  mapLookRowToCamel,
  mapLookCamelToRow,
  isUuid,
} from '../models/Look.js';

const router = Router();

const itemValidator = (path = 'items.*.') => [
  body(`${path}productId`).isString().trim().notEmpty().withMessage('item.productId is required'),
  body(`${path}numericPrice`).optional().isFloat({ min: 0 }).withMessage('item.numericPrice must be >= 0'),
];

const lookValidators = [
  body('lookId').isString().trim().notEmpty().withMessage('lookId is required'),
  body('title').isString().trim().notEmpty().withMessage('title is required'),
  body('image').isString().trim().notEmpty().withMessage('image is required'),
  body('costumeNumericPrice').optional().isFloat({ min: 0 }),
  body('active').optional().isBoolean(),
];

async function findLookByAnyId(sb, id) {
  const { data: byLookId, error: e1 } = await sb
    .from(LOOKS_TABLE)
    .select('*')
    .eq('look_id', id)
    .maybeSingle();
  if (e1) throw e1;
  if (byLookId) return byLookId;
  if (isUuid(id)) {
    const { data: byUuid, error: e2 } = await sb.from(LOOKS_TABLE).select('*').eq('id', id).maybeSingle();
    if (e2) throw e2;
    return byUuid;
  }
  return null;
}

// GET /api/looks — public storefront feed (LookbookView / ShoppableLooks).
// ?includeInactive=1 is an admin preview: it must not be readable by the public,
// otherwise a deactivated look (or its price) stays live through a query string.
const gateInactive = (req, res, next) =>
  req.query.includeInactive === '1' ? requireAdmin(req, res, next) : next();

router.get('/', gateInactive, async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === '1';
    // Only cache the public feed — admin previews must stay live.
    if (includeInactive) {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from(LOOKS_TABLE)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      const docs = (data || []).map(mapLookRowToCamel);
      return res.json({ success: true, count: docs.length, data: docs });
    }
    return await sendCached(res, 'looks:feed', 5 * 60 * 1000, async () => {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from(LOOKS_TABLE)
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const docs = (data || []).map(mapLookRowToCamel);
      return { success: true, count: docs.length, data: docs };
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/looks/:id — by lookId ("look-3") or uuid id.
// Deactivated looks are admin-only, and only the public view is cacheable.
router.get(
  '/:id',
  optionalAuth,
  [param('id').isString().trim().notEmpty().withMessage('id is required')],
  validate,
  async (req, _res, next) => {
    try {
      const { id } = req.params;
      const adminPreview = req.user?.role === 'admin';
      if (!adminPreview) {
        return await sendCached(_res, `looks:${String(id).toLowerCase()}`, 5 * 60 * 1000, async () => {
          const sb = requireSupabase();
          const doc = await findLookByAnyId(sb, id);
          if (!doc || doc.active === false) throw ApiError.notFound('Look not found');
          return { success: true, data: mapLookRowToCamel(doc) };
        });
      }
      const sb = requireSupabase();
      const doc = await findLookByAnyId(sb, id);
      if (!doc) throw ApiError.notFound('Look not found');
      return _res.json({ success: true, data: mapLookRowToCamel(doc) });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/looks — admin create.
router.post(
  '/',
  protect,
  adminOnly,
  [...lookValidators, ...itemValidator()],
  validate,
  async (req, res, next) => {
    try {
      const sb = requireSupabase();
      const row = mapLookCamelToRow(req.body);
      const { data, error } = await sb.from(LOOKS_TABLE).insert(row).select().single();
      if (error) {
        if (error.code === '23505') return next(ApiError.conflict('Look already exists.'));
        throw error;
      }
      cacheDel('looks');
      return res.status(201).json({ success: true, data: mapLookRowToCamel(data) });
    } catch (err) {
      if (err?.code === '23505') return next(ApiError.conflict('Look already exists.'));
      return next(err);
    }
  }
);

// PUT /api/looks/:id — admin update (by lookId or uuid).
router.put(
  '/:id',
  protect,
  adminOnly,
  [
    body('title').optional().isString().trim().notEmpty(),
    body('image').optional().isString().trim().notEmpty(),
    body('costumeNumericPrice').optional().isFloat({ min: 0 }),
    body('active').optional().isBoolean(),
  ],
  validate,
  async (req, _res, next) => {
    try {
      const sb = requireSupabase();
      const { id } = req.params;
      const existing = await findLookByAnyId(sb, id);
      if (!existing) throw ApiError.notFound('Look not found');
      const patch = mapLookCamelToRow(req.body);
      delete patch.look_id;
      const { data, error } = await sb
        .from(LOOKS_TABLE)
        .update(patch)
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) {
        if (error.code === '23505') return next(ApiError.conflict('Look already exists.'));
        throw error;
      }
      if (!data) throw ApiError.notFound('Look not found');
      cacheDel('looks');
      return _res.json({ success: true, data: mapLookRowToCamel(data) });
    } catch (err) {
      if (err?.code === '23505') return next(ApiError.conflict('Look already exists.'));
      return next(err);
    }
  }
);

// DELETE /api/looks/:id — admin delete (?soft=1 deactivates instead).
router.delete('/:id', protect, adminOnly, async (req, _res, next) => {
  try {
    const sb = requireSupabase();
    const { id } = req.params;
    const existing = await findLookByAnyId(sb, id);
    if (!existing) throw ApiError.notFound('Look not found');
    if (req.query.soft === '1') {
      const { data, error } = await sb
        .from(LOOKS_TABLE)
        .update({ active: false })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      cacheDel('looks');
      return _res.json({ success: true, message: 'Look deactivated', data: mapLookRowToCamel(data) });
    }
    const { error } = await sb.from(LOOKS_TABLE).delete().eq('id', existing.id);
    if (error) throw error;
    cacheDel('looks');
    return _res.json({ success: true, message: 'Look deleted' });
  } catch (err) {
    return next(err);
  }
});

export default router;
