import { requireSupabase } from '../config/supabase.js';

export const CMS_TABLE = 'cms_content';
export const CMS_CONTENT_TABLE = CMS_TABLE;
export const CMS_KEY = 'site';
export const SITE_KEY = CMS_KEY;

function asObject(v, fallback = {}) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  return fallback;
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

export function mapCmsRowToCamel(row) {
  if (!row) return null;
  const categoryCarousel = row.category_carousel ?? [];
  return {
    key: row.key ?? 'site',
    hero: asObject(row.hero),
    graphicBanner: asObject(row.graphic_banner),
    categoryCarousel: asArray(categoryCarousel),
    categories: asArray(categoryCarousel),
    lookbookBanner: asObject(row.lookbook_banner),
    aboutUs: asObject(row.about_us),
    tontoOwnMake: asObject(row.tonto_own_make),
    offerModal: asObject(row.offer_modal),
    shoppableLooks: asArray(row.shoppable_looks),
    updatedAt: row.updated_at,
  };
}

export function mapCmsCamelToRow(input = {}) {
  const row = {};
  if (input.key !== undefined) row.key = input.key;
  if (input.hero !== undefined) row.hero = input.hero;
  if (input.graphicBanner !== undefined) row.graphic_banner = input.graphicBanner;
  else if (input.graphic_banner !== undefined) row.graphic_banner = input.graphic_banner;
  if (input.categoryCarousel !== undefined) row.category_carousel = input.categoryCarousel;
  else if (input.categories !== undefined) row.category_carousel = input.categories;
  else if (input.category_carousel !== undefined) row.category_carousel = input.category_carousel;
  if (input.lookbookBanner !== undefined) row.lookbook_banner = input.lookbookBanner;
  else if (input.lookbook_banner !== undefined) row.lookbook_banner = input.lookbook_banner;
  if (input.aboutUs !== undefined) row.about_us = input.aboutUs;
  else if (input.about_us !== undefined) row.about_us = input.about_us;
  if (input.tontoOwnMake !== undefined) row.tonto_own_make = input.tontoOwnMake;
  else if (input.tonto_own_make !== undefined) row.tonto_own_make = input.tonto_own_make;
  if (input.offerModal !== undefined) row.offer_modal = input.offerModal;
  else if (input.offer_modal !== undefined) row.offer_modal = input.offer_modal;
  if (input.shoppableLooks !== undefined) row.shoppable_looks = input.shoppableLooks;
  else if (input.shoppable_looks !== undefined) row.shoppable_looks = input.shoppable_looks;
  return row;
}

export async function getCmsContentRow(key = CMS_KEY) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(CMS_TABLE).select('*').eq('key', key).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCmsContent(key = CMS_KEY) {
  return mapCmsRowToCamel(await getCmsContentRow(key));
}

export async function ensureCmsContentRow(key = CMS_KEY) {
  const existing = await getCmsContentRow(key);
  if (existing) return existing;
  const sb = requireSupabase();
  const { data, error } = await sb.from(CMS_TABLE).insert({ key }).select().single();
  if (error) throw error;
  return data;
}

export async function upsertCmsContentRow(patch, key = CMS_KEY) {
  const sb = requireSupabase();
  const row = { ...mapCmsCamelToRow(patch), key };
  delete row.key;
  const existing = await getCmsContentRow(key);
  if (!existing) {
    const { data, error } = await sb.from(CMS_TABLE).insert({ key, ...row }).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await sb
    .from(CMS_TABLE)
    .update(row)
    .eq('key', key)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertCmsContent(patch, key = CMS_KEY) {
  return mapCmsRowToCamel(await upsertCmsContentRow(patch, key));
}

export default {
  CMS_TABLE,
  CMS_CONTENT_TABLE,
  CMS_KEY,
  SITE_KEY,
  mapCmsRowToCamel,
  mapCmsCamelToRow,
  getCmsContentRow,
  getCmsContent,
  ensureCmsContentRow,
  upsertCmsContentRow,
  upsertCmsContent,
};
