// Shared translation layer between the store API and the shapes these screens
// already render. CheckoutPage (new holds), AdminDashboard (order desk) and
// AccountPage (customer portal) all read the same records, so the mapping lives
// in one file instead of three copies that drift apart.

export const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// The dashboard (and the WhatsApp summary) speak labels; the API speaks the
// canonical order lifecycle. Translate one way, at the edge.
export const STATUS_LABELS = {
  pending: 'New Hold',
  new_hold: 'New Hold',
  hold: 'New Hold',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  dispatched: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const PAYMENT_LABELS = {
  pending_payment_link: 'Pending Payment Link',
  unpaid: 'Pending Payment Link',
  paid_upi: 'Paid (UPI)',
  paid: 'Paid',
  refunded: 'Refunded',
  cancelled_released: 'Cancelled / Released',
};

// POST /api/promos/validate answers 200 with { valid: false, reason } — translate
// the engine's reasons into shopper language instead of a generic shrug.
export const PROMO_REASONS = {
  unknown: 'is not recognized.',
  empty: 'is required.',
  inactive: 'is currently inactive.',
  expired: 'has expired.',
  usage_limit_reached: 'has already been used up.',
  invalid_percent: 'is misconfigured.',
};

/** API order → the record shape the admin desk + customer portal render. */
export const fromApiOrder = (order, customerArg = {}) => {
  const stored = order?.customer && typeof order.customer === 'object' ? order.customer : {};
  const customer = { ...stored, ...customerArg };
  const firstName = customer.firstName || stored.firstName || '';
  const lastName = customer.lastName || stored.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || customer.name || stored.name || 'Store Customer';

  return {
    id: order.orderId,
    orderId: order.orderId,
    date: String(order.createdAt || new Date().toISOString()).replace('T', ' ').slice(0, 16),
    customerName: fullName,
    email: order.customer?.email ?? customer.email ?? '',
    phone: order.customer?.phone ?? customer.phone ?? '',
    customer,
    deliveryMethod: order.deliveryMethod || 'shipping',
    shippingAddress: {
      address: order.customer?.address ?? customer.address,
      apartment: order.customer?.apartment ?? customer.apartment,
      city: order.customer?.city ?? customer.city,
      state: order.customer?.state ?? customer.state,
      postalCode: order.customer?.postalCode ?? customer.postalCode,
      country: order.customer?.country ?? customer.country,
    },
    items: order.items || [],
    subtotal: rupees(order.subtotal),
    numericSubtotal: Number(order.subtotal) || 0,
    discountAmount: Number(order.discountAmount) > 0 ? rupees(order.discountAmount) : '₹0',
    numericDiscount: Number(order.discountAmount) || 0,
    appliedPromo: order.promoCode || null,
    shippingFee: Number(order.shippingFee) > 0 ? rupees(order.shippingFee) : 'Free',
    totalAmount: rupees(order.grandTotal),
    numericTotal: Number(order.grandTotal) || 0,
    status: STATUS_LABELS[order.status] || 'New Hold',
    paymentStatus: PAYMENT_LABELS[order.paymentStatus] || 'Pending Payment Link',
    courierPartner: order.courierPartner || (order.deliveryMethod === 'shipping' ? 'BlueDart Express' : 'Showroom Handover'),
    trackingNumber: order.trackingNumber || '',
    notes: order.notes || '',
    recordedBy: 'storefront-api',
  };
};

/** 'showroom' (API) and 'pickup' (older local records) both mean collect in person. */
export const deliveryLabel = (method) =>
  method === 'showroom' || method === 'pickup'
    ? 'Coimbatore Showroom Pickup'
    : 'Courier Delivery';

export const isCancellableStatus = (label) =>
  ['New Hold', 'Pending', 'Hold', 'Confirmed'].includes(label);

export default { rupees, fromApiOrder, deliveryLabel, isCancellableStatus, PROMO_REASONS };
