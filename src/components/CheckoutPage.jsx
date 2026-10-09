import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle, ShoppingBag, ShieldCheck, MapPin, Send, Copy, ArrowRight, RefreshCw } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function CheckoutPage({
  cartItems,
  onClearCart,
  onNavigateHome,
  onNavigateCart,
  onNavigateCollection
}) {
  const [step, setStep] = useState('details'); // 'details' | 'review' | 'pending' | 'success' | 'failure'
  const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' | 'studio'
  const [simulateError, setSimulateError] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

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

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim() || formData.phone.length < 8) newErrors.phone = 'Valid phone / WhatsApp number is required';
    
    if (deliveryMethod === 'shipping') {
      if (!formData.address.trim()) newErrors.address = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.postalCode.trim() || formData.postalCode.length < 5) newErrors.postalCode = 'Valid PIN / postal code is required';
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

  const handlePlaceOrder = () => {
    setStep('pending');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Simulate authentic network latency
    setTimeout(() => {
      if (simulateError) {
        setStep('failure');
      } else {
        const orderId = `TONTO-${Math.floor(100000 + Math.random() * 900000)}`;
        const orderRecord = {
          orderId,
          date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
          items: [...cartItems],
          deliveryMethod,
          customer: { ...formData },
          status: 'Hold Reserved at Studio'
        };
        setConfirmedOrder(orderRecord);
        onClearCart();
        setStep('success');
      }
    }, 1400);
  };

  const getOrderWhatsAppText = () => {
    if (!confirmedOrder) return '';
    return `TONTO Studio Order Reservation\nOrder Ref: #${confirmedOrder.orderId}\nCustomer: ${confirmedOrder.customer.firstName} ${confirmedOrder.customer.lastName}\nPhone: ${confirmedOrder.customer.phone}\nDelivery: ${confirmedOrder.deliveryMethod === 'shipping' ? 'Courier Dispatch' : 'Coimbatore Studio Pickup'}\n\nPieces (${confirmedOrder.items.length}):\n` +
      confirmedOrder.items.map((i, idx) => `${idx + 1}. ${i.title} (${i.colour}) - Sz ${i.size} x ${i.quantity}`).join('\n') +
      `\n\nPlease confirm availability & payment link for dispatch.`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getOrderWhatsAppText());
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  return (
    <div className="w-full bg-white text-[#111827] pb-24">
      
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

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-8 sm:pt-10">
        
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
            <p className="text-[13px] text-red-700 mb-6">
              A temporary connection issue occurred while registering your piece hold with the studio catalog. No charges were made.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setStep('review')}
                className="w-full py-3 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer"
              >
                Retry Order Submission
              </button>
              <button
                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Hi TONTO, I had an issue on checkout reserving my pieces. Could you assist?')}`, '_blank')}
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
                  {confirmedOrder.deliveryMethod === 'shipping' ? 'Courier Dispatch (Tracked India)' : 'Studio Pickup (Coimbatore, TN)'}
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
                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getOrderWhatsAppText())}`, '_blank')}
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
                          Dispatched from Coimbatore studio with tracking details provided on WhatsApp.
                        </p>
                      </div>

                      <div
                        onClick={() => setDeliveryMethod('studio')}
                        className={`p-4 border cursor-pointer transition-all ${
                          deliveryMethod === 'studio'
                            ? 'border-[#003F25] bg-[#F9FAF9] ring-1 ring-[#003F25]'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-bold text-[#003F25]">Coimbatore Studio Pickup</span>
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
                          {deliveryMethod === 'shipping' ? 'Standard Courier (Tracked)' : 'Coimbatore Studio Collection'}
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

                  <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] text-[12px] text-[#4B5563]">
                    <strong className="block text-[#003F25] font-bold mb-1">Honest Sourcing & Reservation Notice</strong>
                    Submitting this form reserves your selected archive items. The TONTO studio team will confirm measurement fit with you before issuing final payment details.
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('details')}
                      className="px-6 py-4 border border-[#003F25] text-[#003F25] text-[12px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 py-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Check size={16} />
                      <span>Confirm & Reserve Order</span>
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

                <div className="space-y-4 max-h-[360px] overflow-y-auto no-scrollbar pr-1 mb-4 divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="pt-3 flex gap-3 items-center">
                      <img src={item.image} alt={item.title} className="w-14 h-18 object-cover bg-gray-50 border border-gray-200" />
                      <div className="flex-1 text-[12px]">
                        <h4 className="font-bold text-[#003F25] uppercase">{item.title}</h4>
                        <p className="text-[#79867D] capitalize">{item.colour} • Sz {item.size}</p>
                        <p className="text-[#4B5563]">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#003F25]">{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#E0E5E1] pt-4 space-y-2 text-[12px] text-[#4B5563]">
                  <div className="flex justify-between">
                    <span>Fulfillment</span>
                    <span className="font-medium text-[#003F25]">
                      {deliveryMethod === 'shipping' ? 'Tracked Courier' : 'Studio Pickup'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium text-[#003F25]">Confirmed on Order</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 text-[13px] font-bold text-[#003F25]">
                    <span>Total Items</span>
                    <span>{totalQuantity} pieces</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-[#79867D] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#003F25] flex-shrink-0" />
                  <span>Secure showroom reservation direct from Coimbatore studio.</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
