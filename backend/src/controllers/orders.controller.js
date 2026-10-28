/**
 * Orders controller (Supabase).
 *  POST  /api/orders            — guest + auth checkout. Prices, stock and promos
 *                                 are resolved server-side; the client's totals
 *                                 are ignored entirely.
 *  GET   /api/orders/my         — authenticated customer's own orders.
 *  GET   /api/orders/:id        — one order, owner-or-admin only.
 *  POST  /api/orders/:id/cancel — owner cancels a held order, stock goes back.
 *  GET   /api/orders            — admin list.
 *  PATCH /api/orders/:id/status — admin fulfilment (transition-guarded).
 *
 * Request shapes are enforced in routes/orders.routes.js via `validate`; the
 * client's price/total fields are ignored, never merely validated.
 */
import { requireSupabase, isSupabaseConnected } from '../config/supabase.js';
import { asyncHandler } from '../middleware/auth.js';
import { quoteCart } from '../utils/pricing.js';
import { generateOrderId } from '../utils/orderId.js';
import { redeemPromoCode, releasePromoRedemption, loadStoreSettings, validatePromoByCode } from '../utils/promos.js';
import { findCheckoutRows } from '../models/Product.js';
import { reserveStock, releaseStock, releaseStockBatch } from '../utils/stock.js';
import ApiError from '../utils/ApiError.js';
import {
  createOrder as insertOrder,
  findOrderByOrderId,
  findOrderByClientRequestId,
  findOrdersByCustomer,
  updateOrderByOrderId,
  listOrders as queryOrders,
  canTransition,
  ORDER_STATUSES,
  RESTOCKABLE_STATUSES,
} from '../models/Order.js';

// Legacy frontend labels → canonical enum (CheckoutPage / AdminDashboard / AccountPage).
const LEGACY_STATUS_MAP = {
  'new hold': 'new_hold',
  new_hold: 'new_hold',
  hold: 'hold',
  pending: 'pending',
  'hold reserved at showroom': 'hold',
  confirmed: 'confirmed',
  processing: 'processing',
  shipped: 'shipped',
  dispatched: 'dispatched',
  delivered: 'delivered',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  refunded: 'refunded',
};

export const normaliseStatus = (s) => {
  const raw = String(s ?? '').trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  return LEGACY_STATUS_MAP[raw.toLowerCase()] || LEGACY_STATUS_MAP[key] || (ORDER_STATUSES.includes(key) ? key : null);
};

const LEGACY_PAYMENT_MAP = {
  'pending payment link': 'pending_payment_link',
  'paid (upi)': 'paid_upi',
  'paid (card)': 'paid_card',
  'cancelled / released': 'cancelled_released',
  refunded: 'refunded',
};

