import { requireSupabase } from '../config/supabase.js';

export const PRODUCT_CATEGORIES = [
  'Tees',
  'Shirts',
  'Layers',
  'Denim',
  'Bottoms',
  'Trousers',
  'Shorts',
  'Accessories',
];
// 'Bottoms' was missing from this list (and from the products_category_check
// constraint) while src/data/products.js ships 3 Bottoms pieces, so any admin
// save of one of those products failed validation with 400.

export const PRODUCTS_TABLE = 'products';
export const PRODUCT_TABLE = PRODUCTS_TABLE;

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function toDateOnly(v) {
  if (v == null || v === '') return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s.slice(0, 10);
}

// snake_case row -> camelCase frontend JSON
export function mapProductRowToCamel(row) {
  if (!row) return null;
  const stockQty = row.stock_qty ?? 10;
  const images = asArray(row.images);
  const priceText = row.price_text ?? 'Price on enquiry';
  return {
    id: row.slug,
    _id: row.id,
    uuid: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    colour: row.colour ?? '',
    color: row.colour ?? '',
    fit: row.fit ?? '',
    priceText,
    price: priceText,
    numericPrice: row.numeric_price ?? null,
    images,
    image: images[0] || '',
    alt: row.alt ?? '',
    description: row.description ?? '',
    verifiedBrand: row.verified_brand ?? 'unisex / TONTO',
    availability: row.availability ?? 'In stock - Coimbatore',
    variants: asArray(row.variants),
    measurements: row.measurements ?? '',
    isTrending: !!row.is_trending,
    isNew: !!row.is_new,
    stockQty,
    stock: stockQty,
    inStock: stockQty > 0,
    createdDate: row.created_date,
    active: row.active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// camelCase payload -> snake_case row (only known columns; undefined omitted)
export function mapProductCamelToRow(input = {}) {
  const row = {};
  const pick = (camel, snake, transform) => {
    if (input[camel] !== undefined) {
      const v = transform ? transform(input[camel]) : input[camel];
      if (v !== undefined) row[snake] = v;
    }
  };
  if (input.slug !== undefined) {
    const s = String(input.slug).toLowerCase().trim();
    if (s) row.slug = s;
  }
  pick('title', 'title');
  pick('category', 'category');
  if (input.colour !== undefined) row.colour = input.colour;
  else if (input.color !== undefined) row.colour = input.color;
  pick('fit', 'fit');
  if (input.priceText !== undefined) row.price_text = input.priceText;
  else if (input.price !== undefined) row.price_text = input.price;
  if (input.numericPrice !== undefined) row.numeric_price = input.numericPrice;
  else if (input.numeric_price !== undefined) row.numeric_price = input.numeric_price;
  if (input.images !== undefined) row.images = asArray(input.images);
  pick('alt', 'alt');
  pick('description', 'description');
  if (input.verifiedBrand !== undefined) row.verified_brand = input.verifiedBrand;
  else if (input.verified_brand !== undefined) row.verified_brand = input.verified_brand;
  pick('availability', 'availability');
  if (input.variants !== undefined) {
    row.variants = typeof input.variants === 'string'
      ? input.variants.split(/[,/]+/).map((s) => s.trim()).filter(Boolean)
      : asArray(input.variants);
  }
  pick('measurements', 'measurements');
  if (input.isTrending !== undefined) row.is_trending = !!input.isTrending;
  else if (input.is_trending !== undefined) row.is_trending = !!input.is_trending;
  if (input.isNew !== undefined) row.is_new = !!input.isNew;
  else if (input.is_new !== undefined) row.is_new = !!input.is_new;
  if (input.stockQty !== undefined) row.stock_qty = input.stockQty;
  else if (input.stock_qty !== undefined) row.stock_qty = input.stock_qty;
  else if (input.stock !== undefined) row.stock_qty = input.stock;
  if (input.createdDate !== undefined) {
    const d = toDateOnly(input.createdDate);
    if (d !== undefined) row.created_date = d;
  } else if (input.created_date !== undefined) {
    const d = toDateOnly(input.created_date);
    if (d !== undefined) row.created_date = d;
  }
  if (input.active !== undefined) row.active = !!input.active;
  return row;
}

// ---- CRUD helpers (Supabase, camelCase in/out where noted) ----

/**
 * Public/commerce reads must never surface a soft-deleted piece: `DELETE
 * /api/products/:slug` only flips `active = false`, so without this filter a
 * "deleted" product stayed purchasable at its old URL forever.
 * Admin lookups pass `{ includeInactive: true }`.
 */
export async function getProductRowBySlug(slug, { includeInactive = false } = {}) {
  const sb = requireSupabase();
  let query = sb
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('slug', String(slug).toLowerCase());
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug, options) {
  return mapProductRowToCamel(await getProductRowBySlug(slug, options));
}

export async function getProductRowById(id, { includeInactive = false } = {}) {
  const sb = requireSupabase();
  let query = sb.from(PRODUCTS_TABLE).select('*').eq('id', id);
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Batch price/stock lookup for checkout. Cart and order payloads arrive from the
 * browser, so the only trustworthy source for a unit price is this row — callers
 * must never read `numericPrice` off the request body.
 * Accepts slug OR uuid keys; returns snake_case rows for whatever exists.
 */
export async function findCheckoutRows(keys = []) {
  const clean = [...new Set(keys.map((k) => String(k ?? '').trim()).filter(Boolean))];
  if (clean.length === 0) return [];
  const sb = requireSupabase();
  const columns = 'id,slug,title,numeric_price,price_text,stock_qty,active,images,variants,availability';
  const uuids = clean.filter((k) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k));
  const slugs = clean.filter((k) => !uuids.includes(k)).map((k) => k.toLowerCase());

  // PostgREST cannot OR across a uuid and a text column in one filter, so query
  // each set separately and merge.
  const runs = [];
  if (slugs.length) runs.push(sb.from(PRODUCTS_TABLE).select(columns).in('slug', slugs));
  if (uuids.length) runs.push(sb.from(PRODUCTS_TABLE).select(columns).in('id', uuids));
  const results = await Promise.all(runs.map(async (p) => {
    const { data, error } = await p;
    if (error) throw error;
    return data || [];
  }));
  return results.flat();
}

export async function listProductRows({ limit = 100, offset = 0 } = {}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(PRODUCTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

export async function createProductRow(payload) {
  const sb = requireSupabase();
  const row = mapProductCamelToRow(payload);
  const { data, error } = await sb.from(PRODUCTS_TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function createProduct(payload) {
  return mapProductRowToCamel(await createProductRow(payload));
}

export async function updateProductRowBySlug(slug, patch) {
  const sb = requireSupabase();
  const row = mapProductCamelToRow(patch);
  delete row.slug;
  const { data, error } = await sb
    .from(PRODUCTS_TABLE)
    .update(row)
    .eq('slug', String(slug).toLowerCase())
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProductBySlug(slug, patch) {
  return mapProductRowToCamel(await updateProductRowBySlug(slug, patch));
}

export async function deactivateProductRowBySlug(slug) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(PRODUCTS_TABLE)
    .update({ active: false })
    .eq('slug', String(slug).toLowerCase())
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default {
  PRODUCTS_TABLE,
  PRODUCT_TABLE,
  PRODUCT_CATEGORIES,
  mapProductRowToCamel,
  mapProductCamelToRow,
  getProductRowBySlug,
  getProductBySlug,
  getProductRowById,
  findCheckoutRows,
  listProductRows,
  createProductRow,
  createProduct,
  updateProductRowBySlug,
  updateProductBySlug,
  deactivateProductRowBySlug,
};
