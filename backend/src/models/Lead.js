/**
 * Lead — Supabase DAO.
 * Replaces the Mongoose Lead model. Table: leads
 *   (id, name, email, phone, source, promo_claimed, claimed_code, stage,
 *    interest, estimated_value, notes).
 * The last four are the Studio Admin CRM columns from
 * supabase/migration_004_admin_crm_fields.sql — without that migration the desk's
 * edits have nowhere to land, so writes here fail loudly rather than dropping
 * the owner's notes on the floor.
 */
import { requireSupabase } from '../config/supabase.js';

export const LEADS_TABLE = 'leads';

/** The exact labels the Leads tab's picker and CSV export use. */
export const LEAD_STAGES = ['New', 'In Discussion', 'Converted', 'Lost'];

/** Anything unknown becomes 'New' — the CHECK constraint would reject the write. */
export function normaliseStage(value) {
  const raw = String(value ?? '').trim();
  const hit = LEAD_STAGES.find((s) => s.toLowerCase() === raw.toLowerCase());
  return hit || 'New';
}

/** DB row (snake_case) → API object (camelCase). */
export function mapRowToLead(row = {}) {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    source: row.source ?? 'other',
    promoClaimed: row.promo_claimed ?? false,
    claimedCode: row.claimed_code ?? null,
    stage: row.stage ?? 'New',
    interest: row.interest ?? '',
    estimatedValue: Number(row.estimated_value ?? 0),
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** API object (camelCase) → DB row (snake_case) for inserts. */
export function mapLeadToRow(doc = {}) {
  return {
    name: doc.name ?? '',
    email: doc.email ? String(doc.email).trim().toLowerCase() : '',
    phone: doc.phone ?? '',
    source: doc.source ?? 'other',
    promo_claimed: doc.promoClaimed ?? doc.promo_claimed ?? false,
    claimed_code: doc.claimedCode ?? doc.claimed_code ?? '',
    stage: normaliseStage(doc.stage ?? doc.stage_label),
    interest: doc.interest ?? '',
    estimated_value: Number(doc.estimatedValue ?? doc.estimated_value ?? 0) || 0,
    notes: doc.notes ?? '',
  };
}

function sanitizeSearch(q) {
  return String(q || '')
    .replace(/[,()%\"\\]/g, '')
    .trim();
}

export async function createLead(data) {
  const sb = requireSupabase();
  const { data: row, error } = await sb.from(LEADS_TABLE).insert(mapLeadToRow(data)).select().single();
  if (error) throw error;
  return mapRowToLead(row);
}

/** Case-insensitive lookup — the unique index is on lower(email). */
export async function findLeadByEmail(email) {
  const sb = requireSupabase();
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return null;
  const { data, error } = await sb.from(LEADS_TABLE).select('*').ilike('email', clean).maybeSingle();
  if (error) throw error;
  return data ? mapRowToLead(data) : null;
}

export async function updateLeadById(id, patch = {}) {
  const sb = requireSupabase();
  const rowPatch = {};
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.email !== undefined) rowPatch.email = String(patch.email || '').trim().toLowerCase();
  if (patch.phone !== undefined) rowPatch.phone = patch.phone;
  if (patch.source !== undefined) rowPatch.source = patch.source;
  if (patch.promoClaimed !== undefined) rowPatch.promo_claimed = patch.promoClaimed;
  if (patch.claimedCode !== undefined) rowPatch.claimed_code = patch.claimedCode;
  if (patch.stage !== undefined) rowPatch.stage = normaliseStage(patch.stage);
  if (patch.interest !== undefined) rowPatch.interest = patch.interest;
  if (patch.estimatedValue !== undefined) rowPatch.estimated_value = Number(patch.estimatedValue) || 0;
  if (patch.notes !== undefined) rowPatch.notes = patch.notes;
  // An empty .update({}) is a PostgREST error (500), not a no-op.
  if (Object.keys(rowPatch).length === 0) return findLeadById(id);
  const { data, error } = await sb.from(LEADS_TABLE).update(rowPatch).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data ? mapRowToLead(data) : null;
}

export async function findLeadById(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(LEADS_TABLE).select('*').eq('id', String(id)).maybeSingle();
  if (error) throw error;
  return data ? mapRowToLead(data) : null;
}

export async function deleteLeadById(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(LEADS_TABLE).delete().eq('id', String(id)).select('id');
  if (error) throw error;
  return (data || []).length;
}

/**
 * Admin list. Search spans the CRM text the desk filters on, not just contacts.
 * `stage` filters the pipeline; `source` filters where the address came from.
 */
export async function listLeads({ source, stage, search, page = 1, limit = 20 } = {}) {
  const sb = requireSupabase();
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  let query = sb.from(LEADS_TABLE).select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (source) query = query.eq('source', source);
  if (stage) query = query.eq('stage', normaliseStage(stage));
  const q = sanitizeSearch(search);
  if (q) {
    const pat = `%${q}%`;
    query = query.or([`name.ilike.${pat}`, `email.ilike.${pat}`, `phone.ilike.${pat}`, `interest.ilike.${pat}`, `notes.ilike.${pat}`].join(','));
  }
  query = query.range((pg - 1) * lim, pg * lim - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? (data || []).length;
  return { data: (data || []).map(mapRowToLead), total, page: pg, pages: Math.ceil(total / lim) || 0 };
}

export default {
  LEADS_TABLE,
  LEAD_STAGES,
  normaliseStage,
  mapRowToLead,
  mapLeadToRow,
  createLead,
  findLeadByEmail,
  findLeadById,
  updateLeadById,
  deleteLeadById,
  listLeads,
};
