/**
 * Order routes — mount at /api/orders.
 *  POST /             — guest + auth checkout (optionalAuth; user linked when present).
 *  POST /quote        — server-computed totals for the order summary (no writes).
 *  GET  /my           — customer's own orders (requireAuth).
 *  GET  /:id          — one order (protect: owner or admin, role read from the DB).
 *  POST /:id/cancel   — owner cancels a held order + stock is returned.
 *  GET  /             — admin list ?status=&deliveryMethod=&search=&page=&limit=.
 *  PATCH /:id/status  — admin fulfilment update; :id is the TONTO-… orderId.
 */
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { optionalAuth, protect, requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { checkoutLimiter } from '../middleware/rateLimit.js';
import {
  createOrder,
  quoteOrder,
  getMyOrders,
  getOrder,
  cancelMyOrder,
  listOrders,
  updateOrderStatus,
} from '../controllers/orders.controller.js';
import ApiError from '../utils/ApiError.js';

const router = Router();

const orderIdParam = param('id').isString().trim().isLength({ min: 4, max: 40 }).withMessage('Order reference is required.');

const bagItems = body('items')
  .isArray({ min: 1, max: 50 })
  .withMessage('items must be a non-empty array of bag lines.');

const itemShape = [
  body('items.*.productId').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('items.*.id').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('items.*.size').optional().isString().trim().isLength({ max: 40 }),
  body('items.*.quantity').optional().isInt({ min: 1, max: 20 }).toInt(),
  // Deliberately NO price rules: prices are read from the catalogue, and a
  // client-sent numericPrice is ignored by the controller.
];

router.post(
  '/quote',
  checkoutLimiter,
  [bagItems, ...itemShape, body('deliveryMethod').optional().isIn(['shipping', 'showroom'])],
  validate,
  quoteOrder
);

router.post(
  '/',
  checkoutLimiter,
  optionalAuth,
  [
    bagItems,
    ...itemShape,
    body('customer.firstName').isString().trim().notEmpty().withMessage('First name is required.').isLength({ max: 80 }),
    body('customer.lastName').isString().trim().notEmpty().withMessage('Last name is required.').isLength({ max: 80 }),
    body('customer.email').isEmail().withMessage('Valid email is required.'),
    body('customer.phone').isString().trim().isLength({ min: 8, max: 32 }).withMessage('Valid phone / WhatsApp number is required.'),
    body('deliveryMethod').optional().isIn(['shipping', 'showroom']),
    body('promoCode').optional().isString().trim().isLength({ max: 32 }),
    body('clientRequestId').optional().isString().trim().isLength({ min: 6, max: 120 }),
    body('notes').optional().isString().trim().isLength({ max: 1000 }),
  ],
  validate,
  createOrder
);

router.get('/my', requireAuth, getMyOrders);

// Registered after /my so "/my" is never swallowed by the ":id" pattern.
// `protect` (not `requireAuth`) because the handler trusts `req.user.role` to
// let staff open any order, and only protect re-reads that role from the DB.
router.get('/:id', protect, [orderIdParam], validate, getOrder);

router.post(
  '/:id/cancel',
  requireAuth,
  [orderIdParam, body('reason').optional().isString().trim().isLength({ max: 300 })],
  validate,
  cancelMyOrder
);

router.get(
  '/',
  requireAdmin,
  [
    query('status').optional().isString().trim().isLength({ max: 40 }),
    query('deliveryMethod').optional().isIn(['shipping', 'showroom']),
    query('search').optional().isString().trim().isLength({ max: 80 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  listOrders
);

router.patch(
  '/:id/status',
  requireAdmin,
  [
    orderIdParam,
    body('status').optional().isString().trim().isLength({ max: 40 }),
    body('paymentStatus').optional().isString().trim().isLength({ max: 40 }),
    body('trackingNumber').optional().isString().trim().isLength({ max: 80 }),
    body('courierPartner').optional().isString().trim().isLength({ max: 80 }),
    body('notes').optional().isString().trim().isLength({ max: 2000 }),
    body().custom((_, { req }) => {
      const keys = ['status', 'paymentStatus', 'trackingNumber', 'courierPartner', 'notes'];
      if (!keys.some((k) => req.body?.[k] !== undefined)) throw new Error('Nothing to update.');
      return true;
    }),
  ],
  validate,
  updateOrderStatus
);

// Any other verb under /api/orders is a mistake, not a 500.
router.all('*', asyncHandler(async (req) => {
  throw ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`);
}));

export default router;
