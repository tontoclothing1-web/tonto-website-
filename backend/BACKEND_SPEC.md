# TONTO Clothing — Backend Requirements Map (Frontend Audit)

> Auditor: Agent 1 — Frontend Auditor
> Source of truth: `src/App.jsx`, `src/data/products.js`, `src/data/defaultCms.js`, `src/components/*.jsx`
> Date: 2026-10-13
> Store: TONTO Clothing, Coimbatore (Opposite to Prozone Mall, Sathy Road, Coimbatore, TN 641035, India)
> Phone/WhatsApp: `+91 82483 21214` / `+918248321214` — Instagram: `@tonto_clothing_` (`https://instagram.com/tonto_clothing_`), Maps: `https://share.google/6kenpRy2HPjbnZ9Lo`
> Frontend persistence today: **100% localStorage + sessionStorage, no backend, no real auth**.

---

## 0. Complete localStorage / sessionStorage key inventory (exact keys)

| Key | Type | Written / read by | Shape |
|---|---|---|---|
| `tonto_admin_products` | JSON array | `App.jsx` (init + persist products state) | `Product[]` |
| `tonto_products` | JSON array | `CheckoutPage` (stock decrement), `AccountPage` (stock restore), `App.jsx` sync listener reads it | Legacy/inventory copy of `Product[]` with `stock: number`, `inStock: boolean`. **BUG/INCONSISTENCY: App writes `tonto_admin_products` but Checkout decrements `tonto_products`; sync reads `tonto_products` into products state.** Backend must unify to one canonical products table. |
| `tonto_admin_orders` | JSON array | `CheckoutPage` (prepend on place order), `AdminDashboard` (CRUD + persist on every change), `AccountPage` (read + cancel) | `Order[]` |
| `tonto_admin_enquiries` | JSON array | `EnquiryModal`, `CheckoutPage`, `AdminDashboard` | `Enquiry[]` |
| `tonto_admin_leads` | JSON array | `OfferModal`, `EnquiryModal`, `CheckoutPage`, `DropWaitlistBanner`, `Footer`, `AdminDashboard` | `Lead[]` |
| `tonto_admin_subscribers` | JSON array | `OfferModal`, `Footer`, `AdminDashboard` | `Subscriber[]` |
| `tonto_admin_promos` | JSON array | `CheckoutPage` (validate + increment `uses`), `AdminDashboard` | `Promo[]` |
| `tonto_admin_settings` | JSON object | `App.jsx`, `AdminDashboard` | `StoreSettings` |
| `tonto_admin_cms` | JSON object | `App.jsx`, `CheckoutPage` (reads `offerModal.promoCode`), `AdminDashboard` | `CMSContent` |
| `tonto_admin_authenticated` | string `'true'` / absent | `AdminDashboard` only | `'true'` = admin logged in. Logout = `removeItem`. Init default: `!== 'false'` means **authenticated by default**. |
| `tonto_bag_items` | JSON array | `App.jsx` (cart state) | `CartItem[]`, seeded with 1 demo item `extra-wide-denim` |
| `tonto_saved_items` | JSON array of string | `App.jsx` | `string[]` (product ids), seeded `['extra-wide-denim']` |
| `tonto_credentials_submitted` | string `'true'` | `OfferModal` (set), `App.jsx` + `CheckoutPage` (read) | Gate for 15% offer popup + auto-apply `TONTO15` |
| `tonto_subscriber_email` | string | `OfferModal` | email that claimed offer |
| `tonto_subscriber_phone` | string (optional) | `OfferModal` | phone if provided |
| `tonto_initial_pop_shown` | string `'true'` (**sessionStorage**, not localStorage) | `App.jsx` | Ensures offer popup shows max once per tab session on home |
| Event `tonto-data-updated` (window CustomEvent) + native `storage` event | — | All writers dispatch; `App`, `AdminDashboard`, `AccountPage` listen | Poor-man's realtime sync. Backend should replace with WebSocket/SSE or polling + ETag. |

No other persistence: `AccountModal` drop-alert signup is **in-memory only** (`subscribed` boolean, never persisted — BUG, lead lost). `RegionModal` selection (`{code,label,currency,display}`) is React state only, not persisted. Account auth/profile/addresses/notifications are React state only.

---

## 1. Entities & exact fields observed

### 1.1 Product (`PRODUCTS` in `src/data/products.js`, key `tonto_admin_products` / `tonto_products`)

