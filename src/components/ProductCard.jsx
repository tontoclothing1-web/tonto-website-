import React, { useState } from 'react';
import { Bookmark, ArrowUpRight } from 'lucide-react';

export default function ProductCard({
  product,
  isSaved,
  onToggleSave,
  onQuickView,
  onOpenProduct,
  showBrandSubtitle = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const hasAltImage = product.images && product.images.length > 1;
  const primaryImg = selectedImage || product.images?.[0];
  const secondaryImg = !selectedImage && hasAltImage ? product.images[1] : primaryImg;

  const handleCardClick = (e) => {
    if (e.target.closest('button[data-save-btn]') || e.target.closest('button[data-qv-btn]') || e.target.closest('[data-swatch-btn]')) return;
    if (onOpenProduct) {
      onOpenProduct(product);
    } else {
      onQuickView(product);
    }
  };

  return (
    <div
      className="group relative flex flex-col cursor-pointer select-none text-left"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container with precise aspect ratio */}
      <div className="relative w-full aspect-[3/4.1] bg-[#F5F5F5] overflow-hidden">
        
        {/* MNML Tag/Badge in Top-Left matching media screenshot */}
        <span className="absolute top-2 left-2 z-10 bg-[#F4EDE5] text-[#222222] text-[10.5px] px-2 py-0.5 lowercase tracking-normal font-normal font-['Futura_PT_Book',sans-serif]">
          {product.isTrending ? 'back in stock' : 'sale'}
        </span>

        {/* Primary Image */}
        <img
          src={primaryImg}
          alt={product.alt || product.title}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out will-change-transform ${
            isHovered && hasAltImage && !selectedImage ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
        />

        {/* Secondary Crossfade Image on Hover */}
        {hasAltImage && !selectedImage && (
          <img
            src={secondaryImg}
            alt={`${product.title} alternative view`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out will-change-transform ${
              isHovered ? 'opacity-100 scale-[1.03]' : 'opacity-0 scale-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Save / Bookmark Button on Top-Right */}
        <button
          data-save-btn="true"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(product);
          }}
          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-sm transition-all duration-150 ease-out focus:outline-none focus:ring-1 focus:ring-[#003F25] ${
            isSaved
              ? 'bg-[#003F25] text-white opacity-100 shadow-sm'
              : 'text-[#003F25] bg-white/80 hover:bg-white opacity-85 hover:opacity-100'
          }`}
          aria-label={isSaved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
        >
          <Bookmark
            size={16}
            strokeWidth={1.8}
            className={`transition-transform duration-150 active:scale-75 ${isSaved ? 'fill-white stroke-white' : 'stroke-current'}`}
          />
        </button>

        {/* Quick View Bar - slides up into the image area */}
        <button
          type="button"
          data-qv-btn="true"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className={`absolute bottom-0 left-0 right-0 z-20 bg-[#003F25] text-white py-2.5 px-4 flex items-center justify-between transition-transform duration-300 ease-out cursor-pointer hover:bg-[#002e1b] ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <span className="text-[11.5px] font-semibold tracking-wider uppercase">
            QUICK VIEW
          </span>
          <ArrowUpRight size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Swatches Thumbnail Row matching MNML */}
      {hasAltImage && (
        <div className="flex items-center gap-1 mt-2 mb-1">
          {product.images.slice(0, 4).map((img, i) => {
            const isCurrent = (selectedImage === img) || (!selectedImage && i === 0);
            return (
              <button
                key={i}
                type="button"
                data-swatch-btn="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(img);
                }}
                className={`w-[21px] h-[25px] bg-[#F5F5F5] overflow-hidden border transition-all cursor-pointer ${
                  isCurrent ? 'border-black ring-[0.5px] ring-black' : 'border-[#E5E7EB] hover:border-gray-500'
                }`}
                title={`View variant ${i + 1}`}
              >
                <img src={img} alt="swatch" className="w-full h-full object-cover" />
              </button>
            );
          })}
          {product.images.length > 4 && (
            <button
              type="button"
              data-swatch-btn="true"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="text-[11px] text-[#111111] hover:text-black underline decoration-[1px] cursor-pointer ml-1 font-normal font-['Futura_PT_Book',sans-serif]"
            >
              +{product.images.length - 4}
            </button>
          )}
        </div>
      )}

      {/* Product Metadata underneath card matching MNML exact typography */}
      <div className={`${hasAltImage ? 'pt-1' : 'pt-2'} pb-1 flex flex-col font-['Futura_PT_Book',sans-serif]`}>
        {/* Title */}
        <h3 className="text-[12px] sm:text-[12.5px] font-normal tracking-[0.035em] text-[#000000] uppercase truncate group-hover:text-black transition-colors leading-[1.25]">
          {product.title}
        </h3>

        {/* Color / Variant Subtitle matching MNML (e.g. light blue, black) */}
        <p className="text-[11px] sm:text-[11.5px] text-[#767676] font-normal lowercase tracking-normal mt-[2px] leading-tight font-['Futura_PT_Book',sans-serif]">
          {product.colour || 'vintage black'}
        </p>

        {/* Price */}
        <p className="text-[11px] sm:text-[11.5px] font-normal text-[#000000] mt-[3px] tracking-[0.02em] leading-tight">
          {product.price}
        </p>
      </div>
    </div>
  );
}
