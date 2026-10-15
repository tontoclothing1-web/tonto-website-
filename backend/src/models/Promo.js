import { requireSupabase } from '../config/supabase.js';
import { percentFromEntry, promoUsability, validatePromo, validatePromoByCode } from '../utils/promos.js';

export const PROMOS_TABLE = 'promos';
export const PROMO_TABLE = PROMOS_TABLE;

export function mapPromoRowToCamel(row) {
  if (!row) return null;
  const discountText = row.discount_text ?? '';
  // Strict resolution (see utils/promos.js): no invented 15% when the row has
  // neither a percent nor a parseable label.
  const percent = percentFromEntry({ percent: row.percent, discountText });
  return {
    id: row.id,
    _id: row.id,
    code: row.code,
    discountText,
    discount: discountText,
    // Campaign label the desk shows beside the code ("Private Drop Access").
    type: row.type ?? '',
    percent,
    active: !!row.active,
    expiresAt: row.expires_at ?? null,
    usageLimit: row.usage_limit ?? null,
    uses: row.uses ?? 0,
    createdAt: row.created_at,
  };
}

export function mapPromoCamelToRow(input = {}) {
  const row = {};
  if (input.code !== undefined) {
    const c = String(input.code).toUpperCase().trim();
    if (c) row.code = c;
  }
  if (input.discountText !== undefined) row.discount_text = input.discountText;
  else if (input.discount !== undefined) row.discount_text = input.discount;
  else if (input.discount_text !== undefined) row.discount_text = input.discount_text;
  if (input.type !== undefined) row.type = input.type;
  if (input.percent !== undefined) row.percent = input.percent;
  if (input.active !== undefined) row.active = !!input.active;
  if (input.expiresAt !== undefined) row.expires_at = input.expiresAt;
  else if (input.expires_at !== undefined) row.expires_at = input.expires_at;
  if (input.usageLimit !== undefined) row.usage_limit = input.usageLimit;
  else if (input.usage_limit !== undefined) row.usage_limit = input.usage_limit;
  if (input.uses !== undefined) row.uses = input.uses;
  return row;
}

/**
 * Usability checks live in utils/promos.js so every caller (validate endpoint,
 * cart sync, checkout, claim-offer) applies identical rules. These two thin
 * wrappers exist for older imports.
 */
export const isPromoUsableRow = (row) => promoUsability(row?.code, [row ? mapPromoRowToCamel(row) : null]);
export const isPromoUsable = (promoCamel) => promoUsability(promoCamel?.code, [promoCamel]);

export async function getPromoRowByCode(code) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(PROMOS_TABLE)
    .select('*')
    .eq('code', String(code).toUpperCase().trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPromoByCode(code) {
  return mapPromoRowToCamel(await getPromoRowByCode(code));
}

export async function listPromoRows() {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(PROMOS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listPromos() {
  return (await listPromoRows()).map(mapPromoRowToCamel);
}

export async function createPromoRow(payload) {
  const sb = requireSupabase();
  const row = mapPromoCamelToRow(payload);
  const { data, error } = await sb.from(PROMOS_TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function createPromo(payload) {
  return mapPromoRowToCamel(await createPromoRow(payload));
}

export async function updatePromoRowByCode(code, patch) {
  const sb = requireSupabase();
  const row = mapPromoCamelToRow(patch);
  const { data, error } = await sb
    .from(PROMOS_TABLE)
    .update(row)
    .eq('code', String(code).toUpperCase().trim())
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePromoByCode(code, patch) {
  return mapPromoRowToCamel(await updatePromoRowByCode(code, patch));
}

export async function deletePromoRowByCode(code) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(PROMOS_TABLE)
    .delete()
    .eq('code', String(code).toUpperCase().trim())
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default {
  PROMOS_TABLE,
  PROMO_TABLE,
  mapPromoRowToCamel,
  mapPromoCamelToRow,
  isPromoUsableRow,
  isPromoUsable,
  validatePromo,
  validatePromoByCode,
  getPromoRowByCode,
  getPromoByCode,
  listPromoRows,
  listPromos,
  createPromoRow,
  createPromo,
  updatePromoRowByCode,
  updatePromoByCode,
  deletePromoRowByCode,
};
