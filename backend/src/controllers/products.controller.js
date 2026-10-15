import { requireSupabase } from '../config/supabase.js';
import { PRODUCTS_TABLE, mapProductRowToCamel, mapProductCamelToRow } from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import { sendCached, del as cacheDel } from '../utils/cache.js';

// Public catalog reads are the hottest path — cache 30s (admin writes invalidate).
// Admin views (?includeInactive=true) bypass the cache and stay live.
const PRODUCTS_TTL_MS = 30 * 1000;

function sortToOrder(sort) {
  if (sort === 'newest') return { column: 'created_date', ascending: false };
  if (sort === 'alpha') return { column: 'title', ascending: true };
  if (sort === 'price-asc') return { column: 'numeric_price', ascending: true, nullsFirst: true };
  if (sort === 'price-desc') return { column: 'numeric_price', ascending: false, nullsFirst: false };
  return { column: 'created_at', ascending: false };
}

function sanitizeLike(s) {
  return String(s).replace(/[%_,()"]/g, '').slice(0, 120);
}

// GET /api/products?category&search&trending&new&page&limit&sort
export const listProducts = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const {
      category,
      search,
      trending,
      new: isNew,
      page = '1',
      limit = '24',
      sort = 'featured',
      includeInactive,
    } = req.query;

    // `?includeInactive=true` also reveals soft-deleted pieces, so it is honoured
    // only for a verified admin token (optionalAuth populates req.user). Public
    // responses are what land in the shared catalog cache, so an unauthenticated
    // caller asking for inactive rows simply gets the public catalog.
    const isAdminView = includeInactive === 'true' && req.user?.role === 'admin';

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    const order = sortToOrder(sort);

    const applyBaseFilters = (q) => {
      let query = q;
      if (!isAdminView) query = query.eq('active', true);
      // Exact category match (eq hits the btree index; ilike cannot).
      if (category && category !== 'All') query = query.eq('category', String(category).slice(0, 40));
      if (trending === 'true') query = query.eq('is_trending', true);
      if (isNew === 'true') query = query.eq('is_new', true);
      return query;
    };

    const applyOrder = (q) => q.order(order.column, { ascending: order.ascending });

    const term = search && String(search).trim() ? sanitizeLike(String(search).trim()) : '';

    const runQuery = async () => {
      let data = null;
      let total = 0;
      let error = null;

      if (term) {
        // Primary: full-text search via search_tsv (plainto_tsquery).
        const fts = applyOrder(
          applyBaseFilters(sb.from(PRODUCTS_TABLE).select('*', { count: 'exact' })).textSearch(
            'search_tsv',
            String(search).trim(),
            { type: 'plain' }
          )
        ).range(from, to);
        const ftsRes = await fts;
        if (!ftsRes.error) {
          data = ftsRes.data;
          total = ftsRes.count ?? 0;
        }
        // Fallback: ilike on title/description/colour when FTS errors or finds nothing.
        if (ftsRes.error || total === 0) {
          const like = `%${term}%`;
          const fb = applyOrder(
            applyBaseFilters(sb.from(PRODUCTS_TABLE).select('*', { count: 'exact' })).or(
              `title.ilike.${like},description.ilike.${like},colour.ilike.${like}`
            )
          ).range(from, to);
          const fbRes = await fb;
          data = fbRes.data;
          total = fbRes.count ?? 0;
          error = fbRes.error;
        }
      } else {
        const q = applyOrder(applyBaseFilters(sb.from(PRODUCTS_TABLE).select('*', { count: 'exact' }))).range(
          from,
          to
        );
        const res = await q;
        data = res.data;
        total = res.count ?? 0;
        error = res.error;
      }

      if (error) throw error;
      return {
        items: (data || []).map(mapProductRowToCamel),
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      };
    };

    // Cache public catalog pages; admin (includeInactive) always live.
    if (isAdminView) {
      return res.json(await runQuery());
    }
    const cacheKey = `products:${category || 'All'}:${term}:${trending || ''}:${isNew || ''}:${pageNum}:${limitNum}:${sort}`;
    return await sendCached(res, cacheKey, PRODUCTS_TTL_MS, runQuery);
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:slug
export const getProductBySlug = async (req, res, next) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const isAdminView = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const loadProduct = async () => {
      const sb = requireSupabase();
      // eq() hits the unique slug index (ilike cannot use it).
      let query = sb.from(PRODUCTS_TABLE).select('*').eq('slug', slug);
      // A soft-deleted piece must 404 for shoppers; `deleteProduct` only flips
      // active=false, so without this filter the old URL stayed purchasable.
      if (!isAdminView) query = query.eq('active', true);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) throw ApiError.notFound('Product not found.');
      return mapProductRowToCamel(data);
    };
    // Never let an admin-only view poison the shared public cache entry.
    if (isAdminView) return res.json(await loadProduct());
    return await sendCached(res, `product:${slug}`, 2 * 60 * 1000, loadProduct);
  } catch (err) {
    next(err);
  }
};

// POST /api/products (admin)
export const createProduct = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    if (!req.body?.slug) return next(ApiError.badRequest('Slug is required.'));
    const row = mapProductCamelToRow({ ...req.body, slug: String(req.body.slug).toLowerCase() });
    const { data, error } = await sb.from(PRODUCTS_TABLE).insert(row).select().single();
    if (error) {
      if (error.code === '23505') return next(ApiError.conflict('Slug already exists.'));
      throw error;
    }
    cacheDel('products');
    cacheDel('product');
    res.status(201).json(mapProductRowToCamel(data));
  } catch (err) {
    if (err?.code === '23505') return next(ApiError.conflict('Slug already exists.'));
    next(err);
  }
};

// PUT /api/products/:slug (admin)
export const updateProduct = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const row = mapProductCamelToRow(req.body);
    delete row.slug;
    const { data, error } = await sb
      .from(PRODUCTS_TABLE)
      .update(row)
      .eq('slug', String(req.params.slug).toLowerCase())
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === '23505') return next(ApiError.conflict('Slug already exists.'));
      throw error;
    }
    if (!data) return next(ApiError.notFound('Product not found.'));
    cacheDel('products');
    cacheDel('product');
    res.json(mapProductRowToCamel(data));
  } catch (err) {
    if (err?.code === '23505') return next(ApiError.conflict('Slug already exists.'));
    next(err);
  }
};

// DELETE /api/products/:slug (admin) — soft delete via `active: false`
export const deleteProduct = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from(PRODUCTS_TABLE)
      .update({ active: false })
      .eq('slug', String(req.params.slug).toLowerCase())
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return next(ApiError.notFound('Product not found.'));
    cacheDel('products');
    cacheDel('product');
    res.json({ message: 'Product deactivated.', product: mapProductRowToCamel(data) });
  } catch (err) {
    next(err);
  }
};
