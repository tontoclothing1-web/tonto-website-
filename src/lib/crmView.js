// Shared translation layer between the store API and the shapes the Studio Admin
// desk already renders, so the desk's tables, <select> options and CSV exports
// keep speaking labels while the database keeps speaking tokens.
//
// Same convention as lib/orderView.js: map once, at the edge. The desk should
// never need a second copy of a vocabulary — the API sends `statusLabel` and
// `sourceLabel` alongside the canonical token, and accepts either form on write.

const shortRef = (id, prefix) => {
  const tail = String(id || '').replace(/-/g, '').slice(-6).toUpperCase();
  return tail ? `${prefix}-${tail}` : prefix;
};

const deskDate = (value) =>
  String(value || '').replace('T', ' ').slice(0, 16) || new Date().toISOString().replace('T', ' ').slice(0, 16);

/** The enquiry list, including the "Action Required" count, filters on these. */
export const ENQUIRY_STAGE_LABELS = [
  'New',
  'Pending',
  'In Discussion',
  'Payment Received',
  'Dispatched',
  'Completed',
];

/**
 * API enquiry → the row the CLIENT ENQUIRIES tab renders.
 * `id` stays the database uuid (every PATCH is keyed by it); `ref` is the short
 * chip a shopkeeper can read off a WhatsApp thread.
 */
export const fromApiEnquiry = (row = {}) => {
  const contact = row.phone || row.email || '';
  return {
    id: row.id,
    ref: row.ref || shortRef(row.id, 'ENQ'),
    clientName: row.name || 'Store Shopper',
    contact,
    phone: row.phone || '',
    email: row.email || '',
    productId: row.productId || '',
    productTitle: row.productTitle || row.title || 'General Collection',
    colour: row.colour || '',
    size: row.size || 'Standard',
    message: row.message || '',
    notes: row.notes || row.message || '',
    channel: row.channel || 'form',
    status: row.statusLabel || row.status || 'New',
    date: deskDate(row.createdAt),
    whatsappLink: row.whatsappLink || '',
    recordedBy: 'storefront-api',
  };
};

/** Lead source labels the CRM tab's picker and Source column show. */
export const LEAD_SOURCE_LABELS = [
  'Store Walk-In',
  '15% Welcome Modal',
  'Product Enquiry',
  'TONTO Made Drop Waitlist',
  'Instagram Concierge',
  'Footer Drop Alerts',
  'Direct Call',
  'Admin Entry',
];

export const LEAD_STAGE_LABELS = ['New', 'In Discussion', 'Converted', 'Lost'];

/** API lead → the row the LEAD MANAGEMENT table renders. */
export const fromApiLead = (row = {}) => ({
  id: row.id,
  ref: row.ref || shortRef(row.id, 'LEAD'),
  name: row.name || 'Store Lead',
  phone: row.phone || '',
  email: row.email || '',
  // The desk filters and exports on the label, the column stores a token.
  source: row.sourceLabel || row.source || 'Other',
  sourceToken: row.source || 'other',
  interest: row.interest || '',
  estimatedValue: Number(row.estimatedValue) || 0,
  stage: LEAD_STAGE_LABELS.includes(row.stage) ? row.stage : 'New',
  notes: row.notes || '',
  promoClaimed: row.promoClaimed === true,
  claimedCode: row.claimedCode || '',
  date: deskDate(row.createdAt).slice(0, 10),
  recordedBy: 'storefront-api',
});

/**
 * POST /api/leads and PATCH /api/leads/:id body. The server normalises both
 * `source` (label or token) and `stage`, so nothing here duplicates its rules —
 * it only drops keys the desk never touched.
 */
export const toApiLead = (form = {}) => {
  const body = {};
  if (form.name !== undefined) body.name = String(form.name).trim();
  if (form.phone !== undefined) body.phone = String(form.phone).trim();
  if (form.email !== undefined) body.email = String(form.email).trim();
  if (form.source !== undefined) body.source = String(form.source).trim();
  if (form.stage !== undefined) body.stage = String(form.stage).trim();
  if (form.interest !== undefined) body.interest = String(form.interest).trim();
  if (form.notes !== undefined) body.notes = String(form.notes).trim();
  if (form.estimatedValue !== undefined) body.estimatedValue = Number(form.estimatedValue) || 0;
  return body;
};

/**
 * The DROP ALERTS register is not a separate table — it is the leads that came
 * from an email capture. Anything the owner filed by hand without an address
 * belongs in the CRM tab, not the mailing list.
 */