```js
{
  id: string,            // e.g. "tonto-studios-waffle-black", new: `tonto-${Date.now()}`
  slug: string,          // URL slug, derived from title lowercased non-alphanum -> "-"
  title: string,         // e.g. "TONTO WAFFLE LONGSLEEVE" (UPPERCASE display)
  category: string,      // "Tees" | "Denim" | "Layers" | "Shirts" | "Bottoms" (+ virtual filters: "New Arrivals","Tops","Outerwear","Sweatpants","Accessories","Shorts","Loungewear")
  colour: string,        // British spelling everywhere! e.g. "black / woodland camo"
  fit: string,           // e.g. "Relaxed drop-shoulder"
  price: string,         // "Price on enquiry" OR "₹2,490" — ALWAYS string in seed; admin form free-text
  images: string[],      // asset URLs or dataURLs (FileReader uploads); fallback ['/assets/products/extra-wide-denim.jpg']
  image?: string,        // legacy single-image alias read in CartDrawer/EnquiryModal fallbacks
  alt: string,
  description: string,
  verifiedBrand: string, // always "unisex / TONTO"
  availability: string,  // "In stock - Coimbatore" | "Low stock" | "Sold out" (admin quick-toggle cycles these 3)
  variants: string[] | string, // sizes e.g. ["S","M","L","XL"] or ["28","30","32","34","36"] or ["One Size (Adjustable)"] or ["Pack of 5"]; admin form edits as comma string "S, M, L, XL" split on /[,/]+/
  measurements: string,  // free text e.g. "Chest: 48in | Length: 29in | Sleeve: 26in"
  isTrending: boolean,
  createdDate: string,   // "YYYY-MM-DD" e.g. "2026-09-24", used for newest sort
  // Admin/inventory-only (not in seed, added at runtime):
  stock?: number,        // default 8 (checkout) or 5 (account restore) when missing
  inStock?: boolean      // false when stock hits 0
}
```

Notes:
- `CollectionView.SAMPLE_PRICE_MAP` enriches display-only prices when `price === 'Price on enquiry'` (e.g. `extra-wide-denim -> ₹3,290`). Backend needs real `numericPrice` / `currency` — frontend currently **parses price with `parseInt(price.replace(/\D/g,''))` and falls back to 2490**. That is fragile; backend must store `priceInPaise` + display string.
- Admin product modal fields (`AdminDashboard.productFormData`): `title, category, colour, fit, price, availability, isTrending, variants (string), measurements, description, images[]` + `imageUrlInput` + file upload (dataURL) + preset gallery (`ASSET_LIBRARY_PRESETS`, 12 entries) + `GALLERY_PRESETS` (21 entries).
- Filters used: title/colour/category substring search (admin), category exact, stock substring (`includes('In stock')` etc.), collection page: category (with special-case mapping for New Arrivals/Tops/Outerwear/Sweatpants+Bottoms/Accessories), colour substring, size exact match in variants, availability `coimbatore` substring; sorts: `featured` (default order), `newest` (createdDate desc), `alpha` (title).
- `SavedItemsPage` filters from static `PRODUCTS` import (not `products` prop) — **BUG: admin-added products never appear in Saved page**. Backend wishlist must join against live catalog.

### 1.2 CartItem (`tonto_bag_items`, built in `App.handleAddToCart`)

```js
{
  id: string,       // product.id (or look item productId, or synthetic 'bag-order' / 'saved-shortlist')
  title: string,
  colour: string,   // product.colour
  size: string,     // chosen size || product.size || variants[0] || 'Standard'
  price: string,    // product.price ("Price on enquiry" common) — CartPage/CartDrawer display raw string
  image: string,    // product.image || product.images[0]
  images?: string[],// only for look-bundles
  quantity: number,
  numericPrice?: number, // only present on some admin-seed order items, NOT on cart adds — checkout parses
  variants?: string[],
  lookId?: string,  // when added from CompleteLookPage
  lookTitle?: string
}
```

Cart identity = `(id, size)` tuple. `handleUpdateCartQuantity(id,size,delta)` removes at 0. `handleClearCart` empties. No server cart today; guest cart in localStorage only.

### 1.3 Order (`tonto_admin_orders`)

Full record built in `CheckoutPage.handlePlaceOrder` (schema comment says "matching Admin Dashboard schema"):

```js
{
  id: string,              // "TONTO-123456" (random 6-digit); admin seed uses "TONTO-849201" etc.; account seed uses "TONTO-TN-84920"
  orderId: string,         // duplicate of id
  date: string,            // `new Date().toISOString().replace('T',' ').slice(0,16)` => "2026-10-13 10:15"
  customerName: string,    // `${firstName} ${lastName}`
  email: string,
  phone: string,
  deliveryMethod: "shipping" | "showroom",  // AccountPage also checks "pickup"
  shippingAddress: {
    address: string, apartment: string, city: string,
    state: string, postalCode: string, country: string // default state "Tamil Nadu", country "India"
  },
  items: [{
    id: string, title: string, colour: string, size: string,
    price: string,           // display
    numericPrice?: number,   // admin seeds include it; checkout-built items do NOT
    quantity: number, image: string
  }],
  subtotal: string,        // "₹5,780" formatted en-IN
  numericSubtotal: number,
  discountAmount: string,  // "₹0" if none
  numericDiscount: number,
  appliedPromo: string | null, // promo code e.g. "TONTO15"
  shippingFee: string,     // "Free" or "₹150"
  totalAmount: string,     // "₹6,490" formatted
  numericTotal: number,
  grandTotal?: string,     // account-seed legacy alias for totalAmount
  status: string,          // "New Hold" (default) | "Confirmed" | "Processing" | "Pending" | "Hold" | "Shipped" | "Dispatched" | "Delivered" | "Cancelled"
  paymentStatus: string,   // "Pending Payment Link" (default) | "Paid (UPI)" | "Paid (Card)" | "Cancelled / Released"
  courierPartner: string,  // "BlueDart Express" | "Delhivery Express" | "Showroom Handover"
  courier?: string,        // legacy alias read in AccountPage tracking box
  trackingNumber: string,  // "" until admin fills; seeds e.g. "BLUEDART-849201948IN"
  notes: string,           // includes delivery mode + city
  customer?: {             // checkout adds full form snapshot under `customer`
    firstName, lastName, email, phone, address, apartment,
    city, state, postalCode, country, orderNotes
  }
}
```