export const normalisePaymentStatus = (s) => {
  const raw = String(s ?? '').trim().toLowerCase();
  if (LEGACY_PAYMENT_MAP[raw]) return LEGACY_PAYMENT_MAP[raw];
  const snake = raw.replace(/[\s()/]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const known = ['pending_payment_link', 'paid_upi', 'paid_card', 'cancelled_released', 'refunded'];
  return known.includes(snake) ? snake : null;
};

const clampQty = (raw) => Math.max(1, Math.min(20, Math.floor(Number(raw) || 1)));

/**
 * Does this order belong to this shopper? Matched on `user_id` OR the email
 * stored on the order, so a guest order placed before signing in is still
 * readable/cancellable by whoever owns that email — and nobody else's.
 */
const orderBelongsTo = (order, user = {}) => {
  const email = String(user?.email || '').toLowerCase();
  return (
    (!!order.userId && !!user?.id && String(order.userId) === String(user.id)) ||
    (!!email && String(order.customer?.email || '').toLowerCase() === email)
  );
};

function displayPrice(unit, fallbackText) {
  if (Number.isFinite(unit) && unit > 0) return `₹${unit.toLocaleString('en-IN')}`;
  return String(fallbackText || 'Price on enquiry');
}

/**
 * Turn the client's bag into priced, in-stock lines.
 *
 * This is the fix for the single biggest hole in the old checkout: `toOrderItems()`
 * read `numericPrice` (or a parsed `price` string) straight off the request body,
 * so anyone could put ₹1 on every line and the server would happily total it.
 * Unit price, title and availability now come from the `products` row keyed by
 * `productId`; anything unknown, inactive or unpriced is a hard 400/409.
 */
async function resolveOrderItems(rawItems = [], { reserve = true } = {}) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw ApiError.badRequest('Order needs at least one item.');
  }
  if (rawItems.length > 50) throw ApiError.badRequest('Too many line items in one order.');

  const keys = rawItems.map((raw) => String(raw?.productId ?? raw?.id ?? '').trim());
  if (keys.some((k) => !k)) throw ApiError.badRequest('Every bag item must reference a product.');

  const rows = await findCheckoutRows(keys);
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(String(row.slug).toLowerCase(), row);
    byKey.set(String(row.id), row);
  }

  const resolved = [];
  const booked = [];
  try {
    for (const raw of rawItems) {
      const key = String(raw?.productId ?? raw?.id ?? '').trim();
      const row = byKey.get(key.toLowerCase()) || byKey.get(key);
      if (!row) throw ApiError.badRequest(`"${key}" is not in the catalogue.`);
      if (row.active === false) throw ApiError.conflict(`${row.title} is no longer on sale.`);

      const unit = Number(row.numeric_price ?? 0);
      if (!(unit > 0)) {
        throw ApiError.conflict(`${row.title} has no selling price yet — ask the showroom to price it.`);
      }

      const variants = Array.isArray(row.variants) ? row.variants : [];
      const wanted = String(raw?.size ?? '').trim();
      let size = wanted || variants[0] || 'Standard';
      if (variants.length > 0 && wanted) {
        const hit = variants.find((v) => String(v).toLowerCase() === wanted.toLowerCase());
        if (!hit) {
          throw ApiError.badRequest(`${row.title} is not offered in "${wanted}" (sizes: ${variants.join(', ')}).`);
        }
        size = String(hit);
      }

      const quantity = clampQty(raw?.quantity);
      if (reserve) {
        await reserveStock(row.slug, quantity);
        booked.push({ key: row.slug, qty: quantity });
      }

      const image = raw?.image || (Array.isArray(row.images) ? row.images[0] : '') || '';
      resolved.push({
        productId: row.id,
        id: row.slug,
        slug: row.slug,
        title: row.title,
        colour: String(raw?.colour ?? 'Standard').slice(0, 80),
        size: String(size).slice(0, 40),
        price: displayPrice(unit, row.price_text),
        numericPrice: unit,
        image: String(image).slice(0, 500),
        quantity,
        availableQty: Number(row.stock_qty ?? 0),
      });
    }
  } catch (err) {
    if (booked.length) await releaseStockBatch(booked);
    throw err;
  }
  return resolved;
}

async function priceOrder({ items, promoCode, deliveryMethod, consumePromo = true }) {
  const storeSettings = await loadStoreSettings();
  let promo = null;
  if (promoCode) {
    const result = consumePromo ? await redeemPromoCode(promoCode) : await validatePromoByCode(promoCode);
    if (!result.ok) throw ApiError.badRequest(result.error || 'Promo code could not be applied.');
    promo = result.promo;
  }
  const quote = quoteCart({ items, promo, deliveryMethod, storeSettings });
  return { ...quote, promo };
}

/**
 * POST /api/orders/quote — server-computed totals for the order summary.
 * Nothing is reserved or consumed; the numbers are the same ones POST /api/orders
 * will use, which is what stops the storefront from showing a client-side total.
 */
export const quoteOrder = asyncHandler(async (req, res) => {
  requireSupabase();
  const items = await resolveOrderItems(req.body?.items, { reserve: false });
  const deliveryMethod = req.body?.deliveryMethod === 'showroom' ? 'showroom' : 'shipping';
  const quote = await priceOrder({ items, promoCode: req.body?.promoCode, deliveryMethod, consumePromo: false });
  const short = items.filter((i) => i.availableQty < i.quantity).map((i) => ({ slug: i.slug, title: i.title, wanted: i.quantity, available: i.availableQty }));
  res.json({ success: true, data: { items, ...quote, insufficientStock: short, stockIssues: short.length > 0 } });
});

