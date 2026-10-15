-- TONTO Clothing — Supabase (Postgres) schema
-- Run in Supabase SQL Editor (or `supabase db push`). Idempotent.
-- Replaces the previous Mongoose/MongoDB models 1:1.

-- ============ helpers ============
create extension if not exists "pgcrypto";

-- ============ users + addresses ============
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text default '',
  password_hash text not null,
  role text not null default 'customer' check (role in ('customer','admin')),
  top_size text default '',
  bottom_waist text default '',
  credentials_submitted boolean not null default false,
  promo_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_email on users (lower(email));
create index if not exists idx_users_role on users (role);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text default 'Primary Delivery',
  recipient text not null,
  phone text default '',
  address text not null,
  city text default '',
  state text default '',
  postal_code text default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on addresses (user_id);

-- ============ catalog ============
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'Tees'
    -- 'Bottoms' is used by the storefront catalog (src/data/products.js).
    -- Keep in sync with PRODUCT_CATEGORIES in src/data/products.js.
    check (category in ('Tees','Shirts','Layers','Denim','Bottoms','Trousers','Shorts','Accessories')),
  colour text default '',
  fit text default '',
  price_text text default 'Price on enquiry',
  numeric_price integer check (numeric_price is null or numeric_price >= 0),
  images jsonb not null default '[]',
  alt text default '',
  description text default '',
  verified_brand text default 'unisex / TONTO',
  availability text default 'In stock - Coimbatore',
  variants jsonb not null default '[]',
  measurements text default '',
  is_trending boolean not null default false,
  is_new boolean not null default false,
  stock_qty integer not null default 10 check (stock_qty >= 0),
  created_date date default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_slug on products (slug);
create index if not exists idx_products_cat_active on products (category, active);
create index if not exists idx_products_trending on products (is_trending, active);
-- full-text search (mirrors old Mongo $text index)
alter table products add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(colour,'') || ' ' || coalesce(fit,'') || ' ' || coalesce(category,''))
  ) stored;
create index if not exists idx_products_search on products using gin (search_tsv);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text default '',
  category_filter text default 'All',
  image text default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- singleton CMS content (one row, key='site')
create table if not exists cms_content (
  key text primary key,
  hero jsonb not null default '{}',
  graphic_banner jsonb not null default '{}',
  category_carousel jsonb not null default '[]',
  lookbook_banner jsonb not null default '{}',
  about_us jsonb not null default '{}',
  tonto_own_make jsonb not null default '{}',
  offer_modal jsonb not null default '{}',
  shoppable_looks jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists promos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_text text default '',
  -- Campaign label the Studio Admin desk shows next to the code (migration_004).
  type text default '',
  percent integer not null default 15 check (percent >= 0 and percent <= 100),
  active boolean not null default true,
  expires_at timestamptz,
  usage_limit integer,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

-- singleton store settings (one row, key='store')
create table if not exists store_settings (
  key text primary key,
  store_name text default 'TONTO Clothing',
  store_location text default 'Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India',
  whatsapp_phone text default '+91 82483 21214',
  instagram_handle text default '@tonto_clothing_',
  announcement_text text default '',
  free_shipping_threshold text default '₹2,500',
  updated_at timestamptz not null default now()
);

-- ============ engagement ============
create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  device_id text,
  product_id text not null,
  created_at timestamptz not null default now(),
  check (user_id is not null or device_id is not null),
  unique (user_id, product_id)
);
create unique index if not exists uq_wishlist_device_product on wishlist (device_id, product_id) where device_id is not null;
create index if not exists idx_wishlist_user on wishlist (user_id);
create index if not exists idx_wishlist_device on wishlist (device_id);

