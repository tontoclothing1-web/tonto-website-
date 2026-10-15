import { requireSupabase } from '../config/supabase.js';
import {
  PROMOS_TABLE,
  mapPromoRowToCamel,
  mapPromoCamelToRow,
} from '../models/Promo.js';
import ApiError from '../utils/ApiError.js';
import { sendCached, del as cacheDel } from '../utils/cache.js';
import { invalidatePricingCache, validatePromoByCode } from '../utils/promos.js';

// `id` is included so the desk can key rows without assuming codes are unique
// forever, and `type` because the campaign label is part of what the list shows.
const PROMO_COLUMNS = 'id,code,discount_text,type,percent,active,expires_at,usage_limit,uses,created_at';

function bustPromoCaches() {
  cacheDel('promos');
  invalidatePricingCache();
}

// GET /api/promos (admin) — full list including inactive
export const listPromos = async (_req, res, next) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from(PROMOS_TABLE)
      .select(PROMO_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const items = (data || []).map(mapPromoRowToCamel);
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/promos (admin)
export const createPromo = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const row = mapPromoCamelToRow(req.body || {});
    if (!row.code) return next(ApiError.badRequest('Promo code is required.'));
    const { data, error } = await sb.from(PROMOS_TABLE).insert(row).select().single();
    if (error) {
      if (error.code === '23505') return next(ApiError.conflict('Promo code already exists.'));
      throw error;
    }
    bustPromoCaches();
    res.status(201).json(mapPromoRowToCamel(data));
  } catch (err) {
    if (err?.code === '23505') return next(ApiError.conflict('Promo code already exists.'));
    next(err);
  }
};

// PUT /api/promos/:code (admin)
export const updatePromo = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const row = mapPromoCamelToRow(req.body || {});
    // An empty .update({}) is a PostgREST error (500), not a no-op.
    if (Object.keys(row).length === 0) {
      return next(ApiError.badRequest('Nothing to update — no known promo fields in the payload.'));
    }
    const { data, error } = await sb
      .from(PROMOS_TABLE)
      .update(row)
      .eq('code', String(req.params.code).toUpperCase())
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === '23505') return next(ApiError.conflict('Promo code already exists.'));
      throw error;
    }
    if (!data) return next(ApiError.notFound('Promo not found.'));
    bustPromoCaches();
    res.json(mapPromoRowToCamel(data));
  } catch (err) {
    if (err?.code === '23505') return next(ApiError.conflict('Promo code already exists.'));
    next(err);
  }
};

// DELETE /api/promos/:code (admin)
export const deletePromo = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from(PROMOS_TABLE)
      .delete()
      .eq('code', String(req.params.code).toUpperCase())
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return next(ApiError.notFound('Promo not found.'));
    bustPromoCaches();
    res.json({ message: 'Promo deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/promos/validate { code } (public) → { valid, percent, ... }
// Same rules as checkout (active + expires_at + usage_limit + a real percent),
// so a code the storefront accepts can never be rejected at order time.
// Cached 30s per code (admin writes bust it; expiry granularity of 30s is fine).
export const validatePromo = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').toUpperCase().trim();
    if (!code) return res.json({ valid: false, reason: 'empty', code: '' });
    return await sendCached(res, `promos:validate:${code}`, 30 * 1000, async () => {
      const result = await validatePromoByCode(code);
      if (!result.ok) return { valid: false, reason: result.reason, code };
      return { valid: true, ...result.promo };
    });
  } catch (err) {
    next(err);
  }
};
