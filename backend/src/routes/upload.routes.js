import { Router } from 'express';
import { requireAdmin, protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { uploadImage } from '../controllers/upload.controller.js';

const router = Router();

// POST /api/uploads — multipart field `image` (admin only).
// Single multer config (middleware/upload.js): memory storage, MIME allowlist,
// 5 MB cap, server-generated filename.
router.post('/', protect, requireAdmin, uploadLimiter, uploadSingle('image'), uploadImage);

export default router;