Pricing logic (must be replicated server-side):
- `subtotal = Σ (numericPrice ?? parseInt(price w/ non-digits) ?? 2490) * qty`
- `discountAmount = round(subtotal * promo.percent / 100)`
- `freeThreshold = parseInt(storeSettings.freeShippingThreshold digits) || 2500`
- `isFreeShipping = deliveryMethod==='showroom' || subtotal >= freeThreshold`
- `shippingFee = isFreeShipping ? 0 : 150`
- `grandTotal = max(0, subtotal - discount + shipping)`

Order side-effects on place (all localStorage today, must become transactional backend ops):
1. prepend to `tonto_admin_orders`
2. prepend derived `Enquiry` (status `Hold Reserved at Showroom`)
3. prepend derived `Lead` (source `Storefront Checkout`, stage `In Discussion`, estimatedValue=grandTotal)
4. increment `promos[].uses` for applied code
5. decrement `tonto_products[].stock`, set `inStock=false` at 0
6. dispatch `tonto-data-updated`, clear cart, show success + WhatsApp deep-link with order text.

Cancel flow (`AccountPage.handleCancelOrder`): sets `status='Cancelled'`, `paymentStatus='Cancelled / Released'`, appends ` [Cancelled by customer via Client Portal]` to notes, restores stock (`+qty`, `inStock=true` if >0). Only `New Hold|Pending|Hold` are cancellable in UI.

Admin order ops: search (id/orderId/customerName/phone/email/city/trackingNumber/item title), filters (status, deliveryMethod), sorts (`newest|oldest|amount-desc|amount-asc`), update status / payment / tracking+ courier / notes, delete, manual create (form: customerName, phone, email, deliveryMethod, address, city, state, postalCode, productId, size, quantity, unitPrice, status, paymentStatus, courierPartner, trackingNumber, notes), CSV export (headers: Order ID,Date,Customer Name,Phone,Email,City,Delivery Method,Total Amount,Status,Payment Status,Courier Partner,Tracking Number,Items), print receipt modal.

### 1.4 Enquiry (`tonto_admin_enquiries`)

```js
{
  id: string,           // "ENQ-1001" seed or `ENQ-${Date.now().toString().slice(-4)}`
  clientName: string,   // EnquiryModal: name || 'Store Shopper'; checkout: full name
  contact: string,      // phone or email or 'Direct Inquiry'
  productTitle: string, // product.title || 'General Collection' || `${n} Piece(s): ...`
  colour: string,
  size: string,
  date: string,         // "YYYY-MM-DD HH:mm"
  status: string,       // "Pending" (modal default) | "In Discussion" | "Payment Received" | "Hold Reserved at Showroom"
  notes: string         // message text or delivery/city/total summary
}
```

EnquiryModal fields: `name*`, `contact*` (phone or IG handle), `sizePreference` (from variants), `message` (prefilled `Hi TONTO, I am enquiring about the {title} ({colour})...`). Submit writes Enquiry + Lead then shows copy/WhatsApp/Instagram actions (`https://api.whatsapp.com/send?text=...`, `BRAND_INFO.instagramUrl`). CartDrawer/CartPage also build WhatsApp order text without persisting.

### 1.5 Lead / CRM (`tonto_admin_leads`)

```js
{
  id: string,           // "LEAD-101" seed or `LEAD-${last4 of Date.now()}`
  name: string,
  phone: string,        // often placeholder "+91 98400 00000" or "Awaiting WhatsApp"
  email: string,        // may be "" when only phone given
  source: string,       // "15% Welcome Modal" | "Storefront Checkout" | "Product Enquiry" | "TONTO MADE Waitlist (Drop 01)" | "TONTO Made Drop Waitlist" | "Footer Drop Alerts" | "Store Walk-In" | "Instagram Concierge" | "15% Welcome Modal" etc. — free text, needs enum + filter
  interest: string,     // e.g. "Heavyweight Waffle Longsleeve & Wide Denim", "Claimed 15% Welcome Promo (TONTO15)"
  estimatedValue: number,// 3500 (offer) | 4000 (footer) | 4500 (waitlist/enquiry) | grandTotal (checkout) | custom
  stage: string,        // "New" | "In Discussion" | "Converted"
  date: string,         // "YYYY-MM-DD"
  notes: string
}
```

Admin lead ops: search (name/phone/email/interest/notes), filters (stage, source), create/edit modal (`name*, phone*, email, source, interest, estimatedValue, stage, notes`), stage quick-update, delete, CSV export (`ID,Name,Phone,Email,Source,Stage,Estimated Value,Interest,Date,Notes`), pipeline sum display.

### 1.6 Subscriber (`tonto_admin_subscribers`)

```js
{
  email: string,
  phone?: string,   // only from OfferModal when provided
  source: string,   // "15% Welcome Modal" | "Drop 01 Waitlist" | "Footer Drop Alerts"
  date: string      // "YYYY-MM-DD"
}
```