export const isSubscriber = (lead = {}) => {
  if (!lead?.email) return false;
  if (lead.promoClaimed) return true;
  const token = String(lead.sourceToken || '').toLowerCase();
  if (['offer-modal', 'waitlist', 'newsletter', 'concierge'].includes(token)) return true;
  const src = String(lead.source || '').toLowerCase();
  return (
    src.includes('waitlist') ||
    src.includes('drop') ||
    src.includes('modal') ||
    src.includes('newsletter') ||
    src.includes('offer') ||
    src.includes('concierge')
  );
};

export const fromApiSubscriber = (row = {}) => {
  const rawSource = String(row.sourceLabel || row.source || 'Other');
  const rawInterest = String(row.interest || '');
  const rawNotes = String(row.notes || '');
  const isDrop01 =
    rawSource.toLowerCase().includes('drop 01') ||
    rawSource.toLowerCase().includes('waitlist') ||
    rawInterest.toLowerCase().includes('drop 01') ||
    rawNotes.toLowerCase().includes('drop 01') ||
    String(row.dropName || '').toLowerCase().includes('drop 01');

  const dropName = row.dropName || (isDrop01 ? 'TONTO Drop 01' : 'General Drop Alerts');

  return {
    id: row.id || 'SUB-' + String(row.email || '').toLowerCase(),
    name: row.name || (row.email ? row.email.split('@')[0] : 'Drop Member'),
    email: String(row.email || '').trim().toLowerCase(),
    phone: row.phone && row.phone !== 'Awaiting WhatsApp' ? row.phone : '',
    dropName,
    size: row.size || 'M',
    source: rawSource,
    sourceToken: row.sourceToken || (isDrop01 ? 'waitlist' : 'newsletter'),
    priority: isDrop01 ? '1-Hour Priority Early Access' : 'Standard VIP Alert',
    date: row.date || (row.createdAt ? deskDate(row.createdAt).slice(0, 10) : ''),
    promoClaimed: row.promoClaimed === true,
    notes: row.notes || '',
    recordedBy: row.recordedBy || 'storefront-api',
  };
};

/** API promo row → the card the PROMOTIONS tab renders. */
export const fromApiPromo = (row = {}) => ({
  id: row.id || row.code,
  code: String(row.code || '').toUpperCase(),
  discount: row.discountText || (Number(row.percent) ? `${row.percent}% OFF` : ''),
  type: row.type || '',
  percent: Number(row.percent) || 0,
  active: row.active !== false,
  uses: Number(row.uses) || 0,
  usageLimit: Number(row.usageLimit) || 0,
  expiresAt: row.expiresAt || '',
  recordedBy: 'storefront-api',
});

/** PUT /api/promos/:code body — only what changed (the route is a partial update). */
export const toApiPromo = (form = {}) => {
  const body = {};
  if (form.code !== undefined) body.code = String(form.code).trim().toUpperCase();
  if (form.discount !== undefined) body.discountText = String(form.discount).trim();
  if (form.type !== undefined) body.type = String(form.type).trim();
  if (form.percent !== undefined) body.percent = Number(form.percent) || 0;
  if (form.active !== undefined) body.active = form.active === true;
  if (form.uses !== undefined) body.uses = Number(form.uses) || 0;
  if (form.expiresAt !== undefined) body.expiresAt = form.expiresAt || null;
  if (form.usageLimit !== undefined) body.usageLimit = Number(form.usageLimit) || null;
  return body;
};

/** GET /api/settings and PUT /api/settings both answer this flat shape. */
export const SETTINGS_FIELDS = [
  'storeName',
  'storeLocation',
  'whatsappPhone',
  'instagramHandle',
  'announcementText',
  'freeShippingThreshold',
];

export const fromApiSettings = (row = {}) => {
  const out = {};
  for (const field of SETTINGS_FIELDS) {
    if (row[field] !== undefined && row[field] !== null) out[field] = String(row[field]);
  }
  out.updatedAt = row.updatedAt || '';
  return out;
};

/** PUT payload: only the six columns the route knows about. */
export const toApiSettings = (form = {}) => {
  const out = {};
  for (const field of SETTINGS_FIELDS) {
    if (form[field] !== undefined) out[field] = String(form[field]).trim();
  }
  return out;
};

export default {
  fromApiEnquiry,
  fromApiLead,
  toApiLead,
  fromApiSubscriber,
  isSubscriber,
  fromApiPromo,
  toApiPromo,
  fromApiSettings,
  toApiSettings,
  ENQUIRY_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
};
