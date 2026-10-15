/**
 * WhatsApp deep-link helper.
 * Builds https://api.whatsapp.com/send?... links used by cart / checkout /
 * enquiry flows on the storefront (EnquiryModal, CartDrawer, CheckoutPage).
 */

const DEFAULT_PHONE = (process.env.WHATSAPP_PHONE || '919840000000').replace(/\D/g, '');

export function normalizePhone(phone, fallback = DEFAULT_PHONE) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits || fallback;
}

/** https://api.whatsapp.com/send?phone=<digits>&text=<encoded> (phone omitted when empty). */
export function buildWhatsAppLink({ phone = '', text = '' } = {}) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  const base = 'https://api.whatsapp.com/send?';
  const params = new URLSearchParams();
  if (digits) params.set('phone', digits);
  if (text) params.set('text', text);
  return base + params.toString();
}

/** Storefront order-reservation message (mirrors CheckoutPage getOrderWhatsAppText). */
export function buildOrderEnquiryText(order) {
  const c = order?.customer || {};
  const lines = [
    'TONTO Order Reservation',
    `Order Ref: #${order?.orderId ?? ''}`,
    `Customer: ${(c.firstName || '').trim()} ${(c.lastName || '').trim()}`.trim(),
    `Phone: ${c.phone || ''}`,
    `Delivery: ${order?.deliveryMethod === 'shipping' ? 'Courier Dispatch' : 'Coimbatore Showroom Pickup'}`,
    '',
    `Pieces (${(order?.items || []).length}):`,
    ...(order?.items || []).map(
      (i, idx) => `${idx + 1}. ${i.title} (${i.colour || 'Standard'}) - Sz ${i.size || 'M'} x ${i.quantity || 1}`
    ),
    '',
    'Please confirm availability & payment link for dispatch.',
  ];
  return lines.join('\n');
}

/** Piece-enquiry message (mirrors EnquiryModal fullEnquiryText). */
export function buildPieceEnquiryText({ product = null, size = '', name = '', contact = '', message = '' } = {}) {
  return [
    'TONTO Clothing Enquiry',
    `Piece: ${product?.title || 'General Enquiry'}`,
    `Colour: ${product?.colour || 'N/A'}`,
    `Preferred Size: ${size || 'Standard'}`,
    `Client Name: ${name || 'Customer'}`,
    `Contact: ${contact || 'N/A'}`,
    '',
    message || '',
  ].join('\n');
}

/** Bag-summary message (mirrors CartDrawer / CartPage orderSummaryText). */
export function buildBagEnquiryText(items = []) {
  const qty = items.reduce((a, i) => a + (Number(i?.quantity) || 1), 0);
  return (
    `TONTO Clothing Order Enquiry\n\nItems in Bag (${qty} pieces):\n` +
    items
      .map((item, idx) => `${idx + 1}. ${item.title} (${item.colour || 'Standard'}) - Size: ${item.size || 'Standard'} x ${item.quantity || 1}`)
      .join('\n') +
    '\n\nOrigin: Coimbatore, Tamil Nadu, India\nPlease confirm price, delivery timeline, and payment instructions.'
  );
}
