import React, { useState, useRef, memo } from 'react';
import { Bookmark, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

function ProductCard({
  product,
  isSaved,
  onToggleSave,
  onQuickView,
  onOpenProduct,
  showBrandSubtitle = false
}) {
  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ['/assets/products/extra-wide-denim.jpg']);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragStartX = useRef(0);
  const hasMovedRef = useRef(false);

  const hasAltImage = images.length > 1;

  const handleNextImage = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch Swipe Handlers (Mobile & Tablets)
  const handleTouchStart = (e) => {
    if (images.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    hasMovedRef.current = false;
    setDragOffset(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || images.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Detect horizontal swipe vs vertical scroll
    if (Math.abs(diffX) > 8 && Math.abs(diffX) > Math.abs(diffY)) {
      hasMovedRef.current = true;
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 35;
    if (dragOffset < -threshold) {
      handleNextImage();
    } else if (dragOffset > threshold) {
      handlePrevImage();
    }
    setDragOffset(0);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 80);
  };

  // Mouse Drag Handlers (Desktop Swiping)
  const handleMouseDown = (e) => {
    if (e.target.closest('[data-no-swipe]')) return;
    if (images.length <= 1) return;
    dragStartX.current = e.clientX;
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || images.length <= 1) return;
    const diffX = e.clientX - dragStartX.current;
    if (Math.abs(diffX) > 6) {
      hasMovedRef.current = true;
      setDragOffset(diffX);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 35;
    if (dragOffset < -threshold) {
      handleNextImage();
    } else if (dragOffset > threshold) {
      handlePrevImage();
    }
    setDragOffset(0);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 80);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 80);
    }
  };

  const handleCardClick = (e) => {
    if (hasMovedRef.current) return;
    if (
      e.target.closest('[data-no-swipe]') ||
      e.target.closest('button[data-save-btn]') ||
      e.target.closest('button[data-qv-btn]') ||
      e.target.closest('[data-swatch-btn]')
    ) {
      return;
    }
    if (onOpenProduct) {
      onOpenProduct(product);
    } else if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <div
      className="group relative flex flex-col cursor-pointer select-none text-left"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* Image Container with precise streetwear aspect ratio */}
      <div
        className="relative w-full aspect-[3/4.1] bg-[#F5F5F5] overflow-hidden select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* MNML Tag/Badge in Top-Left */}
        {(product.inStock === false || product.stock === 0) ? (
          <span className="absolute top-2 left-2 z-10 bg-black text-white text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold pointer-events-none shadow-xs">
            SOLD OUT
          </span>
        ) : (
          <span className="absolute top-2 left-2 z-10 bg-white/95 text-[#111111] border border-[#E0E5E1] text-[10.5px] px-2 py-0.5 lowercase tracking-normal font-normal font-['Futura_PT_Book',sans-serif] pointer-events-none shadow-xs">
            {product.badge || (product.isTrending ? 'back in stock' : (product.isNew ? 'new arrival' : 'sale'))}
          </span>
        )}

        {/* Sliding Carousel Track */}
        <div
          className="flex h-full w-full will-change-transform"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {images.map((img, i) => {
            const shouldLoad = i === 0 || i === currentIndex || isHovered || isDragging;
            return (
              <div key={i} className="min-w-full h-full relative shrink-0">
                {shouldLoad ? (
                  <img
                    src={img}
                    alt={`${product.alt || product.title} - view ${i + 1}`}
                    className="w-full h-full object-cover object-center pointer-events-none select-none"
                    // First view is the one the shopper actually sees (and the LCP
                    // candidate); the alternates wait until they are needed.
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-[#F5F5F5]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Swipe Left Arrow (Prev Image) */}
        {hasAltImage && (
          <button
            type="button"
            data-no-swipe="true"
            onClick={handlePrevImage}
            aria-label="Previous product image"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#111111] shadow-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>
        )}

        {/* Swipe Right Arrow (Next Image) */}
        {hasAltImage && (
          <button
            type="button"
            data-no-swipe="true"
            onClick={handleNextImage}
            aria-label="Next product image"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#111111] shadow-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          >
            <ChevronRight size={16} strokeWidth={2.2} />
          </button>
        )}

        {/* Dots Pagination Indicators */}
        {hasAltImage && (
          <div
            data-no-swipe="true"
            className="absolute bottom-2 group-hover:bottom-12 left-0 right-0 z-15 flex items-center justify-center gap-1.5 pointer-events-none transition-all duration-200"
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1 rounded-full transition-all duration-200 pointer-events-auto cursor-pointer ${
                  idx === currentIndex
                    ? 'w-4 bg-[#003F25]'
                    : 'w-1.5 bg-black/25 hover:bg-black/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Save / Bookmark Button on Top-Right */}
        <button
          data-save-btn="true"
          data-no-swipe="true"
          aria-label={isSaved ? `Remove ${product.title} from saved items` : `Save ${product.title} to wishlist`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(product);
          }}
          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-sm transition-all duration-150 ease-out focus:outline-none focus:ring-1 focus:ring-[#003F25] cursor-pointer ${
            isSaved
              ? 'bg-[#003F25] text-white opacity-100 shadow-sm'
              : 'text-[#003F25] bg-white/80 hover:bg-white opacity-85 hover:opacity-100'
          }`}
          aria-label={isSaved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
        >
          <Bookmark
            size={16}
            strokeWidth={1.8}
            className={`transition-transform duration-150 active:scale-75 ${
              isSaved ? 'fill-white stroke-white' : 'stroke-current'
            }`}
          />
        </button>

        {/* Quick View Bar - slides up into the image area */}
        <button
          type="button"
          data-qv-btn="true"
          data-no-swipe="true"
          aria-label={`Quick view ${product.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className={`absolute bottom-0 left-0 right-0 z-20 ${
            (product.inStock === false || product.stock === 0)
              ? 'bg-black/90 text-white hover:bg-black'
              : 'bg-[#003F25] text-white hover:bg-[#002e1b]'
          } py-2.5 px-4 flex items-center justify-between transition-transform duration-300 ease-out cursor-pointer ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <span className="text-[11.5px] font-semibold tracking-wider uppercase">
            {(product.inStock === false || product.stock === 0) ? 'SOLD OUT • DETAILS' : 'QUICK VIEW'}
          </span>
          <ArrowUpRight size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Swatches Thumbnail Row */}
      {hasAltImage && (
        <div className="flex items-center gap-1 mt-2 mb-1" data-no-swipe="true">
          {images.slice(0, 4).map((img, i) => {
            const isCurrent = i === currentIndex;
            return (
              <button
                key={i}
                type="button"
                data-swatch-btn="true"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`w-[21px] h-[25px] bg-[#F5F5F5] overflow-hidden border transition-all cursor-pointer ${
                  isCurrent ? 'border-black ring-[0.5px] ring-black' : 'border-[#E5E7EB] hover:border-gray-500'
                }`}
                title={`View variant ${i + 1}`}
              >
                <img src={img} alt="swatch" className="w-full h-full object-cover pointer-events-none" />
              </button>
            );
          })}
          {images.length > 4 && (
            <button
              type="button"
              data-swatch-btn="true"
              data-no-swipe="true"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="text-[11px] text-[#111111] hover:text-black underline decoration-[1px] cursor-pointer ml-1 font-normal font-['Futura_PT_Book',sans-serif]"
            >
              +{images.length - 4}
            </button>
          )}
        </div>
      )}

      {/* Product Metadata underneath card */}
      <div className={`${hasAltImage ? 'pt-1' : 'pt-2'} pb-1 flex flex-col font-['Futura_PT_Book',sans-serif]`}>
        {/* Title */}
        <h3 className="text-[12px] sm:text-[12.5px] font-normal tracking-[0.035em] text-[#000000] uppercase truncate group-hover:text-black transition-colors leading-[1.25]">
          {product.title}
        </h3>

        {/* Color / Variant Subtitle */}
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

export default memo(ProductCard);
