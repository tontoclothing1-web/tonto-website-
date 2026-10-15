import { requireSupabase } from '../config/supabase.js';
import {
  CATEGORIES_TABLE,
  mapCategoryRowToCamel,
  mapCategoryCamelToRow,
} from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import { sendCached, del as cacheDel } from '../utils/cache.js';

const CATEGORIES_TTL_MS = 5 * 60 * 1000;

// GET /api/categories (public)
export const listCategories = async (_req, res, next) => {
  try {
    return await sendCached(res, 'categories:list', CATEGORIES_TTL_MS, async () => {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from(CATEGORIES_TABLE)
        .select('slug,title,subtitle,category_filter,image,sort_order,active')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const items = (data || []).map(mapCategoryRowToCamel);
      return { items, total: items.length };
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/categories/:slug (public)
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    return await sendCached(res, `categories:${slug}`, CATEGORIES_TTL_MS, async () => {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from(CATEGORIES_TABLE)
        .select('slug,title,subtitle,category_filter,image,sort_order,active')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw ApiError.notFound('Category not found.');
      return mapCategoryRowToCamel(data);
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories (admin)
export const createCategory = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    if (!req.body?.slug) return next(ApiError.badRequest('Slug is required.'));
    const row = mapCategoryCamelToRow({ ...req.body, slug: String(req.body.slug).toLowerCase() });
    const { data, error } = await sb.from(CATEGORIES_TABLE).insert(row).select().single();
    if (error) {
      if (error.code === '23505') return next(ApiError.conflict('Category slug already exists.'));
      throw error;
    }
    cacheDel('categories');
    res.status(201).json(mapCategoryRowToCamel(data));
  } catch (err) {
    if (err?.code === '23505') return next(ApiError.conflict('Category slug already exists.'));
    next(err);
  }
};

// PUT /api/categories/:slug (admin)
export const updateCategory = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const row = mapCategoryCamelToRow(req.body);
    delete row.slug;
    const { data, error } = await sb
      .from(CATEGORIES_TABLE)
      .update(row)
      .eq('slug', String(req.params.slug).toLowerCase())
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === '23505') return next(ApiError.conflict('Category slug already exists.'));
      throw error;
    }
    if (!data) return next(ApiError.notFound('Category not found.'));
    cacheDel('categories');
    res.json(mapCategoryRowToCamel(data));
  } catch (err) {
    if (err?.code === '23505') return next(ApiError.conflict('Category slug already exists.'));
    next(err);
  }
};

// DELETE /api/categories/:slug (admin) — soft delete
export const deleteCategory = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from(CATEGORIES_TABLE)
      .update({ active: false })
      .eq('slug', String(req.params.slug).toLowerCase())
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return next(ApiError.notFound('Category not found.'));
    cacheDel('categories');
    res.json({ message: 'Category deactivated.', category: mapCategoryRowToCamel(data) });
  } catch (err) {
    next(err);
  }
};
