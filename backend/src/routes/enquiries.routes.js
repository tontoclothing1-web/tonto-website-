/**
 * Enquiry routes — mount at /api/enquiries.
 *  POST /     — public piece/collection enquiry (EnquiryModal shape).
 *  GET  /     — admin list ?status=&channel=&search=&page=&limit=.
 *  PATCH /:id — admin update: status, internal notes, colour.
 */
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { publicWriteLimiter } from '../middleware/rateLimit.js';
import { createEnquiry, listEnquiries, updateEnquiry } from '../controllers/enquiries.controller.js';

const router = Router();

router.post(
  '/',
  publicWriteLimiter,
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required.').isLength({ max: 120 }),
    body('contact')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Contact / WhatsApp is required.')
      .isLength({ max: 80 }),
    body('phone').optional().isString().trim().isLength({ max: 32 }),
    body('email').optional().isEmail().withMessage('Email must be valid.'),
    body('channel').optional().isIn(['whatsapp', 'form']),
    body('productId').optional().isString().trim().isLength({ max: 80 }),
    body('title').optional().isString().trim().isLength({ max: 160 }),
    body('colour').optional().isString().trim().isLength({ max: 80 }),
    body('size').optional().isString().trim().isLength({ max: 40 }),
    body('message').optional().isString().trim().isLength({ max: 2000 }),
    body().custom((_, { req }) => {
      const hasContact = Boolean(req.body?.contact || req.body?.phone || req.body?.email);
      if (!hasContact) throw new Error('A contact number, email or WhatsApp handle is required.');
      return true;
    }),
  ],
  validate,
  createEnquiry
);

router.get(
  '/',
  requireAdmin,
  [
    query('status').optional().isString().trim().isLength({ max: 40 }),
    query('channel').optional().isIn(['whatsapp', 'form']),
    query('search').optional().isString().trim().isLength({ max: 80 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  listEnquiries
);

// :id is the uuid column, so a non-uuid value must be rejected here — passing it
// to Postgres throws `invalid input syntax for type uuid` and surfaces as a 500.
// Every field is optional: the desk's status picker, its notes box and its colour
// column are edited independently, and requiring `status` meant a note-only save
// answered 400.
router.patch(
  '/:id',
  requireAdmin,
  [
    param('id').isUUID().withMessage('Invalid enquiry id.'),
    body('status').optional().isString().trim().isLength({ max: 40 }),
    body('notes').optional().isString().trim().isLength({ max: 2000 }),
    body('colour').optional().isString().trim().isLength({ max: 80 }),
  ],
  validate,
  updateEnquiry
);

export default router;
