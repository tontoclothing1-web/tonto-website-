import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, Check, Bookmark } from 'lucide-react';

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onOpenEnquiry,
  onAddToCart,
  onViewFullDetails,
  isSaved,
  onToggleSave
}) {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    setSelectedImgIndex(0);
    setSelectedSize(product?.variants?.[0] || '');
  }, [product]);

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

  if (!isOpen || !product) return null;

  const currentImage = product.images?.[selectedImgIndex] || product.images?.[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dimmed & lightly blurred backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card Dialog */}
      <div
        className="relative w-full max-w-3xl bg-white border border-[#E0E5E1] shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row my-auto animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 p-2 text-[#003F25] hover:opacity-70 transition-opacity bg-white/80 hover:bg-white rounded-full focus:outline-none focus:ring-1 focus:ring-[#003F25]"
          aria-label="Close dialog"
        >
          <X size={19} strokeWidth={2} />
        </button>

        {/* Left: Product Image & Gallery */}
        <div className="w-full md:w-1/2 bg-[#F9F9F9] relative flex flex-col justify-between">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5]">
            <img
              src={currentImage}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {/* Save Bookmark button on top-left of image */}
            <button
              onClick={() => onToggleSave(product)}
              className={`absolute top-3 left-3 p-2 rounded-sm transition-colors ${
                isSaved ? 'bg-[#003F25] text-white' : 'bg-white/80 text-[#003F25] hover:bg-white'
              }`}
              title={isSaved ? "Saved" : "Save item"}
            >
              <Bookmark size={15} className={isSaved ? 'fill-white' : ''} />
            </button>
          </div>

          {/* Alternate Image Thumbnails if available */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 p-3 bg-white border-t border-[#E0E5E1]">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImgIndex(i)}
                  className={`w-12 h-14 border overflow-hidden transition-all ${
                    selectedImgIndex === i ? 'border-[#003F25] ring-1 ring-[#003F25]' : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Enquiry Action */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between text-left">
          <div>
            {/* Subtitle */}
            <p className="text-[11px] font-semibold text-[#79867D] uppercase tracking-[0.15em] mb-1.5">
              TONTO / UNISEX
            </p>

            {/* Title */}
            <h2
              id="quickview-title"
              className="text-xl sm:text-2xl font-extrabold text-[#003F25] uppercase tracking-tight mb-3"
            >
              {product.title}
            </h2>

            {/* Description */}
            <p className="text-[13px] text-[#4B5563] leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Structured Specifications matching mockup */}
            <div className="space-y-3 border-t border-b border-[#E0E5E1] py-4 my-4 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-[#79867D]">Colour</span>
                <span className="font-semibold text-[#003F25] capitalize">{product.colour}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#79867D]">Fit</span>
                <span className="font-semibold text-[#003F25]">{product.fit}</span>
              </div>
              {(() => {
                const variantsList = Array.isArray(product?.variants)
                  ? product.variants
                  : (typeof product?.variants === 'string'
                    ? product.variants.split(/[,/]+/).map((v) => v.trim()).filter(Boolean)
                    : []);
                if (variantsList.length === 0) return null;
                return (
                  <div className="flex justify-between items-center">
                    <span className="text-[#79867D]">Select Size</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {variantsList.map((sz) => {
                        const isSel = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                              isSel
                                ? 'bg-[#003F25] text-white border-[#003F25]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#003F25]'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {product.measurements && (
                <div className="flex flex-col pt-1">
                  <span className="text-[11px] text-[#79867D] uppercase tracking-wider mb-0.5">Measurements</span>
                  <span className="text-[12px] text-[#374151] font-mono">{product.measurements}</span>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-1.5 text-[12px] text-[#003F25] font-medium mb-6">
              <Check size={14} strokeWidth={2.5} />
              <span>{product.availability}</span>
            </div>
          </div>

          {/* Primary Action & Helper Note */}
          <div className="space-y-2.5">
            <button
              onClick={() => {
                onClose();
                if (onAddToCart) onAddToCart(product, selectedSize);
              }}
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003F25]"
            >
              <span>Add to Bag {selectedSize ? `(${selectedSize})` : ''}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEnquiry(product, selectedSize);
              }}
              className="w-full py-3 border border-[#003F25] text-[#003F25] hover:bg-[#F9FAF9] text-[12px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Ask about this piece</span>
              <ArrowUpRight size={15} strokeWidth={2} />
            </button>

            <div className="pt-1 flex items-center justify-between text-[11px] text-[#79867D]">
              <span>Ask for price, measurements & stock</span>
              {onViewFullDetails && (
                <button
                  onClick={() => {
                    onClose();
                    onViewFullDetails(product);
                  }}
                  className="text-[#003F25] font-semibold underline hover:opacity-80"
                >
                  View full details ↗
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
