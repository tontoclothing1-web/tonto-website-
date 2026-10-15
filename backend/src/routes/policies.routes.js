import { Router } from 'express';

const router = Router();

// Static policy content — mirrors PolicyPage.jsx tabs so the storefront can
// render server-driven copy (GET /api/policies/:tab). No DB, no auth.
// Valid tabs: shipping | returns | privacy | terms (+ size-guide alias).

const POLICIES = {
  shipping: {
    title: 'Shipping & Delivery',
    updatedAt: '2026-10-01',
    sections: [
      {
        heading: 'Showroom Dispatch & Transit Timelines',
        body: 'Every order is inspected, steam-prepped, and hand-packaged at the TONTO showroom — Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu 641035.',
      },
      {
        heading: 'Tamil Nadu & South India',
        body: 'Estimated delivery within 2–4 business days via verified express surface courier.',
      },
      {
        heading: 'Rest of India & Metro Hubs',
        body: 'Estimated delivery within 4–7 business days with a real-time tracking number shared on WhatsApp.',
      },
      {
        heading: 'Coimbatore Showroom Pickup',
        body: 'Select Showroom Pickup at checkout to try on pieces in-store before taking them home. No courier charge applies to pickups.',
      },
    ],
  },
  returns: {
    title: 'Archive Returns & Exchanges',
    updatedAt: '2026-10-01',
    sections: [
      {
        heading: 'Archive Authenticity & Exchange Policy',
        body: 'TONTO garments are curated unisex thrift, surplus, and vintage archive pieces — most styles are one-of-a-kind cuts or limited batches.',
      },
      {
        heading: 'Pre-Dispatch Measurement Verification',
        body: 'Our concierge verifies chest, waist, inseam, and leg-opening measurements with you on WhatsApp (+91 82483 21214) before dispatch.',
      },
      {
        heading: 'Exchange Assistance',
        body: 'For sizing discrepancies, contact us within 48 hours of delivery for an exchange or store credit.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updatedAt: '2026-10-01',
    sections: [
      {
        heading: 'Privacy & Data Integrity',
        body: 'We collect contact details (phone, email, shipping address) strictly to coordinate order holds, dispatch, and opt-in drop alerts.',
      },
      {
        heading: 'No Sale of Data',
        body: 'We do not sell, rent, or trade your contact information with external marketing third parties.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updatedAt: '2026-10-01',
    sections: [
      {
        heading: 'Terms of Service',
        body: 'TONTO operates as a curated unisex fashion archive providing thrift, imported, and surplus apparel in Coimbatore, Tamil Nadu, India.',
      },
      {
        heading: 'Availability & Holds',
        body: 'Availability follows physical showroom inventory. Placed orders are showroom holds until our team verifies specs and confirms dispatch.',
      },
    ],
  },
  'size-guide': {
    title: 'Garment Measuring Guide',
    updatedAt: '2026-10-01',
    sections: [
      {
        heading: 'How We Measure Archive Pieces',
        body: 'All measurements are taken with the garment laid flat. Streetwear silhouettes vary by decade and vintage origin.',
      },
      {
        heading: 'Denim Reference (tag → flat waist → inseam → leg opening)',
        body: '28 → 28–29in → 30in → 20in (Wide) • 30 → 30–31in → 31in → 21in (Wide) • 32 → 32–33in → 31in → 22in (Extra Wide) • 34 → 34–35in → 32in → 22.5in (Extra Wide) • 36 → 36–37in → 32in → 23in (Extra Wide).',
      },
    ],
  },
};

const ALIASES = { return: 'returns', shipping: 'shipping', terms: 'terms', privacy: 'privacy' };

// GET /api/policies/:tab
router.get('/:tab', (req, res) => {
  const raw = String(req.params.tab || '').toLowerCase().trim();
  const tab = POLICIES[raw] ? raw : ALIASES[raw];
  if (!tab || !POLICIES[tab]) {
    return res.status(404).json({
      success: false,
      message: 'Unknown policy tab. Use shipping|returns|privacy|terms|size-guide.',
    });
  }
  return res.json({ success: true, tab, ...POLICIES[tab] });
});

// GET /api/policies — tab index.
router.get('/', (_req, res) => {
  const tabs = Object.entries(POLICIES).map(([id, p]) => ({
    id,
    title: p.title,
    updatedAt: p.updatedAt,
  }));
  return res.json({ success: true, count: tabs.length, data: tabs });
});

export default router;
export { POLICIES };
