import { requireSupabase } from '../config/supabase.js';

export const CATEGORIES_TABLE = 'categories';
export const CATEGORY_TABLE = CATEGORIES_TABLE;

export function mapCategoryRowToCamel(row) {
  if (!row) return null;
  return {
    id: row.slug,
    _id: row.id,
    uuid: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? '',
    categoryFilter: row.category_filter ?? '',
    image: row.image ?? '',
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true,
    createdAt: row.created_at,
  };
}

export function mapCategoryCamelToRow(input = {}) {
  const row = {};
  if (input.slug !== undefined) {
    const s = String(input.slug).toLowerCase().trim();
    if (s) row.slug = s;
  }
  if (input.id !== undefined && row.slug === undefined && typeof input.id === 'string' && !input.slug) {
    const s = String(input.id).toLowerCase().trim();
    if (s) row.slug = s;
  }
  if (input.title !== undefined) row.title = input.title;
  if (input.subtitle !== undefined) row.subtitle = input.subtitle;
  if (input.categoryFilter !== undefined) row.category_filter = input.categoryFilter;
  else if (input.category_filter !== undefined) row.category_filter = input.category_filter;
  if (input.image !== undefined) row.image = input.image;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  else if (input.sort_order !== undefined) row.sort_order = input.sort_order;
  if (input.active !== undefined) row.active = !!input.active;
  return row;
}

export async function getCategoryRowBySlug(slug) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(CATEGORIES_TABLE)
    .select('*')
    .eq('slug', String(slug).toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug) {
  return mapCategoryRowToCamel(await getCategoryRowBySlug(slug));
}

export async function listCategoryRows({ activeOnly = false } = {}) {
  const sb = requireSupabase();
  let q = sb.from(CATEGORIES_TABLE).select('*').order('sort_order', { ascending: true });
  if (activeOnly) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function listCategories(activeOnly = true) {
  const rows = await listCategoryRows({ activeOnly });
  return rows.map(mapCategoryRowToCamel);
}

export async function createCategoryRow(payload) {
  const sb = requireSupabase();
  const row = mapCategoryCamelToRow(payload);
  const { data, error } = await sb.from(CATEGORIES_TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function createCategory(payload) {
  return mapCategoryRowToCamel(await createCategoryRow(payload));
}

export async function updateCategoryRowBySlug(slug, patch) {
  const sb = requireSupabase();
  const row = mapCategoryCamelToRow(patch);
  delete row.slug;
  const { data, error } = await sb
    .from(CATEGORIES_TABLE)
    .update(row)
    .eq('slug', String(slug).toLowerCase())
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCategoryBySlug(slug, patch) {
  return mapCategoryRowToCamel(await updateCategoryRowBySlug(slug, patch));
}

export async function deactivateCategoryRowBySlug(slug) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(CATEGORIES_TABLE)
    .update({ active: false })
    .eq('slug', String(slug).toLowerCase())
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default {
  CATEGORIES_TABLE,
  CATEGORY_TABLE,
  mapCategoryRowToCamel,
  mapCategoryCamelToRow,
  getCategoryRowBySlug,
  getCategoryBySlug,
  listCategoryRows,
  listCategories,
  createCategoryRow,
  createCategory,
  updateCategoryRowBySlug,
  updateCategoryBySlug,
  deactivateCategoryRowBySlug,
};
