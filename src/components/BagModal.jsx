import React, { useEffect } from 'react';
import { X, ShoppingBag, ArrowUpRight } from 'lucide-react';

export default function BagModal({ isOpen, onClose, onOpenSaved }) {
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
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#003F25] flex items-center justify-center mb-4">
          <ShoppingBag size={18} />
        </div>

        <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
          Shopping Bag
        </h2>

        <p className="text-[13px] text-[#4B5563] leading-relaxed mb-6">
          Direct online cart and payment processing will be integrated once TONTO's official payment gateway and confirmed pricing are connected.
        </p>

        <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-2 mb-6">
          <p className="text-[12px] text-[#003F25] font-semibold uppercase tracking-wider">
            Current Purchasing Method:
          </p>
          <p className="text-[12px] text-[#4B5563]">
            Use the <strong className="text-[#003F25]">“Ask about this piece”</strong> button or shortlist items to enquire directly about prices, sizing measurements, and delivery.
          </p>
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenSaved();
          }}
          className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
        >
          View Saved Shortlist
        </button>
      </div>
    </div>
  );
}
