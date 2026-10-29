// TONTO Clothing — On-Page SEO & Structured Data Engine
//
// Manages dynamic page titles, meta descriptions, canonical URLs,
// Open Graph, Twitter/X cards, robots directives, and Schema.org JSON-LD.

export const BASE_URL = 'https://tontoclothing.com';

export const BRAND_NAME = 'TONTO Clothing';
export const STORE_LOCATION = 'Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India';
export const PHONE_NUMBER = '+91 82483 21214';
export const INSTAGRAM_HANDLE = '@tonto_clothing_';
export const INSTAGRAM_URL = 'https://instagram.com/tonto_clothing_';
export const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/editorial/editorial-brutalist-full.jpg`;

/**
 * Global Organization & LocalBusiness Schema
 */
export const STORE_ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  '@id': `${BASE_URL}/#organization`,
  name: BRAND_NAME,
  legalName: 'TONTO Clothing Studio',
  url: BASE_URL,
  logo: `${BASE_URL}/assets/logo.png`,
  image: [
    `${BASE_URL}/assets/editorial/editorial-brutalist-full.jpg`,
    `${BASE_URL}/assets/branding/tonto-tags.jpg`
  ],
  description: 'Curated thrift, imported surplus, heavyweight boxy tees, and heavy washed denim from Coimbatore, South India.',
  telephone: PHONE_NUMBER,
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Opposite to Prozone Mall, Sathy Road',
    addressLocality: 'Coimbatore',
    addressRegion: 'Tamil Nadu',
    postalCode: '641035',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 11.0543,
    longitude: 76.9961
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '10:00',
      closes: '21:30'
    }
  ],
  sameAs: [
    INSTAGRAM_URL,
    'https://share.google/6kenpRy2HPjbnZ9Lo'
  ]
};

/**
 * Keyword & Search Intent Map for all indexable pages
 */
export const SEO_KEYWORD_MAP = {
  home: {
    primary: 'thrift imported surplus streetwear India',
    secondary: [
      'TONTO clothing Coimbatore',
      'oversized streetwear tees',
      'heavy washed denim India',
      'streetwear drops Coimbatore',
      'vintage archive clothing'
    ]
  },
  collection: {
    primary: 'curated streetwear collection and drops',
    secondary: [
      'baggy denim jeans',
      'boxy heavyweight tees',
      'vintage cargo pants',
      'streetwear jackets India',
      'thrifted oversized clothing'
    ]
  },
  newArrivals: {
    primary: 'latest streetwear drops and new arrivals',
    secondary: [
      'fresh thrift drops',
      'newly curated streetwear pieces',
      'limited edition boxy tees',
      'streetwear release Coimbatore'
    ]
  },
  featured: {
    primary: 'in-house streetwear and custom washed denim',
    secondary: [
      'TONTO made garments',
      'heavyweight waffle knit thermal',
      'distressed chain graffiti denim',
      'bespoke streetwear India'
    ]
  },
  lookbook: {
    primary: 'streetwear styling lookbook and complete outfits',
    secondary: [
      'streetwear outfit ideas',
      'shoppable streetwear looks',
      'oversized boxy aesthetic',
      'Y2K grunge thrift styling'
    ]
  },
  about: {
    primary: 'about TONTO clothing Coimbatore',
    secondary: [
      'independent Indian streetwear label',
      'sustainable thrift fashion Coimbatore',
      'vintage surplus curation story'
    ]
  },
  visit: {
    primary: 'streetwear store in Coimbatore Opposite Prozone Mall',
    secondary: [
      'TONTO clothing store location',
      'thrift shop Coimbatore Sathy Road',
      'vintage streetwear boutique Tamil Nadu'
    ]
  },
  policy: {
    primary: 'TONTO clothing shipping exchange and return policy',
    secondary: [
      'streetwear delivery timelines India',
      'size exchange policy Coimbatore',
      'clothing care guide'
    ]
  }
};

/**
 * Generate Page Metadata given route view and contextual data
 */
