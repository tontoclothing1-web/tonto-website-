import { Router } from 'express';
import { body } from 'express-validator';
import { getCms, updateCms } from '../controllers/cms.controller.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', getCms);
router.put(
  '/',
  protect,
  requireAdmin,
  [
    body('hero').optional().isObject(),
    body('graphicBanner').optional().isObject(),
    body('categoryCarousel').optional().isArray(),
    body('categories').optional().isArray(),
    body('tontoOwnMake').optional().isObject(),
    body('lookbookBanner').optional().isObject(),
    body('aboutUs').optional().isObject(),
    body('offerModal').optional().isObject(),
    body('shoppableLooks').optional().isArray(),
    // FileReader dataURLs must never reach the CMS: a single 4 MB base64 image
    // inflates the row, the response and every storefront render. Images go
    // through POST /api/uploads and are referenced by URL.
    body().custom((payload) => {
      const json = JSON.stringify(payload ?? {});
      if (/data:(?!image\/)/i.test(json)) throw new Error('Only image data URLs are accepted.');
      if (json.length > 900_000) throw new Error('CMS payload is too large — upload the media and use URLs.');
      if (/data:image\/(png|jpe?g|webp|gif);base64,/i.test(json)) {
        throw new Error('Upload images via POST /api/uploads and store their URLs, not base64 data.');
      }
      return true;
    }),
  ],
  validate,
  updateCms
);

export default router;
