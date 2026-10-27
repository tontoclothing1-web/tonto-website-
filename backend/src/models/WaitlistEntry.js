/**
 * WaitlistEntry — Supabase DAO.
 * Replaces the Mongoose WaitlistEntry model. Table: waitlist_entries
 *   (id, drop_name, name, phone, email, size).
 */
import { requireSupabase } from '../config/supabase.js';

export const WAITLIST_TABLE = 'waitlist_entries';

/** DB row (snake_case) → API object (camelCase). */
export function mapRowToWaitlistEntry(row = {}) {
  return {
    id: row.id,
    dropName: row.drop_name ?? 'Private Drop 01',
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    size: row.size ?? 'M',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** API object (camelCase) → DB row (snake_case) for inserts. */
export function mapWaitlistEntryToRow(doc = {}) {
  return {
    drop_name: doc.dropName ?? doc.drop_name ?? 'Private Drop 01',
    name: doc.name ?? '',
    phone: doc.phone ?? '',
    email: doc.email ? String(doc.email).trim().toLowerCase() : '',
    size: doc.size ?? 'M',
  };
}

export async function createWaitlistEntry(data) {
  const sb = requireSupabase();
  const { data: row, error } = await sb.from(WAITLIST_TABLE).insert(mapWaitlistEntryToRow(data)).select().single();
  if (error) throw error;
  return mapRowToWaitlistEntry(row);
}

/** Duplicate check: (drop_name, email) when an email exists, else (drop_name, name, phone). */
export async function findWaitlistEntry({ dropName, email = '', name = '', phone = '' } = {}) {
  const sb = requireSupabase();
  let query = sb.from(WAITLIST_TABLE).select('*').eq('drop_name', dropName);
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanEmail) {
    query = query.ilike('email', cleanEmail);
  } else {
    query = query.eq('name', String(name || '')).eq('phone', String(phone || ''));
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapRowToWaitlistEntry(data) : null;
}

export async function listWaitlistEntries({ dropName } = {}) {
  const sb = requireSupabase();
  let query = sb.from(WAITLIST_TABLE).select('*').order('created_at', { ascending: false });
  if (dropName) query = query.eq('drop_name', dropName);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRowToWaitlistEntry);
}

export default { WAITLIST_TABLE, mapRowToWaitlistEntry, mapWaitlistEntryToRow, createWaitlistEntry, findWaitlistEntry, listWaitlistEntries };
