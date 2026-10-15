/**
 * Enquiry — Supabase DAO.
 * Replaces the Mongoose Enquiry model. Table: enquiries
 *   (id, product_id, product_title, size, name, phone, email, message,
 *    channel, status, colour, notes).
 * `colour`/`notes` come from supabase/migration_004_admin_crm_fields.sql; before
 * it, the desk's colour column was invented from nothing and the showroom's own
 * note had no place to live.
 * NOTE: the table has no whatsapp_link column — the concierge link is
 * computed per response in the controller, never persisted.
 */
import { requireSupabase } from '../config/supabase.js';

export const ENQUIRIES_TABLE = 'enquiries';

/** DB row (snake_case) → API object (camelCase, `title` kept as alias). */
export function mapRowToEnquiry(row = {}) {
  const productTitle = row.product_title ?? row.title ?? 'General Collection';
  const out = {
    id: row.id,
    productId: row.product_id ?? null,
    productTitle,
    title: productTitle,
    size: row.size ?? 'Standard',
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    message: row.message ?? '',
    colour: row.colour ?? '',
    notes: row.notes ?? row.message ?? '',
    channel: row.channel ?? 'form',
    status: row.status ?? 'new',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.whatsapp_link || row.whatsappLink) out.whatsappLink = row.whatsapp_link ?? row.whatsappLink;
  return out;
}

/** API object (camelCase) → DB row (snake_case) for inserts. */
export function mapEnquiryToRow(doc = {}) {
  return {
    product_id: doc.productId ?? doc.product_id ?? null,
    product_title: doc.productTitle ?? doc.title ?? doc.product_title ?? 'General Collection',
    size: doc.size ?? 'Standard',
    name: doc.name ?? '',
    phone: doc.phone ?? '',
    email: doc.email ?? '',
    message: doc.message ?? '',
    colour: doc.colour ?? '',
    notes: doc.notes ?? '',
    channel: doc.channel === 'whatsapp' ? 'whatsapp' : 'form',
    status: doc.status ?? 'new',
  };
}

function sanitizeSearch(q) {
  return String(q || '')
    .replace(/[,()%\"\\]/g, '')
    .trim();
}

export async function createEnquiry(data) {
  const sb = requireSupabase();
  const { data: row, error } = await sb.from(ENQUIRIES_TABLE).insert(mapEnquiryToRow(data)).select().single();
  if (error) throw error;
  return mapRowToEnquiry(row);
}

export async function findEnquiryById(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(ENQUIRIES_TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapRowToEnquiry(data) : null;
}

export async function updateEnquiryById(id, patch = {}) {
  const sb = requireSupabase();
  const rowPatch = {};
  if (patch.status !== undefined) rowPatch.status = patch.status;
  if (patch.channel !== undefined) rowPatch.channel = patch.channel;
  if (patch.notes !== undefined) rowPatch.notes = patch.notes;
  if (patch.colour !== undefined) rowPatch.colour = patch.colour;
  // An empty .update({}) is a PostgREST error (500), not a no-op.
  if (Object.keys(rowPatch).length === 0) return findEnquiryById(id);
  const { data, error } = await sb.from(ENQUIRIES_TABLE).update(rowPatch).eq('id', id).select().single();
  if (error) throw error;
  return mapRowToEnquiry(data);
}

export async function listEnquiries({ status, channel, search, page = 1, limit = 20 } = {}) {
  const sb = requireSupabase();
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  let query = sb.from(ENQUIRIES_TABLE).select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (channel) query = query.eq('channel', channel);
  const q = sanitizeSearch(search);
  if (q) {
    const pat = `%${q}%`;
    query = query.or(
      [`name.ilike.${pat}`, `phone.ilike.${pat}`, `email.ilike.${pat}`, `product_title.ilike.${pat}`, `message.ilike.${pat}`].join(',')
    );
  }
  query = query.range((pg - 1) * lim, pg * lim - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? (data || []).length;
  return { data: (data || []).map(mapRowToEnquiry), total, page: pg, pages: Math.ceil(total / lim) || 0 };
}

export default { ENQUIRIES_TABLE, mapRowToEnquiry, mapEnquiryToRow, createEnquiry, findEnquiryById, updateEnquiryById, listEnquiries };
