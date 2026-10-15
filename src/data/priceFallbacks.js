// Display price fallbacks for the pieces that shipped before the store database
// carried real prices.
//
// `GET /api/products` returns `price` (and `numericPrice`) for every live piece,
// so the map below is only consulted for cached or hand-added rows that carry no
// price text at all. `backend/scripts/seed.js` mirrors these same numbers into the
// `products` table — if a price changes, change it there and here together.
//
// Three components used to keep their own copy of this map and quietly diverge.
export const SAMPLE_PRICE_MAP = {
  'tonto-studios-waffle-black': '₹2,490',
  'tonto-waffle-white-blue': '₹2,490',
  'distressed-chain-print-denim': '₹3,290',
  'couch-vintage-fade-flare': '₹2,990',
  'epsten-selvedge-black-denim': '₹3,490',
  'sportswear-archive-sweatshirt-navy': '₹2,800',
  'sportswear-archive-sweatshirt-cream': '₹2,800',
  'pinstripe-crewneck-sweatshirt': '₹3,100',
  'leopard-print-button-shirt': '₹2,200',
  'hardwood-classic-basketball-jerseys': '₹1,990',
  'heavy-olive-army-utility-shirt': '₹2,600',
  'sun-faded-denim-workshirt': '₹2,800',
  'slate-shadow-stripe-shirt': '₹2,400',
  'khaki-pinstripe-oxford-shirt': '₹2,200',
  'charcoal-wrangler-denim-shirt': '₹2,800',
  'y2k-heavy-hardware-statement-belts': '₹1,200',
  'tonto-archive-brand-hangtags': '₹450',
  'extra-wide-denim': '₹3,290',
  'wide-leg-denim-black': '₹3,190',
  'relaxed-fit-trousers-cream': '₹2,790',
  'oversized-graphic-tee-black': '₹1,890',
  'embroidered-shirt-burgundy': '₹2,400',
  'dusty-pink-long-sleeve': '₹2,100',
  'camo-layered-tee': '₹2,300',
  'layered-graphic-tee-blue': '₹1,990'
};

// The price a shopper sees for a piece.
//
// A product with a real price shows it. A product priced "on enquiry" — or with
// no price at all — is NOT given an invented number: the old code defaulted every
// unknown id to ₹2,490, which no quote from the store would ever honour (the cart
// drops unpriced pieces with "Not priced yet").
export function displayPrice(product) {
  const text = String(product?.price ?? '').trim();
  if (text && text !== 'Price on enquiry') return text;
  return SAMPLE_PRICE_MAP[product?.id] || 'Price on enquiry';
}

export default displayPrice;
