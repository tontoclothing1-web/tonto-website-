import { requireSupabase } from '../config/supabase.js';

// Supabase DAO for `users` + `addresses` tables.
// Replaces the previous Mongoose model 1:1. All responses are camelCase
// for frontend compat; DB columns stay snake_case.
//
// users(id uuid, name, email unique, phone, password_hash, role,
//   top_size, bottom_waist, credentials_submitted, promo_claimed,
//   created_at, updated_at)
// addresses(id, user_id FK, label, recipient, phone, address, city, state,
//   postal_code, is_default, created_at)

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

export const mapRowToUser = (row) => {
  if (!row) return null;
  const topSize = row.top_size ?? row.topSize ?? '';
  const bottomWaist = row.bottom_waist ?? row.bottomWaist ?? '';
  const credentialsSubmitted =
    row.credentials_submitted ?? row.credentialsSubmitted ?? false;
  const promoClaimed = row.promo_claimed ?? row.promoClaimed ?? false;
  const out = {
    id: row.id ?? row._id,
    _id: row._id ?? row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: row.role ?? 'customer',
    passwordHash: row.password_hash ?? row.passwordHash,
    password_hash: row.password_hash ?? row.passwordHash,
    topSize,
    top_size: row.top_size ?? topSize,
    bottomWaist,
    bottom_waist: row.bottom_waist ?? bottomWaist,
    sizes: {
      topSize: row.sizes?.topSize ?? topSize,
      bottomWaist: row.sizes?.bottomWaist ?? bottomWaist,
    },
    credentialsSubmitted: !!credentialsSubmitted,
    credentials_submitted: !!credentialsSubmitted,
    promoClaimed: !!promoClaimed,
    promo_claimed: !!promoClaimed,
    createdAt: row.created_at ?? row.createdAt,
    created_at: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    updated_at: row.updated_at ?? row.updatedAt,
  };
  if (row.addresses !== undefined) out.addresses = row.addresses;
  return out;
};

export const mapPatchToRow = (patch = {}) => {
  const row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = normalizeEmail(patch.email);
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.password_hash !== undefined) row.password_hash = patch.password_hash;
  if (patch.passwordHash !== undefined) row.password_hash = patch.passwordHash;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.top_size !== undefined) row.top_size = patch.top_size;
  if (patch.topSize !== undefined) row.top_size = patch.topSize;
  if (patch.bottom_waist !== undefined) row.bottom_waist = patch.bottom_waist;
  if (patch.bottomWaist !== undefined) row.bottom_waist = patch.bottomWaist;
  if (patch.sizes && typeof patch.sizes === 'object') {
    if (patch.sizes.topSize !== undefined) row.top_size = patch.sizes.topSize;
    if (patch.sizes.bottomWaist !== undefined) row.bottom_waist = patch.sizes.bottomWaist;
  }
  if (patch['sizes.topSize'] !== undefined) row.top_size = patch['sizes.topSize'];
  if (patch['sizes.bottomWaist'] !== undefined) row.bottom_waist = patch['sizes.bottomWaist'];
  if (patch.credentials_submitted !== undefined) {
    row.credentials_submitted = patch.credentials_submitted;
  }
  if (patch.credentialsSubmitted !== undefined) {
    row.credentials_submitted = patch.credentialsSubmitted;
  }
  if (patch.promo_claimed !== undefined) row.promo_claimed = patch.promo_claimed;
  if (patch.promoClaimed !== undefined) row.promo_claimed = patch.promoClaimed;
  return row;
};

export const findUserByEmail = async (email) => {
  const sb = requireSupabase();
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();
  if (error) throw error;
  return mapRowToUser(data);
};

export const findUserById = async (id) => {
  if (!id) return null;
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('id', String(id))
    .maybeSingle();
  if (error) throw error;
  return mapRowToUser(data);
};

export const createUser = async (input = {}) => {
  const sb = requireSupabase();
  const email = normalizeEmail(input.email);
  if (!input.name || !String(input.name).trim()) {
    const err = new Error('Name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  const password_hash = input.password_hash ?? input.passwordHash ?? '';
  if (!password_hash) {
    const err = new Error('password_hash is required');
    err.statusCode = 400;
    throw err;
  }
  const row = {
    name: String(input.name).trim(),
    email,
    phone: input.phone !== undefined ? String(input.phone) : '',
    password_hash,
    role: input.role || 'customer',
    top_size:
      input.top_size ?? input.topSize ?? input.sizes?.topSize ?? '',
    bottom_waist:
      input.bottom_waist ?? input.bottomWaist ?? input.sizes?.bottomWaist ?? '',
    credentials_submitted:
      input.credentials_submitted ?? input.credentialsSubmitted ?? false,
    promo_claimed: input.promo_claimed ?? input.promoClaimed ?? false,
  };
  const { data, error } = await sb.from('users').insert(row).select().single();
  if (error) {
    if (error.code === '23505') {
      const dup = new Error('Email already registered');
      dup.statusCode = 409;
      dup.code = '23505';
      throw dup;
    }
    throw error;
  }
  return mapRowToUser(data);
};

export const updateUser = async (id, patch = {}) => {
  if (!id) return null;
  const sb = requireSupabase();
  const row = mapPatchToRow(patch);
  if (Object.keys(row).length === 0) return findUserById(id);
  const { data, error } = await sb
    .from('users')
    .update(row)
    .eq('id', String(id))
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === '23505') {
      const dup = new Error('Email already registered');
      dup.statusCode = 409;
      dup.code = '23505';
      throw dup;
    }
    throw error;
  }
  return mapRowToUser(data);
};

