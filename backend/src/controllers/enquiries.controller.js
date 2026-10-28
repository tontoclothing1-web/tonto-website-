/**
 * Enquiries controller (Supabase).
 *  POST /api/enquiries — public piece/collection enquiry (EnquiryModal shape).
 *  GET  /api/enquiries — admin list with status / channel / search filters.
 *  PATCH /api/enquiries/:id — admin status, notes and colour updates.
 * Every enquiry ships with a prebuilt WhatsApp concierge link (utils/whatsapp.js).
 *
 * Shape validation lives in routes/enquiries.routes.js (+ `validate`).
 */
import { requireSupabase, isSupabaseConnected } from '../config/supabase.js';
import { asyncHandler } from '../middleware/auth.js';
import { buildWhatsAppLink, buildPieceEnquiryText, normalizePhone } from '../utils/whatsapp.js';
import {
  createEnquiry as insertEnquiry,
  findEnquiryById,
  updateEnquiryById,
  listEnquiries as queryEnquiries,
} from '../models/Enquiry.js';

// Labels the Studio Admin picker offers, plus the legacy values older rows
// already carry. migration_004 widened the CHECK to this whole set: before it,
// 'Dispatched'/'Completed' were rejected outright and 'Payment Received' was
// silently downgraded to 'contacted', so saving a status rewrote the owner's
// meaning.
export const ENQUIRY_STATUSES = [
  'new',
  'pending',
  'in_discussion',
  'contacted',
  'payment_received',
  'hold_reserved',
  'dispatched',
  'completed',
  'closed',
  'resolved',
];

// Keyed by both the spaced label the desk sends and the snake token we store.
const LEGACY_STATUS_MAP = {
  new: 'new',
  pending: 'pending',
  'in discussion': 'in_discussion',
  in_discussion: 'in_discussion',
  contacted: 'contacted',
  'payment received': 'payment_received',
  payment_received: 'payment_received',
  'hold reserved': 'hold_reserved',
  hold_reserved: 'hold_reserved',
  'hold reserved at showroom': 'hold_reserved',
  dispatched: 'dispatched',
  completed: 'completed',
  closed: 'closed',
  resolved: 'resolved',
  converted: 'completed',
};

const normaliseStatus = (s) => {
  const raw = String(s ?? '').trim().toLowerCase();
  const snake = raw.replace(/[\s-]+/g, '_');
  return LEGACY_STATUS_MAP[raw] || LEGACY_STATUS_MAP[snake] || (ENQUIRY_STATUSES.includes(snake) ? snake : null);
};

// Read-side labels, so the desk can render and filter straight off the row the
// way it does with a local array. The API is still the only place that decides
// what a status means.
export const STATUS_LABELS = {
  new: 'New',
  pending: 'Pending',
  in_discussion: 'In Discussion',
  contacted: 'Contacted',
  payment_received: 'Payment Received',
  hold_reserved: 'Hold Reserved',
  dispatched: 'Dispatched',
  completed: 'Completed',
  closed: 'Closed',
  resolved: 'Resolved',
};

export const statusLabel = (token) => STATUS_LABELS[String(token || '').trim()] || String(token || 'New');

const withLabel = (enquiry) =>
  enquiry ? { ...enquiry, statusLabel: statusLabel(enquiry.status) } : enquiry;

function splitContact(contact = '', email = '') {
  const c = String(contact || '').trim().slice(0, 80);
  const e = String(email || '').trim().toLowerCase().slice(0, 160);
  return {
    phone: c.includes('@') ? '' : c,
    email: e || (c.includes('@') ? c.toLowerCase() : ''),
  };
}

// Public endpoint: cap every free-text field so one request cannot store a
// megabyte of junk per row.
const clip = (value, max) => String(value ?? '').trim().slice(0, max);

export const createEnquiry = asyncHandler(async (req, res) => {
  requireSupabase();

  const channel = req.body?.channel === 'whatsapp' ? 'whatsapp' : 'form';
  const { phone, email } = splitContact(req.body?.contact || req.body?.phone, req.body?.email);
  const product = req.body?.product || null;

  const text = buildPieceEnquiryText({
    product: product || { title: req.body?.title, colour: req.body?.colour },
    size: req.body?.size,
    name: req.body?.name,
    contact: req.body?.contact || req.body?.phone || email,
    message: req.body?.message,
  });
  const whatsappLink = buildWhatsAppLink({ phone: normalizePhone(phone, ''), text });

  const enquiry = await insertEnquiry({
    productId: clip(req.body?.productId || product?.id || '', 80) || null,
    title: clip(req.body?.title || product?.title || 'General Collection', 160),
    colour: clip(req.body?.colour || product?.colour || '', 80),
    size: clip(req.body?.size || 'Standard', 40),
    name: clip(req.body?.name || 'Store Shopper', 120),
    phone,
    email,
    message: clip(req.body?.message || '', 2000),
    channel,
    status: 'new',
  });

  res.status(201).json({ success: true, data: withLabel({ ...enquiry, whatsappLink }) });
});

export const listEnquiries = asyncHandler(async (req, res) => {
  requireSupabase();
  const { status, channel, search, page = 1, limit = 20 } = req.query;
  let canonical = null;
  if (status) {
    canonical = normaliseStatus(status);
    if (!canonical) return res.status(400).json({ success: false, message: `Unknown status "${status}".` });
  }
  const { data: enquiries, total, page: pg, pages } = await queryEnquiries({
    status: canonical || undefined,
    channel: channel && ['whatsapp', 'form'].includes(channel) ? channel : undefined,
    search: search?.trim() || undefined,
    page,
    limit,
  });
  res.json({ success: true, count: enquiries.length, total, page: pg, pages, data: enquiries.map(withLabel) });
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  requireSupabase();
  const enquiry = await findEnquiryById(req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });

  const patch = {};
  if (req.body?.status !== undefined) {
    const canonical = normaliseStatus(req.body.status);
    if (!canonical) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${ENQUIRY_STATUSES.join(', ')}.` });
    }
    patch.status = canonical;
  }
  if (req.body?.notes !== undefined) patch.notes = String(req.body.notes).trim().slice(0, 2000);
  if (req.body?.colour !== undefined) patch.colour = String(req.body.colour).trim().slice(0, 80);

  if (Object.keys(patch).length === 0) {
    return res.json({ success: true, data: withLabel(enquiry) });
  }
  const updated = await updateEnquiryById(req.params.id, patch);
  return res.json({ success: true, data: withLabel(updated) });
});
