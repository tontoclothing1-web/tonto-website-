/**
 * Leads controller (Supabase).
 *  POST /api/leads/claim-offer — { name, phone, email } → TONTO15, issued once per email.
 *  POST /api/leads/waitlist   — { dropName, name, phone/email, size } → WaitlistEntry + Lead mirror.
 *  GET  /api/leads            — admin list with source / stage / search filters.
 *  POST /api/leads            — admin files a lead (walk-in, phone, spreadsheet import).
 *  PATCH /api/leads/:id       — admin CRM edit (stage, interest, value, notes).
 *  DELETE /api/leads/:id      — admin removes a misfiled lead.
 *
 * express-validator chains live in routes/leads.routes.js and are enforced by
 * the shared `validate` middleware, so the handlers below can assume a shaped
 * body (they still clip defensively — validation caps length, it doesn't trim).
 */
import { requireSupabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';
import { WELCOME_PROMO_CODE, validatePromoByCode } from '../utils/promos.js';
import {
  createLead,
  findLeadByEmail,
  findLeadById,
  updateLeadById,
  deleteLeadById,
  listLeads as queryLeads,
  normaliseStage,
} from '../models/Lead.js';
import { createWaitlistEntry, findWaitlistEntry, listWaitlistEntries } from '../models/WaitlistEntry.js';

// Frontend labels → canonical source token (OfferModal, DropWaitlistBanner,
// Footer, EnquiryModal, and the Studio Admin desk's own <select> values).
const SOURCE_MAP = {
  'offer-modal': 'offer-modal',
  '15% welcome modal': 'offer-modal',
  'welcome modal': 'offer-modal',
  offer: 'offer-modal',
  waitlist: 'waitlist',
  'tonto made waitlist (drop 01)': 'waitlist',
  'tonto made drop waitlist': 'waitlist',
  'drop 01 waitlist': 'waitlist',
  concierge: 'concierge',
  'whatsapp concierge': 'concierge',
  'instagram concierge': 'concierge',
  checkout: 'checkout',
  'storefront checkout': 'checkout',
  'product enquiry': 'product-enquiry',
  'product-enquiry': 'product-enquiry',
  enquiry: 'product-enquiry',
  'store walk-in': 'walk-in',
  'walk-in': 'walk-in',
  'footer drop alerts': 'newsletter',
  'drop alerts': 'newsletter',
  newsletter: 'newsletter',
  'direct call': 'direct-call',
  'direct-call': 'direct-call',
  'admin entry': 'admin',
  admin: 'admin',
};

// The desk renders and filters on labels, so the API hands the label back at the
// edge instead of every <option> needing a token lookup.
export const SOURCE_LABELS = {
  'offer-modal': '15% Welcome Modal',
  waitlist: 'TONTO Made Drop Waitlist',
  concierge: 'Instagram Concierge',
  checkout: 'Checkout',
  'product-enquiry': 'Product Enquiry',
  'walk-in': 'Store Walk-In',
  newsletter: 'Footer Drop Alerts',
  'direct-call': 'Direct Call',
  admin: 'Admin Entry',
  other: 'Other',
};

export const normaliseSource = (s) => SOURCE_MAP[String(s || '').toLowerCase().trim()] || 'other';
export const sourceLabel = (token) => SOURCE_LABELS[String(token || '').trim()] || String(token || 'Other');

const clip = (value, max) => String(value ?? '').trim().slice(0, max);

/**
 * The desk's <select> values and CSV columns are labels, its filter compares on
 * them, and the column stores a token — so the API answers with both and the
 * browser needs no second copy of the vocabulary to drift out of sync.
 */
const withLabel = (lead) => (lead ? { ...lead, sourceLabel: sourceLabel(lead.source) } : lead);

/**
 * The welcome offer payload is read from the promos table (so an admin changing
 * TONTO15 to 20% actually changes what the modal promises) instead of a
 * hardcoded "15% OFF" string that could disagree with what checkout applies.
 */
async function welcomeOffer() {
  const result = await validatePromoByCode(WELCOME_PROMO_CODE);
  if (result.ok) return { promoCode: result.promo.code, discountText: result.promo.discountText, percent: result.promo.percent };
  return { promoCode: WELCOME_PROMO_CODE, discountText: '15% OFF', percent: 15 };
}

/** Claim the 15% welcome privilege — idempotent per email ("once"). */
export const claimOffer = asyncHandler(async (req, res) => {
  requireSupabase();

  const email = clip(req.body?.email, 160).toLowerCase();
  const name = clip(req.body?.name || (email ? email.split('@')[0] : ''), 120) || 'Store Shopper';
  const phone = clip(req.body?.phone, 32);
  // The footer's "Drop Alerts" box posts here too. Recording where the address
  // came from is the difference between a welcome-offer list and a mailing list.
  const source = req.body?.source ? normaliseSource(req.body.source) : 'offer-modal';

  const existing = await findLeadByEmail(email);
  if (existing?.promoClaimed) {
    // Keep the richer provenance: a footer signup that arrives after a modal
    // claim still tells the owner which channel filled the row.
    if (source !== 'other' && existing.source !== source) {
      await updateLeadById(existing.id, { source });
    }
    return res.json({
      success: true,
      alreadyClaimed: true,
      message: 'This email has already claimed the welcome privilege.',
      data: { ...(await welcomeOffer()), promoCode: existing.claimedCode || WELCOME_PROMO_CODE },
    });
  }

  if (existing) {
    await updateLeadById(existing.id, {
      name: name || existing.name,
      phone: phone || existing.phone,
      source,
      promoClaimed: true,
      claimedCode: WELCOME_PROMO_CODE,
    });
  } else {
    await createLead({
      name,
      email,
      phone,
      source,
      promoClaimed: true,
      claimedCode: WELCOME_PROMO_CODE,
    });
  }

  res.status(201).json({
    success: true,
    alreadyClaimed: false,
    message: 'Welcome privilege unlocked.',
    data: await welcomeOffer(),
  });
});

/** Join a private drop waitlist — writes WaitlistEntry + mirrors a Lead. */
export const joinWaitlist = asyncHandler(async (req, res) => {
  requireSupabase();

  const dropName = clip(req.body?.dropName || 'Private Drop 01', 80);
  const email = clip(req.body?.email, 160).toLowerCase();
  const phone = clip(req.body?.phone, 32);
  const name = clip(req.body?.name || (email ? email.split('@')[0] : ''), 120) || 'Drop Member';
  const size = clip(req.body?.size || 'M', 40);

  const dupe = await findWaitlistEntry(email ? { dropName, email } : { dropName, name, phone });
  if (dupe) {
    return res.json({ success: true, alreadyJoined: true, message: 'Already registered for this drop.', data: dupe });
  }

  const entry = await createWaitlistEntry({ dropName, name, phone, email, size });

  // Mirror into CRM leads (mirrors DropWaitlistBanner localStorage behaviour).
  try {
    if (email) {
      const lead = await findLeadByEmail(email);
      if (!lead) {
        await createLead({ name, email, phone: phone || 'Awaiting WhatsApp', source: 'waitlist' });
      }
    } else {
      const sb = requireSupabase();
      const { data } = await sb
        .from('leads')
        .select('*')
        .eq('name', name)
        .eq('phone', phone)
        .eq('source', 'waitlist')
        .maybeSingle();
      if (!data) {
        await createLead({ name, email: '', phone: phone || 'Awaiting WhatsApp', source: 'waitlist' });
      }
    }
  } catch {
    // Duplicate email raced against another tab, or the lead row was rejected —
    // the waitlist entry itself is already saved, so the signup still counts.
  }

  res.status(201).json({ success: true, alreadyJoined: false, data: entry });
});

export const getWaitlist = asyncHandler(async (req, res) => {
  requireSupabase();
  const { dropName } = req.query;
  const entries = await listWaitlistEntries({ dropName: dropName ? String(dropName).trim() : undefined });
  res.json({ success: true, data: entries });
});

export const listLeads = asyncHandler(async (req, res) => {
  requireSupabase();
  const { source, stage, search, page = 1, limit = 20 } = req.query;
  let canonical;
  if (source && source !== 'all') canonical = normaliseSource(source);
  const { data: leads, total, page: pg, pages } = await queryLeads({
    source: canonical || undefined,
    stage: stage && stage !== 'all' ? stage : undefined,
    search: search?.trim() || undefined,
    page,
    limit,
  });
  res.json({ success: true, count: leads.length, total, page: pg, pages, data: leads.map(withLabel) });
});

/**
 * POST /api/leads (admin) — the desk files a walk-in or a phone lead.
 * An email that already exists updates that row instead of failing on the
 * unique index: the owner is filling in a CRM record, not signing up again.
 */
export const addLead = asyncHandler(async (req, res) => {
  requireSupabase();

  const email = clip(req.body?.email, 160).toLowerCase();
  const name = clip(req.body?.name, 120);
  const phone = clip(req.body?.phone, 32);
  if (!name && !phone && !email) {
    throw ApiError.badRequest('A lead needs a name, a phone number or an email.');
  }

  const payload = {
    name: name || (email ? email.split('@')[0] : 'Store Lead'),
    email,
    phone,
    source: normaliseSource(req.body?.source || 'admin'),
    stage: normaliseStage(req.body?.stage),
    interest: clip(req.body?.interest, 200),
    estimatedValue: Number(req.body?.estimatedValue) || 0,
    notes: clip(req.body?.notes, 2000),
    promoClaimed: req.body?.promoClaimed === true,
    claimedCode: clip(req.body?.claimedCode, 32),
  };

  const existing = email ? await findLeadByEmail(email) : null;
  if (existing) {
    const merged = await updateLeadById(existing.id, {
      ...payload,
      name: payload.name || existing.name,
      phone: payload.phone || existing.phone,
    });
    return res.status(200).json({ success: true, merged: true, data: withLabel(merged) });
  }

  const lead = await createLead(payload);
  res.status(201).json({ success: true, data: withLabel(lead) });
});

/** PATCH /api/leads/:id (admin) — CRM edit: stage, interest, value, notes, contact. */
export const editLead = asyncHandler(async (req, res) => {
  requireSupabase();
  const existing = await findLeadById(req.params.id);
  if (!existing) throw ApiError.notFound('Lead not found.');

  const patch = {};
  if (req.body?.name !== undefined) patch.name = clip(req.body.name, 120);
  if (req.body?.phone !== undefined) patch.phone = clip(req.body.phone, 32);
  if (req.body?.email !== undefined) patch.email = clip(req.body.email, 160).toLowerCase();
  if (req.body?.source !== undefined) patch.source = normaliseSource(req.body.source);
  if (req.body?.stage !== undefined) patch.stage = normaliseStage(req.body.stage);
  if (req.body?.interest !== undefined) patch.interest = clip(req.body.interest, 200);
  if (req.body?.estimatedValue !== undefined) patch.estimatedValue = Number(req.body.estimatedValue) || 0;
  if (req.body?.notes !== undefined) patch.notes = clip(req.body.notes, 2000);
  if (req.body?.promoClaimed !== undefined) patch.promoClaimed = req.body.promoClaimed === true;

  const updated = await updateLeadById(existing.id, patch);
  if (!updated) throw ApiError.notFound('Lead not found.');
  res.json({ success: true, data: withLabel(updated) });
});

/** DELETE /api/leads/:id (admin) — misfiled or duplicate row. */
export const removeLead = asyncHandler(async (req, res) => {
  requireSupabase();
  const removed = await deleteLeadById(req.params.id);
  if (!removed) throw ApiError.notFound('Lead not found.');
  res.json({ success: true, message: 'Lead removed.' });
});
