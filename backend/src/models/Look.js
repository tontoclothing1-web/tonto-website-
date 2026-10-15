import { requireSupabase } from '../config/supabase.js';

export const LOOKS_TABLE = 'looks';
export const LOOK_TABLE = LOOKS_TABLE;

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  return fallback;
}

// snake_case row -> camelCase frontend JSON.
// Frontend (SHOPPABLE_LOOKS) uses `id` = "look-1"; DB uses look_id for that
// plus uuid `id`. We expose both: `id`/`lookId` = look_id for storefront
// compat, `_id`/`uuid`/`dbId` = postgres uuid for admin ops.
export function mapLookRowToCamel(row) {
  if (!row) return null;
  const items = asArray(row.items);
  const lookId = row.look_id ?? '';
  return {
    id: lookId,
    lookId,
    _id: row.id,
    uuid: row.id,
    dbId: row.id,
    title: row.title ?? '',
    shortTitle: row.short_title ?? '',
    image: row.image ?? '',
    thumbnail: row.thumbnail ?? '',
    video: row.video ?? '',
    mediaType: row.video ? 'video' : 'image',
    tag: row.tag ?? '',
    fit: row.fit ?? '',
    colour: '',
    color: '',
    productId: items[0]?.productId || items[0]?.product_id || '',
    description: row.description ?? '',
    items,
    costumePrice: row.costume_price ?? '',
    costumeNumericPrice: toInt(row.costume_numeric_price, 0),
    originalPrice: '',
    itemsCount: items.length,
    active: row.active ?? true,
    sortOrder: 0,
    createdAt: row.created_at,
  };
}

export function mapLookCamelToRow(input = {}) {
  const row = {};
  const lookIdRaw = input.lookId ?? input.look_id ?? input.id;
  if (lookIdRaw !== undefined) {
    const s = String(lookIdRaw).trim();
    // Only treat non-uuid strings as look_id; uuid ids map to `id`, not look_id.
    if (s && !isUuid(s)) row.look_id = s;
  }
  if (input.title !== undefined) row.title = input.title;
  if (input.shortTitle !== undefined) row.short_title = input.shortTitle;
  else if (input.short_title !== undefined) row.short_title = input.short_title;
  if (input.image !== undefined) row.image = input.image;
  if (input.thumbnail !== undefined) row.thumbnail = input.thumbnail;
  if (input.video !== undefined) row.video = input.video;
  if (input.tag !== undefined) row.tag = input.tag;
  if (input.fit !== undefined) row.fit = input.fit;
  if (input.description !== undefined) row.description = input.description;
  if (input.items !== undefined) row.items = asArray(input.items);
  if (input.costumePrice !== undefined) row.costume_price = input.costumePrice;
  else if (input.costume_price !== undefined) row.costume_price = input.costume_price;
  if (input.costumeNumericPrice !== undefined) row.costume_numeric_price = toInt(input.costumeNumericPrice, 0);
  else if (input.costume_numeric_price !== undefined) {
    row.costume_numeric_price = toInt(input.costume_numeric_price, 0);
  }
  if (input.active !== undefined) row.active = !!input.active;
  return row;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v) {
  return UUID_RE.test(String(v || ''));
}

export async function getLookRowByLookId(lookId) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(LOOKS_TABLE).select('*').eq('look_id', lookId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLookRowById(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(LOOKS_TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLookByAnyId(id) {
  let row = await getLookRowByLookId(id);
  if (!row && isUuid(id)) row = await getLookRowById(id);
  return mapLookRowToCamel(row);
}

export async function listLookRows({ includeInactive = false } = {}) {
  const sb = requireSupabase();
  let q = sb.from(LOOKS_TABLE).select('*').order('created_at', { ascending: true });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function listLooks({ includeInactive = false } = {}) {
  return (await listLookRows({ includeInactive })).map(mapLookRowToCamel);
}

export async function createLookRow(payload) {
  const sb = requireSupabase();
  const row = mapLookCamelToRow(payload);
  const { data, error } = await sb.from(LOOKS_TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function createLook(payload) {
  return mapLookRowToCamel(await createLookRow(payload));
}

export async function updateLookRowByAnyId(id, patch) {
  const sb = requireSupabase();
  const row = mapLookCamelToRow(patch);
  delete row.look_id;
  let target = await getLookRowByLookId(id);
  if (!target && isUuid(id)) target = await getLookRowById(id);
  if (!target) return null;
  const { data, error } = await sb
    .from(LOOKS_TABLE)
    .update(row)
    .eq('id', target.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteLookRowByAnyId(id) {
  const sb = requireSupabase();
  let target = await getLookRowByLookId(id);
  if (!target && isUuid(id)) target = await getLookRowById(id);
  if (!target) return null;
  const { data, error } = await sb.from(LOOKS_TABLE).delete().eq('id', target.id).select().maybeSingle();
  if (error) throw error;
  return data;
}

export default {
  LOOKS_TABLE,
  LOOK_TABLE,
  mapLookRowToCamel,
  mapLookCamelToRow,
  isUuid,
  getLookRowByLookId,
  getLookRowById,
  getLookByAnyId,
  listLookRows,
  listLooks,
  createLookRow,
  createLook,
  updateLookRowByAnyId,
  deleteLookRowByAnyId,
};
