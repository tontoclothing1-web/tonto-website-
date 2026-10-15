/**
 * Pricing engine — exact port of CheckoutPage.jsx financial rules.
 * Pure module: no mongoose/express imports so it stays unit-testable.
 */

/**
 * Parse a display price ("₹2,490", "2490") into a number.
 * Mirrors CheckoutPage.jsx: parseInt(digits) with 2490 fallback.
 */
export function parsePriceToNumber(value, fallback = 2490) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.floor(value);
  const n = parseInt(String(value ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Subtotal = Σ unitPrice × qty. Prefers numericPrice, falls back to parsing `price`. */
export function calcSubtotal(items = []) {
  return (items || []).reduce((acc, item) => {
    const unit =
      typeof item?.numericPrice === 'number' && item.numericPrice > 0
        ? Math.floor(item.numericPrice)
        : parsePriceToNumber(item?.price);
    return acc + unit * (Number(item?.quantity) > 0 ? Math.floor(Number(item.quantity)) : 1);
  }, 0);
}

/**
 * Discount = round(subtotal × percent / 100).
 * Mirrors CheckoutPage.jsx handleApplyCodeDirect percent resolution.
 */
export function calcDiscount(subtotal, promo) {
  const percent = Number(promo?.percent) || 0;
  if (!promo || percent <= 0 || subtotal <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}

/**
 * Resolve the free-shipping threshold from StoreSettings-ish input.
 * Frontend stores it as "₹2,500" — strip non-digits, default 2500.
 */
export function resolveFreeThreshold(storeSettings, fallback = 2500) {
  const raw = storeSettings?.freeShippingThreshold ?? storeSettings?.freeShipping ?? fallback;
  const n = parseInt(String(raw).replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Shipping rule (mirrors CheckoutPage.jsx):
 *   FREE when deliveryMethod === 'showroom' OR subtotal >= threshold (pre-discount subtotal).
 *   Otherwise flat ₹150.
 */
export function calcShipping({ subtotal = 0, deliveryMethod = 'shipping', freeThreshold = 2500, flatFee = 150 } = {}) {
  const isFree = deliveryMethod === 'showroom' || subtotal >= freeThreshold;
  return isFree ? 0 : flatFee;
}

/** Grand total = max(0, subtotal − discount + shipping). */
export function calcGrandTotal({ subtotal = 0, discountAmount = 0, shippingFee = 0 } = {}) {
  return Math.max(0, subtotal - discountAmount + shippingFee);
}

/**
 * Full quote in one call — shared by cart sync, order creation, and admin previews.
 * NOTE: free-shipping check uses the pre-discount subtotal, exactly like CheckoutPage.jsx.
 */
export function quoteCart({ items = [], promo = null, deliveryMethod = 'shipping', storeSettings = null } = {}) {
  const method = deliveryMethod === 'showroom' ? 'showroom' : 'shipping';
  const subtotal = calcSubtotal(items);
  const discountAmount = calcDiscount(subtotal, promo);
  const freeThreshold = resolveFreeThreshold(storeSettings);
  const shippingFee = calcShipping({ subtotal, deliveryMethod: method, freeThreshold });
  const grandTotal = calcGrandTotal({ subtotal, discountAmount, shippingFee });
  return {
    subtotal,
    discountAmount,
    promoCode: promo?.code ?? null,
    promoPercent: promo?.percent ?? 0,
    freeThreshold,
    shippingFee,
    grandTotal,
    deliveryMethod: method,
  };
}

export const PRICING_DEFAULTS = Object.freeze({
  freeShippingThreshold: 2500,
  flatShippingFee: 150,
  fallbackUnitPrice: 2490,
});
