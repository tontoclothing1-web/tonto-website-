/**
 * Cart controller (Supabase).
 * Merges the frontend localStorage bag with server truth persisted in the
 * `carts` table (one row per user_id or per guest device_id).
 * POST /api/cart/sync validates, normalises (id+size merge, qty sum, price
 * canonicalisation) and re-quotes with the exact CheckoutPage.jsx pricing
 * rules. Guests OK — deviceId comes from the body or the x-device-id header.
 * Every line must resolve against the `products` table, so this router needs
 * Supabase (503 when it is down) — a bag priced from nothing is not a bag.
 *
 * Body validation lives in routes/cart.routes.js (+ the `validate` middleware).
 */
import { requireSupabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/auth.js';
import { quoteCart } from '../utils/pricing.js';
import { validatePromoByCode, loadStoreSettings } from '../utils/promos.js';
import { findCheckoutRows } from '../models/Product.js';

const CARTS_TABLE = 'carts';

const keyOf = (i) => `${i?.productId || i?.id || i?.title || 'piece'}__${i?.size || 'M'}`;

/**
 * Merge a bag into canonical (productId, size) lines **at catalogue prices**.
 *
 * The old version kept `raw.numericPrice` (or parsed the `price` string) from the
 * request, so a tampered bag persisted a fake subtotal and the checkout quote
 * agreed with it. Anything not resolvable in `products` is dropped and reported
 * in `removed` instead of silently pricing to the 2490 fallback.
 */
async function normalizeBag(items = []) {
  const merged = new Map();
  const removed = [];
  const pending = [];

  for (const raw of items || []) {
    if (!raw) continue;
    const key = keyOf(raw);
    const qty = Math.max(1, Math.min(20, Math.floor(Number(raw.quantity) || 1)));
    const productId = raw.productId || raw.id || null;
    if (!productId) {
      removed.push({ productId: null, title: raw?.title || null, reason: 'Item does not reference a catalogue product.' });
      continue;
    }
    pending.push({ raw, key, qty, productId });
  }

  const rows = await findCheckoutRows(pending.map((p) => p.productId));
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(String(row.slug).toLowerCase(), row);
    byKey.set(String(row.id), row);
  }

  for (const { raw, key, qty, productId } of pending) {
    const row = byKey.get(String(productId).toLowerCase()) || byKey.get(String(productId));
    if (!row) {
      removed.push({ productId, title: raw?.title || null, reason: 'No longer in the catalogue.' });
      continue;
    }
    if (row.active === false) {
      removed.push({ productId, title: row.title, reason: 'No longer on sale.' });
      continue;
    }
    const numericPrice = Number(row.numeric_price ?? 0);
    if (!(numericPrice > 0)) {
      removed.push({ productId, title: row.title, reason: 'Not priced yet.' });
      continue;
    }

    const line = {
      productId: row.id,
      id: row.slug,
      slug: row.slug,
      title: row.title,
      colour: String(raw.colour ?? 'Standard').slice(0, 80),
      size: String(raw.size ?? 'M').slice(0, 40),
      price: `₹${numericPrice.toLocaleString('en-IN')}`,
      numericPrice,
      image: String(raw.image || (Array.isArray(row.images) ? row.images[0] : '') || '').slice(0, 500),
      quantity: qty,
    };
    const prev = merged.get(key);
    if (prev) {
      prev.quantity = Math.min(20, prev.quantity + qty);
    } else {
      merged.set(key, line);
    }
  }

  return { bag: [...merged.values()], removed };
}

/** Null when Supabase is unconfigured — callers fall back to stateless mode. */
function getSb() {
  try {
    return requireSupabase();
  } catch {
    return null;
  }
}

/**
 * Guest bag scope. The storefront keeps a per-device bag, so `GET /api/cart`
 * has to find it too — query string for reads, body/header for writes.
 * Truncated to the schema's column width so a padded string cannot be used to
 * probe for (or squat on) another device's row.
 */
function deviceIdOf(req) {
  const raw = String(req.body?.deviceId || req.query?.deviceId || req.headers?.['x-device-id'] || '').trim();
  return raw.slice(0, 80) || null;
}

async function loadBag(req) {
  const sb = getSb();
  if (!sb) return null;
  try {
    if (req.user?.id) {
      const { data, error } = await sb.from(CARTS_TABLE).select('items').eq('user_id', req.user.id).maybeSingle();
      if (error) return null;
      return Array.isArray(data?.items) ? data.items : null;
    }
    const deviceId = deviceIdOf(req);
    if (!deviceId) return null;
    const { data, error } = await sb.from(CARTS_TABLE).select('items').eq('device_id', deviceId).maybeSingle();
    if (error) return null;
    return Array.isArray(data?.items) ? data.items : null;
  } catch {
    return null;
  }
}

async function persistBag(req, bag) {
  const sb = getSb();
  if (!sb) return false;
  try {
    // Single roundtrip upsert (unique(user_id) / unique(device_id) in schema).
    if (req.user?.id) {
      const { error } = await sb
        .from(CARTS_TABLE)
        .upsert(
          { user_id: req.user.id, device_id: null, items: bag, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      return !error;
    }
    const deviceId = deviceIdOf(req);
    if (!deviceId) return false;
    const { error } = await sb
      .from(CARTS_TABLE)
      .upsert(
        { user_id: null, device_id: deviceId, items: bag, updated_at: new Date().toISOString() },
        { onConflict: 'device_id' }
      );
    return !error;
  } catch {
    return false;
  }
}

export const getCart = asyncHandler(async (req, res) => {
  const { bag, removed } = await normalizeBag((await loadBag(req)) || []);
  const quote = quoteCart({ items: bag });
  res.json({ success: true, data: { items: bag, removed, ...quote, persisted: bag.length > 0 } });
});

export const syncCart = asyncHandler(async (req, res) => {
  const { bag: clientBag, removed } = await normalizeBag(req.body?.items || []);
  // `mode: 'replace'` (what the storefront sends) makes the client bag the whole
  // bag, so removing a line on one tab stays removed. The default merge keeps
  // the older behaviour for callers that only ever push additions.
  const replace = req.body?.mode === 'replace';
  const serverBagRaw = replace ? [] : (await loadBag(req)) || [];
  // Re-priced from the catalogue either way — a stored bag can be days old.
  const { bag, removed: serverRemoved } = await normalizeBag([...serverBagRaw, ...clientBag]);

  let promo = null;
  if (req.body?.promoCode) {
    // Validation only — a promo use is consumed at POST /api/orders.
    const result = await validatePromoByCode(req.body.promoCode);
    if (!result.ok) return res.status(400).json({ success: false, reason: result.reason, message: result.error });
    promo = result.promo;
  }

  const storeSettings = await loadStoreSettings();
  const quote = quoteCart({ items: bag, promo, deliveryMethod: req.body?.deliveryMethod, storeSettings });

  const persisted = await persistBag(req, bag);

  res.json({
    success: true,
    data: {
      items: bag,
      removed: [...removed, ...serverRemoved],
      ...quote,
      persisted,
      itemCount: bag.reduce((a, i) => a + i.quantity, 0),
    },
  });
});
