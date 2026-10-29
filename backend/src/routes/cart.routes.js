/**
 * Cart routes — mount at /api/cart.
 *  GET  /            — server bag for the bearer user (optional auth; guests get
 *                      their bag via ?deviceId=...).
 *  POST /sync        — push the frontend bag → normalised + re-quoted.
 *                      `mode: 'replace'` (default 'merge') makes the pushed bag
 *                      authoritative, so removed lines stay removed.
 * Both accept guests; auth is optional so anonymous bags keep working.
 * Prices are always taken from the `products` table by the controller, so no
 * price field is validated here — the client's numbers are ignored, not checked.
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { cartSyncLimiter } from '../middleware/rateLimit.js';
import { getCart, syncCart } from '../controllers/cart.controller.js';

const router = Router();

router.get('/', optionalAuth, getCart);

router.post(
  '/sync',
  cartSyncLimiter,
  optionalAuth,
  [
    body('items').optional().isArray().withMessage('items must be an array.'),
    body('items.*.quantity').optional().isInt({ min: 1, max: 20 }).withMessage('quantity must be 1–20.'),
    body('items.*.productId').optional().isString().trim().isLength({ max: 120 }),
    body('items.*.id').optional().isString().trim().isLength({ max: 120 }),
    body('promoCode').optional().isString().trim().isLength({ max: 32 }),
    body('deviceId').optional().isString().trim().isLength({ max: 80 }),
    body('mode').optional().isIn(['merge', 'replace']).withMessage("mode must be 'merge' or 'replace'."),
    body('deliveryMethod').optional().isIn(['shipping', 'showroom']),
  ],
  validate,
  syncCart
);

export default router;