Writers: `OfferModal` (email* + optional phone), `Footer` newsletter (email*), `AccountModal` does NOT persist (bug). Admin: list, CSV export (`Email,Source,Date Joined`), copy-all-emails. No unsubscribe/delete UI — backend needs it.

### 1.7 Promo (`tonto_admin_promos`)

```js
{
  code: string,      // e.g. "TONTO15" (uppercase compare)
  discount: string,  // display "15% OFF" — checkout derives percent from this string if `percent` missing (includes('20')->20 etc.)
  percent?: number,  // 15 | 20 | 10 — admin create form has it; seeds have it
  type: string,      // "Welcome Privilege" | "Private Drop Access" | "Return Customer" | "Exclusive Campaign Privilege"
  active: boolean,
  uses: number       // 38, 12, 5 in seeds; incremented on checkout
}
```

Defaults when key empty (`CheckoutPage`): `TONTO15/15`, `TONTOVIP/20`, `ARCHIVE10/10` all active + dynamic push of `cms.offerModal.promoCode` (15%). Auto-apply: if `tonto_credentials_submitted==='true'`, checkout pre-applies `{code:'TONTO15', discountText:'15% OFF', percent:15}`. Admin: create (`code, discount, type, percent, active`), toggle active, delete presumably, `uses` counter.

### 1.8 StoreSettings (`tonto_admin_settings`)

```js
{
  storeName: string,            // "TONTO Clothing"
  storeLocation: string,        // App default: "Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India"; Admin default: "Coimbatore, Tamil Nadu, India"
  whatsappPhone: string,        // App default "+91 82483 21214"; Admin default "+91 98400 00000" (INCONSISTENT — backend must be single source)
  instagramHandle: string,      // "@tonto_clothing_"
  announcementText: string,     // "✦ EXCLUSIVE PRIVILEGE: 15% OFF FIRST ORDER • CLAIM CODE | SIGN IN"
  freeShippingThreshold: string // "₹2,500" — parsed to int for shipping logic
}
```

Consumed by `Header` (announcement bar, sign-in/claim buttons), `App` concierge WhatsApp link (`whatsappPhone` digits-only), `CheckoutPage` free-shipping threshold.

### 1.9 CMSContent (`tonto_admin_cms`, defaults `DEFAULT_CMS_CONTENT`)

```js
{
  hero: { image, tagline, headline, buttonText },
  graphicBanner: { image, subtitle, headline, buttonText },
  lookbookBanner: { image, headline, buttonText },
  tontoOwnMake: {
    badge, headline, description,
    card1Image, card1Tag, card1Title, card1Desc,
    card2Image, card2Tag, card2Title, card2Desc,
    card3Image, card3Tag, card3Title, card3Desc
  },
  categories: [{ id, title, subtitle, categoryFilter, image }],  // aka categoryCarousel (App reads cmsContent?.categoryCarousel || cmsContent?.categories)
  categoryCarousel?: [...],  // alias, same shape
  shoppableLooks: Look[],    // defaults to SHOPPABLE_LOOKS
  aboutUs: { heroImage, card1Image, card2Image, card3Image },
  offerModal: {
    image, tag, badge, headline, description,
    privilegeTag, title, subtitle, buttonText, promoCode // default "TONTO15"
  }
}
```

Admin CMS tabs (`cmsSectionTab`): `hero | graphic | lookbook | tontoMade | categories | shoppable | about | couponModal`. Uploads via FileReader → dataURL (images + video for looks), preset pickers (`GALLERY_PRESETS` 21 entries, `ASSET_LIBRARY_PRESETS` 12 entries). App merges saved CMS over defaults with special deep-merge for `offerModal`.

### 1.10 Look / Complete Look (`SHOPPABLE_LOOKS`, also `cms.shoppableLooks`)

```js
{
  id: string,               // "look-1".."look-5"
  image: string,            // may be .mp4 (look-3 has video field + image fallback logic)
  video?: string,           // e.g. "/assets/videos/look-preview.mp4"
  mediaType?: string,       // "video" when uploaded via admin
  title: string,            // "Chain-Graffiti Baggy Streetwear Look"
  shortTitle: string,
  costumePrice: string,     // "₹6,980"
  costumeNumericPrice: number,
  itemsCount: number,
  description: string,
  thumbnail: string,
  productId: string,        // hero product link
  colour: string, fit: string,
  tag?: string,             // e.g. "SAME STORIES DIFFERENT PEOPLE"
  isCenter?: boolean,
  items: [{
    id: string,             // "item-1-top"
    role: string,           // "Top / Thermal" | "Bottom / Denim" | "Accessory / Hardware" ...
    productId: string,      // catalog link (may dangle, e.g. "archive-hardware-belts" not a real product id)
    title: string, price: string, numericPrice: number,
    colour: string, defaultSize: string, variants: string[], image: string
  }]
}
```

`App` `#/look/:id` route enriches CMS look with `SHOPPABLE_LOOKS` defaults. `CompleteLookPage` supports per-item checkbox + size select, live total, add-all-to-bag, instant-checkout (adds then navigates), WhatsApp order with `BRAND_INFO.phoneRaw`.

### 1.11 User / Account (no localStorage today — all `useState` in `AccountPage`)

