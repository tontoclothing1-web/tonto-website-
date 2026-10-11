import React, { useEffect } from 'react';
import { X, Trash2, ArrowUpRight } from 'lucide-react';
import { PRODUCTS } from '../data/products';

export default function SavedItemsDrawer({
  isOpen,
  onClose,
  savedIds,
  onRemoveSaved,
  onQuickView,
  onOpenProduct,
  onEnquire,
  onNavigateSaved
}) {
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

  const savedProducts = PRODUCTS.filter((p) => savedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-[380px] sm:max-w-[420px] h-full bg-white shadow-2xl z-10 flex flex-col justify-between text-left animate-slide-left">
        
        {/* Top Bar */}
        <div className="p-6 border-b border-[#E0E5E1] flex items-center justify-between">
          <h2 className="text-[14px] font-extrabold tracking-[0.08em] text-[#003F25] uppercase">
            SAVED PIECES ({savedProducts.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#003F25] hover:opacity-70 transition-opacity focus:outline-none"
            aria-label="Close saved items drawer"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* List of Saved Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedProducts.length > 0 ? (
            savedProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 border border-[#E0E5E1] rounded-xs flex gap-3.5 items-center group relative hover:border-[#003F25]/40 transition-colors"
              >
                <img
                  src={p.images?.[0]}
                  alt={p.title}
                  className="w-16 h-20 object-cover bg-gray-50 flex-shrink-0 cursor-pointer"
                  onClick={() => {
                    onClose();
                    onQuickView(p);
                  }}
                />

                <div className="flex-1 overflow-hidden">
                  <h3
                    onClick={() => {
                      onClose();
                      onQuickView(p);
                    }}
                    className="text-[13px] font-bold text-[#003F25] uppercase truncate cursor-pointer hover:underline"
                  >
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-[#79867D] capitalize">
                    {p.colour} • {p.fit}
                  </p>
                  <p className="text-[12px] font-semibold text-[#003F25] mt-1">
                    {p.price}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onEnquire(p);
                      }}
                      className="text-[11px] font-bold text-[#003F25] uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Enquire</span>
                      <ArrowUpRight size={12} />
                    </button>
                    <button
                      onClick={() => onRemoveSaved(p.id)}
                      className="text-[11px] text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <p className="text-[14px] font-bold text-[#003F25] uppercase mb-1">
                No saved pieces yet
              </p>
              <p className="text-[12px] text-[#79867D] max-w-xs">
                Click the bookmark icon on any piece to curate your personal TONTO shortlist.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {savedProducts.length > 0 && (
          <div className="p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-[#E0E5E1] bg-white space-y-3">
            <button
              onClick={() => {
                onClose();
                const combined = {
                  id: 'saved-shortlist',
                  title: `Shortlist of ${savedProducts.length} Pieces: ${savedProducts.map(p => p.title).join(' | ')}`,
                  colour: savedProducts.map(p => p.colour).join(', '),
                  fit: 'Multiple',
                  price: 'Price on enquiry',
                  images: [savedProducts[0]?.images?.[0]]
                };
                onEnquire(combined);
              }}
              className="w-full py-3.5 bg-[#003F25] text-white text-[13px] font-bold tracking-wider uppercase hover:bg-[#002e1b] transition-colors cursor-pointer"
            >
              Enquire About All {savedProducts.length} Saved Pieces
            </button>

            {onNavigateSaved && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateSaved();
                }}
                className="w-full text-center text-[12px] font-semibold text-[#003F25] underline hover:opacity-80 cursor-pointer"
              >
                View Full Shortlist Page ↗
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
