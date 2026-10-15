import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL) {
  console.warn(
    '[supabase] SUPABASE_URL not set — running without Supabase. ' +
      'DB-backed routes will return 503 until SUPABASE_URL + keys are configured in backend/.env.'
  );
}

const clientKey = SERVICE_KEY || ANON_KEY || 'missing-key-placeholder';

export const supabase = SUPABASE_URL
  ? createClient(SUPABASE_URL, clientKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export const isSupabaseConnected = () => !!supabase;

export const requireSupabase = () => {
  if (!supabase) {
    const err = new Error(
      'Database unavailable — set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in backend/.env and restart the server.'
    );
    err.statusCode = 503;
    throw err;
  }
  return supabase;
};

export default supabase;
