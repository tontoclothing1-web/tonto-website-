import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories.controller.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const adminWrite = [protect, requireAdmin];

const slugParam = param('slug').isString().trim().notEmpty().withMessage('Slug is required.');

router.get('/', listCategories);
router.get('/:slug', slugParam, validate, getCategoryBySlug);
router.post(
  '/',
  ...adminWrite,
  [
    body('slug').notEmpty().withMessage('Slug is required.').isString(),
    body('title').notEmpty().withMessage('Title is required.').isString(),
    body('subtitle').optional().isString(),
    body('categoryFilter').optional().isString(),
    body('image').optional().isString(),
    body('sortOrder').optional().isInt().toInt(),
    body('active').optional().isBoolean().toBoolean(),
  ],
  validate,
  createCategory
);
router.put('/:slug', ...adminWrite, slugParam, validate, updateCategory);
router.delete('/:slug', ...adminWrite, slugParam, validate, deleteCategory);

export default router;
