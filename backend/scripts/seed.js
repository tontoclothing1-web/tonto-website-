// Seed script — catalog/CMS/backend data from the frontend source of truth.
//
// Usage:  node backend/scripts/seed.js   (run from repo root)
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env
// (run backend/supabase/schema.sql in Supabase SQL Editor first).
//
// It reads (via fs, no bundler imports):
//   src/data/products.js    → PRODUCTS, CATEGORIES, SHOPPABLE_LOOKS, BRAND_INFO
//   src/data/defaultCms.js  → DEFAULT_CMS_CONTENT
// and upserts: products, categories, cms singleton, TONTO15 promo, settings.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(ROOT, 'backend', '.env') });

// --- fs-based ESM evaluation (frontend data files use `export const`) ---
function evalEsModule(source, { stripImports = false, inject = {}, returns = '' } = {}) {
  let code = source;
  if (stripImports) {
    code = code.replace(/^import\s+.*?;$/gm, '');
  }
  code = code.replace(/^export\s+const\s+/gm, 'const ');
  code = code.replace(/^export\s+default\s+/gm, 'const __defaultExport = ');
  const names = Object.keys(inject);
  const fn = new Function(...names, `${code}\nreturn { ${returns} };`);
  return fn(...names.map((n) => inject[n]));
}

function loadFrontendData() {
  const productsSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'products.js'), 'utf8');
  const { PRODUCTS, CATEGORIES, SHOPPABLE_LOOKS, BRAND_INFO } = evalEsModule(productsSrc, {
    returns: 'PRODUCTS, CATEGORIES, SHOPPABLE_LOOKS, BRAND_INFO',
  });

  const cmsSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'defaultCms.js'), 'utf8');
  const { DEFAULT_CMS_CONTENT } = evalEsModule(cmsSrc, {
    stripImports: true,
    inject: { SHOPPABLE_LOOKS },
    returns: 'DEFAULT_CMS_CONTENT',
  });

  return { PRODUCTS, CATEGORIES, SHOPPABLE_LOOKS, BRAND_INFO, DEFAULT_CMS_CONTENT };
}

// Matches CollectionView.jsx SAMPLE_PRICE_MAP so seeded numericPrice values
// agree with the storefront's displayed prices.
const SAMPLE_PRICE_MAP = {
  'tonto-studios-waffle-black': 2490,
  'tonto-waffle-white-blue': 2490,
  'distressed-chain-print-denim': 3290,
  'couch-vintage-fade-flare': 2990,
  'epsten-selvedge-black-denim': 3490,
  'sportswear-archive-sweatshirt-navy': 2800,
  'sportswear-archive-sweatshirt-cream': 2800,
  'pinstripe-crewneck-sweatshirt': 3100,
  'leopard-print-button-shirt': 2200,
  'hardwood-classic-basketball-jerseys': 1990,
  'heavy-olive-army-utility-shirt': 2600,
  'sun-faded-denim-workshirt': 2800,
  'slate-shadow-stripe-shirt': 2400,
  'khaki-pinstripe-oxford-shirt': 2200,
  'charcoal-wrangler-denim-shirt': 2800,
  'y2k-heavy-hardware-statement-belts': 1200,
  'tonto-archive-brand-hangtags': 450,
  'extra-wide-denim': 3290,
  'wide-leg-denim-black': 3190,
  'relaxed-fit-trousers-cream': 2790,
  'oversized-graphic-tee-black': 1890,
  'embroidered-shirt-burgundy': 2400,
  'dusty-pink-long-sleeve': 2100,
  'camo-layered-tee': 2300,
  'layered-graphic-tee-blue': 1990,
};

// Frontend data predates the strict enum — "Bottoms" maps to the closest enum value.
function mapCategory(p) {
  if (p.category === 'Bottoms') {
    const id = String(p.id || '');
    if (id.includes('belt') || id.includes('tag')) return 'Accessories';
    return 'Trousers';
  }
  return p.category;
}

