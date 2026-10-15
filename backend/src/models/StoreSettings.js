import { requireSupabase } from '../config/supabase.js';

export const STORE_SETTINGS_TABLE = 'store_settings';
export const STORE_TABLE = STORE_SETTINGS_TABLE;
export const STORE_KEY = 'store';

export function mapStoreSettingsRowToCamel(row) {
  if (!row) return null;
  return {
    key: row.key ?? 'store',
    storeName: row.store_name ?? 'TONTO Clothing',
    storeLocation:
      row.store_location ??
      'Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India',
    whatsappPhone: row.whatsapp_phone ?? '+91 82483 21214',
    instagramHandle: row.instagram_handle ?? '@tonto_clothing_',
    announcementText: row.announcement_text ?? '',
    freeShippingThreshold: row.free_shipping_threshold ?? '₹2,500',
    updatedAt: row.updated_at,
  };
}

export function mapStoreSettingsCamelToRow(input = {}) {
  const row = {};
  if (input.key !== undefined) row.key = input.key;
  if (input.storeName !== undefined) row.store_name = input.storeName;
  else if (input.store_name !== undefined) row.store_name = input.store_name;
  if (input.storeLocation !== undefined) row.store_location = input.storeLocation;
  else if (input.store_location !== undefined) row.store_location = input.store_location;
  if (input.whatsappPhone !== undefined) row.whatsapp_phone = input.whatsappPhone;
  else if (input.whatsapp_phone !== undefined) row.whatsapp_phone = input.whatsapp_phone;
  if (input.instagramHandle !== undefined) row.instagram_handle = input.instagramHandle;
  else if (input.instagram_handle !== undefined) row.instagram_handle = input.instagram_handle;
  if (input.announcementText !== undefined) row.announcement_text = input.announcementText;
  else if (input.announcement_text !== undefined) row.announcement_text = input.announcement_text;
  if (input.freeShippingThreshold !== undefined) row.free_shipping_threshold = input.freeShippingThreshold;
  else if (input.free_shipping_threshold !== undefined) {
    row.free_shipping_threshold = input.free_shipping_threshold;
  }
  return row;
}

export async function getStoreSettingsRow(key = STORE_KEY) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(STORE_SETTINGS_TABLE).select('*').eq('key', key).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getStoreSettings(key = STORE_KEY) {
  return mapStoreSettingsRowToCamel(await getStoreSettingsRow(key));
}

export async function ensureStoreSettingsRow(key = STORE_KEY) {
  const existing = await getStoreSettingsRow(key);
  if (existing) return existing;
  const sb = requireSupabase();
  const { data, error } = await sb.from(STORE_SETTINGS_TABLE).insert({ key }).select().single();
  if (error) throw error;
  return data;
}

export async function upsertStoreSettingsRow(patch, key = STORE_KEY) {
  const sb = requireSupabase();
  const row = { ...mapStoreSettingsCamelToRow(patch) };
  delete row.key;
  const existing = await getStoreSettingsRow(key);
  if (!existing) {
    const { data, error } = await sb
      .from(STORE_SETTINGS_TABLE)
      .insert({ key, ...row })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await sb
    .from(STORE_SETTINGS_TABLE)
    .update(row)
    .eq('key', key)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertStoreSettings(patch, key = STORE_KEY) {
  return mapStoreSettingsRowToCamel(await upsertStoreSettingsRow(patch, key));
}

export default {
  STORE_SETTINGS_TABLE,
  STORE_TABLE,
  STORE_KEY,
  mapStoreSettingsRowToCamel,
  mapStoreSettingsCamelToRow,
  getStoreSettingsRow,
  getStoreSettings,
  ensureStoreSettingsRow,
  upsertStoreSettingsRow,
  upsertStoreSettings,
};
