import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Ruler } from 'lucide-react';

export default function SizeGuideModal({ isOpen, onClose, category = 'Denim' }) {
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg bg-white border border-[#E0E5E1] shadow-2xl z-10 p-4 sm:p-8 rounded-xs text-left animate-scale-up max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none"
          aria-label="Close size guide"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 text-[#003F25] mb-2">
          <Ruler size={18} />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#79867D]">
            MEASUREMENT GUIDANCE
          </span>
        </div>

        <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
          Unisex Fit & Sizing Guide
        </h2>
        <p className="text-[12px] text-[#6B7280] mb-5 leading-relaxed">
          TONTO pieces are cut with modern streetwear proportions: wide leg openings for denim, dropped shoulders for tees, and relaxed rises for trousers.
        </p>

        {/* Denim & Bottoms Chart */}
        <div className="mb-5">
          <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider mb-2.5">
            Denim & Trousers (Inches)
          </h3>
          <div className="overflow-x-auto border border-[#E0E5E1] rounded-xs text-[12px]">
            <table className="w-full text-left">
              <thead className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[#003F25] font-bold">
                <tr>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Waist</th>
                  <th className="p-2.5">Inseam</th>
                  <th className="p-2.5">Leg Opening</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#4B5563]">
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">28 / S</td>
                  <td className="p-2.5">28 - 29"</td>
                  <td className="p-2.5">30.5"</td>
                  <td className="p-2.5">20.5"</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">30 / M</td>
                  <td className="p-2.5">30 - 31"</td>
                  <td className="p-2.5">31.0"</td>
                  <td className="p-2.5">21.5"</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">32 / L</td>
                  <td className="p-2.5">32 - 33"</td>
                  <td className="p-2.5">31.5"</td>
                  <td className="p-2.5">22.0"</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">34 / XL</td>
                  <td className="p-2.5">34 - 35"</td>
                  <td className="p-2.5">32.0"</td>
                  <td className="p-2.5">22.5"</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tops & Layering Chart */}
        <div className="mb-5">
          <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider mb-2.5">
            Oversized Tops & Shirts (Inches)
          </h3>
          <div className="overflow-x-auto border border-[#E0E5E1] rounded-xs text-[12px]">
            <table className="w-full text-left">
              <thead className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[#003F25] font-bold">
                <tr>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Chest Width</th>
                  <th className="p-2.5">Length</th>
                  <th className="p-2.5">Shoulder Drop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#4B5563]">
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">S</td>
                  <td className="p-2.5">44"</td>
                  <td className="p-2.5">27.5"</td>
                  <td className="p-2.5">21.0"</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">M</td>
                  <td className="p-2.5">46"</td>
                  <td className="p-2.5">28.5"</td>
                  <td className="p-2.5">22.0"</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">L</td>
                  <td className="p-2.5">48"</td>
                  <td className="p-2.5">29.5"</td>
                  <td className="p-2.5">23.0"</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#003F25]">XL</td>
                  <td className="p-2.5">50"</td>
                  <td className="p-2.5">30.5"</td>
                  <td className="p-2.5">24.0"</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs text-[11px] text-[#6B7280]">
          <strong className="text-[#003F25]">Care Note:</strong> Individual thrift and surplus items can vary by 0.5–1 inch due to specialized wash treatments. For custom flat measurements of any piece, use the "Ask about this piece" button.
        </div>
      </div>
    </div>,
    document.body
  );
}