```js
// Auth form
{ authMode: "signin"|"register"|"recovery", authEmail, authPassword, authName, authPhone }
// Profile (seeded demo "Karthik Raja")
{ name, email, phone, topSize: "L" ("S"|"M"|"L"|"XL"|"XXL"), bottomWaist: "32" ("28"|"30"|"32"|"34"|"36") }
// Address
{ id: "addr-1", label: "Primary Delivery", recipient, phone, address, city, state, postalCode, isDefault: true }
// Notifications
{ denimDrops: true, surplusFinds: true, vintageGraphics: false, showroomAppointments: true }
// Account tabs: orders | profile | addresses | notifications
```

### 1.12 Region (React state only, `RegionModal.REGIONS`)

```js
{ code: "IN"|"US"|"AE"|"GB"|"SG", label, currency: "INR (₹)"|"USD ($)"|"AED (د.إ)"|"GBP (£)"|"SGD (S$)", display: "INDIA"|... }
// App default: { code:'IN', label:'India', currency:'INR (₹)', display:'INDIA' }
```

No persistence, no price conversion — display only. Backend should store FX + per-region pricing if ever needed.

### 1.13 Category presets (`CATEGORIES` in products.js, mirrored in defaultCms.categories)

`{ id, title, subtitle, categoryFilter, image }` — 6 entries (new-arrivals, new-denim, new-outerwear, new-sweatpants, new-tops, new-accessories). Collection page has 8 filter pills (denim, bottoms, shorts, tees, tops, outerwear, loungewear, accessories).

---

## 2. User flows that need APIs

### F1. Browse catalog (guest)
`Home (HeroBanner, TrendingStyles, GraphicBanner, CategoryCarousel, LookbookBanner, TontoMadeProducts, ShoppableLooks) → CollectionView (filter/sort/paginate) → ProductDetailPage → QuickViewModal`
Needs: `GET /products` (filter category/colour/size/availability, search q, sort featured|newest|alpha, pagination), `GET /products/:id-or-slug`, `GET /categories`, related products (`same category OR isTrending`, limit 4). Frontend hash routes to preserve: `#/collection?category=&color=&size=&sort=&availability=`, `#/product/:id`.

### F2. Search
`SearchDialog` — client-side substring over title/category/colour/fit/description, shows first 4 as "Popular" when empty.
Needs: `GET /search?q=` (full-text + typo tolerance, return products + looks), debounce, analytics (log queries). Must handle empty-q → curated popular list.

### F3. Saved items / wishlist (guest → user)
Toggle bookmark anywhere (`handleToggleSave`), `SavedItemsDrawer`, `SavedItemsPage` (add-to-bag, remove, enquire-all-as-one synthetic product).
Needs: guest wishlist in localStorage now; backend: `GET/POST/DELETE /wishlist` (auth) + merge-on-login (`POST /wishlist/merge {ids}`). Note SavedItemsPage bug (reads static import) — backend join fixes it.

### F4. Cart / bag (guest)
`handleAddToCart(product,size,qty)` keyed by `(id,size)`, `CartDrawer` (copy summary, WhatsApp checkout, combined `bag-order` enquiry), `CartPage` (qty +/-, remove, clear, WhatsApp checkout text).
Needs: guest cart localStorage OK for MVP; authenticated: `GET/PUT /cart` (items with product snapshot + size/qty validation vs stock), `POST /cart/validate` (price/stock re-check before checkout). WhatsApp text format must be preserved server-side for share links.

### F5. Checkout (3 steps: details → review → pending → success|failure)
Fields: `firstName*, lastName*, email*, phone* (min 8), deliveryMethod (shipping|showroom), address*, apartment, city*, state, postalCode* (min 5), country, orderNotes`; promo apply/remove; shipping calc (see §1.3); `simulateError` dev checkbox (must NOT ship to prod).
Needs: `POST /promos/validate {code}`, `POST /checkout/quote {items,promoCode,deliveryMethod}` (server-computed totals), `POST /orders` (transactional: create order + enquiry + lead + promo use + stock decrement), `GET /orders/:id` confirmation. Payment today is "reserve hold + WhatsApp payment link later" — backend must model `paymentStatus` state machine, not real charge.

### F6. Promo / privilege code
Apply at checkout; auto-apply `TONTO15` when `tonto_credentials_submitted`; CMS promoCode also valid; inactive → error; unknown → error.
Needs: `POST /promos/validate`, admin `CRUD /promos`, `uses` atomic increment, per-customer single-use enforcement (currently missing).

### F7. Offer claim — 15% off (lead magnet)
Triggers: home first-visit (800ms, once/session), featured entry (500ms), IntersectionObserver on `#trending-section`/`#tonto-own-make` (300ms), header CLAIM CODE, mobile menu, DropWaitlistBanner link, footer. Form: `email*`, `phone?` → reveals `PROMO_CODE` (default TONTO15), copies to clipboard, sets `tonto_credentials_submitted`, writes Subscriber + Lead, auto-dismiss 2.5s, "Apply & shop" navigates to collection.
Needs: `POST /offers/claim {email,phone,source:'15% Welcome Modal'}` → `{promoCode, alreadyClaimed}` + idempotent dedupe by email, rate-limit, double-opt-in email/SMS later.

