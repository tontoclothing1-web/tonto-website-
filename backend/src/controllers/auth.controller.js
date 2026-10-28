import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { requireSupabase } from '../config/supabase.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  toSafeJSON,
  listAddresses,
} from '../models/User.js';
import authConfig from '../config/auth.js';
import { signToken } from '../utils/jwt.js';
import { safeCompare } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';

const SALT_ROUNDS = 10;

const issueToken = (user) =>
  signToken({
    id: String(user.id ?? user._id),
    role: user.role,
    email: user.email,
  });

const withAddresses = async (user) => {
  if (!user) return user;
  const safe = toSafeJSON(user);
  try {
    const addresses = await listAddresses(safe.id);
    return { ...safe, addresses };
  } catch {
    if (safe.addresses === undefined) return { ...safe, addresses: [] };
    return safe;
  }
};

const publicUser = (user) => toSafeJSON(user);

// POST /api/auth/register — { name, email, password, phone? }
export const register = async (req, res, next) => {
  try {
    requireSupabase();
    const { name, email, password, phone = '' } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) throw ApiError.conflict('Email already registered');

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || '').trim(),
      password_hash,
      role: 'customer',
      credentials_submitted: true,
    });

    const token = issueToken(user);
    const safe = await withAddresses(user);
    return res.status(201).json({ success: true, token, user: safe });
  } catch (err) {
    if (err?.code === '23505' && !err.statusCode) {
      return next(ApiError.conflict('Email already registered'));
    }
    return next(err);
  }
};

// POST /api/auth/login — { email, password }
export const login = async (req, res, next) => {
  try {
    requireSupabase();
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await findUserByEmail(normalizedEmail);
    if (!user) throw ApiError.unauthorized('Invalid email or password');

    const hash = user.passwordHash ?? user.password_hash;
    if (!hash) throw ApiError.unauthorized('Invalid email or password');
    const ok = await bcrypt.compare(password, hash);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');

    const token = issueToken(user);
    const safe = await withAddresses(user);
    return res.status(200).json({ success: true, token, user: safe });
  } catch (err) {
    return next(err);
  }
};

// GET /api/auth/me — protect
export const getMe = async (req, res, next) => {
  try {
    requireSupabase();
    const user = await findUserById(req.user.id);
    if (!user) throw ApiError.notFound('User not found');
    const safe = await withAddresses(user);
    return res.status(200).json({ success: true, user: safe });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/auth/profile — protect — { name?, phone?, sizes?, credentialsSubmitted?, promoClaimed? }
export const updateProfile = async (req, res, next) => {
  try {
    requireSupabase();
    const allowed = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      allowed.name = req.body.name.trim();
    }
    if (typeof req.body.phone === 'string') allowed.phone = req.body.phone.trim();
    if (req.body.sizes && typeof req.body.sizes === 'object') {
      if (typeof req.body.sizes.topSize === 'string') {
        allowed['sizes.topSize'] = req.body.sizes.topSize;
      }
      if (typeof req.body.sizes.bottomWaist === 'string') {
        allowed['sizes.bottomWaist'] = req.body.sizes.bottomWaist;
      }
    }
    // Also accept flat topSize / bottomWaist for forward-compat.
    if (typeof req.body.topSize === 'string') allowed['sizes.topSize'] = req.body.topSize;
    if (typeof req.body.bottomWaist === 'string') {
      allowed['sizes.bottomWaist'] = req.body.bottomWaist;
    }
    if (typeof req.body.credentialsSubmitted === 'boolean') {
      allowed.credentialsSubmitted = req.body.credentialsSubmitted;
    }
    if (typeof req.body.promoClaimed === 'boolean') {
      allowed.promoClaimed = req.body.promoClaimed;
    }

    const user = await updateUser(req.user.id, allowed);
    if (!user) throw ApiError.notFound('User not found');
    const safe = await withAddresses(user);
    return res.status(200).json({ success: true, user: safe });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/forgot-password — stub (logs reset request, no email provider yet)
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(`[auth] password-reset requested for ${email} — stub, no email sent`);
    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, reset instructions were sent.',
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/admin/login — { email?, passcode } → admin JWT
export const adminLogin = async (req, res, next) => {
  try {
    const { email = 'admin@tonto.local', passcode } = req.body;
    if (!authConfig.adminPasscode) {
      throw ApiError.unauthorized('Admin login is disabled — ADMIN_PASSCODE is not configured');
    }
    if (typeof passcode !== 'string' || !safeCompare(passcode, authConfig.adminPasscode)) {
      throw ApiError.unauthorized('Invalid admin passcode');
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    let admin = null;
    try {
      if (isSupabaseConnected()) {
        admin = await findUserByEmail(normalizedEmail);
        if (!admin) {
          const password_hash = await bcrypt.hash(randomBytes(32).toString('base64url'), SALT_ROUNDS);
          admin = await createUser({
            name: 'TONTO Admin',
            email: normalizedEmail,
            phone: '',
            password_hash,
            role: 'admin',
            credentials_submitted: true,
          });
        } else if (admin.role !== 'admin') {
          admin = await updateUser(admin.id, { role: 'admin' });
        }
      }
    } catch (dbErr) {
      console.warn(`[auth] Supabase admin sync skipped: ${dbErr.message}`);
    }

    if (!admin) {
      admin = {
        id: 'admin-director',
        name: 'TONTO Admin',
        email: normalizedEmail,
        role: 'admin',
        credentials_submitted: true,
      };
    }

    const token = issueToken(admin);
    let safe = admin;
    try {
      safe = await withAddresses(admin);
    } catch {
      safe = admin;
    }
    console.log(`[auth] admin session issued for ${normalizedEmail} from ${req.ip}`);
    return res.status(200).json({ success: true, token, user: safe });
  } catch (err) {
    if (err?.code === '23505' && !err.statusCode) {
      return next(ApiError.conflict('Email already registered'));
    }
    return next(err);
  }
};

export { publicUser };

export default { register, login, getMe, updateProfile, forgotPassword, adminLogin };
