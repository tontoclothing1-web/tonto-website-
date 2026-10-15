import { Router } from 'express';
import { requireSupabase } from '../config/supabase.js';
import { sendCached } from '../utils/cache.js';

const router = Router();

// Static fallback mirrors BRAND_INFO (src/data/products.js) + the default
// storeSettings in src/App.jsx. When the settings/cms agent ships
// backend/src/models/StoreSettings.js we read live values instead —
// this router never crashes when that file is absent.
const FALLBACK_STORE_INFO = {
  brand: 'TONTO Clothing',
  tagline: 'THRIFT • IMPORTED • SURPLUS',
  location: 'Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India',
  landmark: 'Opposite Prozone Mall',
  hours: 'Mon–Sun, 10:30 AM – 9:00 PM IST (walk-ins welcome)',
  mapsUrl: 'https://share.google/6kenpRy2HPjbnZ9Lo',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Tonto+Clothing+Opposite+Prozone+Mall+Coimbatore&t=&z=16&ie=UTF8&iwloc=&output=embed',
  phone: '+91 82483 21214',
  phoneRaw: '+918248321214',
  whatsapp: '918248321214',
  whatsappUrl:
    'https://wa.me/918248321214?text=Hi%20TONTO,%20I%20would%20like%20to%20enquire%20about%20your%20pieces.',
  instagram: '@tonto_clothing_',
  instagramHandle: 'tonto_clothing_',
  instagramUrl: 'https://instagram.com/tonto_clothing_',
  announcementText: '✦ EXCLUSIVE PRIVILEGE: 15% OFF FIRST ORDER • CLAIM CODE | SIGN IN',
  freeShippingThreshold: '₹2,500',
};

async function loadLiveStoreInfo() {
  // Live values from the Supabase store_settings singleton (cached 5 min).
  // Any shape mismatch or DB outage → static fallback below.
  try {
    const sb = requireSupabase();
    const { data: doc, error } = await sb
      .from('store_settings')
      .select('store_name,store_location,whatsapp_phone,instagram_handle,announcement_text,free_shipping_threshold')
      .eq('key', 'store')
      .maybeSingle();
    if (error || !doc) return null;
    const waDigits = String(doc.whatsapp_phone || '').replace(/[^0-9]/g, '');
    return {
      ...FALLBACK_STORE_INFO,
      brand: doc.store_name || FALLBACK_STORE_INFO.brand,
      location: doc.store_location || FALLBACK_STORE_INFO.location,
      phone: doc.whatsapp_phone || FALLBACK_STORE_INFO.phone,
      whatsapp: waDigits || FALLBACK_STORE_INFO.whatsapp,
      instagramHandle: (doc.instagram_handle || '').replace(/^@/, '') || 'tonto_clothing_',
      announcementText: doc.announcement_text || FALLBACK_STORE_INFO.announcementText,
      freeShippingThreshold: doc.free_shipping_threshold || FALLBACK_STORE_INFO.freeShippingThreshold,
    };
  } catch {
    return null;
  }
}

// GET /api/store/info — brand, location, hours, maps URL, whatsapp, instagram.
router.get('/info', async (_req, res, next) => {
  try {
    return await sendCached(res, 'store:info', 5 * 60 * 1000, async () => {
      const live = await loadLiveStoreInfo();
      const info = live || FALLBACK_STORE_INFO;
      const whatsappUrl = `https://wa.me/${String(info.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        'Hi TONTO, I would like to enquire about your pieces.'
      )}`;
      return {
        success: true,
        source: live ? 'StoreSettings' : 'static-fallback',
        data: {
          ...info,
          instagram: info.instagram || `@${info.instagramHandle}`,
          instagramUrl: info.instagramUrl || `https://instagram.com/${info.instagramHandle}`,
          whatsappUrl,
        },
      };
    });
  } catch (err) {
    return next(err);
  }
});

// Alias: GET /api/store
router.get('/', async (_req, res, next) => {
  try {
    const live = await loadLiveStoreInfo();
    return res.json({ success: true, source: live ? 'StoreSettings' : 'static-fallback', data: live || FALLBACK_STORE_INFO });
  } catch (err) {
    return next(err);
  }
});

export default router;
export { FALLBACK_STORE_INFO };
