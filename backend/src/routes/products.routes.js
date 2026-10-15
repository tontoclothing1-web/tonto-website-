import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.controller.js';
import { protect, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PRODUCT_CATEGORIES } from '../models/Product.js';

const router = Router();

const adminWrite = [protect, requireAdmin];

const slugParam = param('slug').isString().trim().notEmpty().withMessage('Slug is required.');

const productBody = [
  body('slug').optional().isString().trim().notEmpty().withMessage('Slug must be a non-empty string.'),
  body('title').notEmpty().withMessage('Title is required.').isString(),
  body('category').isIn(PRODUCT_CATEGORIES).withMessage(
    `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`
  ),
  body('colour').optional().isString(),
  body('fit').optional().isString(),
  body('priceText').optional().isString(),
  body('numericPrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('numericPrice must be >= 0.'),
  body('images').optional().isArray().withMessage('images must be an array of URLs.'),
  body('alt').optional().isString(),
  body('description').optional().isString(),
  body('verifiedBrand').optional().isString(),
  body('availability').optional().isString(),
  body('variants').optional().isArray().withMessage('variants must be an array of size strings.'),
  body('measurements').optional().isString(),
  body('isTrending').optional().isBoolean().toBoolean(),
  body('isNew').optional().isBoolean().toBoolean(),
  body('stockQty').optional().isInt({ min: 0 }).toInt(),
  body('active').optional().isBoolean().toBoolean(),
];

router.get(
  '/',
  optionalAuth, // lets an admin token unlock ?includeInactive=true
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isIn(['featured', 'newest', 'alpha', 'price-asc', 'price-desc']),
    query('category').optional().isString().trim().isLength({ max: 40 }),
    query('search').optional().isString().trim().isLength({ max: 120 }),
  ],
  validate,
  listProducts
);
router.get('/:slug', optionalAuth, slugParam, validate, getProductBySlug);
router.post('/', ...adminWrite, productBody, validate, createProduct);
router.put('/:slug', ...adminWrite, slugParam, validate, updateProduct);
router.delete('/:slug', ...adminWrite, slugParam, validate, deleteProduct);

export default router;
