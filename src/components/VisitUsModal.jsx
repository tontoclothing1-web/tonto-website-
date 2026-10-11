import React, { useEffect } from 'react';
import { X, MapPin, ArrowUpRight } from 'lucide-react';

const InstagramIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import { BRAND_INFO } from '../data/products';

export default function VisitUsModal({ isOpen, onClose, onOpenEnquiry }) {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white border border-[#E0E5E1] shadow-2xl z-10 p-6 sm:p-8 rounded-xs text-left animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 text-[#003F25] mb-2">
          <MapPin size={18} strokeWidth={2.2} />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#79867D]">
            STORE LOCATION
          </span>
        </div>

        <h2 id="visit-modal-title" className="text-xl sm:text-2xl font-extrabold text-[#003F25] uppercase tracking-tight mb-4">
          Visit TONTO
        </h2>

        <div className="space-y-4 text-[13px] text-[#374151] leading-relaxed">
          <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-1.5">
            <p className="font-bold text-[#003F25] text-[14px]">
              Coimbatore, Tamil Nadu, India
            </p>
            <p className="text-[12px] text-[#79867D]">
              Physical studio showroom & archive fitting space.
            </p>
          </div>

          <div className="text-[12px] text-[#6B7280] space-y-2 border-l-2 border-[#003F25] pl-3 py-1">
            <p className="font-medium text-[#111827]">
              Studio Visits & Fitting Appointments
            </p>
            <p>
              To respect curated piece drops, in-person studio visits and styling previews are coordinated by advance appointment.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenEnquiry({
                  id: 'studio-appointment',
                  title: 'Studio Fitting Appointment (Coimbatore)',
                  colour: 'In-person trial',
                  fit: 'Custom fittings',
                  price: 'Free appointment',
                  images: ['/assets/hero-banner-hd.jpg']
                });
              }}
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Request Studio Appointment</span>
              <ArrowUpRight size={15} />
            </button>

            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 border border-[#003F25] text-[#003F25] hover:bg-gray-50 text-[12px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <InstagramIcon size={15} />
              <span>DM on Instagram @{BRAND_INFO.instagram}</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
