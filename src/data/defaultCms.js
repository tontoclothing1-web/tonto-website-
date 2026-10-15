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
    genesisImage: '/assets/branding/tonto-tags.jpg',
    headline: 'ABOUT TONTO',
    description: 'Same Stories, Different People. Crafting substantial, heavyweight streetwear with brutalist drape and generational Indian textile mastery.',
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

/**
 * Deep-merges partial or empty CMS payloads with factory defaults so sections,
 * cards, banners, categories, and shoppable outfits are never wiped out by empty
 * objects or database defaults.
 */
export function mergeCmsWithDefaults(base = {}) {
  if (!base || typeof base !== 'object') return { ...DEFAULT_CMS_CONTENT };

  const rawHero = base.hero || {};
  const hero = {
    image: rawHero.image || DEFAULT_CMS_CONTENT.hero.image,
    tagline: rawHero.tagline || DEFAULT_CMS_CONTENT.hero.tagline,
    headline: rawHero.headline || DEFAULT_CMS_CONTENT.hero.headline,
    buttonText: rawHero.buttonText || DEFAULT_CMS_CONTENT.hero.buttonText,
  };

  const rawGraphic = base.graphicBanner || base.graphic_banner || {};
  const graphicBanner = {
    image: rawGraphic.image || DEFAULT_CMS_CONTENT.graphicBanner.image,
    subtitle: rawGraphic.subtitle ?? DEFAULT_CMS_CONTENT.graphicBanner.subtitle,
    headline: rawGraphic.headline || DEFAULT_CMS_CONTENT.graphicBanner.headline,
    buttonText: rawGraphic.buttonText || DEFAULT_CMS_CONTENT.graphicBanner.buttonText,
  };

  const rawLookbook = base.lookbookBanner || base.lookbook_banner || {};
  const lookbookBanner = {
    image: rawLookbook.image || DEFAULT_CMS_CONTENT.lookbookBanner.image,
    headline: rawLookbook.headline || DEFAULT_CMS_CONTENT.lookbookBanner.headline,
    buttonText: rawLookbook.buttonText || DEFAULT_CMS_CONTENT.lookbookBanner.buttonText,
  };

  const rawTonto = base.tontoOwnMake || base.tonto_own_make || base.tontoMade || {};
  const tontoOwnMake = {
    badge: rawTonto.badge || DEFAULT_CMS_CONTENT.tontoOwnMake.badge,
    headline: rawTonto.headline || DEFAULT_CMS_CONTENT.tontoOwnMake.headline,
    description: rawTonto.description ?? DEFAULT_CMS_CONTENT.tontoOwnMake.description,
    card1Image: rawTonto.card1Image || DEFAULT_CMS_CONTENT.tontoOwnMake.card1Image,
    card1Tag: rawTonto.card1Tag ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card1Tag,
    card1Title: rawTonto.card1Title ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card1Title,
    card1Desc: rawTonto.card1Desc ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card1Desc,
    card2Image: rawTonto.card2Image || DEFAULT_CMS_CONTENT.tontoOwnMake.card2Image,
    card2Tag: rawTonto.card2Tag ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card2Tag,
    card2Title: rawTonto.card2Title ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card2Title,
    card2Desc: rawTonto.card2Desc ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card2Desc,
    card3Image: rawTonto.card3Image || DEFAULT_CMS_CONTENT.tontoOwnMake.card3Image,
    card3Tag: rawTonto.card3Tag ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card3Tag,
    card3Title: rawTonto.card3Title ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card3Title,
    card3Desc: rawTonto.card3Desc ?? DEFAULT_CMS_CONTENT.tontoOwnMake.card3Desc,
  };

  const rawCategories = Array.isArray(base.categories) && base.categories.length > 0
    ? base.categories
    : Array.isArray(base.categoryCarousel) && base.categoryCarousel.length > 0
    ? base.categoryCarousel
    : Array.isArray(base.category_carousel) && base.category_carousel.length > 0
    ? base.category_carousel
    : DEFAULT_CMS_CONTENT.categories;

  const categories = rawCategories.map((cat, idx) => {
    const fallback = DEFAULT_CMS_CONTENT.categories[idx] || {};
    return {
      ...fallback,
      ...cat,
      image: cat.image || fallback.image,
      title: cat.title || fallback.title,
      subtitle: cat.subtitle ?? fallback.subtitle,
      categoryFilter: cat.categoryFilter || fallback.categoryFilter,
    };
  });

  const shoppableLooks = Array.isArray(base.shoppableLooks) && base.shoppableLooks.length > 0
    ? base.shoppableLooks
    : Array.isArray(base.shoppable_looks) && base.shoppable_looks.length > 0
    ? base.shoppable_looks
    : DEFAULT_CMS_CONTENT.shoppableLooks;

  const rawAbout = base.aboutUs || base.about_us || {};
  const aboutUs = {
    heroImage: rawAbout.heroImage || DEFAULT_CMS_CONTENT.aboutUs.heroImage,
    genesisImage: rawAbout.genesisImage || rawAbout.card1Image || DEFAULT_CMS_CONTENT.aboutUs.genesisImage,
    headline: rawAbout.headline || DEFAULT_CMS_CONTENT.aboutUs.headline,
    description: rawAbout.description ?? DEFAULT_CMS_CONTENT.aboutUs.description,
    card1Image: rawAbout.card1Image || DEFAULT_CMS_CONTENT.aboutUs.card1Image,
    card2Image: rawAbout.card2Image || DEFAULT_CMS_CONTENT.aboutUs.card2Image,
    card3Image: rawAbout.card3Image || DEFAULT_CMS_CONTENT.aboutUs.card3Image,
  };

  const rawOffer = base.offerModal || base.offer_modal || {};
  const offerModal = {
    image: rawOffer.image || DEFAULT_CMS_CONTENT.offerModal.image,
    tag: rawOffer.tag ?? DEFAULT_CMS_CONTENT.offerModal.tag,
    badge: rawOffer.badge ?? DEFAULT_CMS_CONTENT.offerModal.badge,
    headline: rawOffer.headline ?? DEFAULT_CMS_CONTENT.offerModal.headline,
    description: rawOffer.description ?? DEFAULT_CMS_CONTENT.offerModal.description,
    privilegeTag: rawOffer.privilegeTag ?? DEFAULT_CMS_CONTENT.offerModal.privilegeTag,
    title: rawOffer.title ?? DEFAULT_CMS_CONTENT.offerModal.title,
    subtitle: rawOffer.subtitle ?? DEFAULT_CMS_CONTENT.offerModal.subtitle,
    buttonText: rawOffer.buttonText ?? DEFAULT_CMS_CONTENT.offerModal.buttonText,
    promoCode: rawOffer.promoCode ?? DEFAULT_CMS_CONTENT.offerModal.promoCode,
  };

  return {
    hero,
    graphicBanner,
    lookbookBanner,
    tontoOwnMake,
    tontoMade: tontoOwnMake,
    categories,
    categoryCarousel: categories,
    shoppableLooks,
    aboutUs,
    offerModal,
  };
}

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