export function getPageMetadata(view, data = {}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : BASE_URL;

  switch (view) {
    case 'home':
      return {
        title: 'TONTO Clothing | Thrift, Imported, Surplus Streetwear India',
        description: 'Explore TONTO Clothing in Coimbatore, India. Curated thrift drops, imported surplus, 360+ GSM boxy tees, and heavy washed baggy denim.',
        canonical: `${BASE_URL}/`,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        ogType: 'website',
        ogImage: `${BASE_URL}/assets/editorial/editorial-brutalist-full.jpg`,
        ogImageAlt: 'TONTO Clothing — Curated Streetwear Drops in Coimbatore, India',
        keywords: 'thrift clothing India, streetwear Coimbatore, imported surplus tees, heavy washed denim, oversized boxy tees, TONTO clothing',
        schema: [
          STORE_ORGANIZATION_SCHEMA,
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${BASE_URL}/#website`,
            url: BASE_URL,
            name: BRAND_NAME,
            description: 'Curated thrift, imported surplus, and heavy washed denim from Coimbatore, India.',
            publisher: { '@id': `${BASE_URL}/#organization` },
            potentialAction: {
              '@type': 'SearchAction',
              target: `${BASE_URL}/#/collection?search={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          }
        ]
      };

    case 'collection': {
      const category = data.category && data.category !== 'All' ? data.category : '';
      const title = category
        ? `${category} | Streetwear Collection | TONTO Clothing`
        : 'The Full Streetwear Collection | TONTO Clothing';
      const description = category
        ? `Shop curated ${category.toLowerCase()} drops at TONTO Clothing. Authentic thrift, imported surplus, and archival fits from Coimbatore, India.`
        : 'Discover the full TONTO streetwear collection. Heavyweight boxy tees, wide-leg baggy denim, vintage overshirts, and archive accessories.';
      const canonical = category
        ? `${BASE_URL}/#/collection?category=${encodeURIComponent(category)}`
        : `${BASE_URL}/#/collection`;

      return {
        title,
        description,
        canonical,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: `${BASE_URL}/assets/products/tonto-studios-waffle-black-front.jpg`,
        ogImageAlt: `${title} - TONTO Clothing`,
        keywords: `${category || 'streetwear'}, thrift clothing, baggy denim, boxy tees, streetwear collection Coimbatore`,
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title,
            url: canonical,
            description,
            isPartOf: { '@id': `${BASE_URL}/#website` }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${BASE_URL}/`
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Collection',
                item: `${BASE_URL}/#/collection`
              },
              ...(category
                ? [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: category,
                      item: canonical
                    }
                  ]
                : [])
            ]
          }
        ]
      };
    }

    case 'new-arrivals':
      return {
        title: 'New Arrivals | Latest Streetwear & Thrift Drops | TONTO',
        description: 'Explore the newest weekly drops at TONTO Clothing. Freshly curated thrift, heavyweight waffle knits, and vintage washed denim in Coimbatore.',
        canonical: `${BASE_URL}/#/new-arrivals`,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: `${BASE_URL}/assets/products/tonto-studios-waffle-black-front.jpg`,
        ogImageAlt: 'New Arrivals Streetwear Drops - TONTO Clothing',
        keywords: 'new arrivals streetwear, fresh thrift drop, latest denim release, oversized tees, Coimbatore fashion',
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'New Arrivals | TONTO Clothing',
            url: `${BASE_URL}/#/new-arrivals`,
            description: 'Freshly released streetwear and curated thrift drops from TONTO Clothing.'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'New Arrivals', item: `${BASE_URL}/#/new-arrivals` }
            ]
          }
        ]
      };

    case 'featured':
      return {
        title: 'Featured Streetwear & TONTO Made Garments | TONTO Clothing',
        description: 'Discover featured in-house pieces, signature waffle thermals, and chain-graffiti denim by TONTO Clothing. Handcrafted with generational South Indian cotton.',
        canonical: `${BASE_URL}/#/featured`,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: `${BASE_URL}/assets/branding/tonto-tags.jpg`,
        ogImageAlt: 'Featured TONTO Made Garments',
        keywords: 'featured streetwear, TONTO made, signature waffle thermal, chain graffiti denim, bespoke streetwear India',
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Featured Streetwear | TONTO Clothing',
            url: `${BASE_URL}/#/featured`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Featured', item: `${BASE_URL}/#/featured` }
            ]
          }
        ]
      };

    case 'product': {
      const p = data.product || {};
      const title = `${p.title || 'Product'} | TONTO Clothing`;
      const description = p.description || `${p.title} in ${p.colour || 'vintage wash'}. Curated streetwear and heavy cotton drape by TONTO Clothing Coimbatore.`;
      const canonical = `${BASE_URL}/#/product/${p.slug || p.id || ''}`;
      const image = p.images?.[0] ? `${BASE_URL}${p.images[0]}` : DEFAULT_OG_IMAGE;

      // Extract numeric price
      const numericPrice = Number(p.numericPrice) || parseInt(String(p.price || '').replace(/\D/g, ''), 10) || 2490;
      const isSoldOut = p.inStock === false || p.stock === 0;

      return {
        title,
        description,
        canonical,
        robots: 'index, follow',
        ogType: 'product',
        ogImage: image,
        ogImageAlt: p.alt || `${p.title} - TONTO Clothing`,
        keywords: `${p.title}, ${p.category || 'streetwear'}, ${p.colour || ''}, thrift streetwear, TONTO clothing, Coimbatore`,
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: p.title,
            image: (p.images || [image]).map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img}`)),
            description: p.description || description,
            sku: p.id,
            mpn: p.slug || p.id,
            brand: {
              '@type': 'Brand',
              name: BRAND_NAME
            },
            color: p.colour || 'Multi',
            category: p.category || 'Clothing',
            itemCondition: 'https://schema.org/NewCondition',
            offers: {
              '@type': 'Offer',
              url: canonical,
              priceCurrency: 'INR',
              price: numericPrice,
              availability: isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
              seller: {
                '@type': 'Organization',
                name: BRAND_NAME
              },
              priceValidUntil: '2026-12-31'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Collection', item: `${BASE_URL}/#/collection` },
              ...(p.category
                ? [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: p.category,
                      item: `${BASE_URL}/#/collection?category=${encodeURIComponent(p.category)}`
                    }
                  ]
                : []),
              {
                '@type': 'ListItem',
                position: p.category ? 4 : 3,
                name: p.title,
                item: canonical
              }
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `What is the fit and sizing for the ${p.title}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `${p.title} is designed with a ${p.fit || 'relaxed drop-shoulder'} unisex drape. Consult the chest, length, and sleeve measurements provided on the garment specifications card.`
                }
              },
              {
                '@type': 'Question',
                name: `How do I care for and wash this piece?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'To protect the heavyweight cotton texture, custom dye wash, and embroidery, machine wash cold inside-out on gentle cycle or hand wash. Lay flat to dry out of direct sunlight.'
                }
              },
              {
                '@type': 'Question',
                name: `How fast is delivery across India?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Orders are dispatched directly from our Coimbatore atelier within 24 hours. Express surface courier delivers within 2–4 business days across Tamil Nadu & South India, and 3–6 business days nationwide.'
                }
              }
            ]
          }
        ]
      };
    }

    case 'lookbook':
      return {
        title: 'Streetwear Lookbook & Complete Looks | TONTO Clothing',
        description: 'Browse complete styled streetwear outfits by TONTO Clothing. Heavyweight waffle thermals paired with vintage wash denim and statement archive belts.',
        canonical: `${BASE_URL}/#/lookbook`,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: `${BASE_URL}/assets/editorial/editorial-brutalist-full.jpg`,
        ogImageAlt: 'TONTO Streetwear Lookbook',
        keywords: 'streetwear lookbook, complete outfit styling, baggy jeans outfit, oversized tee styling, vintage streetwear looks',
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'TONTO Streetwear Lookbook',
            url: `${BASE_URL}/#/lookbook`,
            description: 'Curated complete looks and styling inspirations by TONTO Clothing.'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Lookbook', item: `${BASE_URL}/#/lookbook` }
            ]
          }
        ]
      };

    case 'look-detail': {
      const look = data.look || {};
      const title = `${look.title || 'Complete Look'} | TONTO Streetwear Styling`;
      const description = look.description || `Shop this complete streetwear fit curated by TONTO Clothing Coimbatore. Includes coordinating top, denim, and accessories.`;
      const canonical = `${BASE_URL}/#/look/${look.id || ''}`;

      return {
        title,
        description,
        canonical,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: look.heroImage ? `${BASE_URL}${look.heroImage}` : DEFAULT_OG_IMAGE,
        ogImageAlt: title,
        keywords: 'complete streetwear look, styled outfit, bundle outfit, streetwear Coimbatore',
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: title,
            url: canonical,
            description
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Lookbook', item: `${BASE_URL}/#/lookbook` },
              { '@type': 'ListItem', position: 3, name: look.title || 'Look', item: canonical }
            ]
          }
        ]
      };
    }

    case 'about':
      return {
        title: 'About TONTO Clothing | Atelier Manifesto & Story | Coimbatore, India',
        description: 'The story behind TONTO Clothing. Combining South India’s generational spinning craftsmanship with global underground streetwear, 360+ GSM cotton, and sustainable curation.',
        canonical: `${BASE_URL}/#/about`,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: `${BASE_URL}/assets/branding/tonto-tags.jpg`,
        ogImageAlt: 'About TONTO Clothing Atelier in Coimbatore',
        keywords: 'about TONTO clothing, Coimbatore streetwear brand, South Indian textile mastery, sustainable thrift India, brutalist streetwear',
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About TONTO Clothing',
            url: `${BASE_URL}/#/about`,
            description: 'The story and textile manifesto of TONTO Clothing in Coimbatore, India.',
            mainEntity: { '@id': `${BASE_URL}/#organization` }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'About Us', item: `${BASE_URL}/#/about` }
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Where is TONTO Clothing based?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'TONTO is based in Coimbatore, Tamil Nadu, known globally as the textile capital of South India. Our physical showroom is located Opposite Prozone Mall on Sathy Road.'
                }
              },
              {
                '@type': 'Question',
                name: 'What makes TONTO garments different from standard streetwear?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Instead of flimsy polyester fast fashion, our pieces utilize 240–450 GSM heavyweight combed cottons, custom damask woven jacquard labeling, ozone washed denim, and authentic oversized architectural unisex cuts.'
                }
              },
              {
                '@type': 'Question',
                name: 'Are TONTO pieces authentic thrift or original creations?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We curate both: our archive drops feature verified imported surplus and handpicked vintage garments, while our TONTO Made collection represents our bespoke in-house cut-and-sew apparel.'
                }
              }
            ]
          }
        ]
      };

    case 'visit':
      return {
        title: 'Visit TONTO Clothing | Store Location & Hours | Opposite Prozone Mall, Coimbatore',
        description: 'Visit the TONTO Clothing store in Coimbatore, Tamil Nadu. Located Opposite Prozone Mall on Sathy Road. Open daily 10 AM to 9:30 PM for in-person fittings and exclusive drops.',
        canonical: `${BASE_URL}/#/visit`,
        robots: 'index, follow',
        ogType: 'business.business',
        ogImage: `${BASE_URL}/assets/editorial/editorial-brutalist-full.jpg`,
        ogImageAlt: 'Visit TONTO Clothing Showroom in Coimbatore',
        keywords: 'TONTO clothing store Coimbatore, streetwear shop Coimbatore, Opposite Prozone Mall Sathy Road, thrift boutique Tamil Nadu',
        schema: [
          STORE_ORGANIZATION_SCHEMA,
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Visit Us', item: `${BASE_URL}/#/visit` }
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What are the opening hours of the TONTO Clothing Coimbatore showroom?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We are open 7 days a week from 10:00 AM to 9:30 PM for in-store fittings, exclusive showroom drops, and order pickups.'
                }
              },
              {
                '@type': 'Question',
                name: 'Where exactly is the store located and is parking available?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Our showroom is located Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035. Dedicated two-wheeler and four-wheeler parking is available on site.'
                }
              },
              {
                '@type': 'Question',
                name: 'Can I try on garments for size before buying?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! Our showroom features fitting rooms where you can try any of our boxy tees, baggy denim, and outerwear silhouettes in person.'
                }
              }
            ]
          }
        ]
      };

    case 'policy': {
      const tab = data.policyTab || 'shipping';
      const titles = {
        shipping: 'Shipping & Delivery Guidelines | TONTO Clothing',
        returns: 'Archive Returns & Exchanges Policy | TONTO Clothing',
        'size-guide': 'Garment Measuring & Sizing Guide | TONTO Clothing',
        privacy: 'Privacy & Data Protection Policy | TONTO Clothing',
        terms: 'Terms of Service | TONTO Clothing'
      };
      const title = titles[tab] || 'Client Care & Brand Policies | TONTO Clothing';
      const canonical = `${BASE_URL}/#/policy/${tab}`;

      return {
        title,
        description: 'Read the official client care guidelines, express courier timelines, and exchange terms for TONTO Clothing Coimbatore.',
        canonical,
        robots: 'index, follow',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        keywords: 'TONTO clothing shipping, return policy, streetwear exchange Coimbatore, garment sizing guide',
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'ItemPage',
            name: title,
            url: canonical
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Policies', item: `${BASE_URL}/#/policy` },
              { '@type': 'ListItem', position: 3, name: tab.replace('-', ' '), item: canonical }
            ]
          }
        ]
      };
    }

    // Non-indexable administrative & transactional routes
    case 'admin':
    case 'cart':
    case 'checkout':
    case 'account':
    case 'saved':
    case '404':
      return {
        title: view === 'admin' ? 'TONTO Studio Desk' : `${view.toUpperCase()} | TONTO Clothing`,
        description: 'Private customer portal and administrative desk for TONTO Clothing.',
        canonical: `${BASE_URL}/#/${view}`,
        robots: 'noindex, nofollow', // Prevent search crawlers from wasting index budget on private pages
        schema: []
      };

    default:
      return {
        title: 'TONTO Clothing | Thrift, Imported, Surplus Streetwear India',
        description: 'Curated thrift drops, imported surplus, and heavy washed denim from Coimbatore, India.',
        canonical: `${BASE_URL}/`,
        robots: 'index, follow'
      };
  }
}

