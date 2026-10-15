/**
 * Order — Supabase DAO.
 * Replaces the Mongoose Order model. Table: orders
 *   (id, order_id unique e.g. TONTO-XXXXXX, user_id nullable, customer jsonb,
 *    items jsonb, subtotal, discount_amount, promo_code, promo_percent,
 *    shipping_fee, grand_total, delivery_method, status, payment_status,
 *    courier_partner, tracking_number, notes).
 * All responses are camelCase (orderId, grandTotal, …).
 */
import { requireSupabase } from '../config/supabase.js';

export const ORDERS_TABLE = 'orders';

/** DB row (snake_case) → API object (camelCase). */
export function mapRowToOrder(row = {}) {
  return {
    id: row.id,
    orderId: row.order_id,
    user: row.user_id ?? null,
    userId: row.user_id ?? null,
    customer: row.customer ?? {},
    items: row.items ?? [],
    subtotal: row.subtotal ?? 0,
    discountAmount: row.discount_amount ?? 0,
    promoCode: row.promo_code ?? null,
    promoPercent: row.promo_percent ?? 0,
    shippingFee: row.shipping_fee ?? 0,
    grandTotal: row.grand_total ?? 0,
    deliveryMethod: row.delivery_method ?? 'shipping',
    status: row.status ?? 'pending',
    paymentStatus: row.payment_status ?? 'Pending Payment Link',
    clientRequestId: row.client_request_id ?? null,
    courierPartner: row.courier_partner ?? '',
    trackingNumber: row.tracking_number ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** API object (camelCase, snake tolerated) → DB row (snake_case) for inserts. */
export function mapOrderToRow(doc = {}) {
  return {
    order_id: doc.orderId ?? doc.order_id,
    user_id: doc.userId ?? doc.user ?? null,
    customer: doc.customer ?? {},
    items: doc.items ?? [],
    subtotal: doc.subtotal ?? 0,
    discount_amount: doc.discountAmount ?? doc.discount_amount ?? 0,
    promo_code: doc.promoCode ?? doc.promo_code ?? null,
    promo_percent: doc.promoPercent ?? doc.promo_percent ?? 0,
    shipping_fee: doc.shippingFee ?? doc.shipping_fee ?? 0,
    grand_total: doc.grandTotal ?? doc.grand_total ?? 0,
    delivery_method: doc.deliveryMethod ?? doc.delivery_method ?? 'shipping',
    status: doc.status ?? 'pending',
    payment_status: doc.paymentStatus ?? doc.payment_status ?? 'Pending Payment Link',
    client_request_id: doc.clientRequestId ?? doc.client_request_id ?? null,
    courier_partner: doc.courierPartner ?? doc.courier_partner ?? '',
    tracking_number: doc.trackingNumber ?? doc.tracking_number ?? '',
    notes: doc.notes ?? '',
  };
}

const PATCH_KEYMAP = {
  status: 'status',
  paymentStatus: 'payment_status',
  payment_status: 'payment_status',
  courierPartner: 'courier_partner',
  courier_partner: 'courier_partner',
  trackingNumber: 'tracking_number',
  tracking_number: 'tracking_number',
  notes: 'notes',
};

/**
 * Order lifecycle, enforced on every admin write. Previously any string was
 * accepted (only the enum blocked nonsense), so an order could jump from
 * 'cancelled' back to 'pending' — which, with stock now reserved per order,
 * would silently duplicate or lose units.
 */
export const ORDER_STATUSES = [
  'pending',
  'new_hold',
  'confirmed',
  'processing',
  'hold',
  'shipped',
  'dispatched',
  'delivered',
  'cancelled',
  'refunded',
];

export const ORDER_STATUS_TRANSITIONS = {
  pending: ['new_hold', 'confirmed', 'processing', 'hold', 'cancelled'],
  new_hold: ['pending', 'confirmed', 'processing', 'hold', 'cancelled'],
  confirmed: ['processing', 'hold', 'shipped', 'dispatched', 'cancelled'],
  processing: ['hold', 'shipped', 'dispatched', 'cancelled'],
  hold: ['processing', 'confirmed', 'shipped', 'dispatched', 'cancelled'],
  shipped: ['dispatched', 'delivered'],
  dispatched: ['shipped', 'delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

/** Statuses where reserved stock goes back on the shelf when the order ends. */
export const RESTOCKABLE_STATUSES = ['cancelled', 'refunded'];

export const canTransition = (from, to) => {
  if (!from || !to) return true;
  if (from === to) return true;
  const allowed = ORDER_STATUS_TRANSITIONS[from] || ORDER_STATUS_TRANSITIONS[String(from).toLowerCase()] || [];
  return allowed.includes(to);
};

/** Partial camelCase patch → snake_case row patch (only defined keys). */
export function mapOrderPatchToRow(patch = {}) {
  const row = {};
  for (const [key, column] of Object.entries(PATCH_KEYMAP)) {
    if (patch[key] !== undefined) row[column] = patch[key];
  }
  return row;
}

/** Strip characters that would break PostgREST `or=` / ilike patterns. */
function sanitizeSearch(q) {
  return String(q || '')
    .replace(/[,()%\"\\]/g, '')
    .trim();
}

export async function createOrder(data) {
  const sb = requireSupabase();
  const { data: row, error } = await sb.from(ORDERS_TABLE).insert(mapOrderToRow(data)).select().single();
  if (error) throw error;
  return mapRowToOrder(row);
}

export async function findOrderByOrderId(orderId) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(ORDERS_TABLE).select('*').eq('order_id', orderId).maybeSingle();
  if (error) throw error;
  return data ? mapRowToOrder(data) : null;
}

/** Idempotency lookup for POST /api/orders (unique partial index on the column). */
export async function findOrderByClientRequestId(clientRequestId) {
  if (!clientRequestId) return null;
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(ORDERS_TABLE)
    .select('*')
    .eq('client_request_id', String(clientRequestId))
    .maybeSingle();
  if (error) throw error;
  return data ? mapRowToOrder(data) : null;
}

/** Customer's own orders: match user_id OR customer->>email. */
export async function findOrdersByCustomer({ userId = null, email = '' } = {}) {
  const sb = requireSupabase();
  let query = sb.from(ORDERS_TABLE).select('*').order('created_at', { ascending: false });
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (userId && cleanEmail) {
    query = query.or(`user_id.eq.${userId},customer->>email.eq.${cleanEmail}`);
  } else if (userId) {
    query = query.eq('user_id', userId);
  } else if (cleanEmail) {
    query = query.filter('customer->>email', 'eq', cleanEmail);
  } else {
    return [];
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRowToOrder);
}

export async function updateOrderByOrderId(orderId, patch = {}) {
  const sb = requireSupabase();
  const rowPatch = mapOrderPatchToRow(patch);
  const { data, error } = await sb
    .from(ORDERS_TABLE)
    .update({ ...rowPatch, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select()
    .single();
  if (error) throw error;
  return mapRowToOrder(data);
}

/**
 * Admin list with filters + pagination (uses .range()).
 * Search spans order_id, tracking_number, customer email/name/phone via ilike + jsonb operators.
 */
export async function listOrders({ status, deliveryMethod, search, page = 1, limit = 20 } = {}) {
  const sb = requireSupabase();
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  let query = sb.from(ORDERS_TABLE).select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (deliveryMethod) query = query.eq('delivery_method', deliveryMethod);
  const q = sanitizeSearch(search);
  if (q) {
    const pat = `%${q}%`;
    query = query.or(
      [
        `order_id.ilike.${pat}`,
        `tracking_number.ilike.${pat}`,
        `customer->>email.ilike.${pat}`,
        `customer->>firstName.ilike.${pat}`,
        `customer->>lastName.ilike.${pat}`,
        `customer->>phone.ilike.${pat}`,
      ].join(',')
    );
  }
  query = query.range((pg - 1) * lim, pg * lim - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? (data || []).length;
  return { data: (data || []).map(mapRowToOrder), total, page: pg, pages: Math.ceil(total / lim) || 0 };
}

export default {
  ORDERS_TABLE,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  RESTOCKABLE_STATUSES,
  canTransition,
  mapRowToOrder,
  mapOrderToRow,
  mapOrderPatchToRow,
  createOrder,
  findOrderByOrderId,
  findOrderByClientRequestId,
  findOrdersByCustomer,
  updateOrderByOrderId,
  listOrders,
};
