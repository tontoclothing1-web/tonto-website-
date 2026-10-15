-- TONTO Clothing — migration_003: security lockdown + commerce integrity
-- Idempotent. Run in the Supabase SQL Editor (or `supabase db push`).
--
-- WHY THIS EXISTS
--   schema.sql shipped with no `enable row level security` on any table and a
--   note claiming RLS was optional. It is not: the anon key is public (it is
--   embedded in the shipped JS bundle), so with RLS off every PostgREST table
--   readable by anon exposes the whole database. Verified live during the
--   2026-10-14 audit:
--     GET {SUPABASE_URL}/rest/v1/users?select=email,password_hash  -> 200 + bcrypt hashes
--
--   The Node server talks to Postgres with the service_role key, which has
--   BYPASSRLS, so denying anon/authenticated costs the API nothing.
--
-- ALSO FIXES
--   * `Bottoms` was rejected by the products category CHECK although the
--     storefront catalog ships 3 Bottoms pieces.
--   * order/enquiry status vocabularies were narrower than the lifecycle the
--     storefront and admin dashboard actually use ('New Hold', 'Processing', …)
--     so real orders would have been rejected by the CHECK on insert.
--   * no atomic primitives for promo redemption or stock movement (read-modify-
--     write races let a code be redeemed twice and stock go negative).

begin;

-- ===========================================================================
-- 1. RLS: enable on every table, deny anon + authenticated on everything.
--    No policies are created on purpose — the server is the only writer and
--    reader, through service_role (BYPASSRLS). Public data goes through the
--    Express API, never straight to PostgREST.
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'users','addresses','products','categories','cms_content','promos',
    'store_settings','wishlist','looks','reviews','orders','enquiries',
    'leads','waitlist_entries','carts'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    -- Deliberately NOT using `force row level security`: the SECURITY DEFINER
    -- helpers below are owned by the table owner, and FORCE would subject that
    -- owner to RLS too, making stock/promo updates silently affect 0 rows.
    -- PostgREST only ever connects as anon / authenticated / service_role, and
    -- the first two are revoked below, so owner-level access is not reachable
    -- from outside.
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- service_role must keep full access (it does by default, but make it explicit
-- and permanent so a future revoke of the schema grants cannot silently break it).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- New tables created later (by postgres/migrations) must NOT auto-grant to anon.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- function owner (touch_updated_at etc.) should not be executable by anon either.
revoke execute on all functions in schema public from anon, authenticated;

-- ===========================================================================
-- 2. Catalog taxonomy: accept 'Bottoms' (used by src/data/products.js).
-- ===========================================================================
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in (
    'Tees','Shirts','Layers','Denim','Bottoms','Trousers','Shorts','Accessories'
  ));

-- ===========================================================================
-- 3. Status vocabularies: canonical snake_case tokens, covering both the API
--    defaults and the storefront/admin lifecycle labels.
-- ===========================================================================
-- backfill anything currently outside the canonical set to a safe value
update public.orders set status = 'pending'
  where status not in ('pending','new_hold','confirmed','processing','hold',
                       'shipped','dispatched','delivered','cancelled','refunded');
update public.orders set payment_status = 'pending_payment_link'
  where payment_status not in (
    'pending_payment_link','paid_upi','paid_card','cancelled_released','refunded'
  );
update public.enquiries set status = 'new'
  where status not in ('new','pending','in_discussion','contacted',
                       'payment_received','hold_reserved','closed','resolved');

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','new_hold','confirmed','processing','hold',
                    'shipped','dispatched','delivered','cancelled','refunded'));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending_payment_link','paid_upi','paid_card',
                            'cancelled_released','refunded'));

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new','pending','in_discussion','contacted',
                    'payment_received','hold_reserved','closed','resolved'));

-- ===========================================================================
-- 4. Idempotent checkout + lookup indexes the API actually needs.
-- ===========================================================================
-- A double-tapped "Place order" button (or a retry after a timeout) used to
-- create two orders. The client now sends `clientRequestId`; the partial unique
-- index makes a replay collide instead of duplicating.
alter table public.orders add column if not exists client_request_id text;
create unique index if not exists uq_orders_client_request
  on public.orders (client_request_id)
  where client_request_id is not null;

create index if not exists idx_orders_created_desc on public.orders (created_at desc);
create index if not exists idx_orders_email on public.orders (lower((customer->>'email')));
create index if not exists idx_orders_promo on public.orders (promo_code);
create index if not exists idx_enquiries_created_desc on public.enquiries (created_at desc);
create index if not exists idx_leads_created_desc on public.leads (created_at desc);
create index if not exists idx_waitlist_email on public.waitlist_entries (lower(email));
create index if not exists idx_carts_device on public.carts (device_id);
create unique index if not exists uq_waitlist_drop_email
  on public.waitlist_entries (lower(email), drop_name) where email <> '';

