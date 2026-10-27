/**
 * Lead routes — mount at /api/leads.
 *  POST /claim-offer — { name?, phone?, email } → welcome promo, issued once per email.
 *  POST /waitlist    — { dropName?, name?, phone?, email?, size? } → WaitlistEntry + Lead mirror.
 *  GET    /          — admin list ?source=&stage=&search=&page=&limit= (requireAdmin).
 *  POST   /          — admin files a lead (walk-in, phone, spreadsheet import).
 *  PATCH  /:id       — admin CRM edit (stage, interest, value, notes, contact).
 *  DELETE /:id       — admin removes a misfiled lead.
 * Claim + waitlist are public (mirrors OfferModal / DropWaitlistBanner modals),
 * so they carry the shared public-write limiter — otherwise they are a free
 * insert-anything spam faucet for the owner's CRM. The three admin routes sit
 * behind requireAdmin and are the only way to write arbitrary CRM columns.
 */
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { publicWriteLimiter } from '../middleware/rateLimit.js';
import { LEAD_STAGES } from '../models/Lead.js';
import {
  claimOffer,
  joinWaitlist,
  getWaitlist,
  listLeads,
  addLead,
  editLead,
  removeLead,
} from '../controllers/leads.controller.js';

const router = Router();

// The desk's <select> and CSV hold the spaced labels ('In Discussion'), the
// column holds the same text, and the DAO normalises both — so accept either
// and let normaliseStage be the single place that decides what is valid.
// Validation only: the handlers re-normalise, so nothing here needs to rewrite
// the request body.
const isValidStage = (value) =>
  LEAD_STAGES.some((s) => s.toLowerCase() === String(value ?? '').trim().toLowerCase());

const stageValidator = (chain) =>
  chain.optional({ nullable: true }).custom(isValidStage).withMessage(`stage must be one of: ${LEAD_STAGES.join(', ')}.`);

router.post(
  '/claim-offer',
  publicWriteLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('name').optional().isString().trim().isLength({ max: 120 }),
    body('phone').optional().isString().trim().isLength({ max: 32 }),
  ],
  validate,
  claimOffer
);

router.post(
  '/waitlist',
  publicWriteLimiter,
  [
    body('dropName').optional().isString().trim().isLength({ max: 120 }),
    body('name').optional().isString().trim().isLength({ max: 120 }),
    body('email').optional().isEmail().withMessage('Email must be valid.').normalizeEmail(),
    body('phone').optional().isString().trim().isLength({ max: 32 }),
    body('size').optional().isString().trim().isLength({ max: 16 }),
    body().custom((_, { req }) => {
      if (!req.body?.email && !req.body?.phone) throw new Error('Email or phone is required.');
      return true;
    }),
  ],
  validate,
  joinWaitlist
);

router.get('/waitlist', requireAdmin, getWaitlist);

router.get(
  '/',
  requireAdmin,
  [
    query('source').optional().isString().trim().isLength({ max: 60 }),
    query('stage').optional().isString().trim().isLength({ max: 40 }),
    query('search').optional().isString().trim().isLength({ max: 120 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  listLeads
);

const leadFields = [
  body('name').optional().isString().trim().isLength({ max: 120 }),
  body('phone').optional().isString().trim().isLength({ max: 32 }),
  // '' is allowed: a walk-in filed from the floor often has no address yet, and
  // the unique index only covers non-empty emails.
  body('email')
    .optional({ nullable: true })
    .custom((v) => v === '' || /.+@.+\..+/.test(String(v).trim()))
    .withMessage('Email must be valid.'),
  body('source').optional().isString().trim().isLength({ max: 60 }),
  body('interest').optional().isString().trim().isLength({ max: 200 }),
  body('notes').optional().isString().trim().isLength({ max: 2000 }),
  body('estimatedValue').optional({ nullable: true }).isInt({ min: 0, max: 100000000 }).withMessage('estimatedValue must be a whole number.').toInt(),
  body('promoClaimed').optional().isBoolean().toBoolean(),
  body('claimedCode').optional().isString().trim().isLength({ max: 32 }),
];

// A lead filed from the showroom floor may legitimately have no email at all,
// but it needs one identifiable thing in it.
const needsIdentifier = body().custom((_, { req }) => {
  const b = req.body || {};
  if (!String(b.name || '').trim() && !String(b.phone || '').trim() && !String(b.email || '').trim()) {
    throw new Error('A lead needs a name, a phone number or an email.');
  }
  return true;
});

// `validate` is what turns those chains into a 400 — without it the handler runs
// anyway and a bad stage becomes a Postgres CHECK violation (500).
router.post('/', requireAdmin, [...leadFields, stageValidator(body('stage')), needsIdentifier], validate, addLead);

// :id is the uuid column — a stray 'LEAD-101' desk key would otherwise surface
// as a Postgres `invalid input syntax for type uuid` 500.
router.patch(
  '/:id',
  requireAdmin,
  [
    param('id').isUUID().withMessage('Invalid lead id.'),
    ...leadFields,
    stageValidator(body('stage')),
  ],
  validate,
  editLead
);

router.delete('/:id', requireAdmin, [param('id').isUUID().withMessage('Invalid lead id.')], validate, removeLead);

export default router;
