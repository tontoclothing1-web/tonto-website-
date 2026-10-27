import React, { useState } from 'react';
import UPIPaymentModal from './UPIPaymentModal';
import { Smartphone } from 'lucide-react';
import { ArrowLeft, Check, AlertCircle, ShoppingBag, ShieldCheck, MapPin, Send, Copy, ArrowRight, RefreshCw, WifiOff } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { placeOrder, newClientRequestId, validatePromoCode, mirror, mirrorMerge, readList } from '../lib/capture';
import { PROMO_REASONS, fromApiOrder } from '../lib/orderView';

/**
 * Mirror into the keys AdminDashboard reads. Stock + promo counters are only
 * bumped on the offline path — the API already decremented inventory and
 * consumed the promo use, and doing it again here is a double spend.
 */
function recordLocally(record, { synced = false } = {}) {
  const { firstName = '', lastName = '', phone = '', email = '', city = '' } = record.customer || {};
  const items = record.items || [];

  mirror('tonto_admin_orders', record);

  mirror('tonto_admin_enquiries', {
    id: record.orderId,
    clientName: `${firstName} ${lastName}`.trim(),
    contact: phone || email,
    productTitle: `${items.length} Piece(s): ${items.map((i) => i.title).join(', ')}`,
    colour: items.map((i) => i.colour).filter(Boolean).join(' / ') || 'Standard',
    size: items.map((i) => i.size).filter(Boolean).join(', ') || 'Standard',
    date: record.date,
    status: 'Hold Reserved at Showroom',
    notes: `Delivery: ${record.deliveryMethod === 'shipping' ? 'Courier Dispatch' : 'Showroom Pickup'}. City: ${city || 'Coimbatore'}. Total: ${record.totalAmount}.`,
  });

  mirror('tonto_admin_leads', {
    id: `LEAD-${Date.now().toString().slice(-6)}`,
    name: `${firstName} ${lastName}`.trim(),
    phone,
    email,
    source: 'Storefront Checkout',
    interest: items.map((i) => `${i.title} (${i.size})`).join(', '),
    estimatedValue: record.numericTotal || 4500,
    stage: 'In Discussion',
    date: new Date().toISOString().split('T')[0],
    notes: `Order #${record.orderId} reserved on storefront. Total ${record.totalAmount}. Awaiting UPI confirmation.`,
  });

  if (synced) return;

  if (record.appliedPromo) {
    mirrorMerge('tonto_admin_promos', (list) => {
      const idx = list.findIndex((p) => String(p?.code).toUpperCase() === String(record.appliedPromo).toUpperCase());
      if (idx > -1) list[idx] = { ...list[idx], uses: (list[idx].uses || 0) + 1 };
      return list;
    });
  }

  const saved = readList('tonto_products');
  if (saved.length) {
    const next = saved.map((p) => {
      const line = items.find((i) => i.id === p.id || i.productId === p.id);
      if (!line) return p;
      const stock = Math.max(0, (typeof p.stock === 'number' ? p.stock : 8) - (Number(line.quantity) || 1));
      return { ...p, stock, inStock: stock > 0 };
    });
    try {
      localStorage.setItem('tonto_products', JSON.stringify(next));
    } catch { /* private mode */ }
  }
}

