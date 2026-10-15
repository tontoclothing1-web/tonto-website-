import { requireSupabase } from '../config/supabase.js';

// Supabase DAO for `wishlist` table.
// wishlist(id uuid, user_id uuid nullable, device_id text nullable,
//   product_id text not null, created_at timestamptz)
// Either user_id or device_id must be present (DB check).

export const mapRowToWishlist = (row) => {
  if (!row) return null;
  const userId = row.user_id ?? row.userId ?? row.user ?? null;
  const deviceId = row.device_id ?? row.deviceId ?? null;
  const productId = row.product_id ?? row.productId ?? '';
  const createdAt = row.created_at ?? row.createdAt;
  return {
    id: row.id ?? row._id,
    _id: row._id ?? row.id,
    user: userId,
    userId,
    user_id: userId,
    deviceId,
    device_id: deviceId,
    productId,
    product_id: productId,
    createdAt,
    created_at: createdAt,
    updatedAt: row.updated_at ?? row.updatedAt ?? createdAt,
    updated_at: row.updated_at ?? createdAt,
  };
};

const toOwnerFilter = (owner = {}) => {
  const userId = owner.userId ?? owner.user_id ?? owner.user ?? null;
  const deviceId = owner.deviceId ?? owner.device_id ?? null;
  return { userId, deviceId };
};

const applyOwner = (query, owner) => {
  const { userId, deviceId } = toOwnerFilter(owner);
  if (userId) return query.eq('user_id', String(userId));
  if (deviceId) return query.eq('device_id', String(deviceId));
  return query;
};

export const listWishlist = async (owner = {}) => {
  const sb = requireSupabase();
  const { userId, deviceId } = toOwnerFilter(owner);
  if (!userId && !deviceId) return [];
  let query = sb.from('wishlist').select('*').order('created_at', { ascending: false });
  query = applyOwner(query, owner);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRowToWishlist);
};

export const findWishlistEntry = async (owner = {}, productId = '') => {
  const sb = requireSupabase();
  const { userId, deviceId } = toOwnerFilter(owner);
  if ((!userId && !deviceId) || !productId) return null;
  let query = sb
    .from('wishlist')
    .select('*')
    .eq('product_id', String(productId).trim());
  query = applyOwner(query, owner);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return mapRowToWishlist(data);
};

export const createWishlistEntry = async ({ userId, user, user_id, deviceId, device_id, productId, product_id } = {}) => {
  const sb = requireSupabase();
  const resolvedUserId = userId ?? user_id ?? user ?? null;
  const resolvedDeviceId = deviceId ?? device_id ?? null;
  const resolvedProductId = String(productId ?? product_id ?? '').trim();
  if (!resolvedProductId) {
    const err = new Error('productId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!resolvedUserId && !resolvedDeviceId) {
    const err = new Error('Wishlist entry requires either an authenticated user or a deviceId guest key.');
    err.statusCode = 401;
    throw err;
  }
  const row = {
    user_id: resolvedUserId ? String(resolvedUserId) : null,
    device_id: resolvedDeviceId ? String(resolvedDeviceId).trim() : null,
    product_id: resolvedProductId,
  };
  const { data, error } = await sb.from('wishlist').insert(row).select().single();
  if (error) {
    if (error.code === '23505') {
      const dup = new Error('Already saved');
      dup.statusCode = 409;
      dup.code = '23505';
      throw dup;
    }
    throw error;
  }
  return mapRowToWishlist(data);
};

export const removeWishlistEntry = async (owner = {}, productId = '') => {
  const sb = requireSupabase();
  const { userId, deviceId } = toOwnerFilter(owner);
  if ((!userId && !deviceId) || !productId) return 0;
  let query = sb.from('wishlist').delete().eq('product_id', String(productId).trim());
  query = applyOwner(query, owner);
  const { data, error } = await query.select();
  if (error) throw error;
  return (data || []).length;
};

export const listAllWishlist = async (limit = 500) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('wishlist')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapRowToWishlist);
};

// ---- Back-compat default export ----
const withQueryHelpers = (promise) => {
  promise.lean = () => promise;
  promise.sort = () => promise;
  promise.limit = () => promise;
  promise.select = () => promise;
  return promise;
};

export default {
  find: (owner = {}) => withQueryHelpers(listWishlist(owner)),
  findOne: (filter = {}) =>
    withQueryHelpers(
      (async () => {
        const productId = filter.productId ?? filter.product_id ?? '';
        return findWishlistEntry(filter, productId);
      })()
    ),
  create: (input = {}) => withQueryHelpers(createWishlistEntry(input)),
  deleteOne: (filter = {}) =>
    withQueryHelpers(
      (async () => {
        const productId = filter.productId ?? filter.product_id ?? '';
        const deletedCount = await removeWishlistEntry(filter, productId);
        return { deletedCount };
      })()
    ),
  listWishlist,
  findWishlistEntry,
  createWishlistEntry,
  removeWishlistEntry,
  listAllWishlist,
  mapRowToWishlist,
};