### F8. Product enquiry via WhatsApp/Instagram
`EnquiryModal` (per product), `ProductDetailPage` ask-about, `CartDrawer` bag-order, `SavedItemsPage` shortlist enquiry, concierge `Ask About Sizing & Prices`, `VisitUsModal/Page` call/WhatsApp/maps.
Needs: `POST /enquiries` (persist + notify admin via WhatsApp/email), `GET /enquiries/mine`, admin triage. WhatsApp deep-links (`api.whatsapp.com/send?phone=&text=`) and `wa.me/` variants must keep working; backend should generate canonical message templates (product, bag, look, order-ref).

### F9. Waitlist — Drop 01
`DropWaitlistBanner` email* → Lead (source `TONTO MADE Waitlist (Drop 01)`, interest `In-House Debut Capsule...`, value 4500). Footer newsletter → Subscriber + Lead (source mismatch: subscriber `Footer Drop Alerts` but lead `TONTO Made Drop Waitlist` — normalize). AccountModal signup → nowhere (fix).
Needs: `POST /waitlist {email, dropId:'drop-01'}` + dedupe, `GET /waitlist/count`, launch-notify job.

### F10. Saved/shortlist bulk enquiry — covered in F3/F8.

### F11. Complete look / costume bundle
`LookbookView` (editorial grid, alternating layout) → `CompleteLookPage` (`#/look/:id`): per-item toggle + size, live bundle total, add-entire-costume, instant-checkout, WhatsApp exact-look order.
Needs: `GET /looks`, `GET /looks/:id` (with resolved product refs + availability), `POST /cart/bundle {lookId, selections:[{itemId,size,include}]}`. Dangling `productId`s (e.g. `archive-hardware-belts`) must resolve or 404 gracefully.

### F12. Customer account (orders, profile, addresses, alerts)
`AccountModal` (drop-alert mini form + portal/saved links) → `AccountPage` (signin|register|recovery tabs; demo bypass button; authed tabs orders|profile|addresses|notifications; cancel order + stock restore).
Needs: full auth (`POST /auth/register|login|logout|refresh|password-forgot|password-reset`), `GET/PATCH /me`, `GET/POST/PATCH/DELETE /me/addresses`, `GET /me/orders` (scoped to user — today shows ALL admin orders!), `POST /orders/:id/cancel`, `GET/PATCH /me/preferences` (sizes + notification toggles).

### F13. Visit us / policies / region (static + settings)
`VisitUsPage/Modal` (address, landmark, phone, maps share + embed), `PolicyPage` (shipping|returns|size-guide|privacy|terms tabs), `RegionModal` (5 regions).
Needs: `GET /store/settings` (public: name, location, whatsapp, instagram, announcement, threshold, maps URLs), `GET /store/policies/:tab` (CMS-driven), region list + currency display (no conversion today).

### F14. Admin CRUD (all tabs)
Tabs: `overview | products | orders | enquiries | leads | subscribers | promos | cms | settings`. Passcode gate + 1-click access. Overview stats (implied revenue/counters — read code before building). Products CRUD + trending toggle + 3-state stock toggle + reset-catalog; Orders full lifecycle + manual create + CSV + print receipt; Enquiries status update; Leads CRM + CSV; Subscribers CSV + copy-all; Promos CRUD; CMS section editors (hero/graphic/lookbook/tontoMade/categories/shoppable/about/couponModal) with image/video upload + preset galleries + reset-to-defaults; Settings editor.
Needs: every `GET/POST/PATCH/DELETE /admin/*` below + `POST /admin/media/upload` (object storage, replace dataURLs — dataURLs will blow up localStorage/backend row size), audit log.

---

## 3. Proposed REST API table (~34 endpoints)

Conventions: JSON, `₹` display + `*InPaise` integers, ISO-8601 dates, pagination `?page&limit&sort`, filter query params, auth `Bearer JWT (customer)` vs `Bearer JWT (admin)`. British `colour` kept for compat + alias `color` accepted.