export const createOrder = asyncHandler(async (req, res) => {
  requireSupabase();

  const clientRequestId = String(
    req.body?.clientRequestId || req.get('idempotency-key') || ''
  ).trim().slice(0, 120);

  // Replay of an attempt we already stored → return the original order untouched
  // instead of double-charging stock and promo uses.
  if (clientRequestId) {
    const existing = await findOrderByClientRequestId(clientRequestId);
    if (existing) return res.status(200).json({ success: true, duplicated: true, data: existing });
  }

  const items = await resolveOrderItems(req.body?.items);
  const deliveryMethod = req.body?.deliveryMethod === 'showroom' ? 'showroom' : 'shipping';

  // Stock is reserved the moment a line is accepted, so every later failure has
  // to undo the bookings (and the promo use) before answering.
  const rollback = async ({ items: lines, promo: usedPromo }) => {
    await releaseStockBatch(lines.map((i) => ({ key: i.slug, qty: i.quantity })));
    if (usedPromo?.code) await releasePromoRedemption(usedPromo.code);
  };

  let pricing;
  try {
    pricing = await priceOrder({ items, promoCode: req.body?.promoCode, deliveryMethod });
  } catch (err) {
    await rollback({ items });
    throw err;
  }
  const { subtotal, discountAmount, promo, shippingFee, grandTotal, promoCode: appliedCode } = pricing;

  const c = req.body?.customer || {};
  const customer = {
    firstName: String(c.firstName || '').trim().slice(0, 80),
    lastName: String(c.lastName || '').trim().slice(0, 80),
    email: String(c.email || '').trim().toLowerCase().slice(0, 160),
    phone: String(c.phone || '').trim().slice(0, 32),
    address: String(c.address || '').trim().slice(0, 240),
    apartment: String(c.apartment || '').trim().slice(0, 120),
    city: String(c.city || '').trim().slice(0, 80),
    state: String(c.state || 'Tamil Nadu').trim().slice(0, 80),
    postalCode: String(c.postalCode || '').trim().slice(0, 16),
    country: String(c.country || 'India').trim().slice(0, 60),
    notes: String(c.notes || req.body?.notes || '').trim().slice(0, 1000),
  };

  // Showroom pickup needs no street address; courier orders do (mirrors form validation).
  if (deliveryMethod === 'shipping' && (!customer.address || !customer.city || !customer.postalCode)) {
    await rollback({ items, promo });
    return res.status(400).json({
      success: false,
      message: 'Street address, city and PIN code are required for courier dispatch.',
    });
  }

  let order = null;
  let lastErr = null;
  for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
    try {
      order = await insertOrder({
        orderId: generateOrderId(),
        clientRequestId: clientRequestId || null,
        userId: req.user?.id || null,
        customer,
        items,
        subtotal,
        discountAmount,
        promoCode: appliedCode ? promo.code : null,
        promoPercent: promo?.percent || 0,
        shippingFee,
        grandTotal,
        deliveryMethod,
        status: 'pending',
        paymentStatus: 'pending_payment_link',
        courierPartner: deliveryMethod === 'shipping' ? 'BlueDart Express' : 'Showroom Handover',
        trackingNumber: '',
        notes:
          req.body?.notes ||
          `Delivery: ${deliveryMethod === 'shipping' ? 'Courier Dispatch' : 'Showroom Pickup'}. City: ${customer.city || 'Coimbatore'}.`,
      });
      lastErr = null;
    } catch (err) {
      const message = String(err?.message || '');
      // Another request won the idempotency race with the same clientRequestId.
      if (err?.code === '23505' && /client_request/i.test(message)) {
        const twin = await findOrderByClientRequestId(clientRequestId);
        if (twin) {
          await rollback({ items, promo });
          return res.status(200).json({ success: true, duplicated: true, data: twin });
        }
      }
      lastErr = err;
      // TONTO-XXXXXX collision — retry with a fresh reference.
      if (err?.code !== '23505' || !/order_id/i.test(message)) break;
    }
  }

  if (!order) {
    await rollback({ items, promo });
    throw lastErr || new Error('Could not reserve order reference.');
  }

  res.status(201).json({ success: true, data: order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  requireSupabase();
  const orders = await findOrdersByCustomer({ userId: req.user?.id || null, email: req.user?.email || '' });
  res.json({ success: true, count: orders.length, data: orders });
});

/**
 * GET /api/orders/:id — the confirmation screen / account order view refreshing
 * one order straight from the database instead of trusting whatever the client
 * cached. Mounted behind `protect`, so `req.user.role` is the database role and
 * a demoted admin cannot read someone else's order with a stale token.
 */
export const getOrder = asyncHandler(async (req, res) => {
  requireSupabase();
  const order = await findOrderByOrderId(req.params.id);
  // Same 404 for "no such order" and "not yours": an existing order id must not
  // be confirmable by a stranger probing the reference off a shared link.
  if (!order) throw ApiError.notFound('Order not found.');
  if (req.user?.role !== 'admin' && !orderBelongsTo(order, req.user)) {
    throw ApiError.notFound('Order not found.');
  }
  res.json({ success: true, data: order });
});

/**
 * POST /api/orders/:id/cancel — customer-facing cancellation of a held order.
 * Ownership is checked against user_id OR the email on the order, so a guest
 * order can be cancelled from the confirmation screen but nobody else's can.
 */
export const cancelMyOrder = asyncHandler(async (req, res) => {
  requireSupabase();
  const order = await findOrderByOrderId(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  if (!orderBelongsTo(order, req.user || {})) {
    throw ApiError.forbidden('This order belongs to another customer.');
  }

  if (!canTransition(order.status, 'cancelled')) {
    throw ApiError.badRequest(`An order marked "${order.status}" can no longer be cancelled.`);
  }

  // Give the pieces back to the shelf.
  for (const item of order.items || []) {
    await releaseStock(item.slug || item.productId || item.id, item.quantity || 1);
  }

  const reason = String(req.body?.reason || '').trim().slice(0, 300);
  const notes = `${order.notes || ''}${order.notes ? '\n' : ''}Cancelled by customer${reason ? `: ${reason}` : ''}.`;
  const updated = await updateOrderByOrderId(order.orderId, {
    status: 'cancelled',
    paymentStatus: 'cancelled_released',
    notes,
  });
  res.json({ success: true, data: updated });
});

export const listOrders = asyncHandler(async (req, res) => {
  requireSupabase();
  const { status, deliveryMethod, search, page = 1, limit = 20 } = req.query;
  const canonical = normaliseStatus(status);
  if (status && !canonical) return res.status(400).json({ success: false, message: `Unknown status "${status}".` });
  const { data: orders, total, page: pg, pages } = await queryOrders({
    status: canonical || undefined,
    deliveryMethod: deliveryMethod && ['shipping', 'showroom'].includes(deliveryMethod) ? deliveryMethod : undefined,
    search: search?.trim() || undefined,
    page,
    limit,
  });
  res.json({ success: true, count: orders.length, total, page: pg, pages, data: orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  requireSupabase();
  const order = await findOrderByOrderId(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const { status, paymentStatus, trackingNumber, courierPartner, notes } = req.body || {};
  const patch = {};

  if (status !== undefined) {
    const canonical = normaliseStatus(status);
    if (!canonical) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ORDER_STATUSES.join(', ')} (legacy labels accepted).`,
      });
    }
    if (!canTransition(order.status, canonical)) {
      return res.status(409).json({
        success: false,
        message: `"${order.status}" cannot move directly to "${canonical}".`,
      });
    }
    patch.status = canonical;
    // Stock was reserved when the order was created, so an order that ends
    // without shipping has to put the pieces back.
    if (RESTOCKABLE_STATUSES.includes(canonical) && !RESTOCKABLE_STATUSES.includes(order.status)) {
      for (const item of order.items || []) {
        await releaseStock(item.slug || item.productId || item.id, item.quantity || 1);
      }
    }
  }

  if (paymentStatus !== undefined) {
    const canonicalPay = normalisePaymentStatus(paymentStatus);
    if (!canonicalPay) {
      return res.status(400).json({
        success: false,
        message: 'paymentStatus must be one of: pending_payment_link, paid_upi, paid_card, cancelled_released, refunded.',
      });
    }
    patch.paymentStatus = canonicalPay;
  }

  if (trackingNumber !== undefined) patch.trackingNumber = String(trackingNumber).slice(0, 80);
  if (courierPartner !== undefined) patch.courierPartner = String(courierPartner).slice(0, 80);
  if (notes !== undefined) patch.notes = String(notes).slice(0, 2000);

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ success: false, message: 'Nothing to update.' });
  }

  const updated = await updateOrderByOrderId(req.params.id, patch);
  res.json({ success: true, data: updated });
});
