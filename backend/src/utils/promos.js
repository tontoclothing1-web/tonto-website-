/**
 * Promo validation + redemption. One engine for the whole API.
 *
 * History: `validatePromo()` here (used by cart sync, order creation and
 * claim-offer) only checked `active`, while `isPromoUsableRow()` in
 * models/Promo.js (used only by POST /api/promos/validate) also checked
 * `expires_at` and `usage_limit`. A code that the validate endpoint rejected as
 * expired was still accepted at checkout, and `percentFromEntry()` silently
 * turned an unknown label into 15% off. Both paths now share this file, and
 * `models/Promo.js` re-exports from it.
 *
 * Canonical defaults mirror CheckoutPage.jsx + AdminDashboard.jsx seed:
 *   TONTO15   → 15% (welcome privilege)
 *   TONTOVIP  → 20% (private drop access)
 *   ARCHIVE10 → 10% (return customer)
 * Admin-managed promos live in the Supabase `promos` table and take precedence.
 */

import { isSupabaseConnected, requireSupabase } from '../config/supabase.js';
import { getOrSet, del as cacheDel } from './cache.js';

// Hot pricing inputs change rarely — cache 60s so cart-sync / order-create
// don't pay 2x Supabase roundtrips on every checkout.
const PROMOS_TTL_MS = 60 * 1000;
const SETTINGS_TTL_MS = 60 * 1000;

export function invalidatePricingCache() {
  cacheDel('promos');
  cacheDel('promos:all');
  cacheDel('store-settings');
  // store.routes.js caches the public store payload under its own key.
  cacheDel('store:info');
}

export const DEFAULT_PROMOS = Object.freeze([
  { code: 'TONTO15', discount: '15% OFF', discountText: '15% OFF', percent: 15, active: true },
  { code: 'TONTOVIP', discount: '20% OFF', discountText: '20% OFF', percent: 20, active: true },
  { code: 'ARCHIVE10', discount: '10% OFF', discountText: '10% OFF', percent: 10, active: true },
]);

export const WELCOME_PROMO_CODE = 'TONTO15';

const REASONS = {
  unknown: 'Promo code is not recognized.',
  inactive: 'Promo code is currently inactive.',
  expired: 'Promo code has expired.',
  usage_limit_reached: 'Promo code has reached its usage limit.',
  invalid_percent: 'Promo code is misconfigured (no discount percentage).',
};

/**
 * Discount percentage, resolved strictly.
 * Only an explicit numeric `percent`, or a "15% OFF"-style label, is trusted.
 * Never guess: a promo row with a broken label must fail closed rather than
 * hand out 15% because the fallback said so.
 */
export function percentFromEntry(entry) {
  const explicit = Number(entry?.percent);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(Math.floor(explicit), 100);
  const label = String(entry?.discount ?? entry?.discountText ?? entry?.discount_text ?? '');
  const m = label.match(/(\d{1,3})\s*%/);
  if (m) {
    const pct = parseInt(m[1], 10);
    if (pct > 0 && pct <= 100) return pct;
  }
  return 0;
}

function usableChecks(entry) {
  if (!entry) return 'unknown';
  if (entry.active === false) return 'inactive';
  const expires = entry.expiresAt ?? entry.expires_at;
  if (expires && new Date(expires).getTime() < Date.now()) return 'expired';
  const limit = entry.usageLimit ?? entry.usage_limit;
  if (limit != null && Number(entry.uses ?? 0) >= Number(limit)) return 'usage_limit_reached';
  return null;
}

/**
 * Validate a promo code (case-insensitive) without consuming it.
 * @returns {{ ok: true, promo: { code, discountText, percent } } | { ok: false, error, reason }}
 */
export function validatePromo(code, promoList = []) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return { ok: false, reason: 'unknown', error: 'Promo code is required.' };

  const list = Array.isArray(promoList) && promoList.length > 0 ? promoList : DEFAULT_PROMOS;
  const match = list.find((p) => String(p?.code || '').toUpperCase() === clean);
  if (!match) return { ok: false, reason: 'unknown', error: REASONS.unknown };

  const broken = usableChecks(match);
  if (broken) return { ok: false, reason: broken, error: REASONS[broken] };

  const percent = percentFromEntry(match);
  if (percent <= 0) return { ok: false, reason: 'invalid_percent', error: REASONS.invalid_percent };

  return {
    ok: true,
    promo: {
      code: match.code,
      discountText: match.discount || match.discountText || `${percent}% OFF`,
      percent,
    },
  };
}

/** models/Promo.js compatibility shape: `{ valid, reason }`. */
export function promoUsability(code, promoList = []) {
  const result = validatePromo(code, promoList);
  return result.ok ? { valid: true, promo: result.promo } : { valid: false, reason: result.reason };
}

/** Validate against the live admin promo list without consuming a use. */
export async function validatePromoByCode(code) {
  return validatePromo(code, await loadAdminPromos());
}

function mapPromoRowToUtil(row) {
  const discountText = row.discount_text ?? row.discountText ?? row.discount ?? '';
  return {
    code: row.code,
    discount: discountText,
    discountText,
    percent: row.percent,
    active: row.active,
    expiresAt: row.expires_at ?? row.expiresAt ?? null,
    usageLimit: row.usage_limit ?? row.usageLimit ?? null,
    uses: row.uses ?? 0,
  };
}

