-- TONTO Clothing — Perf migration 002 (run AFTER schema.sql)
-- Run in Supabase SQL Editor. Idempotent.
-- Speeds up: product ilike fallback search, order admin search, review lookups.

create extension if not exists pg_trgm;

-- Product text search fallback (title/description/colour ilike %term%)
create index if not exists idx_products_title_trgm on products using gin (title gin_trgm_ops);
create index if not exists idx_products_desc_trgm on products using gin (description gin_trgm_ops);
create index if not exists idx_products_colour_trgm on products using gin (colour gin_trgm_ops);

-- Product sort paths used by GET /api/products
create index if not exists idx_products_created_date on products (created_date desc) where active = true;
create index if not exists idx_products_price on products (numeric_price asc) where active = true;

-- Order admin search (order_id / tracking ilike + customer email)
create index if not exists idx_orders_order_id_trgm on orders using gin (order_id gin_trgm_ops);
create index if not exists idx_orders_tracking_trgm on orders using gin (tracking_number gin_trgm_ops);
create index if not exists idx_orders_customer_email on orders ((lower(customer ->> 'email')));

-- Enquiry / lead admin filters
create index if not exists idx_enquiries_status_created on enquiries (status, created_at desc);
create index if not exists idx_leads_created on leads (created_at desc);

-- Reviews per product + wishlist lookups
create index if not exists idx_reviews_product_approved on reviews (product_id, approved);
create index if not exists idx_wishlist_product on wishlist (product_id);