create table if not exists looks (
  id uuid primary key default gen_random_uuid(),
  look_id text not null unique,
  title text default '',
  short_title text default '',
  image text default '',
  thumbnail text default '',
  video text default '',
  tag text default '',
  fit text default '',
  description text default '',
  items jsonb not null default '[]',
  costume_price text default '',
  costume_numeric_price integer default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid references users(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text default '',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists idx_reviews_product on reviews (product_id);

-- ============ commerce ============
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  -- Client-generated per checkout attempt; makes POST /api/orders replay-safe.
  client_request_id text unique,
  user_id uuid references users(id) on delete set null,
  customer jsonb not null,
  items jsonb not null,
  subtotal integer not null default 0,
  discount_amount integer not null default 0,
  promo_code text,
  promo_percent integer not null default 0,
  shipping_fee integer not null default 0,
  grand_total integer not null default 0,
  delivery_method text not null default 'shipping' check (delivery_method in ('shipping','showroom')),
  -- Canonical lifecycle tokens; see migration_003 for the matching normalizer.
  status text not null default 'pending' check (status in ('pending','new_hold','confirmed','processing','hold','shipped','dispatched','delivered','cancelled','refunded')),
  payment_status text default 'pending_payment_link' check (payment_status in ('pending_payment_link','paid_upi','paid_card','cancelled_released','refunded')),
  courier_partner text default '',
  tracking_number text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_status_created on orders (status, created_at desc);
create index if not exists idx_orders_user on orders (user_id);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  product_id text default '',
  product_title text default '',
  colour text default '',
  size text default '',
  name text default '',
  phone text default '',
  email text default '',
  message text default '',
  notes text default '',
  channel text default 'form' check (channel in ('whatsapp','form')),
  -- Full desk vocabulary; migration_004 re-declares this for projects created earlier.
  status text default 'new' check (status in ('new','pending','in_discussion','contacted','payment_received','hold_reserved','dispatched','completed','closed','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  email text default '',
  phone text default '',
  source text default '',
  promo_claimed boolean not null default false,
  claimed_code text default '',
  -- Studio Admin CRM columns (see migration_004 for existing projects).
  stage text not null default 'New' check (stage in ('New','In Discussion','Converted','Lost')),
  interest text default '',
  estimated_value integer not null default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_leads_email on leads (lower(email)) where email <> '';

create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  drop_name text default 'Private Drop 01',
  name text default '',
  phone text default '',
  email text default '',
  size text default '',
  created_at timestamptz not null default now()
);

-- guest/server carts (optional persistence for /api/cart sync)
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  device_id text,
  items jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (device_id)
);

-- ============ updated_at trigger ============
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_users_touch on users;
create trigger trg_users_touch before update on users for each row execute function touch_updated_at();
drop trigger if exists trg_products_touch on products;
create trigger trg_products_touch before update on products for each row execute function touch_updated_at();
drop trigger if exists trg_orders_touch on orders;
create trigger trg_orders_touch before update on orders for each row execute function touch_updated_at();
drop trigger if exists trg_enquiries_touch on enquiries;
create trigger trg_enquiries_touch before update on enquiries for each row execute function touch_updated_at();
drop trigger if exists trg_leads_touch on leads;
create trigger trg_leads_touch before update on leads for each row execute function touch_updated_at();

-- ============ seed singletons + default promos ============
insert into cms_content (key, hero, graphic_banner, category_carousel, lookbook_banner, about_us, tonto_own_make, offer_modal, shoppable_looks) values (
  'site',
  '{"image":"/assets/hero-banner-clean-orig.jpg","tagline":"THRIFT / IMPORTED / SURPLUS","headline":"MADE TO BE DIFFERENT","buttonText":"SHOP THE NEW ARRIVALS"}'::jsonb,
  '{"image":"/assets/campaign-graphic-clean-orig.jpg","subtitle":"OVERSIZED FITS. EVERYDAY STYLE.","headline":"THE GRAPHIC EDIT","buttonText":"shop now"}'::jsonb,
  '[{"id":"new-arrivals","title":"NEW ARRIVALS","subtitle":"knit zip up sweater + more","categoryFilter":"New Arrivals","image":"/assets/products/tonto-studios-waffle-black-front.jpg"},{"id":"new-denim","title":"NEW DENIM","subtitle":"distressed workwear denim + more","categoryFilter":"Denim","image":"/assets/products/chain-print-denim-detail.jpg"},{"id":"new-outerwear","title":"NEW OUTERWEAR","subtitle":"reworked jacket + more","categoryFilter":"Outerwear","image":"/assets/products/pinstripe-sweatshirt-navy-flat1.jpg"},{"id":"new-sweatpants","title":"NEW SWEATPANTS","subtitle":"mojave sweatpants + more","categoryFilter":"Sweatpants","image":"/assets/products/grey-stripe-black-denim-wide.jpg"},{"id":"new-tops","title":"NEW TOPS","subtitle":"striped layered polo + more","categoryFilter":"Tops","image":"/assets/products/layered-graphic-tee-blue.jpg"},{"id":"new-accessories","title":"NEW ACCESSORIES","subtitle":"leather belt & hardware + more","categoryFilter":"Accessories","image":"/assets/products/archive-hardware-belts.jpg"}]'::jsonb,
  '{"image":"/assets/lookbook-banner-clean.jpg","headline":"TONTO MADE","buttonText":"explore tonto made"}'::jsonb,
  '{"heroImage":"/assets/editorial/editorial-brutalist-full.jpg","genesisImage":"/assets/branding/tonto-tags.jpg","headline":"ABOUT TONTO","description":"Same Stories, Different People. Crafting substantial, heavyweight streetwear with brutalist drape and generational Indian textile mastery."}'::jsonb,
  '{"badge":"IN-HOUSE ATELIER • COIMBATORE","headline":"TONTO MADE","description":"Beyond curation. Proprietary cuts, heavyweight custom-milled textiles, and distinct garment washes — patterned, tailored, and hand-finished in small batches under our own roof in Coimbatore.","card1Image":"/assets/branding/tonto-tags.jpg","card1Tag":"ARCHIVE TAGGING","card1Title":"CUSTOM HARDWARE & LABELS","card1Desc":"Every garment carries custom woven jacquard labeling, tonal embroidery, and archival industrial details unique to TONTO.","card2Image":"/assets/products/tonto-waffle-tees-hanging.jpg","card2Tag":"PROPRIETARY DRAPE","card2Title":"DROP-SHOULDER PROPORTIONS","card2Desc":"Engineered unisex fits crafted with wide bodies, relaxed collars, and scalloped hems for effortless streetwear layering.","card3Image":"/assets/products/tonto-studios-waffle-black-concrete.jpg","card3Tag":"CUSTOM MILLED","card3Title":"HEAVYWEIGHT KNITS & WASHES","card3Desc":"High-density textured waffle knits, custom mineral dyes, and hand-distressed washed denim developed specifically for our climate."}'::jsonb,
  '{"image":"/assets/editorial/editorial-seated-camo.jpg","tag":"TONTO ARCHIVE","badge":"LIMITED OFFER","headline":"MADE TO BE DIFFERENT","description":"Curated thrift, surplus & heavy washed denim drops from Coimbatore.","privilegeTag":"WELCOME PRIVILEGE","title":"UNLOCK 15% OFF","subtitle":"Enter your email to reveal your private 15% discount code and receive priority access to limited surplus & denim releases.","buttonText":"REVEAL 15% OFF CODE","promoCode":"TONTO15"}'::jsonb,
  '[]'::jsonb
) on conflict (key) do nothing;
insert into store_settings (key) values ('store') on conflict (key) do nothing;
insert into promos (code, discount_text, type, percent, active) values
  ('TONTO15','15% OFF','Welcome Privilege',15,true),
  ('TONTOVIP','20% OFF','Private Drop Access',20,true),
  ('ARCHIVE10','10% OFF','Return Customer',10,true)
on conflict (code) do nothing;

-- ===========================================================================
-- ROW LEVEL SECURITY (RLS) & PRIVILEGE LOCKDOWN
-- Enforced immediately on creation so tables are never exposed to PostgREST anon.
-- Service role retains full BYPASSRLS access for the Express backend.
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
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- service_role must keep full access
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Future tables/sequences created must never auto-grant to anon
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- Revoke function execution from untrusted roles
revoke execute on all functions in schema public from anon, authenticated;