| # | Method + Path | Auth | Request | Response | Frontend flow |
|---|---|---|---|---|---|
| 1 | `POST /api/auth/register` | public | `{name, email, phone, password, topSize?, bottomWaist?}` | `{user:{id,name,email,phone,topSize,bottomWaist}, tokens:{access,refresh}}` | F12 register tab (currently fake) |
| 2 | `POST /api/auth/login` | public | `{email, password}` | `{user, tokens}` | F12 signin tab |
| 3 | `POST /api/auth/refresh` | refresh token | `{refreshToken}` | `{access}` | session renewal |
| 4 | `POST /api/auth/logout` | customer | `{refreshToken?}` | `204` | sign out |
| 5 | `POST /api/auth/password-forgot` | public | `{email}` | `{message}` (always 200, no enumeration) | recovery tab |
| 6 | `POST /api/auth/password-reset` | token | `{token, newPassword}` | `{message}` | recovery complete |
| 7 | `GET /api/products` | public | `?category&color|colour&size&availability&q&sort=featured\|newest\|alpha\|price-asc\|price-desc&page&limit` | `{items:Product[], total, page}` | F1 collection + filters |
| 8 | `GET /api/products/:idOrSlug` | public | — | `Product` + `related:Product[4]` | F1 PDP + related |
| 9 | `GET /api/search` | public | `?q&limit` (empty → popular 4) | `{products, looks}` | F2 SearchDialog |
| 10 | `GET /api/categories` | public | — | `{id,title,subtitle,categoryFilter,image}[]` | pills + carousel |
| 11 | `GET /api/looks` | public | — | `Look[]` | F11 lookbook grid, shoppable carousel |
| 12 | `GET /api/looks/:id` | public | — | `Look` with resolved `items[].product` + availability | F11 complete-look page |
| 13 | `GET /api/cart` | customer (guest: skip) | — | `{items:CartItem[], quote}` | F4 authed bag |
| 14 | `PUT /api/cart` | customer | `{items:[{productId,size,quantity}]}` (upsert by id+size) | `{items, quote}` | sync guest→server |
| 15 | `POST /api/cart/validate` | public/customer | `{items, promoCode?, deliveryMethod?}` | `{valid, issues[], quote:{subtotal,discount,shipping,total}}` | pre-checkout re-price |
| 16 | `POST /api/promos/validate` | public | `{code}` | `{valid, code, percent, discountText}` or `422 {error:'unknown'|'inactive'|'expired'|'already-used'}` | F6 apply box |
| 17 | `POST /api/checkout/quote` | public | `{items,promoCode,deliveryMethod,pincode?}` | `{subtotal,discount,shippingFee,total,freeThreshold}` | order summary panel |
| 18 | `POST /api/orders` | public* (guest allowed, link if authed) | `{customer:{firstName,lastName,email,phone}, deliveryMethod, shippingAddress?, orderNotes?, items:[{productId,size,quantity}], promoCode?}` | `{order} + {enquiryId, leadId}` | F5 place order (transactional side-effects §1.3) |
| 19 | `GET /api/orders/:id` | public w/ email+id OR customer | `?email=` for guest lookup | `Order` | success page / tracking |
| 20 | `GET /api/me/orders` | customer | `?status&page` | `Order[]` scoped to user | F12 order holds tab (FIX: stop leaking all orders) |
| 21 | `POST /api/orders/:id/cancel` | customer (owner) | `{reason?}` | `{order}` (status Cancelled + stock restored) | F12 cancel hold |
| 22 | `POST /api/enquiries` | public | `{name, contact, productId?, size?, message}` | `{enquiry, leadId}` + admin notify | F8 modal submit |
| 23 | `POST /api/offers/claim` | public | `{email, phone?, source}` | `{promoCode, alreadyClaimed:boolean}` idempotent | F7 15% claim |
| 24 | `POST /api/waitlist` | public | `{email, dropId='drop-01'}` | `{joined, position?}` deduped | F9 Drop 01 banner |
| 25 | `POST /api/subscribers` | public | `{email, phone?, source}` | `{subscribed, alreadySubscribed}` | F9 footer + modal (FIX AccountModal) |
| 26 | `GET /api/wishlist` | customer | — | `{productIds, products}` | F3 saved page |
| 27 | `PUT /api/wishlist` | customer | `{productIds:string[]}` or `{productId, saved:boolean}` | `{productIds}` | toggle bookmark |
| 28 | `POST /api/wishlist/merge` | customer | `{productIds:string[]}` (guest localStorage) | `{productIds}` union | login merge |
| 29 | `GET /api/me` / `PATCH /api/me` | customer | `{name?,phone?,topSize?,bottomWaist?,notifications?}` | `User` | F12 profile + alerts |
| 30 | `CRUD /api/me/addresses` (`GET/POST/PATCH /:id/DELETE /:id`) | customer | `{label,recipient,phone,address,city,state,postalCode,isDefault}` | `Address` | F12 addresses tab |
| 31 | `GET /api/store/settings` | public | — | `StoreSettings` (safe subset) | header/announcement/checkout threshold |
| 32 | `GET /api/store/policies/:tab` | public | `tab=shipping\|returns\|size-guide\|privacy\|terms` | `{tab, html|blocks}` | F13 PolicyPage |
| 33 | Admin: `GET/POST /api/admin/products`, `PATCH/DELETE /api/admin/products/:id`, `POST /api/admin/products/:id/trending`, `POST /api/admin/products/:id/stock` | admin | Product payloads (multipart or JSON + media URLs) | `Product` | F14 products tab |
| 34 | Admin: `GET/POST /api/admin/orders` (+ `PATCH /:id/status|payment|tracking|notes`, `DELETE /:id`, `GET /:id/receipt`, `GET /export.csv`) | admin | order filters/sorts per §1.3 | `Order` | F14 orders tab |
| 35 | Admin: `CRUD /api/admin/enquiries`, `CRUD /api/admin/leads` (+ export), `GET /api/admin/subscribers` (+ export), `CRUD /api/admin/promos`, `GET/PUT /api/admin/cms` (+ `/:section`), `PUT /api/admin/settings`, `POST /api/admin/media/upload`, `GET /api/admin/overview` | admin | per-entity shapes §1 | mixed | F14 remaining tabs |

Media upload must return CDN URLs (never store FileReader dataURLs in DB). CSV exports stream with headers from §1.3/1.5/1.6.

---

## 4. Auth / RBAC needs & current gaps (read carefully)

