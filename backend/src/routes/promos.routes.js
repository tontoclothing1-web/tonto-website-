import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
  validatePromo,
} from '../controllers/promos.controller.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { promoLimiter } from '../middleware/rateLimit.js';

const router = Router();

const adminWrite = [protect, requireAdmin];

const codeParam = param('code').isString().trim().notEmpty().withMessage('Code is required.');

const promoFields = [
  body('code').optional().isString().trim().notEmpty().withMessage('Code must be non-empty.'),
  body('discountText').optional().isString().isLength({ max: 60 }),
  body('type').optional().isString().trim().isLength({ max: 60 }),
  body('active').optional().isBoolean().toBoolean(),
  body('expiresAt').optional({ nullable: true }).isISO8601().withMessage('expiresAt must be ISO8601.').toDate(),
  body('usageLimit').optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body('uses').optional().isInt({ min: 0 }).toInt(),
];

// Create needs the whole row; the percent is what the code is worth.
const promoBody = [...promoFields, body('percent').isInt({ min: 1, max: 100 }).withMessage('percent must be 1–100.').toInt()];

// PUT used to demand `percent` on every call, so flipping one code off answered
// 400 unless the desk re-sent the discount too. Partial updates are the point.
const promoPatch = [...promoFields, body('percent').optional().isInt({ min: 1, max: 100 }).withMessage('percent must be 1–100.').toInt()];

// Public: CheckoutPage validates the entered code.
router.post(
  '/validate',
  promoLimiter,
  body('code').notEmpty().withMessage('code is required.').isString(),
  validate,
  validatePromo
);

router.get('/', ...adminWrite, listPromos);
router.post('/', ...adminWrite, promoBody, validate, createPromo);
router.put('/:code', ...adminWrite, codeParam, promoPatch, validate, updatePromo);
router.delete('/:code', ...adminWrite, codeParam, validate, deletePromo);

export default router;
