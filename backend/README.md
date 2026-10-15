# TONTO Clothing — Backend

Express + Supabase (Postgres) API for the TONTO Clothing storefront.

## 1. Run instructions

```bash
cd /Users/Apple/Desktop/tontoclothing/backend
cp .env.example .env        # fill SUPABASE_URL + keys + JWT_SECRET
npm install
npm run dev                 # node --watch src/server.js
```

Setup Supabase (one time, in this order):
1. Create a project at https://supabase.com/dashboard
2. Project Settings → API → copy URL, anon key, service_role key into `backend/.env`
3. SQL Editor → run `backend/supabase/schema.sql` (creates all tables + seed promos)
4. SQL Editor → run `backend/supabase/migration_002_perf.sql`
5. SQL Editor → run `backend/supabase/migration_003_security_and_integrity.sql`
   — **not optional.** Until it runs, RLS is off on every table, so the anon key
   reads `users.email` / `users.password_hash` straight from PostgREST, and the
   `reserve_stock()` / `claim_promo_use()` helpers the API prefers do not exist
   (checkout silently degrades to non-atomic read-modify-write).
   Check with: `node backend/scripts/check-migration-003.mjs` (it verifies 003 and 004)
6. SQL Editor → run `backend/supabase/migration_004_admin_crm_fields.sql`
   — the Studio Admin desk's lead / enquiry / promo fields. Until it runs, saving
   a lead stage or a promo answers `42703 column … does not exist`.
7. Project Settings → API → **rotate both keys**, then update `backend/.env` —
   the previous anon key shipped inside a public bundle and was usable live.
8. Storage → create public bucket `tonto-uploads` (for product image uploads)
9. `npm run seed` to load the 25 frontend products

Required env (`backend/.env.example`):

| Var | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `SUPABASE_URL` | `https://xyz.supabase.co` | Supabase project URL (routes return `503` without it) |
| `SUPABASE_ANON_KEY` | `eyJ…` | Supabase publishable key. The API does not use it — kept only for `scripts/check-migration-003.mjs` to prove RLS denies it. The storefront no longer ships it. |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` | Supabase service key (server-side, bypasses RLS) |
| `SUPABASE_STORAGE_BUCKET` | `tonto-uploads` | Storage bucket for uploads |
| `JWT_SECRET` | long random string | Bearer-token signing (matches `tonto_auth_token`) |
| `JWT_EXPIRES_IN` | `7d` | Token TTL |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowlist (comma-separated) |

Health check: `GET http://localhost:5000/api/health`

> `src/server.js` (other agent) should `import app from './app.js'`,
> `await connectDB()`, then `app.listen(PORT)`. `src/app.js` alone exports the
> configured Express app and is import-safe without a DB connection.

## 2. Endpoint table

### Agent 5 — implemented here

| Method & path | Auth | Description |
|---|---|---|
| `GET /api/wishlist[?deviceId=]` | optional JWT, else guest `deviceId` | List my saved `productId`s (replaces `tonto_saved_items`) |
| `POST /api/wishlist` `{productId, deviceId?}` | optional JWT | Save a piece (idempotent — returns `alreadySaved:true` on dup) |
| `DELETE /api/wishlist/:productId[?deviceId=]` | optional JWT | Remove a piece |
| `DELETE /api/wishlist?productId=&deviceId=` | optional JWT | Legacy-query alias for the above |
| `GET /api/looks` | public | Active looks feed (`LookbookView`, `ShoppableLooks`) |
| `GET /api/looks/:id` | public | One look by `lookId` (`look-3`) or Mongo `_id` |
| `POST /api/looks` | admin | Create look |
| `PUT /api/looks/:id` | admin | Update look |
| `DELETE /api/looks/:id[?soft=1]` | admin | Delete (or deactivate with `?soft=1`) |
| `GET /api/products/:id/reviews` | public | Approved reviews + `averageRating` |
| `POST /api/products/:id/reviews` `{rating 1-5, comment?}` | customer | Submit review (enters moderation, `approved:false`) |
| `PATCH /api/reviews/:id/approve` | admin | Approve review |
| `GET /api/reviews[?productId=&approved=]` | admin | Moderation queue |
| `DELETE /api/reviews/:id` | admin | Reject/delete review |
| `GET /api/account` | customer | Profile snapshot (sizes + addresses) |
| `GET /api/account/orders` | customer | My orders (empty + `note` until Order model ships) |
| `GET /api/account/addresses` | customer | List addresses |
| `POST /api/account/addresses` | customer | Add address |
| `DELETE /api/account/addresses/:addressId` | customer | Remove address |
| `PUT /api/account/sizes` `{topSize?, bottomWaist?}` | customer | Update size profile |
| `GET /api/policies/:tab` | public | `shipping\|returns\|privacy\|terms\|size-guide` static JSON |
| `GET /api/policies` | public | Tab index |
| `GET /api/store/info` | public | brand, location, hours, maps URL, whatsapp, instagram |
| `GET /api/store` | public | Alias of the above |

### Other agents