### What exists today
- **Customer "auth" is fake.** `AccountPage.handleAuthSubmit` only checks `email.includes('@')`, waits 600ms, sets `isAuthenticated=true`. No password check, no storage, no session. "Preview Verified Customer Dashboard" button bypasses entirely. Recovery just shows a toast. Profile/addresses/notifications are hardcoded demo data (`Karthik Raja`, 1 address, 4 toggles).
- **Admin "auth" is a passcode + bypass.** `AdminDashboard`: default `isAuthenticated = localStorage.tonto_admin_authenticated !== 'false'` → **logged in on first visit**. Passcodes accepted: `tonto | tonto2026 | admin` (case-insensitive, client-side). "1-CLICK INSTANT ACCESS" sets `true` with no secret. Logout merely removes the key. Ctrl/Cmd+Shift+A toggles `/admin` route with no check (`App.jsx`).
- **No RBAC boundary.** Customer `AccountPage` reads **entire** `tonto_admin_orders` array (all customers' orders, phones, emails, addresses) and can mutate any order's status/stock. Any XSS or shared device exposes PII. Admin dashboard is reachable at `#/admin` and `/admin` with zero server enforcement.
- **No transport security / validation.** All writes are unsanitized `JSON.parse(localStorage)` with no schema, no rate limits, no dedupe (duplicate subscribers/leads on every submit), `LEAD/ENQ` ids from `Date.now()%10000` (collisions), order ids from `Math.random` (guessable, collisions), price trusted from client string, promo percent derived from display text, `uses` increment is read-modify-write race, stock decrement reads a *different key* than the catalog writes.

### What the backend must enforce
1. **Real customer auth:** bcrypt/scrypt passwords, email verification, JWT access (15min) + rotating refresh (30d, reuse detection), forgot/reset via single-use expiring tokens, rate-limit login (e.g. 5/min/IP), lockout + CAPTCHA after failures. Migrate demo profile/addresses/notifications to `users`, `addresses`, `preferences` tables scoped by `user_id`.
2. **Real admin auth + RBAC:** separate `admins` table, strong random passcode → replace with SSO/password + TOTP 2FA; roles `owner | staff | viewer` (viewer read-only, staff no settings/promos-delete, owner all); middleware on every `/api/admin/*` + `/api/me/orders` scoping (`WHERE user_id = auth.id`); never return other customers' PII to clients; audit-log all admin mutations (who/what/when/before-after).
3. **Promo integrity:** server-side promo table (`code UNIQUE, percent, active, starts_at, ends_at, max_uses, per_user_limit`); `validate` + `apply` in a transaction; `uses` via atomic `UPDATE ... SET uses = uses+1`; per-user redemption table to stop TONTO15 reuse; CMS `promoCode` must reference the same row.
4. **Order integrity:** server-computed quote (never trust client totals); stock check + decrement in a DB transaction (`SELECT ... FOR UPDATE`); idempotency key on `POST /orders` (retry-safe, replaces `simulateError` chaos); guest orders linked by email + lookup token, auto-linked on register/login by email match (with verification).
5. **Abuse controls:** rate-limit offer claim / waitlist / enquiry / newsletter per IP+email (e.g. 3/hr), honeypot + email validation (MX/OTP for high-value), idempotent dedupe (unique partial index on lower(email)+source+dropId), unsubscribe tokens for subscribers, GDPR-style export/delete (`GET /me/export`, `DELETE /me`).
6. **Secrets & config:** remove hardcoded passcodes, dev failure toggle, and placeholder phones (`+91 98400 00000`) from client; single canonical `store_settings` row (resolve whatsappPhone inconsistency); WhatsApp/Instagram/maps links from settings API.
7. **Migration notes for backend agents:** seed from `PRODUCTS` (25), `SHOPPABLE_LOOKS` (5 looks / 14 items), `DEFAULT_CMS_CONTENT`, `CATEGORIES`, `GALLERY_PRESETS`; add `price_paise` + `currency='INR'` columns (backfill by parsing `price` strings, fallback 249000); unify `tonto_products` vs `tonto_admin_products` into one `products` table with `stock`, `in_stock`; import localStorage orders/enquiries/leads/subscribers with dedupe + re-issued ids (`TONTO-`, `ENQ-`, `LEAD-` sequences, not random); store CMS images as object-storage URLs (migrate dataURLs out); keep `colour` column name + `color` API alias.

---

## Appendix A — Route map (frontend hash routes backend should support via deep links)

`#/` home · `#/featured` · `#/new-arrivals` · `#/collection?category=&color=&size=&sort=&availability=` · `#/product/:idOrSlug` · `#/cart` · `#/checkout` · `#/account` · `#/saved` · `#/lookbook|#/tonto-made` · `#/look/:id` · `#/about` · `#/visit` · `#/policy/:tab(shipping|returns|size-guide|privacy|terms)` · `#/admin|/admin` (admin only) · 404 fallback. Secret shortcut Ctrl/Cmd+Shift+A toggles admin (remove in prod).

## Appendix B — Files read for this spec
`src/App.jsx` (1052 lines) · `src/data/products.js` (843) · `src/data/defaultCms.js` (127) · `Header, CheckoutPage (945), CartPage, CartDrawer, AccountPage (741), AccountModal, AdminDashboard (1451+ lines, 8 tabs), OfferModal, EnquiryModal (359), SearchDialog, CollectionView, ProductDetailPage (576), SavedItemsPage, CompleteLookPage (467), LookbookView, PolicyPage, VisitUsPage, DropWaitlistBanner, Footer, VisitUsModal, RegionModal` + `localStorage` grep (78 hits).