/** Supabase-backed lookup of admin-managed promos — cached 60s, falls back to built-ins. */
export async function loadAdminPromos() {
  try {
    if (!isSupabaseConnected()) return DEFAULT_PROMOS;
    const { value } = await getOrSet('promos:all', PROMOS_TTL_MS, async () => {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from('promos')
        .select('code,discount_text,percent,active,expires_at,usage_limit,uses');
      if (error || !data || data.length === 0) return DEFAULT_PROMOS;
      return data.map(mapPromoRowToUtil);
    });
    return value;
  } catch {
    return DEFAULT_PROMOS;
  }
}

/**
 * Validate AND consume one use of a promo code.
 *
 * Uses the `claim_promo_use()` Postgres function from
 * supabase/migration_003_security_and_integrity.sql: it locks the row, so two
 * concurrent checkouts cannot both take the last unit of a capped promo, and it
 * bumps `uses` exactly once. Before that migration is applied we degrade to a
 * cached lookup + read-modify-write (still correct for a single instance, just
 * racy under load) and say so loudly in the log.
 *
 * @returns {Promise<{ ok: true, promo } | { ok: false, reason, error }>}
 */
export async function redeemPromoCode(code) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return { ok: false, reason: 'unknown', error: 'Promo code is required.' };

  if (isSupabaseConnected()) {
    try {
      const sb = requireSupabase();
      const { data, error } = await sb.rpc('claim_promo_use', { p_code: clean });
      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0];
        if (!row.ok) {
          const reason = row.reason || 'unknown';
          return { ok: false, reason, error: REASONS[reason] || REASONS.unknown };
        }
        const percent = Number(row.percent) || 0;
        if (percent <= 0) return { ok: false, reason: 'invalid_percent', error: REASONS.invalid_percent };
        return { ok: true, promo: { code: clean, discountText: `${percent}% OFF`, percent }, consumed: true };
      }
      // 42883 / PGRST202 = function missing → migration_003 not applied yet.
      if (error && !/does not exist|schema cache|PGRST202|42883/i.test(`${error.code || ''} ${error.message || ''}`)) {
        throw error;
      }
      console.warn('[promos] claim_promo_use() unavailable — run supabase/migration_003_security_and_integrity.sql. Falling back to non-atomic redemption.');
    } catch (err) {
      console.warn('[promos] rpc failed, falling back to list validation:', err?.message || err);
    }
  }

  // Fallback path: no atomic claim, but the same rules are enforced.
  const result = validatePromo(clean, await loadAdminPromos());
  if (!result.ok) return result;
  try {
    if (isSupabaseConnected()) {
      const sb = requireSupabase();
      const { data: row } = await sb
        .from('promos')
        .select('uses')
        .eq('code', clean)
        .maybeSingle();
      if (row) await sb.from('promos').update({ uses: Number(row.uses ?? 0) + 1 }).eq('code', clean);
    }
  } catch {
    // A counter that fails to increment must not block a legitimate order.
  }
  return { ...result, consumed: false };
}

/** Undo a redemption when the order fails after the code was consumed. */
export async function releasePromoRedemption(code) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return;
  cacheDel(`promos:validate:${clean}`);
  cacheDel(`promos:validate:${clean.toLowerCase()}`);
  try {
    if (!isSupabaseConnected()) return;
    const sb = requireSupabase();
    const { error } = await sb.rpc('release_promo_use', { p_code: clean });
    if (error) {
      const { data: row } = await sb.from('promos').select('uses').eq('code', clean).maybeSingle();
      if (row) await sb.from('promos').update({ uses: Math.max(Number(row.uses ?? 0) - 1, 0) }).eq('code', clean);
    }
  } catch {
    /* best effort */
  }
}

/** Supabase-backed StoreSettings lookup — cached 60s, null when unavailable. */
export async function loadStoreSettings() {
  try {
    if (!isSupabaseConnected()) return null;
    const { value } = await getOrSet('store-settings:singleton', SETTINGS_TTL_MS, async () => {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from('store_settings')
        .select('key,store_name,store_location,whatsapp_phone,instagram_handle,announcement_text,free_shipping_threshold')
        .eq('key', 'store')
        .maybeSingle();
      if (error || !data) return null;
      return {
        key: data.key ?? 'store',
        storeName: data.store_name ?? 'TONTO Clothing',
        storeLocation: data.store_location ?? '',
        whatsappPhone: data.whatsapp_phone ?? '',
        instagramHandle: data.instagram_handle ?? '',
        announcementText: data.announcement_text ?? '',
        freeShippingThreshold: data.free_shipping_threshold ?? '₹2,500',
      };
    });
    return value;
  } catch {
    return null;
  }
}

export default {
  DEFAULT_PROMOS,
  WELCOME_PROMO_CODE,
  percentFromEntry,
  validatePromo,
  validatePromoByCode,
  promoUsability,
  loadAdminPromos,
  loadStoreSettings,
  redeemPromoCode,
  releasePromoRedemption,
  invalidatePricingCache,
};
