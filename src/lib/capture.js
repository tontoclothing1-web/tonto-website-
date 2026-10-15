// TONTO storefront — write-behind capture layer.
//
// Every customer-facing form (checkout, enquiry, offer claim, waitlist,
// newsletter) used to write ONLY to localStorage, which meant the owner never
// saw an order placed from another device. Each write now goes to the API
// first and mirrors into the same `tonto_admin_*` keys AdminDashboard reads:
//
//   • the API is the source of truth whenever it is reachable;
//   • the storefront keeps working with the backend offline (dev, bad network,
//     a deploy mid-rollout) instead of showing a dead form;
//   • the dashboard does not have to be rewritten in one pass.
//
// Nothing here throws. Callers get `{ ok, source, data, error }` and decide how
// loudly to tell the user ("recorded" vs "saved on this device").

import { getDeviceId, getToken, API_BASE } from './api.js';

// After a few consecutive connection failures, stop knocking for a while: a
// storefront with no backend should not fire a failing request per keystroke.
const FAIL_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;
let consecutiveFailures = 0;
let cooldownUntil = 0;

export function backendLikelyDown() {
  return consecutiveFailures >= FAIL_THRESHOLD && Date.now() < cooldownUntil;
}

function noteFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= FAIL_THRESHOLD) cooldownUntil = Date.now() + COOLDOWN_MS;
}

function noteSuccess() {
  consecutiveFailures = 0;
  cooldownUntil = 0;
}

async function call(path, { method = 'POST', body, headers = {} } = {}) {
  if (backendLikelyDown()) {
    return { ok: false, skipped: true, error: 'Backend in cooldown — using on-device storage.' };
  }
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    noteFailure();
    return { ok: false, offline: true, error: `Cannot reach the store API: ${err.message}` };
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html') || res.status === 405 || res.status === 404) {
    noteFailure();
    return {
      ok: false,
      offline: true,
      rejected: false,
      error: 'Store API not reachable on this host — saved locally on this device.',
    };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    // A 4xx (400, 422, etc.) from an actual JSON API means the backend is alive
    // and gave a specific business rejection.
    if (res.status < 500) noteSuccess();
    else noteFailure();
    return {
      ok: false,
      status: res.status,
      rejected: res.status < 500,
      error: payload?.message || `Request failed (${res.status})`,
      data: payload,
    };
  }

  noteSuccess();
  return { ok: true, source: 'api', data: payload };
}

// ---------- localStorage mirroring (what AdminDashboard still reads) ----------
export function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Push a record to a `tonto_admin_*` list, capped so Safari's ~5 MB quota is
 *  not slowly eaten by an ever-growing order log. `append: true` keeps the
 *  insert order of lists the dashboard already reads top-down (subscribers). */
export function mirror(key, record, { max = 300, match = 'id', append = false } = {}) {
  try {
    const list = readList(key);
    const idx = match && record?.[match] ? list.findIndex((r) => r?.[match] === record[match]) : -1;
    if (idx > -1) list.splice(idx, 1);
    if (append) list.push(record);
    else list.unshift(record);
    localStorage.setItem(key, JSON.stringify(list.slice(append ? -max : 0, append ? undefined : max)));
    window.dispatchEvent(new Event('tonto-data-updated'));
  } catch {
    /* private mode / quota — the API copy is the one that matters */
  }
  return record;
}

export function mirrorMerge(key, updater) {
  try {
    const list = readList(key);
    localStorage.setItem(key, JSON.stringify(updater(list) || list));
    window.dispatchEvent(new Event('tonto-data-updated'));
  } catch {
    /* see mirror() */
  }
}

// ---------- orders ----------
/**
 * Ask the server what the bag actually costs. Prices, stock and promo uses are
 * resolved from the catalogue there; the numbers below are what the customer
 * will be charged, not what this device claims.
 */
export async function quoteOrder({ items, promoCode, deliveryMethod }) {
  return call('/orders/quote', {
    body: {
      items: bagPayload(items),
      promoCode: promoCode || undefined,
      deliveryMethod,
    },
  });
}

/**
 * Place the order. `clientRequestId` makes the submit idempotent, so a double
 * tap / a retry after a dropped connection cannot create two showroom holds.
 */
export async function placeOrder({ items, customer, promoCode, deliveryMethod, notes, clientRequestId }) {
  return call('/orders', {
    body: {
      items: bagPayload(items),
      customer,
      promoCode: promoCode || undefined,
      deliveryMethod,
      notes,
      clientRequestId,
      deviceId: getDeviceId(),
    },
    headers: clientRequestId ? { 'Idempotency-Key': clientRequestId } : {},
  });
}

// The API only reads productId + quantity (+ size/colour); prices are ignored.
function bagPayload(items = []) {
  return items.map((item) => ({
    productId: item.productId || item.id || item.slug,
    title: item.title,
    size: item.size || 'M',
    colour: item.colour || 'Standard',
    quantity: Number(item.quantity) || 1,
    image: item.image || item.images?.[0] || '',
  }));
}

export function newClientRequestId() {
  const rand =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `web-${rand}`;
}

// ---------- everything else ----------
export const submitEnquiry = (payload) => call('/enquiries', { body: payload });

export const submitOfferClaim = ({ name, email, phone, source }) =>
  call('/leads/claim-offer', { body: { name, email, phone, source } });

export const submitWaitlist = ({ dropName, name, email, phone, size }) =>
  call('/leads/waitlist', { body: { dropName, name, email, phone, size } });

export const submitNewsletter = ({ email, name = '', source = 'Footer Drop Alerts' }) =>
  call('/leads/claim-offer', { body: { email, name, source } });

export const validatePromoCode = (code) => call('/promos/validate', { body: { code } });

export const cancelOrder = (orderId) => call(`/orders/${encodeURIComponent(orderId)}/cancel`, { body: {} });

export default {
  quoteOrder,
  placeOrder,
  submitEnquiry,
  submitOfferClaim,
  submitWaitlist,
  submitNewsletter,
  validatePromoCode,
  cancelOrder,
  mirror,
  mirrorMerge,
  readList,
  newClientRequestId,
  backendLikelyDown,
};