-- promo codes are compared case-insensitively by the API; make that indexable
-- and stop 'tonto15' / 'TONTO15' duplicating rows.
create unique index if not exists uq_promos_code_lower on public.promos (lower(code));

-- ===========================================================================
-- 5. Atomic commerce primitives (SECURITY DEFINER so they can write despite RLS).
-- ===========================================================================

-- Resolve a product by uuid OR slug without trusting the caller's price.
create or replace function public.product_price_and_stock(p_key text)
returns table (
  product_id uuid,
  slug text,
  title text,
  numeric_price integer,
  stock_qty integer,
  active boolean
)
language sql
stable
set search_path = public
as $$
  select p.id, p.slug, p.title, p.numeric_price, p.stock_qty, p.active
  from public.products p
  where p.slug = p_key or p.id::text = p_key
  limit 1;
$$;

-- Decrement stock for one line, failing if there is not enough on hand.
-- Returns the row count actually updated (0 = unknown product or insufficient stock).
create or replace function public.reserve_stock(p_key text, p_qty integer)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare affected integer;
begin
  if p_qty is null or p_qty < 1 then
    raise exception 'reserve_stock: quantity must be >= 1';
  end if;

  update public.products
     set stock_qty = stock_qty - p_qty
   where (slug = p_key or id::text = p_key)
     and active = true
     and numeric_price is not null
     and stock_qty >= p_qty;
  get diagnostics affected = row_count;
  return affected;
end $$;

-- Put stock back (cancellation / restock).
create or replace function public.release_stock(p_key text, p_qty integer)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare affected integer;
begin
  if p_qty is null or p_qty < 1 then
    raise exception 'release_stock: quantity must be >= 1';
  end if;

  update public.products
     set stock_qty = stock_qty + p_qty
   where slug = p_key or id::text = p_key;
  get diagnostics affected = row_count;
  return affected;
end $$;

-- Validate + redeem a promo code in one round trip.
-- Locks the row (FOR UPDATE) so two concurrent checkouts cannot both consume
-- the last unit of a capped promo, and increments `uses` exactly once.
create or replace function public.claim_promo_use(p_code text)
returns table (ok boolean, reason text, percent integer, promo_id uuid)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare r public.promos%rowtype;
begin
  select * into r from public.promos
    where lower(code) = lower(trim(coalesce(p_code, '')))
    for update;

  if not found then
    return query select false, 'unknown', null::integer, null::uuid;
  end if;
  if not r.active then
    return query select false, 'inactive', r.percent, r.id;
  end if;
  if r.expires_at is not null and r.expires_at < now() then
    return query select false, 'expired', r.percent, r.id;
  end if;
  if r.usage_limit is not null and r.uses >= r.usage_limit then
    return query select false, 'usage_limit_reached', r.percent, r.id;
  end if;

  update public.promos set uses = uses + 1 where id = r.id;
  return query select true, null::text, r.percent, r.id;
end $$;

-- Undo a redemption when an order later fails validation.
create or replace function public.release_promo_use(p_code text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update public.promos set uses = greatest(uses - 1, 0)
    where lower(code) = lower(trim(coalesce(p_code, '')));
end $$;

-- Never let these cross the PostgREST boundary.
revoke execute on function public.claim_promo_use(text) from anon, authenticated;
revoke execute on function public.release_promo_use(text) from anon, authenticated;
revoke execute on function public.reserve_stock(text, integer) from anon, authenticated;
revoke execute on function public.release_stock(text, integer) from anon, authenticated;
revoke execute on function public.product_price_and_stock(text) from anon, authenticated;

-- ===========================================================================
-- 6. Sanity check: RLS must be on for every application table.
-- ===========================================================================
do $$
declare bad text;
begin
  select string_agg(relname, ', ') into bad
  from pg_class
  where relnamespace = 'public'::regnamespace
    and relkind = 'r'
    and relname in ('users','addresses','products','categories','cms_content','promos',
                    'store_settings','wishlist','looks','reviews','orders','enquiries',
                    'leads','waitlist_entries','carts')
    and relrowsecurity = false;
  if bad is not null then
    raise exception 'RLS still disabled on: %', bad;
  end if;
end $$;

commit;

-- After running this:
--   1. Rotate BOTH keys in Supabase → Settings → API. The anon key leaked into
--      the public bundle and was usable against the live database.
--   2. Verify from a terminal:
--        curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/users?select=email"
--      must now return {"error":"...permission denied..."} or [] rather than rows.
--   3. Restart the Node API and re-check GET /api/health + GET /api/products.
