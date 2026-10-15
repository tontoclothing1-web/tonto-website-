import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { authLimiter, adminLoginLimiter } from '../middleware/rateLimit.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  adminLogin,
} from '../controllers/auth.controller.js';

const router = Router();

const emailRule = body('email').isEmail().withMessage('must be a valid email').normalizeEmail();
const passwordRule = body('password')
  .isLength({ min: 6, max: 200 })
  .withMessage('must be at least 6 characters');

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 120 }),
    emailRule,
    passwordRule,
    body('phone').optional().isString().trim().isLength({ max: 32 }),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [emailRule, body('password').notEmpty().withMessage('password is required').isString().isLength({ max: 200 })],
  validate,
  login
);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/profile
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('name is too short'),
    body('phone').optional().trim().isLength({ max: 32 }),
  ],
  validate,
  updateProfile
);

// POST /api/auth/forgot-password (stub — no email provider yet)
router.post('/forgot-password', authLimiter, [emailRule], validate, forgotPassword);

// POST /api/auth/admin/login — passcode gate for AdminDashboard
router.post(
  '/admin/login',
  adminLoginLimiter,
  [
    body('passcode').notEmpty().withMessage('passcode is required').isString().isLength({ max: 200 }),
    body('email').optional().isEmail().withMessage('must be a valid email').normalizeEmail(),
  ],
  validate,
  adminLogin
);

export default router;
