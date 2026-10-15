/**
 * Stock movement helpers.
 *
 * `reserveStock` is the piece that was missing entirely: orders were created
 * without touching `products.stock_qty`, so the same last garment could be sold
 * an unlimited number of times and the admin "stock" column never moved.
 *
 * Preferred path is the `reserve_stock()` / `release_stock()` Postgres functions
 * from supabase/migration_003_security_and_integrity.sql — a single statement,
 * so two concurrent checkouts cannot both take the last unit. Until that
 * migration is applied we fall back to a compare-and-swap on the value we just
 * read, which is safe for one API instance and simply retries on contention.
 */
import { isSupabaseConnected, requireSupabase } from '../config/supabase.js';
import ApiError from './ApiError.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIGRATION_HINT =
  '[stock] reserve_stock()/release_stock() missing — run backend/supabase/migration_003_security_and_integrity.sql';

function byKeyColumn(sb, key) {
  return UUID_RE.test(String(key)) ? sb.from('products').eq('id', String(key)) : sb.from('products').eq('slug', String(key));
}

const isMissingFunction = (error) =>
  /does not exist|PGRST202|42883/i.test(`${error?.code || ''} ${error?.message || ''}`);

/** Decrement stock for one product key (slug or uuid). Throws 409 when short. */
export async function reserveStock(key, qty) {
  const amount = Math.floor(Number(qty) || 0);
  if (!key || amount < 1) throw ApiError.badRequest('Cannot reserve stock for this item.');
  if (!isSupabaseConnected()) throw ApiError.unavailable('Database unavailable.');

  const sb = requireSupabase();
  try {
    const { data, error } = await sb.rpc('reserve_stock', { p_key: String(key), p_qty: amount });
    if (!error) {
      const affected = Array.isArray(data) ? data.length : Number(data ?? 0);
      if (affected > 0) return { reserved: true, method: 'rpc' };
      throw ApiError.conflict(`"${key}" is out of stock or no longer on sale.`);
    }
    if (!isMissingFunction(error)) throw error;
    console.warn(MIGRATION_HINT);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn(MIGRATION_HINT, err?.message || err);
  }

  // Compare-and-swap fallback.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: row, error: readError } = await byKeyColumn(sb, key)
      .select('stock_qty,active')
      .maybeSingle();
    if (readError) throw readError;
    if (!row || row.active === false) throw ApiError.conflict(`"${key}" is no longer on sale.`);
    const onHand = Number(row.stock_qty ?? 0);
    if (onHand < amount) throw ApiError.conflict(`Only ${onHand} left of "${key}".`);

    const { data: updated, error: updateError } = await byKeyColumn(sb, key)
      .eq('stock_qty', onHand)
      .update({ stock_qty: onHand - amount })
      .eq('active', true)
      .select('id');
    if (updateError) throw updateError;
    if (updated && updated.length > 0) return { reserved: true, method: 'cas' };
    // Someone else moved stock between read and write — retry.
  }
  throw ApiError.conflict(`"${key}" just sold out. Please refresh the bag.`);
}

/** Put stock back (order cancelled / restock). Best effort, never throws. */
export async function releaseStock(key, qty) {
  const amount = Math.floor(Number(qty) || 0);
  if (!key || amount < 1 || !isSupabaseConnected()) return { released: false };
  const sb = requireSupabase();
  try {
    const { error } = await sb.rpc('release_stock', { p_key: String(key), p_qty: amount });
    if (!error) return { released: true, method: 'rpc' };
    if (!isMissingFunction(error)) throw error;
  } catch (err) {
    console.warn('[stock] release_stock rpc unavailable:', err?.message || err);
  }
  try {
    const { data: row } = await byKeyColumn(sb, key).select('stock_qty').maybeSingle();
    if (!row) return { released: false };
    await byKeyColumn(sb, key).update({ stock_qty: Number(row.stock_qty ?? 0) + amount });
    return { released: true, method: 'cas' };
  } catch {
    return { released: false };
  }
}

/** Undo several reservations when an order fails after partial booking. */
export async function releaseStockBatch(lines = []) {
  await Promise.all(lines.map((line) => releaseStock(line.key, line.qty).catch(() => null)));
}

export default { reserveStock, releaseStock, releaseStockBatch };
