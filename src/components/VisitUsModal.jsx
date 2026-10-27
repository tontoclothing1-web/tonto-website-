import React, { useEffect } from 'react';
import { lockScroll, unlockScroll } from '../lib/scrollLock';
import { X, MapPin, ArrowUpRight, Phone, MessageCircle, Navigation } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function VisitUsModal({ isOpen, onClose }) {
  const storeAddress = "Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India";
  const landmark = "Opposite Prozone Mall";
  const phoneNumber = "+91 82483 21214";
  const phoneRaw = "+918248321214";
  const googleMapsShareUrl = "https://share.google/6kenpRy2HPjbnZ9Lo";

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
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 text-[#003F25] mb-2">
          <MapPin size={18} strokeWidth={2.2} />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#79867D]">
            STORE LOCATION & CONTACT
          </span>
        </div>

        <h2 id="visit-modal-title" className="text-xl sm:text-2xl font-extrabold text-[#111111] uppercase tracking-tight mb-4 font-['Futura_PT_Book',sans-serif]">
          VISIT TONTO
        </h2>

        <div className="space-y-4 text-[13px] text-[#374151] leading-relaxed">
          {/* Location Box */}
          <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-[#003F25] uppercase tracking-wider block">
              LOCATION
            </span>
            <p className="font-bold text-[#111111] text-[13.5px]">
              {storeAddress}
            </p>
            <p className="text-[12px] text-[#79867D]">
              Landmark: <span className="text-[#003F25] font-semibold">{landmark}</span>
            </p>
          </div>

          {/* Phone Box */}
          <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-[#003F25] uppercase tracking-wider block">
              PHONE NUMBER
            </span>
            <a
              href={`tel:${phoneRaw}`}
              className="text-lg font-extrabold text-[#003F25] tracking-tight hover:underline block"
            >
              {phoneNumber}
            </a>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <a
              href={googleMapsShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xs shadow-xs"
            >
              <Navigation size={14} />
              <span>Open in Google Maps</span>
              <ArrowUpRight size={14} />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${phoneRaw}`}
                className="py-2.5 px-3 bg-white border border-[#003F25] text-[#003F25] hover:bg-[#003F25] hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs"
              >
                <Phone size={13} />
                <span>Call Store</span>
              </a>

              <a
                href={`https://wa.me/${phoneRaw.replace('+', '')}?text=Hi%20TONTO,%20I%20am%20enquiring%20about%20your%20store%20location.`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs"
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
