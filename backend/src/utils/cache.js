/**
 * Tiny in-process TTL cache for hot, rarely-changing reads
 * (cms singleton, store settings, categories, promos, looks...).
 *
 * Single-flight: concurrent getOrSet() calls for the same key share one
 * loader promise — no DB stampede on cold start.
 * Single process only — matches our single-instance deploy; admin writes
 * call `del(prefix)` so storefront reads stay fresh.
 */

const store = new Map(); // key -> { value, expiresAt }
const inflight = new Map(); // key -> Promise

export function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  // Soft cap — evict oldest entries first.
  if (store.size > 500) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
}

/** Invalidate every key starting with `prefix` (e.g. del('cms'), del('promo')). */
export function del(prefix) {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix + ':')) store.delete(key);
  }
}

export async function getOrSet(key, ttlMs, loader) {
  const hit = get(key);
  if (hit !== undefined) return { value: hit, hit: true };
  let pending = inflight.get(key);
  if (!pending) {
    pending = Promise.resolve()
      .then(loader)
      .then((value) => {
        set(key, value, ttlMs);
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return { value: await pending, hit: false };
}

/**
 * Express helper: serve cached JSON with Cache-Control + X-Cache headers.
 * loader must return the already-shaped response body.
 */
export async function sendCached(res, key, ttlMs, loader, { cacheControl } = {}) {
  const { value, hit } = await getOrSet(key, ttlMs, loader);
  res.set('X-Cache', hit ? 'HIT' : 'MISS');
  if (cacheControl) res.set('Cache-Control', cacheControl);
  return res.json(value);
}

export default { get, set, del, getOrSet, sendCached };
