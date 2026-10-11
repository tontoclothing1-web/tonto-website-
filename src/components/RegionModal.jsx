import React, { useEffect } from 'react';
import { X, Check, Globe } from 'lucide-react';

const REGIONS = [
  { code: 'IN', label: 'India', currency: 'INR (₹)', display: 'INDIA' },
  { code: 'US', label: 'United States', currency: 'USD ($)', display: 'UNITED STATES' },
  { code: 'AE', label: 'United Arab Emirates', currency: 'AED (د.إ)', display: 'UAE' },
  { code: 'GB', label: 'United Kingdom', currency: 'GBP (£)', display: 'UNITED KINGDOM' },
  { code: 'SG', label: 'Singapore', currency: 'SGD (S$)', display: 'SINGAPORE' }
];

export default function RegionModal({ isOpen, onClose, selectedRegion, onSelectRegion }) {
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
        className="relative w-full max-w-sm bg-white border border-[#E0E5E1] shadow-2xl z-10 p-6 rounded-xs text-left animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 text-[#003F25] mb-2">
          <Globe size={18} />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#79867D]">
            SHIPPING REGION
          </span>
        </div>

        <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
          Select Region & Currency
        </h2>
        <p className="text-[12px] text-[#6B7280] mb-5 leading-relaxed">
          TONTO ships surplus & imported unisex pieces worldwide from Coimbatore, India.
        </p>

        <div className="space-y-2 mb-6">
          {REGIONS.map((r) => {
            const isSelected = selectedRegion.code === r.code;
            return (
              <button
                key={r.code}
                onClick={() => {
                  onSelectRegion(r);
                  onClose();
                }}
                className={`w-full p-3 border text-left flex items-center justify-between rounded-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#003F25] bg-[#F4F7F5] text-[#003F25]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-800'
                }`}
              >
                <div>
                  <div className="text-[13px] font-bold">{r.label}</div>
                  <div className="text-[11px] text-[#79867D]">{r.currency}</div>
                </div>
                {isSelected && <Check size={16} className="text-[#003F25]" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#003F25] text-white text-[12px] font-bold tracking-wider uppercase hover:bg-[#002e1b] transition-colors cursor-pointer"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
}