/**
 * Apply Metadata & Schema to the active document <head>
 */
export function applySEO(metadata) {
  if (typeof document === 'undefined') return;

  // 1. Update Title
  if (metadata.title && document.title !== metadata.title) {
    document.title = metadata.title;
  }

  // 2. Helper to set/update a <meta> tag
  const setMeta = (attr, key, content) => {
    if (!content) return;
    let tag = document.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // 3. Set standard meta tags
  setMeta('name', 'description', metadata.description);
  setMeta('name', 'keywords', metadata.keywords);
  setMeta('name', 'robots', metadata.robots || 'index, follow');

  // 4. Update Canonical Link
  if (metadata.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', metadata.canonical);
  }

  // 5. Open Graph Meta Tags
  setMeta('property', 'og:site_name', BRAND_NAME);
  setMeta('property', 'og:title', metadata.title);
  setMeta('property', 'og:description', metadata.description);
  setMeta('property', 'og:url', metadata.canonical || BASE_URL);
  setMeta('property', 'og:type', metadata.ogType || 'website');
  setMeta('property', 'og:image', metadata.ogImage || DEFAULT_OG_IMAGE);
  if (metadata.ogImageAlt) {
    setMeta('property', 'og:image:alt', metadata.ogImageAlt);
  }
  setMeta('property', 'og:locale', 'en_IN');

  // 6. Twitter / X Card Meta Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:site', INSTAGRAM_HANDLE);
  setMeta('name', 'twitter:title', metadata.title);
  setMeta('name', 'twitter:description', metadata.description);
  setMeta('name', 'twitter:image', metadata.ogImage || DEFAULT_OG_IMAGE);

  // 7. Inject Page Schema.org JSON-LD
  const SCRIPT_ID = 'tonto-page-schema';
  let scriptEl = document.getElementById(SCRIPT_ID);

  if (metadata.schema && Array.isArray(metadata.schema) && metadata.schema.length > 0) {
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = SCRIPT_ID;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    // If multiple schemas, wrap in an array or single graph
    scriptEl.textContent = JSON.stringify(
      metadata.schema.length === 1 ? metadata.schema[0] : { '@context': 'https://schema.org', '@graph': metadata.schema }
    );
  } else if (scriptEl) {
    scriptEl.remove();
  }
}
