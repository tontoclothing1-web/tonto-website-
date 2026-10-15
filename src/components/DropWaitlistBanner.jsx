import React, { useState } from 'react';
import { ArrowUpRight, Bell, Check } from 'lucide-react';
import { submitWaitlist, mirror } from '../lib/capture';

const DROP_NAME = 'TONTO Drop 01';

export default function DropWaitlistBanner({ onOpenOffer }) {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    const email = waitlistEmail.trim().toLowerCase();
    if (!email || isSubmitting) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    // POST /api/leads/waitlist is the drop register the owner actually reads.
    const result = await submitWaitlist({
      dropName: DROP_NAME,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      email
    });

    if (result.rejected) {
      setIsSubmitting(false);
      setFormError(result.error || 'Could not add that address to the register.');
      return;
    }

    // Device mirror so the Admin Dashboard CRM still shows it (offline fallback).
    mirror('tonto_admin_leads', {
      id: `LEAD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: email.split('@')[0],
      phone: 'Awaiting WhatsApp',
      email,
      source: 'TONTO MADE Waitlist (Drop 01)',
      interest: 'In-House Debut Capsule (Waffle & Washed Denim)',
      estimatedValue: 4500,
      stage: 'New',
      date: new Date().toISOString().split('T')[0],
      notes: 'Submitted email directly from storefront Drop 01 waitlist banner.'
    });

    setIsSubmitting(false);
    setIsJoined(true);
  };

  return (
    <section className="w-full bg-[#FAFBF9] py-8 sm:py-12 border-b border-[#E0E5E1]">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Private Waitlist & Early Access Capsule Banner */}
        <div className="bg-[#003F25] border border-[#002e1b] rounded-xs p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl text-white text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xs mb-2 border border-white/20">
              <Bell size={12} className="text-white" />
              <span>PRIVATE DROP ALERT</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight font-['Futura_PT_Book',sans-serif] text-white">
              BE FIRST FOR TONTO DROP 01
            </h3>
            <p className="text-[13px] text-[#E0E5E1] mt-2 leading-relaxed">
              Our inaugural in-house manufactured collection will release in strictly limited quantities. Join the private drop register to receive lookbook previews and exclusive first-hour checkout access.
            </p>
          </div>

          {/* Interactive Waitlist Form */}
          <div className="w-full lg:w-auto lg:min-w-[420px]">
            {isJoined ? (
              <div className="bg-white/10 border border-white/20 p-4 rounded-xs text-left animate-fade-in flex items-center gap-3.5 text-white">
                <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Check size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-white">
                    YOU'RE REGISTERED FOR DROP 01
                  </h4>
                  <p className="text-[11.5px] text-[#E0E5E1] mt-0.5">
                    We'll email you private early access 1 hour prior to general release.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => {
                    setWaitlistEmail(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Enter your email for Drop 01 access"
                  className="flex-1 px-4 py-3 bg-white text-[#111111] placeholder-gray-400 text-[12.5px] outline-none focus:ring-2 focus:ring-white rounded-xs"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white hover:bg-gray-100 text-[#003F25] text-[12px] font-extrabold uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap rounded-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  <span>{isSubmitting ? 'JOINING\u2026' : 'JOIN WAITLIST'}</span>
                  {!isSubmitting && <ArrowUpRight size={15} strokeWidth={2.5} />}
                </button>
              </form>
            )}

            {formError && (
              <p className="mt-2 text-[11.5px] text-red-200">{formError}</p>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#A5B4AB]">
              <span>Limited capsule batch • Made in Coimbatore</span>
              {onOpenOffer && (
                <button
                  type="button"
                  onClick={() => onOpenOffer('offer')}
                  className="text-white hover:underline cursor-pointer"
                >
                  Claim 15% First Order Privilege &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
