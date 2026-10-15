import { Router } from 'express';
import { body } from 'express-validator';
import { requireSupabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import ApiError from '../utils/ApiError.js';
import {
  findUserById,
  updateUser,
  toSafeJSON,
  listAddresses,
  addAddress,
  removeAddress,
} from '../models/User.js';

const router = Router();

// All account routes require an authenticated customer.
router.use(protect);

const mapOrderRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    orderId: row.order_id ?? row.orderId,
    order_id: row.order_id ?? row.orderId,
    user: row.user_id ?? row.user,
    userId: row.user_id ?? row.user,
    user_id: row.user_id ?? row.user,
    customer: row.customer ?? {},
    items: row.items ?? [],
    subtotal: row.subtotal ?? 0,
    discountAmount: row.discount_amount ?? row.discountAmount ?? 0,
    discount_amount: row.discount_amount ?? row.discountAmount ?? 0,
    promoCode: row.promo_code ?? row.promoCode ?? null,
    promo_code: row.promo_code ?? row.promoCode ?? null,
    promoPercent: row.promo_percent ?? row.promoPercent ?? 0,
    promo_percent: row.promo_percent ?? row.promoPercent ?? 0,
    shippingFee: row.shipping_fee ?? row.shippingFee ?? 0,
    shipping_fee: row.shipping_fee ?? row.shippingFee ?? 0,
    grandTotal: row.grand_total ?? row.grandTotal ?? 0,
    grand_total: row.grand_total ?? row.grandTotal ?? 0,
    deliveryMethod: row.delivery_method ?? row.deliveryMethod ?? 'shipping',
    delivery_method: row.delivery_method ?? row.deliveryMethod ?? 'shipping',
    status: row.status ?? 'pending',
    paymentStatus: row.payment_status ?? row.paymentStatus ?? 'Pending Payment Link',
    payment_status: row.payment_status ?? row.paymentStatus ?? 'Pending Payment Link',
    courierPartner: row.courier_partner ?? row.courierPartner ?? '',
    courier_partner: row.courier_partner ?? row.courierPartner ?? '',
    trackingNumber: row.tracking_number ?? row.trackingNumber ?? '',
    tracking_number: row.tracking_number ?? row.trackingNumber ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at ?? row.createdAt,
    created_at: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    updated_at: row.updated_at ?? row.updatedAt,
  };
};

// GET /api/account — profile snapshot (sizes + addresses, no secrets).
router.get('/', async (req, res, next) => {
  try {
    const sb = requireSupabase();
    void sb;
    const user = await findUserById(req.user.id);
    if (!user) throw ApiError.notFound('Account not found');
    const addresses = await listAddresses(req.user.id);
    const safe = toSafeJSON(user);
    return res.json({ success: true, data: { ...safe, addresses } });
  } catch (err) {
    return next(err);
  }
});

// GET /api/account/orders — my orders (Supabase `orders` table).
router.get('/orders', async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .eq('user_id', String(req.user.id))
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    const orders = (data || []).map(mapOrderRow);
    return res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    return next(err);
  }
});

// GET /api/account/addresses — list my saved addresses.
router.get('/addresses', async (req, res, next) => {
  try {
    requireSupabase();
    const user = await findUserById(req.user.id);
    if (!user) throw ApiError.notFound('Account not found');
    const addresses = await listAddresses(req.user.id);
    return res.json({ success: true, count: addresses.length, data: addresses });
  } catch (err) {
    return next(err);
  }
});

// POST /api/account/addresses — add address (first one becomes default).
router.post(
  '/addresses',
  [
    body('recipient').isString().trim().notEmpty().isLength({ max: 120 }).withMessage('recipient is required'),
    body('address').isString().trim().notEmpty().isLength({ max: 400 }).withMessage('address is required'),
    body('phone').optional().isString().trim().isLength({ max: 32 }),
    body('city').optional().isString().trim().isLength({ max: 80 }),
    body('state').optional().isString().trim().isLength({ max: 80 }),
    body('postalCode').optional().isString().trim().isLength({ max: 20 }),
    body('label').optional().isString().trim().isLength({ max: 60 }),
    body('isDefault').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      requireSupabase();
      const user = await findUserById(req.user.id);
      if (!user) throw ApiError.notFound('Account not found');
      const added = await addAddress(req.user.id, {
        label: req.body.label?.trim() || 'Primary Delivery',
        recipient: req.body.recipient.trim(),
        phone: req.body.phone?.trim?.() ?? req.body.phone ?? '',
        address: req.body.address.trim(),
        city: req.body.city?.trim?.() ?? req.body.city ?? '',
        state: req.body.state?.trim?.() ?? req.body.state ?? '',
        postalCode: req.body.postalCode?.trim?.() ?? req.body.postalCode ?? '',
        postal_code: req.body.postal_code ?? req.body.postalCode,
        isDefault: req.body.isDefault === true,
        is_default: req.body.isDefault === true,
      });
      return res.status(201).json({ success: true, data: added });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/account/addresses/:addressId — remove one address.
router.delete('/addresses/:addressId', async (req, _res, next) => {
  try {
    requireSupabase();
    const user = await findUserById(req.user.id);
    if (!user) throw ApiError.notFound('Account not found');
    const ok = await removeAddress(req.user.id, req.params.addressId);
    if (!ok) throw ApiError.notFound('Address not found');
    return _res.json({ success: true, message: 'Address removed' });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/account/sizes — update size profile (SizeGuideModal / AccountPage).
router.put(
  '/sizes',
  [
    body('topSize').optional().isString().trim().isLength({ max: 20 }),
    body('bottomWaist').optional().isString().trim().isLength({ max: 20 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      requireSupabase();
      const existing = await findUserById(req.user.id);
      if (!existing) throw ApiError.notFound('Account not found');
      const patch = {};
      if (typeof req.body.topSize === 'string') patch.top_size = req.body.topSize.trim();
      if (typeof req.body.bottomWaist === 'string') {
        patch.bottom_waist = req.body.bottomWaist.trim();
      }
      const updated = await updateUser(req.user.id, patch);
      const sizes = {
        topSize: updated?.sizes?.topSize ?? updated?.topSize ?? '',
        bottomWaist: updated?.sizes?.bottomWaist ?? updated?.bottomWaist ?? '',
      };
      return res.json({ success: true, data: sizes });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
