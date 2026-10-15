import { Router } from 'express';
import { body } from 'express-validator';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', getSettings);
router.put(
  '/',
  protect,
  requireAdmin,
  [
    // Capped lengths: these strings are echoed onto every storefront page, so an
    // accidental 2 MB paste used to be stored (and served) verbatim.
    body('storeName').optional().isString().trim().isLength({ max: 120 }),
    body('storeLocation').optional().isString().trim().isLength({ max: 300 }),
    body('whatsappPhone').optional().isString().trim().isLength({ max: 32 }),
    body('instagramHandle').optional().isString().trim().isLength({ max: 64 }),
    body('announcementText').optional().isString().trim().isLength({ max: 240 }),
    body('freeShippingThreshold').optional().isString().trim().isLength({ max: 32 }),
  ],
  validate,
  updateSettings
);

export default router;
