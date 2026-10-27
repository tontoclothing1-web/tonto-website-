import React, { useState, useEffect } from 'react';
import { X, Check, Copy, ArrowRight, Sparkles } from 'lucide-react';
import { submitOfferClaim, mirror, readList } from '../lib/capture';

export default function OfferModal({ isOpen, onClose, onNavigateCollection, onCredentialsSubmitted, offerModalMedia }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Smooth animation entrance and exit states
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const bannerImage = offerModalMedia?.image || '/assets/editorial/editorial-seated-camo.jpg';
  const tag = offerModalMedia?.tag || 'TONTO ARCHIVE';
  const badge = offerModalMedia?.badge || 'LIMITED OFFER';
  const headline = offerModalMedia?.headline || 'MADE TO BE DIFFERENT';
  const description = offerModalMedia?.description || 'Curated thrift, surplus & heavy washed denim drops from Coimbatore.';
  const privilegeTag = offerModalMedia?.privilegeTag || 'welcome privilege';
  const title = offerModalMedia?.title || 'UNLOCK 15% OFF';
  const subtitle = offerModalMedia?.subtitle || 'Enter your email to reveal your private 15% discount code and receive priority access to limited surplus & denim releases.';
  const buttonText = offerModalMedia?.buttonText || 'REVEAL 15% OFF CODE';
  const PROMO_CODE = offerModalMedia?.promoCode || 'TONTO15';

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setFormError('');
      setIsClosing(false);
      // Double rAF ensures DOM paint before transitioning in for butter-smooth animation
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setMounted(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleSmoothClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setMounted(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSmoothClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isClosing]);

  if (!isOpen) return null;

  const handleClaimOffer = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    if (!cleanEmail || isSubmitting) return;
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const result = await submitOfferClaim({
      name: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      email: cleanEmail,
      phone: cleanPhone,
      source: '15% Welcome Modal'
    });

    if (result.rejected) {
      setIsSubmitting(false);
      setFormError(result.error || 'Could not register that address.');
      return;
    }

    const emailKey = cleanEmail;
    const subscribers = readList('tonto_admin_subscribers');
    if (!subscribers.some((s) => String(s?.email).toLowerCase() === emailKey)) {
      mirror(
        'tonto_admin_subscribers',
        {
          email: cleanEmail,
          phone: cleanPhone || undefined,
          source: '15% Welcome Modal',
          date: new Date().toISOString().split('T')[0]
        },
        { append: true, max: 500, match: 'email' }
      );
    }

    mirror('tonto_admin_leads', {
      id: `LEAD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: emailKey.split('@')[0].replace(/[._-]/g, ' '),
      phone: cleanPhone,
      email: cleanEmail,
      source: '15% Welcome Modal',
      interest: `Claimed ${PROMO_CODE} Welcome Promo`,
      estimatedValue: 3500,
      stage: 'New',
      date: new Date().toISOString().split('T')[0],
      notes: 'Signed up via 15% discount popup modal.'
    });

    try {
      localStorage.setItem('tonto_credentials_submitted', 'true');
      localStorage.setItem('tonto_subscriber_email', cleanEmail);
      if (cleanPhone) {
        localStorage.setItem('tonto_subscriber_phone', cleanPhone);
      }
    } catch (err) {
      console.error(err);
    }

    try {
      navigator.clipboard?.writeText(PROMO_CODE)?.catch(() => {});
      setIsCopied(true);
    } catch (err) {
      // clipboard blocked
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    if (onCredentialsSubmitted) {
      onCredentialsSubmitted({ email: cleanEmail, phone: cleanPhone });
    }

    // Auto-dismiss modal smoothly after 2.5s once credentials have been given
    setTimeout(() => {
      handleSmoothClose();
    }, 2500);
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard?.writeText(PROMO_CODE)?.catch(() => {});
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      // clipboard unavailable
    }
  };

  const handleShopWithCode = () => {
    handleCopyCode();
    handleSmoothClose();
    if (onNavigateCollection) {
      onNavigateCollection('All');
    }
  };

  const isVisible = mounted && !isClosing;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-5 overflow-y-auto overflow-x-hidden transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Dimmed backdrop with smooth fade */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ease-out z-0 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSmoothClose}
        aria-hidden="true"
      />

      {/* Main Dialog Modal with smooth scale & settle easing */}
      <div
        className={`relative w-full max-w-[840px] bg-white border border-[#E0E5E1] shadow-2xl z-10 rounded-sm overflow-hidden flex flex-col md:flex-row my-auto text-left max-h-[92dvh] overflow-y-auto transform transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-[0.95] translate-y-3'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={handleSmoothClose}
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Left Column: Streetwear Campaign Image with Overlay Badge */}
        <div className="hidden md:block md:w-5/12 relative bg-[#0D1E16] overflow-hidden">
          <img
            src={bannerImage}
            alt="TONTO Streetwear"
            className="w-full h-full object-cover object-center opacity-90 scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

          {/* Top Logo Badge */}
          {tag && (
            <div className="absolute top-5 left-5">
              <span className="text-[10.5px] font-bold tracking-[0.2em] text-white/90 uppercase bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-xs">
                {tag}
              </span>
            </div>
          )}

          {/* Bottom Callout */}
          <div className="absolute bottom-6 left-6 right-6 text-white text-left">
            {badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white text-[#003F25] text-[10.5px] font-bold uppercase tracking-wider mb-2 rounded-xs shadow-xs">
                <Sparkles size={12} className="text-[#003F25]" />
                <span>{badge}</span>
              </div>
            )}
            <h3 className="text-xl font-bold tracking-tight uppercase leading-tight font-['Futura_PT_Book',sans-serif]">
              {headline}
            </h3>
            {description && (
              <p className="text-[11.5px] text-white/75 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: 15% Off Offer Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-9 flex flex-col justify-between bg-white text-left">
          <div>
            {!isSubmitted ? (
              <div>
                {/* Header */}
                <div className="mb-4">
                  {privilegeTag && (
                    <div className="inline-block px-2.5 py-0.5 bg-[#003F25]/10 text-[#003F25] border border-[#003F25]/20 text-[11px] font-bold uppercase tracking-wider mb-2 rounded-xs">
                      {privilegeTag}
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-tight leading-tight font-['Futura_PT_Book',sans-serif]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[12.5px] text-[#767676] mt-1.5 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Email Sign-up Form */}
                <form onSubmit={handleClaimOffer} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Email Address <span className="text-[#003F25]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:ring-1 focus:ring-[#003F25] rounded-xs outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Phone Number <span className="text-gray-400 font-normal lowercase">(optional for SMS/WhatsApp drops)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:ring-1 focus:ring-[#003F25] rounded-xs outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12.5px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm rounded-xs mt-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <span>{isSubmitting ? 'REVEALING\u2026' : buttonText}</span>
                    {!isSubmitting && <ArrowRight size={15} />}
                  </button>
                </form>

                {formError && (
                  <p className="text-[11.5px] text-red-600 mt-2 text-center">{formError}</p>
                )}

                <p className="text-[11px] text-gray-400 mt-3 text-center">
                  Instant discount applicable on your first purchase. Unsubscribe anytime.
                </p>
              </div>
            ) : (
              /* Success State with Promo Code */
              <div className="py-2 text-center animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#E8F5E9] text-[#003F25] flex items-center justify-center mb-3">
                  <Check size={24} strokeWidth={2.5} />
                </div>

                <h2 className="text-2xl font-bold uppercase text-[#111111] tracking-tight font-['Futura_PT_Book',sans-serif]">
                  YOU'RE ON THE LIST!
                </h2>
                <p className="text-[12.5px] text-[#767676] mt-1 max-w-sm mx-auto">
                  Use this private discount code at checkout to take 15% off your first order:
                </p>

                {/* Promo Code Box */}
                <div className="mt-4 p-3 bg-[#F9FAF9] border-2 border-dashed border-[#003F25] rounded-xs flex items-center justify-between max-w-sm mx-auto">
                  <div className="text-left pl-2">
                    <span className="text-[10px] uppercase font-bold text-[#79867D] tracking-wider block">
                      YOUR CODE
                    </span>
                    <span className="text-xl font-extrabold tracking-widest text-[#003F25]">
                      {PROMO_CODE}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-[#003F25] text-white'
                        : 'bg-white text-[#003F25] border border-[#003F25] hover:bg-[#003F25] hover:text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>COPY CODE</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShopWithCode}
                  className="w-full max-w-sm mx-auto mt-4 py-3 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12.5px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
                >
                  <span>APPLY & SHOP COLLECTION</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Dismissal footer text link */}
          <div className="pt-4 mt-2 text-center">
            <button
              type="button"
              onClick={handleSmoothClose}
              className="text-[11.5px] text-gray-400 hover:text-black transition-colors cursor-pointer underline underline-offset-2"
            >
              No thanks, continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