export default function CheckoutPage({
  cartItems,
  onClearCart,
  onNavigateHome,
  onNavigateCart,
  onNavigateCollection,
  onNavigateAccount,
  onUpdateProducts,
  storeSettings
}) {
  const [step, setStep] = useState('details'); // 'details' | 'review' | 'pending' | 'success' | 'failure'
  const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' | 'showroom'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'whatsapp' | 'cod'
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(() => {
    try {
      const isClaimed = localStorage.getItem('tonto_credentials_submitted') === 'true';
      if (isClaimed) {
        return { code: 'TONTO15', discountText: '15% OFF', percent: 15 };
      }
    } catch {}
    return null;
  });
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: 'Tamil Nadu',
    postalCode: '',
    country: 'India',
    orderNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  // Why the API said no (shown on the failure screen) + whether the order only
  // made it onto this device because the backend was unreachable.
  const [failureReason, setFailureReason] = useState('');
  const [offlineFallback, setOfflineFallback] = useState(false);
  // Idempotency key for this checkout attempt — survives "Retry" so a retry
  // cannot create a second hold.
  const [clientRequestId, setClientRequestId] = useState('');

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Money shown before the showroom quotes: catalogue numbers only. A piece with
  // no price contributes nothing here and is flagged below, instead of being
  // handed an invented ₹2,490 that no invoice would ever match.
  const linePrice = (item) => {
    const numeric = Number(item?.numericPrice);
    if (numeric > 0) return numeric;
    const digits = parseInt(String(item?.price || '').replace(/\D/g, ''), 10);
    return Number.isFinite(digits) && digits > 0 ? digits : 0;
  };
  const unpricedCount = cartItems.filter((item) => linePrice(item) === 0).length;

  // Financial Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + linePrice(item) * (item.quantity || 1), 0);

  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.percent) / 100) : 0;
  const freeThreshold = parseInt(String(storeSettings?.freeShippingThreshold || '2500').replace(/\D/g, ''), 10) || 2500;
  const isFreeShipping = deliveryMethod === 'showroom' || subtotal >= freeThreshold;
  const shippingFee = isFreeShipping ? 0 : 150;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = (e) => {
    if (e) e.preventDefault();
    handleApplyCodeDirect(promoInput);
  };

  /**
   * Offline fallback only: the same strict rule the server uses (an explicit
   * percent, or a "15% OFF" label — never a guessed discount for a broken row).
   */
  const applyLocalPromo = (cleanCode) => {
    let promoList = readList('tonto_admin_promos');
    if (!promoList.length) {
      promoList = [
        { code: 'TONTO15', discount: '15% OFF', percent: 15, active: true },
        { code: 'TONTOVIP', discount: '20% OFF', percent: 20, active: true },
        { code: 'ARCHIVE10', discount: '10% OFF', percent: 10, active: true }
      ];
    }

    try {
      const cms = localStorage.getItem('tonto_admin_cms');
      if (cms) {
        const parsed = JSON.parse(cms);
        if (parsed.offerModal?.promoCode) {
          promoList.push({
            code: parsed.offerModal.promoCode.toUpperCase(),
            discount: '15% OFF',
            percent: 15,
            active: true
          });
        }
      }
    } catch {}

    const match = promoList.find((p) => String(p?.code).toUpperCase() === cleanCode);
    if (!match) {
      setPromoError(`Code "${cleanCode}" is not recognized.`);
      return;
    }
    if (match.active === false) {
      setPromoError(`Code "${cleanCode}" is currently inactive.`);
      return;
    }

    const explicit = Number(match.percent);
    const fromLabel = String(match.discount || match.discountText || '').match(/(\d{1,3})\s*%/);
    const percent = explicit > 0 ? Math.floor(explicit) : fromLabel ? parseInt(fromLabel[1], 10) : 0;
    if (percent <= 0) {
      setPromoError(`Code "${cleanCode}" is misconfigured — no discount percentage.`);
      return;
    }

    setAppliedPromo({ code: match.code, discountText: match.discount || match.discountText || `${percent}% OFF`, percent });
    setPromoError('');
    setPromoInput('');
  };

  /**
   * Codes are resolved by the API — one engine for expiry, usage limits and the
   * percentage the shop actually set. Submitting an order re-prices everything
   * server-side regardless, so a code this device invented gets rejected at
   * checkout instead of quietly discounting the bag.
   */
  const handleApplyCodeDirect = async (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;

    setPromoChecking(true);
    setPromoError('');
    const result = await validatePromoCode(cleanCode);
    setPromoChecking(false);

    if (result.ok) {
      const promo = result.data?.promo || result.data?.data || result.data || {};
      const percent = Number(promo.percent) || 0;
      if (percent > 0) {
        setAppliedPromo({
          code: promo.code || cleanCode,
          discountText: promo.discountText || promo.discount || `${percent}% OFF`,
          percent
        });
        setPromoInput('');
        return;
      }
      setPromoError(`Code "${cleanCode}" ${PROMO_REASONS[result.data?.reason] || 'is not valid.'}`);
      return;
    }

    if (result.rejected) {
      setPromoError(result.error || `Code "${cleanCode}" is not valid.`);
      return;
    }

    applyLocalPromo(cleanCode);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Valid email address is required (e.g. name@domain.com)';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Valid 10-digit mobile / WhatsApp number is required';
    }
    
    if (deliveryMethod === 'shipping') {
      if (!formData.address.trim()) newErrors.address = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      
      const cleanPin = formData.postalCode.replace(/\D/g, '');
      if (!cleanPin || cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
        newErrors.postalCode = 'Valid 6-digit Indian PIN code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = async () => {
    setStep('pending');
    setFailureReason('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const customer = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      apartment: formData.apartment,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
      notes: formData.orderNotes,
    };

    // Dev Test Mode: fail before touching the network.
    if (simulateError) {
      setFailureReason('Dev Test Mode is switched on, so nothing was sent to the showroom.');
      setStep('failure');
      return;
    }

    // Generated once and reused by "Retry Order Submission": the backend treats
    // it as an idempotency key, so a double tap cannot create two holds.
    if (!clientRequestId) setClientRequestId(newClientRequestId());

    const result = await placeOrder({
      items: cartItems,
      customer,
      promoCode: appliedPromo?.code,
      deliveryMethod,
      notes: formData.orderNotes,
      clientRequestId,
    });

    if (result.ok) {
      // Totals, status and the promo use all come back from the server — this
      // is the first time the price on the screen is the price on the invoice.
      const record = fromApiOrder(result.data?.data || {}, customer);
      recordLocally(record, { synced: true });
      setConfirmedOrder(record);
      onClearCart();
      setOfflineFallback(false);
      setClientRequestId('');
      setStep('success');
      return;
    }

    if (result.rejected) {
      // Out of stock, dead promo code, missing address… Show the reason. A hold
      // that the shop never accepted is worse than a failed button.
      setFailureReason(result.error || 'The showroom could not reserve these pieces.');
      setStep('failure');
      return;
    }

    // No API reachable (backend down / offline / dev without a server): keep the
    // on-device record so the intent is not lost, and label it on the receipt.
    const orderId = `TONTO-${Math.floor(100000 + Math.random() * 900000)}`;
    const record = {
      id: orderId,
      orderId,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      customer,
      deliveryMethod,
      shippingAddress: {
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      },
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        colour: item.colour || 'Standard',
        size: item.size || 'M',
        price: item.price || 'Price on enquiry',
        quantity: item.quantity || 1,
        // Neutral brand image: pasting a different garment on the receipt would
        // file a hold for a piece the shopper never picked.
        image: item.image || item.images?.[0] || '/assets/branding/tonto-tags.jpg'
      })),
      subtotal: `₹${subtotal.toLocaleString('en-IN')}`,
      numericSubtotal: subtotal,
      discountAmount: discountAmount > 0 ? `₹${discountAmount.toLocaleString('en-IN')}` : '₹0',
      numericDiscount: discountAmount,
      appliedPromo: appliedPromo ? appliedPromo.code : null,
      shippingFee: shippingFee > 0 ? `₹${shippingFee}` : 'Free',
      totalAmount: `₹${grandTotal.toLocaleString('en-IN')}`,
      numericTotal: grandTotal,
      status: 'New Hold',
      paymentStatus: 'Pending Payment Link',
      courierPartner: deliveryMethod === 'shipping' ? 'BlueDart Express' : 'Showroom Handover',
      trackingNumber: '',
      notes: formData.orderNotes || `Delivery: ${deliveryMethod === 'shipping' ? 'Courier Dispatch' : 'Showroom Pickup'}. City: ${formData.city || 'Coimbatore'}.`,
      recordedBy: 'device-only',
    };

    recordLocally(record);
    const refreshed = readList('tonto_products');
    if (refreshed.length && onUpdateProducts) onUpdateProducts(refreshed);
    setConfirmedOrder(record);
    onClearCart();
    setOfflineFallback(true);
    setStep('success');
  };

  const getOrderWhatsAppText = () => {
    if (!confirmedOrder) return '';
    return `TONTO Order Reservation\nOrder Ref: #${confirmedOrder.orderId}\nCustomer: ${confirmedOrder.customer.firstName} ${confirmedOrder.customer.lastName}\nPhone: ${confirmedOrder.customer.phone}\nDelivery: ${confirmedOrder.deliveryMethod === 'shipping' ? 'Courier Dispatch' : 'Coimbatore Showroom Pickup'}\n\nPieces (${confirmedOrder.items.length}):\n` +
      confirmedOrder.items.map((i, idx) => `${idx + 1}. ${i.title} (${i.colour}) - Sz ${i.size} x ${i.quantity}`).join('\n') +
      `\n\nPlease confirm availability & payment link for dispatch.`;
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard?.writeText(getOrderWhatsAppText());
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    } catch {
      // Clipboard is blocked outside https / without permission: the text stays
      // on screen, so offer the honest alternative instead of a silent no-op.
      setCopiedOrder(false);
    }
  };

  return (
    <div className="w-full bg-white text-[#111827] pb-32 lg:pb-24">
      
      {/* Breadcrumb Navigation */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-4 text-[12px] text-[#79867D] flex items-center justify-between border-b border-[#E0E5E1]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateHome}
            className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            <span>home</span>
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <button
            onClick={onNavigateCart}
            className="hover:text-[#003F25] transition-colors cursor-pointer"
          >
            bag
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-[#003F25] font-semibold">checkout</span>
        </div>

        {/* Development State Switcher */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#79867D] bg-gray-50 border border-gray-200 px-2.5 py-1 rounded">
          <span className="font-semibold text-gray-500 uppercase">Dev Test Mode:</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="accent-[#003F25]"
            />
            <span className={simulateError ? 'text-red-600 font-bold' : ''}>Simulate Failure</span>
          </label>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3.5 sm:px-8 pt-6 sm:pt-10">
        
        {/* Progress Stepper */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#79867D]">
            <span className={step === 'details' ? 'text-[#003F25] font-extrabold pb-1 border-b-2 border-[#003F25]' : step !== 'details' ? 'text-[#003F25]' : ''}>
              1. Information
            </span>
            <span className="text-gray-300">———</span>
            <span className={step === 'review' ? 'text-[#003F25] font-extrabold pb-1 border-b-2 border-[#003F25]' : step === 'pending' || step === 'success' ? 'text-[#003F25]' : ''}>
              2. Review
            </span>
            <span className="text-gray-300">———</span>
            <span className={step === 'success' ? 'text-[#003F25] font-extrabold pb-1 border-b-2 border-[#003F25]' : ''}>
              3. Confirmation
            </span>
          </div>
        </div>

        {/* PENDING VIEW */}
        {step === 'pending' && (
          <div className="py-24 text-center max-w-md mx-auto">
            <RefreshCw size={36} className="mx-auto text-[#003F25] animate-spin mb-4" />
            <h2 className="text-xl font-bold text-[#003F25] uppercase tracking-tight mb-2">
              Reserving Pieces from TONTO Archive...
            </h2>
            <p className="text-[13px] text-[#79867D]">
              Connecting with the Coimbatore showroom catalog to lock your order hold.
            </p>
          </div>
        )}

        {/* FAILURE VIEW */}
        {step === 'failure' && (
          <div className="py-20 text-center max-w-md mx-auto border border-red-200 bg-red-50/50 p-8 rounded-xs">
            <AlertCircle size={44} className="mx-auto text-red-600 mb-3" />
            <h2 className="text-xl font-bold text-red-900 uppercase tracking-tight mb-2">
              Order Hold Could Not Be Processed
            </h2>
            <p className="text-[13px] text-red-700 mb-2">
              {failureReason || 'A temporary connection issue occurred while registering your piece hold with the catalog. No charges were made.'}
            </p>
            <p className="text-[12px] text-red-600/80 mb-6">Nothing was reserved and no payment was taken.</p>
            <div className="space-y-2">
              <button
                onClick={() => setStep('review')}
                className="w-full py-3 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer"
              >
                Retry Order Submission
              </button>
              <button
                onClick={() => {
                  const cleanWa = (storeSettings?.whatsappPhone || '918248321214').replace(/[^0-9]/g, '');
                  window.open(`https://api.whatsapp.com/send?phone=${cleanWa}&text=${encodeURIComponent('Hi TONTO, I had an issue on checkout reserving my pieces. Could you assist?')}`, '_blank');
                }}
                className="w-full py-2.5 border border-[#003F25] text-[#003F25] text-[12px] font-bold uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
              >
                Complete via WhatsApp Concierge
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION VIEW */}
        {step === 'success' && confirmedOrder && (
          <div className="max-w-2xl mx-auto border border-[#E0E5E1] p-6 sm:p-10 bg-white">
            <div className="w-12 h-12 bg-[#003F25] text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} strokeWidth={3} />
            </div>

            <div className="text-center pb-6 border-b border-[#E0E5E1] mb-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#003F25]">ORDER HOLD CONFIRMED</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003F25] uppercase tracking-tight mt-1 mb-2">
                Thank You, {confirmedOrder.customer.firstName}
              </h1>
              <p className="text-[13px] text-[#4B5563]">
                Your order hold reference is <strong className="text-[#003F25] font-mono">#{confirmedOrder.orderId}</strong>.
              </p>
              {offlineFallback && (
                <div className="mt-4 flex items-start gap-2 text-left border border-amber-300 bg-amber-50 p-3 rounded-xs">
                  <WifiOff size={15} className="text-amber-700 mt-0.5 shrink-0" />
                  <p className="text-[11.5px] text-amber-900">
                    The showroom server was not reachable, so this hold is saved on this device only.
                    Please send the reference to TONTO WhatsApp below so the team can lock the pieces.
                  </p>
                </div>
              )}
            </div>

            {/* Next steps notice */}
            <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] mb-6 text-[12px] text-[#4B5563] space-y-2">
              <div className="flex items-center gap-2 text-[#003F25] font-bold uppercase tracking-wider text-[11px]">
                <ShieldCheck size={16} />
                <span>Next Steps with TONTO Coimbatore</span>
              </div>
              <p>
                Because TONTO garments are unique thrift, surplus, and vintage archive items, our team in Coimbatore verifies piece measurements and packs your order directly.
              </p>
              <p>
                Our concierge will reach out to <strong className="text-[#003F25]">{confirmedOrder.customer.phone}</strong> via WhatsApp with invoice verification, secure payment link, and dispatch tracking.
              </p>
            </div>

            {/* Order Items Summary */}
            <div className="border border-[#E0E5E1] mb-6 divide-y divide-[#E0E5E1]">
              <div className="px-4 py-2 bg-[#F9FAF9] text-[11px] font-bold text-[#003F25] uppercase tracking-wider">
                Reserved Pieces ({confirmedOrder.items.length})
              </div>
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 sm:p-4 flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="w-12 h-14 object-cover border border-gray-200" />
                    <div>
                      <strong className="block text-[#003F25] font-bold uppercase">{item.title}</strong>
                      <span className="text-[#79867D] capitalize">{item.colour} • Size {item.size} • Qty {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-[#003F25]">{item.price}</span>
                </div>
              ))}
            </div>

            {/* Delivery Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] border border-[#E0E5E1] p-4 mb-8">
              <div>
                <span className="block text-[10px] font-bold text-[#79867D] uppercase tracking-wider mb-1">
                  Delivery Method
                </span>
                <span className="font-semibold text-[#003F25]">
                  {confirmedOrder.deliveryMethod === 'shipping' ? 'Courier Dispatch (Tracked India)' : 'Showroom Pickup (Coimbatore, TN)'}
                </span>
                {confirmedOrder.deliveryMethod === 'shipping' && (
                  <p className="text-[#4B5563] mt-1">
                    {confirmedOrder.customer.address}, {confirmedOrder.customer.city}, {confirmedOrder.customer.state} - {confirmedOrder.customer.postalCode}
                  </p>
                )}
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#79867D] uppercase tracking-wider mb-1">
                  Contact Information
                </span>
                <p className="font-semibold text-[#003F25]">{confirmedOrder.customer.firstName} {confirmedOrder.customer.lastName}</p>
                <p className="text-[#4B5563]">{confirmedOrder.customer.phone}</p>
                <p className="text-[#4B5563]">{confirmedOrder.customer.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  const cleanWa = (storeSettings?.whatsappPhone || '918248321214').replace(/[^0-9]/g, '');
                  window.open(`https://api.whatsapp.com/send?phone=${cleanWa}&text=${encodeURIComponent(getOrderWhatsAppText())}`, '_blank');
                }}
                className="w-full py-4 bg-[#128C7E] hover:bg-[#075E54] text-white text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send size={16} />
                <span>Send Order Reference to TONTO WhatsApp</span>
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleCopySummary}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 text-[12px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedOrder ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedOrder ? 'Copied' : 'Copy Order Text'}</span>
                </button>

                <button
                  onClick={onNavigateCollection}
                  className="flex-1 py-3 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors text-center cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>

              {onNavigateAccount && (
                <button
                  type="button"
                  onClick={onNavigateAccount}
                  className="w-full py-3 border border-[#003F25] text-[#003F25] hover:bg-[#F9FAF9] text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center block"
                >
                  View Order & Tracking in Customer Account →
                </button>
              )}
            </div>

          </div>
        )}

        {/* STEP 1: DETAILS FORM & STEP 2: REVIEW */}
        {(step === 'details' || step === 'review') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Form or Review */}
            <div className="lg:col-span-7">
              {step === 'details' ? (
                <form onSubmit={handleProceedToReview} className="space-y-8">
                  
                  {/* Contact Info */}
                  <div>
                    <h2 className="text-[13px] font-extrabold text-[#003F25] uppercase tracking-wider pb-2 border-b border-[#E0E5E1] mb-4">
                      Customer Contact
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2.5 text-[13px] border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                          placeholder="e.g. Rahul"
                        />
                        {errors.firstName && <span className="text-[11px] text-red-500 mt-1 block">{errors.firstName}</span>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2.5 text-[13px] border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                          placeholder="e.g. Kumar"
                        />
                        {errors.lastName && <span className="text-[11px] text-red-500 mt-1 block">{errors.lastName}</span>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full px-3 py-2.5 text-[13px] border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                          placeholder="rahul@example.com"
                        />
                        {errors.email && <span className="text-[11px] text-red-500 mt-1 block">{errors.email}</span>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">WhatsApp / Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`w-full px-3 py-2.5 text-[13px] border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                          placeholder="+91 98765 43210"
                        />
                        {errors.phone && <span className="text-[11px] text-red-500 mt-1 block">{errors.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Method Selection */}
                  <div>
                    <h2 className="text-[13px] font-extrabold text-[#003F25] uppercase tracking-wider pb-2 border-b border-[#E0E5E1] mb-4">
                      Delivery Method
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setDeliveryMethod('shipping')}
                        className={`p-4 border cursor-pointer transition-all ${
                          deliveryMethod === 'shipping'
                            ? 'border-[#003F25] bg-[#F9FAF9] ring-1 ring-[#003F25]'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-bold text-[#003F25]">Standard Courier</span>
                          <span className="text-[11px] font-semibold text-[#003F25]">Across India</span>
                        </div>
                        <p className="text-[12px] text-[#79867D]">
                          Dispatched from Coimbatore with tracking details provided on WhatsApp.
                        </p>
                      </div>

                      <div
                        onClick={() => setDeliveryMethod('showroom')}
                        className={`p-4 border cursor-pointer transition-all ${
                          deliveryMethod === 'showroom'
                            ? 'border-[#003F25] bg-[#F9FAF9] ring-1 ring-[#003F25]'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-bold text-[#003F25]">Coimbatore Showroom Pickup</span>
                          <span className="text-[11px] font-semibold text-[#128C7E]">Free</span>
                        </div>
                        <p className="text-[12px] text-[#79867D]">
                          Cross Cut Road, Gandhipuram. Try on piece and collect in person.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address (only if shipping) */}
                  {deliveryMethod === 'shipping' && (
                    <div>
                      <h2 className="text-[13px] font-extrabold text-[#003F25] uppercase tracking-wider pb-2 border-b border-[#E0E5E1] mb-4">
                        Shipping Address
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Street Address *</label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 text-[13px] border ${errors.address ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                            placeholder="House / flat no., street name"
                          />
                          {errors.address && <span className="text-[11px] text-red-500 mt-1 block">{errors.address}</span>}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Apartment, suite, unit (optional)</label>
                          <input
                            type="text"
                            name="apartment"
                            value={formData.apartment}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                            placeholder="Apartment, building floor"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">City *</label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              className={`w-full px-3 py-2.5 text-[13px] border ${errors.city ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                              placeholder="e.g. Chennai"
                            />
                            {errors.city && <span className="text-[11px] text-red-500 mt-1 block">{errors.city}</span>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">State / Province</label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleChange}
                              className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">PIN / Postal Code *</label>
                            <input
                              type="text"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleChange}
                              className={`w-full px-3 py-2.5 text-[13px] border ${errors.postalCode ? 'border-red-500' : 'border-gray-300'} focus:border-[#003F25] focus:outline-none rounded-xs`}
                              placeholder="641012"
                            />
                            {errors.postalCode && <span className="text-[11px] text-red-500 mt-1 block">{errors.postalCode}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Order Notes & Sizing Inquiries (Optional)</label>
                    <textarea
                      name="orderNotes"
                      rows={2}
                      value={formData.orderNotes}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                      placeholder="Special instructions or specific measurement inquiries before packing."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Continue to Order Review</span>
                    <ArrowRight size={16} />
                  </button>

                </form>
              ) : (
                /* STEP 2: REVIEW */
                <div className="space-y-6">
                  <h2 className="text-[14px] font-extrabold text-[#003F25] uppercase tracking-wider pb-2 border-b border-[#E0E5E1]">
                    Review Your Order Hold
                  </h2>

                  <div className="border border-[#E0E5E1] p-5 space-y-4 text-[13px]">
                    <div className="flex justify-between pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-[11px] text-[#79867D] uppercase font-bold block mb-1">Customer</span>
                        <strong className="text-[#003F25]">{formData.firstName} {formData.lastName}</strong>
                        <p className="text-[#4B5563] text-[12px]">{formData.phone} • {formData.email}</p>
                      </div>
                      <button onClick={() => setStep('details')} className="text-[11px] text-[#003F25] underline self-start cursor-pointer">
                        Edit
                      </button>
                    </div>

                    <div className="flex justify-between pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-[11px] text-[#79867D] uppercase font-bold block mb-1">Fulfillment Mode</span>
                        <strong className="text-[#003F25]">
                          {deliveryMethod === 'shipping' ? 'Standard Courier (Tracked)' : 'Coimbatore Showroom Collection'}
                        </strong>
                        {deliveryMethod === 'shipping' ? (
                          <p className="text-[#4B5563] text-[12px]">{formData.address}, {formData.city}, {formData.state} - {formData.postalCode}</p>
                        ) : (
                          <p className="text-[#4B5563] text-[12px]">Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu</p>
                        )}
                      </div>
                      <button onClick={() => setStep('details')} className="text-[11px] text-[#003F25] underline self-start cursor-pointer">
                        Edit
                      </button>
                    </div>

                    {formData.orderNotes && (
                      <div>
                        <span className="text-[11px] text-[#79867D] uppercase font-bold block mb-1">Notes</span>
                        <p className="text-[#4B5563] text-[12px]">{formData.orderNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <h3 className="text-[12px] font-extrabold text-[#003F25] uppercase tracking-wider">
                      Select Payment Mode
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 border rounded-xs cursor-pointer transition-all ${
                          paymentMethod === 'upi'
                            ? 'border-[#003F25] bg-[#F9FAF9] ring-1 ring-[#003F25]'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#003F25]" />
                          <strong className="text-[12px] text-[#003F25] uppercase">UPI Instant</strong>
                        </div>
                        <p className="text-[11px] text-[#79867D]">GPay, PhonePe, Paytm, QR</p>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('whatsapp')}
                        className={`p-3 border rounded-xs cursor-pointer transition-all ${
                          paymentMethod === 'whatsapp'
                            ? 'border-[#003F25] bg-[#F9FAF9] ring-1 ring-[#003F25]'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#128C7E]" />
                          <strong className="text-[12px] text-[#003F25] uppercase">WhatsApp Concierge</strong>
                        </div>
                        <p className="text-[11px] text-[#79867D]">Manual Invoice & Support</p>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-3 border rounded-xs cursor-pointer transition-all ${
                          paymentMethod === 'cod'
                            ? 'border-[#003F25] bg-[#F9FAF9] ring-1 ring-[#003F25]'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-gray-600" />
                          <strong className="text-[12px] text-[#003F25] uppercase">Showroom Pickup</strong>
                        </div>
                        <p className="text-[11px] text-[#79867D]">Pay at Coimbatore store</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] text-[12px] text-[#4B5563]">
                    <strong className="block text-[#003F25] font-bold mb-1">Honest Sourcing & Reservation Notice</strong>
                    Submitting this form reserves your selected archive items. The TONTO team will confirm measurement fit with you before issuing final payment details.
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('details')}
                      className="px-6 py-4 border border-[#003F25] text-[#003F25] text-[12px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (paymentMethod === 'upi') {
                          setIsUpiModalOpen(true);
                        } else {
                          handlePlaceOrder();
                        }
                      }}
                      disabled={isPlacingOrder}
                      className="flex-1 py-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-wait"
                    >
                      <Check size={16} />
                      <span>{isPlacingOrder ? 'Reserving Pieces…' : (paymentMethod === 'upi' ? 'Proceed to UPI Payment' : 'Confirm & Reserve Order')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary (5 cols) */}
            <div className="lg:col-span-5">
              <div className="border border-[#E0E5E1] p-6 bg-white sticky top-24">
                <h3 className="text-[13px] font-extrabold tracking-wider text-[#003F25] uppercase pb-3 border-b border-[#E0E5E1] mb-4">
                  Order Summary ({totalQuantity} Pieces)
                </h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1 mb-4 divide-y divide-gray-100">
                  {cartItems.map((item) => {
                    const priceNum = linePrice(item);
                    return (
                      <div key={`${item.id}-${item.size}`} className="pt-3 flex gap-3 items-center">
                        <img src={item.image} alt={item.title} className="w-14 h-18 object-cover bg-gray-50 border border-gray-200" />
                        <div className="flex-1 text-[12px]">
                          <h4 className="font-bold text-[#003F25] uppercase">{item.title}</h4>
                          <p className="text-[#79867D] capitalize">{item.colour} • Sz {item.size}</p>
                          <p className="text-[#4B5563]">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-[12px] font-semibold text-[#003F25]">
                          {priceNum > 0
                            ? `₹${(priceNum * (item.quantity || 1)).toLocaleString('en-IN')}`
                            : 'On enquiry'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code Input Box */}
                <div className="pt-3 pb-4 border-t border-b border-[#E0E5E1] my-4">
                  <span className="block text-[11px] font-bold text-[#003F25] uppercase tracking-wider mb-2">
                    Promo / Privilege Code
                  </span>

                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#003F25] px-2 py-0.5 bg-white rounded border border-emerald-200">
                          {appliedPromo.code}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800">
                          {appliedPromo.discountText} Applied
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[11px] text-gray-500 hover:text-red-600 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form onSubmit={handleApplyPromo} className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            setPromoError('');
                          }}
                          placeholder="e.g. TONTO15"
                          className="min-w-0 flex-1 px-3 py-2 text-base sm:text-[12px] font-mono border border-gray-300 rounded-xs uppercase focus:border-[#003F25] outline-none"
                        />
                        <button
                          type="submit"
                          disabled={promoChecking}
                          className="px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-[11px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                          {promoChecking ? 'Checking' : 'Apply'}
                        </button>
                      </form>
                      {promoError && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{promoError}</p>
                      )}
                      <p className="text-[10.5px] text-gray-400 mt-1">
                        Try <span className="font-mono text-[#003F25] cursor-pointer underline" onClick={() => handleApplyCodeDirect('TONTO15')}>TONTO15</span> for 15% off first order.
                      </p>
                    </div>
                  )}
                </div>

                {/* Subtotals & Calculations */}
                <div className="space-y-2 text-[12px] text-[#4B5563]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#003F25]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Privilege Discount ({appliedPromo.discountText})</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? 'font-semibold text-emerald-700' : 'text-[#003F25]'}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Fulfillment</span>
                    <span className="font-medium text-[#003F25]">
                      {deliveryMethod === 'shipping' ? 'Tracked Courier' : 'Showroom Pickup'}
                    </span>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-gray-200 text-[14px] font-extrabold text-[#003F25]">
                    <span>Total Hold Value</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {unpricedCount > 0 && (
                    <p className="pt-2 text-[11px] text-[#92400E] bg-amber-50 border border-amber-200 rounded-xs px-2.5 py-2">
                      {unpricedCount} {unpricedCount === 1 ? 'piece is' : 'pieces are'} priced on enquiry, so they are not in
                      this figure. The showroom confirms the final value on your payment link.
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-[#79867D] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#003F25] flex-shrink-0" />
                  <span>Secure showroom reservation direct from Coimbatore.</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        amount={confirmedOrder?.numericTotal || grandTotal}
        orderId={confirmedOrder?.orderId || 'TONTO-HOLD'}
        onPaymentConfirmed={(paymentData) => {
          setIsUpiModalOpen(false);
          if (step !== 'success') {
            handlePlaceOrder();
          } else {
            setConfirmedOrder((prev) => prev ? { ...prev, paymentStatus: 'Paid (UPI)', paymentData } : prev);
          }
        }}
      />
    </div>
  );
}
