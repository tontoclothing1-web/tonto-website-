// Read-only verification of migration_003 (RLS + atomic helpers + idempotency)
// and migration_004 (the admin desk's CRM columns) against the live project.
// Nothing here writes: every query is a select or a call against a name that
// cannot exist. Run with `node backend/scripts/check-migration-003.mjs`.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1. Do the atomic helpers exist yet?
for (const [fn, args] of [
  ['product_price_and_stock', { p_key: 'camo-layered-tee' }],
  ['reserve_stock', { p_key: '__does_not_exist__', p_qty: 1 }],
  ['claim_promo_use', { p_code: '__nope__' }],
]) {
  const { data, error } = await sb.rpc(fn, args);
  console.log(`rpc ${fn}:`, error ? `ERR ${error.code || ''} ${error.message}`.slice(0, 140) : `OK ${JSON.stringify(data).slice(0, 90)}`);
}

// 2. Does the idempotency column exist on orders?
const { error: colErr } = await sb.from('orders').select('client_request_id').limit(1);
console.log('orders.client_request_id:', colErr ? `MISSING (${colErr.message})`.slice(0, 120) : 'present');

// 3. Is RLS blocking the anon key? (the actual leak)
const { status, body } = await (async () => {
  const res = await fetch(`${url}/rest/v1/users?select=email,password_hash&limit=2`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  return { status: res.status, body: (await res.text()).slice(0, 200) };
})();
console.log(`anon GET /users -> HTTP ${status}:`, body);

for (const t of ['products', 'orders', 'cms_content', 'promos', 'carts']) {
  const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const txt = await res.text();
  console.log(`anon GET /${t} -> HTTP ${res.status}:`, txt.slice(0, 90));
}

// 4. migration_004: the columns the Studio Admin desk writes to. Without them
//    the API answers 42703/PGRST202 on every lead, enquiry-note and promo save.
console.log('\n— migration_004 columns —');
for (const [table, columns] of [
  ['leads', 'stage,interest,estimated_value,notes,updated_at'],
  ['enquiries', 'colour,notes,updated_at'],
  ['promos', 'type'],
]) {
  const { error } = await sb.from(table).select(columns).limit(1);
  console.log(`${table}(${columns.replace(/,/g, ', ')}):`, error ? `MISSING (${error.message})`.slice(0, 130) : 'present');
}
