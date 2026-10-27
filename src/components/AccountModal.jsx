import React, { useEffect } from 'react';
import { lockScroll, unlockScroll } from '../lib/scrollLock';
import { X, Lock, ArrowUpRight, Bookmark, RefreshCw, AlertCircle } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { submitWaitlist, mirror } from '../lib/capture';

export default function AccountModal({ isOpen, onClose, onOpenSaved, onNavigateAccount }) {
  const [emailOrPhone, setEmailOrPhone] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subscribeError, setSubscribeError] = React.useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      lockScroll();
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = emailOrPhone.trim();
    if (!value || isSubmitting) return;

    const isEmail = value.includes('@');
    if (isEmail && !/^\S+@\S+\.\S+$/.test(value)) {
      setSubscribeError('Enter a valid email address.');
      return;
    }
    if (!isEmail && value.replace(/\D/g, '').length < 8) {
      setSubscribeError('Enter a reachable email or phone number.');
      return;
    }

    setIsSubmitting(true);
    setSubscribeError('');

    // POST /api/leads/waitlist accepts either an email or a phone, which is what
    // this field offers. Without it the address only ever lived in this browser.
    const result = await submitWaitlist({
      dropName: 'Coimbatore Drop Alerts',
      email: isEmail ? value : undefined,
      phone: isEmail ? undefined : value
    });

    if (result.rejected) {
      setIsSubmitting(false);
      setSubscribeError(result.error || 'Could not add that address to the alert list.');
      return;
    }

    mirror('tonto_admin_leads', {
      id: `LEAD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: isEmail ? value.split('@')[0] : 'Store Shopper',
      phone: isEmail ? '' : value,
      email: isEmail ? value : '',
      source: 'Account Modal Drop Alerts',
      interest: 'Coimbatore Showroom Drop Notifications',
      stage: 'New',
      date: new Date().toISOString().split('T')[0],
      notes: 'Joined drop alerts from the account modal.'
    });

    setIsSubmitting(false);
    setSubscribed(true);
    setEmailOrPhone('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-white border border-[#E0E5E1] shadow-2xl z-10 p-6 sm:p-8 rounded-xs text-left animate-scale-in"
        role="dialog"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none cursor-pointer"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#003F25] flex items-center justify-center mb-4">
          <Lock size={18} />
        </div>

        <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
          Customer Account & Drops
        </h2>

        <p className="text-[13px] text-[#4B5563] leading-relaxed mb-5">
          Manage order hold reservations, set top and denim waist sizing preferences, and receive Coimbatore showroom drop alerts.
        </p>

        {/* Drop Notification Signup Form */}
        <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs mb-5">
          <p className="text-[12px] text-[#003F25] font-bold uppercase tracking-wider mb-1">
            Get Coimbatore Drop Alerts
          </p>
          <p className="text-[11px] text-[#79867D] mb-3">
            Be first to know when new vintage surplus and denim pieces arrive.
          </p>
          {subscribed ? (
            <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[12px] rounded-xs font-semibold">
              ✓ You are on the private TONTO drop notification list.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    if (subscribeError) setSubscribeError('');
                  }}
                  placeholder="Email or phone number"
                  className="flex-1 px-3 py-2 text-[12px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-[#003F25] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors rounded-xs cursor-pointer disabled:opacity-60 disabled:cursor-wait flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw size={12} className="animate-spin" />}
                  <span>{isSubmitting ? 'Joining' : 'Join'}</span>
                </button>
              </div>
              {subscribeError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{subscribeError}</span>
                </p>
              )}
            </form>
          )}
        </div>

        <div className="space-y-2.5">
          {onNavigateAccount && (
            <button
              onClick={() => {
                onClose();
                onNavigateAccount();
              }}
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Open Full Account Portal</span>
              <ArrowUpRight size={15} />
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenSaved();
            }}
            className="w-full py-2.5 border border-gray-300 hover:border-[#003F25] text-[#003F25] text-[12px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Bookmark size={14} />
            <span>View Saved Shortlist</span>
          </button>
        </div>
      </div>
    </div>
  );
}
