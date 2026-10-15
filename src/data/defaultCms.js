import { SHOPPABLE_LOOKS } from './products';

export const DEFAULT_CMS_CONTENT = {
  hero: {
    image: '/assets/hero-banner-clean-orig.jpg',
    tagline: 'THRIFT / IMPORTED / SURPLUS',
    headline: 'MADE TO BE DIFFERENT',
    buttonText: 'SHOP THE NEW ARRIVALS'
  },
  graphicBanner: {
    image: '/assets/campaign-graphic-clean-orig.jpg',
    subtitle: 'OVERSIZED FITS. EVERYDAY STYLE.',
    headline: 'THE GRAPHIC EDIT',
    buttonText: 'shop now'
  },
  lookbookBanner: {
    image: '/assets/lookbook-banner-clean.jpg',
    headline: 'TONTO MADE',
    buttonText: 'explore tonto made'
  },
  tontoOwnMake: {
    badge: 'IN-HOUSE ATELIER • COIMBATORE',
    headline: 'TONTO MADE',
    description: 'Beyond curation. Proprietary cuts, heavyweight custom-milled textiles, and distinct garment washes — patterned, tailored, and hand-finished in small batches under our own roof in Coimbatore.',
    card1Image: '/assets/branding/tonto-tags.jpg',
    card1Tag: 'ARCHIVE TAGGING',
    card1Title: 'CUSTOM HARDWARE & LABELS',
    card1Desc: 'Every garment carries custom woven jacquard labeling, tonal embroidery, and archival industrial details unique to TONTO.',
    card2Image: '/assets/products/tonto-waffle-tees-hanging.jpg',
    card2Tag: 'PROPRIETARY DRAPE',
    card2Title: 'DROP-SHOULDER PROPORTIONS',
    card2Desc: 'Engineered unisex fits crafted with wide bodies, relaxed collars, and scalloped hems for effortless streetwear layering.',
    card3Image: '/assets/products/tonto-studios-waffle-black-concrete.jpg',
    card3Tag: 'CUSTOM MILLED',
    card3Title: 'HEAVYWEIGHT KNITS & WASHES',
    card3Desc: 'High-density textured waffle knits, custom mineral dyes, and hand-distressed washed denim developed specifically for our climate.'
  },
  categories: [
    {
      id: 'new-arrivals',
      title: 'NEW ARRIVALS',
      subtitle: 'knit zip up sweater + more',
      categoryFilter: 'New Arrivals',
      image: '/assets/products/tonto-studios-waffle-black-front.jpg'
    },
    {
      id: 'new-denim',
      title: 'NEW DENIM',
      subtitle: 'distressed workwear denim + more',
      categoryFilter: 'Denim',
      image: '/assets/products/chain-print-denim-detail.jpg'
    },
    {
      id: 'new-outerwear',
      title: 'NEW OUTERWEAR',
      subtitle: 'reworked jacket + more',
      categoryFilter: 'Outerwear',
      image: '/assets/products/pinstripe-sweatshirt-navy-flat1.jpg'
    },
    {
      id: 'new-sweatpants',
      title: 'NEW SWEATPANTS',
      subtitle: 'mojave sweatpants + more',
      categoryFilter: 'Sweatpants',
      image: '/assets/products/grey-stripe-black-denim-wide.jpg'
    },
    {
      id: 'new-tops',
      title: 'NEW TOPS',
      subtitle: 'striped layered polo + more',
      categoryFilter: 'Tops',
      image: '/assets/products/layered-graphic-tee-blue.jpg'
    },
    {
      id: 'new-accessories',
      title: 'NEW ACCESSORIES',
      subtitle: 'leather belt & hardware + more',
      categoryFilter: 'Accessories',
      image: '/assets/products/archive-hardware-belts.jpg'
    }
  ],
  shoppableLooks: SHOPPABLE_LOOKS,
  aboutUs: {
    heroImage: '/assets/editorial/editorial-brutalist-full.jpg',
    card1Image: '/assets/branding/tonto-tags.jpg',
    card2Image: '/assets/editorial/editorial-standing-camo.jpg',
    card3Image: '/assets/products/chain-print-denim-detail.jpg'
  },
  offerModal: {
    image: '/assets/editorial/editorial-seated-camo.jpg',
    tag: 'TONTO ARCHIVE',
    badge: 'LIMITED OFFER',
    headline: 'MADE TO BE DIFFERENT',
    description: 'Curated thrift, surplus & heavy washed denim drops from Coimbatore.',
    privilegeTag: 'WELCOME PRIVILEGE',
    title: 'UNLOCK 15% OFF',
    subtitle: 'Enter your email to reveal your private 15% discount code and receive priority access to limited surplus & denim releases.',
    buttonText: 'REVEAL 15% OFF CODE',
    promoCode: 'TONTO15'
  }
};

export const GALLERY_PRESETS = [
  { label: '★ Editorial Look Video (MP4 Video)', url: '/assets/videos/look-preview.mp4', isVideo: true },
  { label: 'Hero Campaign Clean (Default)', url: '/assets/hero-banner-clean.jpg' },
  { label: 'Hero Campaign HD Sharpened', url: '/assets/hero-banner-hd.jpg' },
  { label: 'Hero Campaign Realistic Tone', url: '/assets/hero-banner-realistic.jpg' },
  { label: 'Campaign Graphic Edit (Clean)', url: '/assets/campaign-graphic-clean.jpg' },
  { label: 'Campaign Graphic Edit (Ultra HD)', url: '/assets/campaign-graphic-ultra.jpg' },
  { label: 'Lookbook Banner HD', url: '/assets/lookbook-banner-hd.jpg' },
  { label: 'Lookbook Banner Clean', url: '/assets/lookbook-banner-clean.jpg' },
  { label: 'Editorial Seated Camo (Atmospheric)', url: '/assets/editorial/editorial-seated-camo.jpg' },
  { label: 'Editorial Standing Camo Full', url: '/assets/editorial/editorial-standing-camo.jpg' },
  { label: 'Editorial Brutalist Silhouette', url: '/assets/editorial/editorial-brutalist-full.jpg' },
  { label: 'TONTO Custom Hardware & Labels', url: '/assets/branding/tonto-tags.jpg' },
  { label: 'Waffle Tees Hanging Atelier', url: '/assets/products/tonto-waffle-tees-hanging.jpg' },
  { label: 'Waffle Black Concrete Flat', url: '/assets/products/tonto-studios-waffle-black-concrete.jpg' },
  { label: 'Waffle Tees Flat on Grass', url: '/assets/products/tonto-waffles-grass-flat.jpg' },
  { label: 'Chain Graffiti Denim Macro Detail', url: '/assets/products/chain-print-denim-detail.jpg' },
  { label: 'Extra Wide Washed Denim', url: '/assets/products/extra-wide-denim.jpg' },
  { label: 'Black Denim Shirt & Flared Jeans', url: '/assets/products/black-denim-shirt-flared-jeans.jpg' },
  { label: 'Oversized Graphic Tee Black', url: '/assets/products/oversized-graphic-tee-black.jpg' },
  { label: 'Sportswear Sweatshirt Navy', url: '/assets/products/sportswear-sweatshirt-navy-flat1.jpg' },
  { label: 'Archive Hardware Belts & Accessories', url: '/assets/products/archive-hardware-belts.jpg' }
];

export const STUDIO_GALLERY_PRESETS = GALLERY_PRESETS;