function inr(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

async function main() {
  const { PRODUCTS, CATEGORIES, SHOPPABLE_LOOKS, BRAND_INFO, DEFAULT_CMS_CONTENT } =
    loadFrontendData();
  console.log(
    `[seed] loaded ${PRODUCTS.length} products, ${CATEGORIES.length} categories, ` +
      `${SHOPPABLE_LOOKS.length} looks from src/data`
  );

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[seed] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  console.log('[seed] connected to Supabase');

  // `isNew` = created within 30 days of the newest product in the dataset.
  const maxDate = Math.max(...PRODUCTS.map((p) => new Date(p.createdDate).getTime()));

  let productCount = 0;
  for (const p of PRODUCTS) {
    const numericPrice = SAMPLE_PRICE_MAP[p.id] ?? null;
    const row = {
      slug: String(p.slug).toLowerCase(),
      title: p.title,
      category: mapCategory(p),
      colour: p.colour || '',
      fit: p.fit || '',
      price_text: numericPrice != null ? inr(numericPrice) : p.price || 'Price on enquiry',
      numeric_price: numericPrice,
      images: p.images || [],
      alt: p.alt || p.title,
      description: p.description || '',
      verified_brand: p.verifiedBrand || 'unisex / TONTO',
      availability: p.availability || 'In stock - Coimbatore',
      variants: p.variants || [],
      measurements: p.measurements || '',
      is_trending: !!p.isTrending,
      is_new: maxDate - new Date(p.createdDate).getTime() <= 30 * 86400 * 1000,
      stock_qty: 10,
      created_date: p.createdDate,
      active: true,
    };
    const { error } = await supabase.from('products').upsert(row, { onConflict: 'slug' });
    if (error) throw new Error(`products upsert failed: ${error.message}`);
    productCount += 1;
  }
  console.log(`[seed] upserted ${productCount} products`);

  let categoryCount = 0;
  for (const [i, c] of CATEGORIES.entries()) {
    const row = {
      slug: String(c.id).toLowerCase(),
      title: c.title,
      subtitle: c.subtitle || '',
      category_filter: c.categoryFilter || '',
      image: c.image || '',
      sort_order: i,
      active: true,
    };
    const { error } = await supabase.from('categories').upsert(row, { onConflict: 'slug' });
    if (error) throw new Error(`categories upsert failed: ${error.message}`);
    categoryCount += 1;
  }
  console.log(`[seed] upserted ${categoryCount} categories`);

  let lookCount = 0;
  for (const l of SHOPPABLE_LOOKS || []) {
    const lookId = String(l.id || '').toLowerCase();
    if (!lookId) continue;
    const row = {
      look_id: lookId,
      title: l.title || '',
      short_title: l.shortTitle || '',
      image: l.image || '',
      thumbnail: l.thumbnail || '',
      video: l.video || '',
      tag: l.tag || '',
      fit: l.fit || '',
      description: l.description || '',
      items: l.items || [],
      costume_price: l.costumePrice || '',
      costume_numeric_price: l.costumeNumericPrice || 0,
      active: true,
    };
    const { error } = await supabase.from('looks').upsert(row, { onConflict: 'look_id' });
    if (error) throw new Error(`looks upsert failed: ${error.message}`);
    lookCount += 1;
  }
  console.log(`[seed] upserted ${lookCount} looks`);

  {
    const { error } = await supabase.from('cms_content').upsert(
      {
        key: 'site',
        hero: DEFAULT_CMS_CONTENT.hero,
        graphic_banner: DEFAULT_CMS_CONTENT.graphicBanner,
        category_carousel: DEFAULT_CMS_CONTENT.categories || [],
        lookbook_banner: DEFAULT_CMS_CONTENT.lookbookBanner,
        about_us: DEFAULT_CMS_CONTENT.aboutUs,
        tonto_own_make: DEFAULT_CMS_CONTENT.tontoOwnMake,
        offer_modal: DEFAULT_CMS_CONTENT.offerModal,
        shoppable_looks: SHOPPABLE_LOOKS,
      },
      { onConflict: 'key' }
    );
    if (error) throw new Error(`cms upsert failed: ${error.message}`);
  }
  console.log('[seed] upserted cms singleton (key=site)');

  const promoCode = String(DEFAULT_CMS_CONTENT.offerModal?.promoCode || 'TONTO15').toUpperCase();
  {
    const { error } = await supabase.from('promos').upsert(
      { code: promoCode, discount_text: '15% OFF', percent: 15, active: true },
      { onConflict: 'code' }
    );
    if (error) throw new Error(`promo upsert failed: ${error.message}`);
  }
  console.log(`[seed] upserted promo ${promoCode}`);

  {
    const { error } = await supabase.from('store_settings').upsert(
      {
        key: 'store',
        store_name: BRAND_INFO?.name || 'TONTO Clothing',
        store_location: BRAND_INFO?.location,
        whatsapp_phone: BRAND_INFO?.phone,
        instagram_handle: BRAND_INFO?.instagram,
      },
      { onConflict: 'key' }
    );
    if (error) throw new Error(`settings upsert failed: ${error.message}`);
  }
  console.log('[seed] upserted store settings singleton (key=store)');

  console.log('[seed] done');
}

main().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
