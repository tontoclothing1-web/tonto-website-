import { requireSupabase, isSupabaseConnected } from '../config/supabase.js';
import { CMS_TABLE, CMS_KEY, mapCmsRowToCamel, mapCmsCamelToRow } from '../models/CmsContent.js';
import { sendCached, del as cacheDel } from '../utils/cache.js';

// Singleton changes only via admin PUT — cache 5 min, invalidate on write.
const CMS_TTL_MS = 5 * 60 * 1000;

async function getOrCreateSiteRow(sb) {
  const { data, error } = await sb.from(CMS_TABLE).select('*').eq('key', CMS_KEY).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: created, error: insertError } = await sb
    .from(CMS_TABLE)
    .insert({ key: CMS_KEY })
    .select()
    .single();
  if (insertError) throw insertError;
  return created;
}

// GET /api/cms (public) — singleton site content
export const getCms = async (_req, res, next) => {
  try {
    return await sendCached(res, 'cms:site', CMS_TTL_MS, async () => {
      const sb = requireSupabase();
      const row = await getOrCreateSiteRow(sb);
      return mapCmsRowToCamel(row);
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/cms (admin) — partial update of singleton sections
export const updateCms = async (req, res, next) => {
  try {
    const sb = requireSupabase();
    await getOrCreateSiteRow(sb);
    const patch = mapCmsCamelToRow(req.body || {});
    delete patch.key;
    const { data, error } = await sb
      .from(CMS_TABLE)
      .update(patch)
      .eq('key', CMS_KEY)
      .select()
      .single();
    if (error) throw error;
    cacheDel('cms');
    res.json(mapCmsRowToCamel(data));
  } catch (err) {
    next(err);
  }
};
