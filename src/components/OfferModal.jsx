import React, { useState, useEffect } from 'react';
import { X, Check, Copy, ArrowRight, ShieldCheck, Tag, UserCheck, Sparkles } from 'lucide-react';

export default function OfferModal({ isOpen, onClose, onNavigateCollection, initialMode = 'offer' }) {
  const [mode, setMode] = useState(initialMode); // 'offer' | 'signin'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);

  const PROMO_CODE = 'TONTO15';

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setIsSubmitted(false);
      setSignInSuccess(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClaimOffer = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitted(true);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSignInSuccess(true);
    setTimeout(() => {
      onClose();
      setSignInSuccess(false);
    }, 1500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleShopWithCode = () => {
    handleCopyCode();
    onClose();
    if (onNavigateCollection) {
      onNavigateCollection('All');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[4px] transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog Modal */}
      <div
        className="relative w-full max-w-[840px] bg-white border border-[#E0E5E1] shadow-2xl z-10 rounded-sm overflow-hidden flex flex-col md:flex-row my-auto animate-scale-up text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Left Column: Streetwear Campaign Image with Overlay Badge */}
        <div className="hidden md:block md:w-5/12 relative bg-[#0D1E16] overflow-hidden">
          <img
            src="/assets/editorial/editorial-seated-camo.jpg"
            alt="TONTO Streetwear"
            className="w-full h-full object-cover object-center opacity-90 scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

          {/* Top Logo Badge */}
          <div className="absolute top-5 left-5">
            <span className="text-[10.5px] font-bold tracking-[0.2em] text-white/90 uppercase bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-xs">
              TONTO ARCHIVE
            </span>
          </div>

          {/* Bottom Callout */}
          <div className="absolute bottom-6 left-6 right-6 text-white text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#F4EDE5] text-[#111111] text-[10.5px] font-bold uppercase tracking-wider mb-2 rounded-xs">
              <Sparkles size={12} className="text-[#003F25]" />
              <span>LIMITED OFFER</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight uppercase leading-tight font-['Futura_PT_Book',sans-serif]">
              MADE TO BE DIFFERENT
            </h3>
            <p className="text-[11.5px] text-white/75 mt-1 leading-relaxed">
              Curated thrift, surplus & heavy washed denim drops from Coimbatore.
            </p>
          </div>
        </div>

        {/* Right Column: Offer & Sign In Forms */}
        <div className="w-full md:w-7/12 p-6 sm:p-9 flex flex-col justify-between bg-white text-left">
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-100 pb-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('offer');
                  setIsSubmitted(false);
                }}
                className={`text-[12.5px] font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer relative ${
                  mode === 'offer'
                    ? 'text-[#003F25]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>GET 15% OFF</span>
                {mode === 'offer' && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#003F25]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setSignInSuccess(false);
                }}
                className={`text-[12.5px] font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer relative ${
                  mode === 'signin'
                    ? 'text-[#003F25]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>SIGN IN</span>
                {mode === 'signin' && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#003F25]" />
                )}
              </button>
            </div>

            {/* TAB 1: OFFER & DISCOUNT */}
            {mode === 'offer' && (
              <>
                {!isSubmitted ? (
                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <div className="inline-block px-2 py-0.5 bg-[#F4EDE5] text-[#111111] text-[11px] font-semibold lowercase tracking-tight mb-2">
                        welcome privilege
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-tight leading-tight font-['Futura_PT_Book',sans-serif]">
                        UNLOCK 15% OFF
                      </h2>
                      <p className="text-[12.5px] text-[#767676] mt-1.5 leading-relaxed">
                        Enter your email to reveal your private 15% discount code and receive priority access to limited surplus & denim releases.
                      </p>
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
                        className="w-full py-3 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12.5px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm rounded-xs mt-2"
                      >
                        <span>REVEAL 15% OFF CODE</span>
                        <ArrowRight size={15} />
                      </button>
                    </form>

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
              </>
            )}

            {/* TAB 2: SIGN IN */}
            {mode === 'signin' && (
              <div>
                <div className="mb-4">
                  <div className="inline-block px-2 py-0.5 bg-[#F3F4F6] text-[#111111] text-[11px] font-semibold lowercase tracking-tight mb-2">
                    client access
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-tight leading-tight font-['Futura_PT_Book',sans-serif]">
                    SIGN IN
                  </h2>
                  <p className="text-[12.5px] text-[#767676] mt-1.5 leading-relaxed">
                    Access your account reservations, saved pieces, and Coimbatore studio appointments.
                  </p>
                </div>

                {signInSuccess ? (
                  <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-xs text-center font-medium text-[13px] animate-fade-in my-6">
                    <UserCheck size={28} className="mx-auto mb-2 text-[#166534]" />
                    <span>Signed in successfully. Welcome back to TONTO.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Email Address
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => alert("Password reset instructions sent to your email.")}
                          className="text-[11px] text-[#003F25] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:ring-1 focus:ring-[#003F25] rounded-xs outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12.5px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm rounded-xs mt-2"
                    >
                      <span>SIGN IN TO ACCOUNT</span>
                      <ArrowRight size={15} />
                    </button>
                  </form>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11.5px] text-[#767676]">
                  <span>Don't have an account yet?</span>
                  <button
                    type="button"
                    onClick={() => setMode('offer')}
                    className="font-bold text-[#003F25] hover:underline uppercase"
                  >
                    Claim 15% Off
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dismissal footer text link */}
          <div className="pt-4 mt-2 text-center">
            <button
              type="button"
              onClick={onClose}
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
