// TONTO Clothing — API client (Agent 5: engagement & integration glue).
// Fetch-based (no new dependencies). Base URL + JWT come from env/localStorage.
//
// Every path below mirrors backend/src/routes/*.routes.js. Keep this list honest:
// a call to an endpoint that does not exist is silently caught by the
// storefront and looks like "the backend is down".
//
// Base URL resolution, shared with lib/capture.js:
//   VITE_API_URL=http://localhost:5000/api   (dev, see .env.example)
//   unset                                    -> same-origin /api (production
//                                               behind the deploy proxy)
//
//   localStorage[tonto_auth_token]           — JWT set on login
//   localStorage[tonto_device_id]            — guest id for wishlist/cart sync
//
// Drop-in usage:
//   import { api, wishlist, looks, storeInfo } from './lib/api.js';
//   const { data } = await wishlist.list();

export const API_BASE = (import.meta.env?.VITE_API_URL || '/api').replace(/\/+$/, '');
const TOKEN_KEY = 'tonto_auth_token';
const DEVICE_KEY = 'tonto_device_id';

// ---------- token + device helpers ----------
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* private-mode */ }
}

export function clearToken() {
  setToken('');
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        globalThis.crypto?.randomUUID?.() ||
        `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `guest-${Date.now().toString(36)}`;
  }
}

// ---------- core request ----------
export async function request(path, { method = 'GET', body, auth = true, query } = {}) {
  let url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (query && typeof query === 'object') {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Network error reaching ${url}: ${err.message}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const err = new Error(`API endpoint not reachable (${res.status})`);
    err.status = res.status === 200 ? 503 : res.status;
    err.payload = null;
    throw err;
  }
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message = payload?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

// ---------- auth (backend/src/routes/auth.routes.js) ----------
export const auth = {
  register: (body) => api.post('/auth/register', body, { auth: false }),
  login: (body) => api.post('/auth/login', body, { auth: false }),
  me: () => api.get('/auth/me'),
  logout: () => clearToken(),
  updateProfile: (body) => api.put('/auth/profile', body),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }, { auth: false }),
  // Owner passcode -> { token, user:{ role:'admin' } }. Rate-limited server-side.
  adminLogin: (passcode) => api.post('/auth/admin/login', { passcode }, { auth: false }),
};

// ---------- products (owner: catalog agent) ----------
export const products = {
  list: (query) => api.get('/products', { query, auth: false }),
  get: (id) => api.get(`/products/${encodeURIComponent(id)}`, { auth: false }),
};

// ---------- cart sync (backend/src/routes/cart.routes.js: GET /, POST /sync) ----------
// The server keeps the authoritative bag for a logged-in shopper; the browser
// copy (tonto_bag_items) stays as the offline draft. Guests are scoped by
// deviceId, so the bag follows the shopper across tabs on the same browser.
export const cart = {
  get: () => api.get('/cart', { query: { deviceId: getDeviceId() } }),
  // 'replace' (default here) makes the pushed bag the whole bag — the route's
  // merge mode would resurrect lines the shopper just removed.
  sync: (items, { mode = 'replace', promoCode, deliveryMethod } = {}) =>
    api.post('/cart/sync', {
      items,
      deviceId: getDeviceId(),
      mode,
      ...(promoCode ? { promoCode } : {}),
      ...(deliveryMethod ? { deliveryMethod } : {}),
    }),
  // No DELETE /cart route — clearing is a sync with an empty bag.
  clear: () => cart.sync([], { mode: 'replace' }),
};

// ---------- orders (owner: orders agent) ----------
export const orders = {
  create: (body) => api.post('/orders', body),
  quote: (body) => api.post('/orders/quote', body, { auth: false }),
  mine: () => api.get('/orders/my'),
  get: (id) => api.get(`/orders/${encodeURIComponent(id)}`),
  cancel: (id) => api.post(`/orders/${encodeURIComponent(id)}/cancel`, {}),
};

// ---------- wishlist (Agent 5) — replaces localStorage tonto_saved_items ----------
// Guest callers automatically attach ?deviceId; authed callers send the JWT.
export const wishlist = {
  list: (deviceId) =>
    api.get('/wishlist', { query: { deviceId: deviceId || getDeviceId() } }),
  add: (productId, deviceId) =>
    api.post('/wishlist', { productId, deviceId: deviceId || getDeviceId() }),
  remove: (productId, deviceId) =>
    api.delete(`/wishlist/${encodeURIComponent(productId)}`, {
      query: { deviceId: deviceId || getDeviceId() },
    }),
  // There is no bulk-delete route — emptying the shortlist is one DELETE per id.
  clear: async (deviceId) => {
    const id = deviceId || getDeviceId();
    const current = await wishlist.list(id);
    const ids = (current?.data || []).map((row) => row.productId).filter(Boolean);
    for (const productId of ids) {
      try {
        await wishlist.remove(productId, id);
      } catch (err) {
        if (err.status !== 404) throw err;
      }
    }
    return { removed: ids.length };
  },
  // One-shot migration: push every locally saved id to the server. Saving an
  // already-saved piece answers 200 { alreadySaved }, so this is safe to retry.
  migrateFromLocal: async (productIds) => {
    const ids = [...new Set(productIds || [])];
    let synced = 0;
    for (const productId of ids) {
      try {
        await wishlist.add(productId);
        synced += 1;
      } catch {
        // A piece that is no longer in the catalogue (400) or a dead API: the
        // local list keeps it and the next toggle will retry.
      }
    }
    return { total: ids.length, synced };
  },
};

// ---------- looks / shoppable costumes (Agent 5) — replaces SHOPPABLE_LOOKS constant ----------
export const looks = {
  list: () => api.get('/looks', { auth: false }),
  get: (id) => api.get(`/looks/${encodeURIComponent(id)}`, { auth: false }),
};

// ---------- reviews (Agent 5) — ProductDetailPage ----------
export const reviews = {
  list: (productId) => api.get(`/products/${encodeURIComponent(productId)}/reviews`, { auth: false }),
  create: (productId, { rating, comment }) =>
    api.post(`/products/${encodeURIComponent(productId)}/reviews`, { rating, comment }),
  approve: (reviewId) => api.patch(`/reviews/${encodeURIComponent(reviewId)}/approve`, {}),
};

// ---------- account (Agent 5) — AccountPage sizes + addresses + order history ----------
export const account = {
  profile: () => api.get('/account'),
  orders: () => api.get('/account/orders'),
  addresses: () => api.get('/account/addresses'),
  addAddress: (address) => api.post('/account/addresses', address),
  removeAddress: (addressId) => api.delete(`/account/addresses/${encodeURIComponent(addressId)}`),
  updateSizes: (sizes) => api.put('/account/sizes', sizes),
};

// ---------- policies (Agent 5) — PolicyPage tabs ----------
export const policies = {
  get: (tab) => api.get(`/policies/${encodeURIComponent(tab)}`, { auth: false }),
  index: () => api.get('/policies', { auth: false }),
};

// ---------- store info (Agent 5) — VisitUsPage / Header / Footer ----------
// Falls back to BRAND_INFO-shaped static data when the API is unreachable,
// so the storefront never hard-crashes during migration.
export const store = {
  info: () => api.get('/store/info', { auth: false }),

  /**
   * Everything the public storefront needs to render the owner's actual shop:
   * catalogue, store settings and CMS content, fetched in parallel.
   *
   * Each section is settled independently — if only /cms is broken the caller
   * still gets the real catalogue — and the whole call throws when nothing
   * answered, so the caller can fall back to its cached copy knowingly.
   */
  bootstrap: async () => {
    const settle = async (promise) => {
      try {
        return await promise;
      } catch {
        return null;
      }
    };

    const [catalog, storeSettings, cmsContent] = await Promise.all([
      settle(loadAllProducts()),
      settle(api.get('/settings', { auth: false })),
      settle(api.get('/cms', { auth: false })),
    ]);

    if (!catalog && !storeSettings && !cmsContent) {
      throw new Error('Store API did not answer');
    }
    return { products: catalog, settings: storeSettings, cms: cmsContent };
  },
};

// The catalogue endpoint paginates (default 24, max 100 per page). Walk the
// pages so a shop with 300 pieces does not silently show the first 24.
async function loadAllProducts() {
  const first = await products.list({ limit: 100 });
  const items = Array.isArray(first?.items) ? [...first.items] : [];
  if (!Array.isArray(first?.items)) return null;
  const pages = Number(first.pages) || 1;
  for (let page = 2; page <= Math.min(pages, 10); page += 1) {
    const next = await products.list({ limit: 100, page });
    if (!Array.isArray(next?.items) || next.items.length === 0) break;
    items.push(...next.items);
  }
  return items;
}

// ---------- leads / waitlist / newsletter (backend/src/routes/leads.routes.js) ----------
// Public entry points are explicit: there is no anonymous POST /leads. The
// plain create/update/remove below are the Studio Admin desk's CRM writes and
// answer 401/403 without an admin JWT.
export const leads = {
  claimOffer: (body) => api.post('/leads/claim-offer', body, { auth: false }),
  waitlist: (body) => api.post('/leads/waitlist', body, { auth: false }),
  subscribe: (email) =>
    api.post('/leads/claim-offer', { email, source: 'Footer Drop Alerts' }, { auth: false }),
  // Admin desk. ?source=&stage=&search=&page=&limit= — the API stores source as a
  // token and answers the display label as `sourceLabel`.
  list: (query) => api.get('/leads', { query }),
  create: (body) => api.post('/leads', body),
  update: (id, patch) => api.patch(`/leads/${encodeURIComponent(id)}`, patch),
  remove: (id) => api.delete(`/leads/${encodeURIComponent(id)}`),
};

// ---------- enquiries (backend/src/routes/enquiries.routes.js) ----------
export const enquiries = {
  create: (body) => api.post('/enquiries', body, { auth: false }),
  list: (query) => api.get('/enquiries', { query }),
  // { status?, notes?, colour? } — status accepts the desk's labels ('In
  // Discussion') and the server normalises them to its own vocabulary.
  update: (id, patch) => api.patch(`/enquiries/${encodeURIComponent(id)}`, patch),
};

// ---------- promos (backend/src/routes/promos.routes.js) ----------
// POST /promos/validate answers 200 with { valid:false, reason } — branch on the
// body, not the status. There is no /promos/claim route.
// Admin list/create/update/remove: PUT is keyed by the CODE, and sends only the
// fields being changed (the route accepts partial updates).
export const promos = {
  validate: (code) => api.post('/promos/validate', { code }, { auth: false }),
  list: () => api.get('/promos'),
  create: (body) => api.post('/promos', body),
  update: (code, body) => api.put(`/promos/${encodeURIComponent(code)}`, body),
  remove: (code) => api.delete(`/promos/${encodeURIComponent(code)}`),
};

// ---------- cms (owner: cms agent; tonto_admin_cms → server) ----------
export const cms = {
  get: () => api.get('/cms', { auth: false }),
  // PUT is a partial update of the singleton. The route rejects any base64 data
  // URL, so device media must go through uploads.image() first.
  save: (body) => api.put('/cms', body),
};

// ---------- settings (owner: settings agent; tonto_admin_settings → server) ----------
export const settings = {
  get: () => api.get('/settings', { auth: false }),
  save: (body) => api.put('/settings', body),
};

// ---------- media upload (backend/src/routes/upload.routes.js) ----------
// multipart/form-data, field `image`, admin only, 5 MB, images only. This cannot
// reuse request(): a JSON Content-Type would break the multipart boundary.
export async function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}/uploads`, { method: 'POST', headers, body: form });
  } catch (err) {
    throw new Error(`Network error reaching ${API_BASE}/uploads: ${err.message}`);
  }
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const err = new Error(payload?.message || `Upload failed (${res.status})`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export const uploads = { image: uploadImage };

export default api;