| Method & path | Auth | Description |
|---|---|---|
| `POST /api/orders` | optional JWT | Checkout — prices/stock/promo resolved server-side, `clientRequestId` makes a replay return the original order |
| `POST /api/orders/quote` | public | Server-computed totals (no writes) |
| `GET /api/orders/my` | customer | My orders |
| `GET /api/orders/:id` | owner or admin | One order — 404 for anyone else's, so ids are not confirmable |
| `POST /api/orders/:id/cancel` | owner | Cancel a held order, stock returns |
| `GET /api/orders` | admin | List `?status=&deliveryMethod=&search=&page=&limit=` |
| `PATCH /api/orders/:id/status` | admin | Fulfilment update (transition-guarded, auto-restock on cancel/refund) |
| `GET/PUT /api/cms` | public / admin | Homepage sections |
| `GET/PUT /api/settings` | public / admin | Single `store_settings` row |
| `GET /api/promos` · `POST/PUT/DELETE /api/promos/:code` | admin | Promo CRUD |
| `POST /api/promos/validate` | public | `200 {valid:false, reason}` — branch on the body |
| `POST/PATCH/GET /api/enquiries` | public / admin | Enquiry + status update |
| `POST /api/leads/claim-offer` · `/waitlist` · `GET /api/leads` | public / admin | Offer claims, drop waitlist, CRM list |
| `POST /api/uploads` | admin | Image → Supabase Storage |
| `POST /api/auth/register` · `/login` · `GET /auth/me` · `PUT /auth/profile` | — / customer | Email+bcrypt, JWT in `tonto_auth_token` |
| `POST /api/auth/admin/login` `{passcode}` | public (rate-limited) | Owner passcode → admin JWT |
| `POST /api/auth/forgot-password` | public | Reset token (single-use, expiring) |

Routers are imported statically in `src/app.js` — a broken route file crashes the
boot instead of being skipped and quietly serving 404s.

## 3. Data models (Agent 5)

- `src/models/Wishlist.js` — `{ user ref User | deviceId, productId }`,
  partial unique indexes on `(user, productId)` and `(deviceId, productId)`.
- `src/models/Look.js` — `{ lookId unique, title, image, items[{productId,…}], costumePrice, costumeNumericPrice, active, … }`
  Extra storefront fields (`thumbnail`, `video`, `shortTitle`, `tag`, `fit`) kept so
  `CompleteLookPage` needs no reshaping.
- `src/models/Review.js` — `{ productId, user ref, rating 1-5, comment, approved }`,
  unique `(productId, user)`; re-POST updates + re-queues moderation.

## 4. Frontend migration checklist (localStorage → API)

Frontend glue: `src/lib/api.js` (fetch wrapper, `VITE_API_URL`, JWT from
`localStorage[tonto_auth_token]`, guest id `localStorage[tonto_device_id]`)
and root `.env.example` (`VITE_API_URL=http://localhost:5000/api`).

| Today (localStorage / constant) | Migrate to | Notes |
|---|---|---|
| `tonto_saved_items` (`App.jsx` `savedIds`) | `wishlist.list/add/remove` from `src/lib/api.js` | On login call `wishlist.migrateFromLocal(savedIds)` once, then clear the key; guests keep `tonto_device_id` |
| `SavedItemsPage.jsx` / `SavedItemsDrawer.jsx` `PRODUCTS.filter(savedIds)` | `wishlist.list()` + `products.get(id)` per id | Drawer/page render server ids; keep local filter as offline fallback |
| `tonto_bag_items` (`App.jsx` `cartItems`) | `cart.get/sync/clear` (cart agent) | Same guest-`deviceId` pattern as wishlist |
| `tonto_admin_products` + `PRODUCTS` / `SHOPPABLE_LOOKS` constants | `products.list/get` + `looks.list/get` | `App.jsx` `#/look/:id` enrichment logic stays as fallback for missing fields |
| `cmsContent.shoppableLooks` (`tonto_admin_cms`) | `looks.list()` | Admin writes via `POST/PUT /api/looks` (admin JWT) |
| `tonto_admin_settings` (`storeSettings`) | `store.info()` + `settings.get()` | `Header` announcement, `VisitUsPage` map/phone, `Footer` links |
| `VisitUsPage.jsx` hardcoded address/phone/map | `store.info()` (`brand, location, hours, mapsUrl, whatsapp, instagram`) | Keep constants as offline fallback |
| `PolicyPage.jsx` hardcoded tab copy | `policies.get(tab)` | Keep static copy as fallback; tabs: `shipping\|returns\|privacy\|terms\|size-guide` |
| `Footer.jsx` newsletter → `tonto_admin_subscribers`/`tonto_admin_leads` | `leads.subscribe(email)` | Fire-and-forget; keep localStorage write until leads agent ships |
| `OfferModal` 15% privilege + `tonto_credentials_submitted` | `promos.validate/claim` + `leads.create` | Gate modal on server `promoClaimed` once authed |
| New keys introduced | `tonto_auth_token` (JWT), `tonto_device_id` (guest) | Never store passwords/tokens elsewhere |

Migration order: (1) ship `.env` + `api.js`, (2) wishlist → looks → store/policies
(read-only, low risk), (3) account sizes/addresses, (4) reviews, (5) cart/orders
with their owners, (6) remove localStorage writes behind a feature flag.

## 5. Verify

```bash
cd /Users/Apple/Desktop/tontoclothing/backend
for f in src/app.js src/models/Wishlist.js src/models/Look.js src/models/Review.js \
  src/routes/wishlist.routes.js src/routes/looks.routes.js src/routes/reviews.routes.js \
  src/routes/account.routes.js src/routes/policies.routes.js src/routes/store.routes.js; do
  node --check "$f" && echo "OK $f";
done
node --check ../src/lib/api.js && echo "OK src/lib/api.js"
```