export const toSafeJSON = (user) => {
  if (!user) return null;
  const src =
    typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete src.passwordHash;
  delete src.password_hash;
  delete src.__v;
  const mapped = mapRowToUser(src);
  if (!mapped) return null;
  delete mapped.passwordHash;
  delete mapped.password_hash;
  return mapped;
};

// ---------------- addresses ----------------

export const mapRowToAddress = (row) => {
  if (!row) return null;
  const postalCode = row.postal_code ?? row.postalCode ?? '';
  const isDefault = row.is_default ?? row.isDefault ?? false;
  return {
    id: row.id ?? row._id,
    _id: row._id ?? row.id,
    userId: row.user_id ?? row.userId ?? row.user,
    user_id: row.user_id ?? row.userId ?? row.user,
    user: row.user ?? row.user_id ?? row.userId,
    label: row.label ?? 'Primary Delivery',
    recipient: row.recipient ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    postalCode,
    postal_code: postalCode,
    isDefault: !!isDefault,
    is_default: !!isDefault,
    createdAt: row.created_at ?? row.createdAt,
    created_at: row.created_at ?? row.createdAt,
  };
};

export const listAddresses = async (userId) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('addresses')
    .select('*')
    .eq('user_id', String(userId))
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRowToAddress);
};

export const ensureSingleDefault = async (userId, keepId = null) => {
  const addresses = await listAddresses(userId);
  if (!addresses || addresses.length === 0) return;
  const sb = requireSupabase();
  const defaults = addresses.filter((a) => a.isDefault);
  if (defaults.length === 1) return;
  let keep = keepId || null;
  if (!keep && defaults.length > 0) keep = defaults[0].id;
  if (!keep) keep = addresses[0].id;
  // Set keep=true, rest=false (sequential to stay simple + RLS-safe).
  for (const addr of addresses) {
    const shouldBeDefault = addr.id === keep;
    if (addr.isDefault !== shouldBeDefault) {
      const { error } = await sb
        .from('addresses')
        .update({ is_default: shouldBeDefault })
        .eq('id', addr.id)
        .eq('user_id', String(userId));
      if (error) throw error;
    }
  }
};

export const addAddress = async (userId, payload = {}) => {
  const sb = requireSupabase();
  const uid = String(userId);
  if (!payload.recipient || !String(payload.recipient).trim()) {
    const err = new Error('recipient is required');
    err.statusCode = 400;
    throw err;
  }
  if (!payload.address || !String(payload.address).trim()) {
    const err = new Error('address is required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await listAddresses(uid);
  let isDefault = payload.is_default ?? payload.isDefault ?? false;
  if (existing.length === 0) isDefault = true;
  if (isDefault === true && existing.length > 0) {
    const { error: clearErr } = await sb
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', uid);
    if (clearErr) throw clearErr;
  }
  const row = {
    user_id: uid,
    label: payload.label?.trim?.() || payload.label || 'Primary Delivery',
    recipient: String(payload.recipient).trim(),
    phone: payload.phone !== undefined ? String(payload.phone).trim() : '',
    address: String(payload.address).trim(),
    city: payload.city !== undefined ? String(payload.city).trim() : '',
    state: payload.state !== undefined ? String(payload.state).trim() : '',
    postal_code:
      payload.postal_code !== undefined
        ? String(payload.postal_code).trim()
        : payload.postalCode !== undefined
          ? String(payload.postalCode).trim()
          : '',
    is_default: isDefault === true,
  };
  const { data, error } = await sb
    .from('addresses')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapRowToAddress(data);
};

export const removeAddress = async (userId, addressId) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('addresses')
    .delete()
    .eq('id', String(addressId))
    .eq('user_id', String(userId))
    .select();
  if (error) throw error;
  if (!data || data.length === 0) return false;
  // If we removed the default, promote the oldest remaining to default.
  await ensureSingleDefault(userId);
  return true;
};

// ---- Back-compat default export (for out-of-scope consumers like cart) ----
// Supports `await User.findById(id).lean()`, `.select()`, `findOne`, `create`,
// `findByIdAndUpdate` without an ODM. Resolves to camelCase objects.
const withQueryHelpers = (promise) => {
  promise.lean = () => promise;
  promise.select = () => promise;
  return promise;
};

const compatFindById = (id) => withQueryHelpers(findUserById(id));

const compatFindOne = (filter = {}) => {
  const p = (async () => {
    if (filter.email) return findUserByEmail(filter.email);
    if (filter._id || filter.id) return findUserById(filter._id || filter.id);
    return null;
  })();
  return withQueryHelpers(p);
};

const compatFindByIdAndUpdate = (id, update = {}, opts = {}) => {
  const patch = update?.$set || update || {};
  void opts;
  return withQueryHelpers(updateUser(id, patch));
};

const compatCreate = (input = {}) =>
  withQueryHelpers(
    createUser({
      ...input,
      password_hash: input.password_hash ?? input.passwordHash,
    })
  );

export default {
  findUserByEmail,
  findUserById,
  findById: compatFindById,
  findOne: compatFindOne,
  findByIdAndUpdate: compatFindByIdAndUpdate,
  create: compatCreate,
  updateUser,
  toSafeJSON,
  listAddresses,
  addAddress,
  removeAddress,
  ensureSingleDefault,
};
