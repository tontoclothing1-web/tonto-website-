import { requireSupabase, isSupabaseConnected } from './supabase.js';

// Backward-compat shim: old code imports { requireDb } / connectDB from config/db.js.
// Now backed by Supabase instead of Mongoose — same 503-when-unconfigured contract.
export const requireDb = () => {
  requireSupabase();
};

export const isDbConnected = () => isSupabaseConnected();

const connectDB = async () => {
  if (!isSupabaseConnected()) {
    console.warn(
      '[db] No SUPABASE_URL set — running without Supabase (in-memory fallback). ' +
        'DB-backed routes will return 503 until Supabase is configured.'
    );
    return { connected: false, reason: 'missing-url' };
  }
  try {
    const sb = requireSupabase();
    const { error } = await sb.from('products').select('id', { count: 'exact', head: true });
    if (error) throw error;
    console.log('[db] Supabase connected.');
    return { connected: true };
  } catch (err) {
    console.error('[db] Supabase connection check failed, continuing without DB:', err.message);
    return { connected: false, reason: err.message };
  }
};

export default connectDB;
