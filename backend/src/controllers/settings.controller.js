import { requireSupabase, isSupabaseConnected } from '../config/supabase.js';
import {
  STORE_SETTINGS_TABLE,
  STORE_KEY,
  mapStoreSettingsRowToCamel,
  mapStoreSettingsCamelToRow,
} from '../models/StoreSettings.js';
import { sendCached, del as cacheDel } from '../utils/cache.js';
import { invalidatePricingCache } from '../utils/promos.js';
import ApiError from '../utils/ApiError.js';

// Singleton changes only via admin PUT — cache 5 min, invalidate on write.
const SETTINGS_TTL_MS = 5 * 60 * 1000;

async function getOrCreateStoreRow(sb) {
  const { data, error } = await sb
    .from(STORE_SETTINGS_TABLE)
    .select('*')
    .eq('key', STORE_KEY)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: created, error: insertError } = await sb
    .from(STORE_SETTINGS_TABLE)
    .insert({ key: STORE_KEY })
    .select()
    .single();
  if (insertError) throw insertError;
  return created;
}

// GET /api/settings (public)
export const getSettings = async (_req, res, next) => {
  try {
    return await sendCached(res, 'store-settings:api', SETTINGS_TTL_MS, async () => {
      const sb = requireSupabase();
      const row = await getOrCreateStoreRow(sb);
      return mapStoreSettingsRowToCamel(row);
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings (admin)
export const updateSettings = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    await getOrCreateStoreRow(sb);
    const patch = mapStoreSettingsCamelToRow(req.body || {});
    delete patch.key;
    if (Object.keys(patch).length === 0) {
      // An empty .update({}) is a PostgREST error (500) rather than a no-op.
      return next(ApiError.badRequest('Nothing to update — no known settings fields in the payload.'));
    }
    const { data, error } = await sb
      .from(STORE_SETTINGS_TABLE)
      .update(patch)
      .eq('key', STORE_KEY)
      .select()
      .single();
    if (error) throw error;
    cacheDel('store-settings');
    invalidatePricingCache(); // free-shipping threshold feeds checkout quotes
    res.json(mapStoreSettingsRowToCamel(data));
  } catch (err) {
    next(err);
  }
};
