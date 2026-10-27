import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, ChevronUp } from 'lucide-react';
import { SHOPPABLE_LOOKS, PRODUCTS } from '../data/products';
import { useCenteredCarousel } from '../hooks/useCenteredCarousel';

export default function ShoppableLooks({ products = PRODUCTS, onSelectProduct, onQuickView, onOpenLook, customLooks }) {
  const rawLooks = customLooks && customLooks.length > 0 ? customLooks : SHOPPABLE_LOOKS;
  
  // Format looks with authentic Rupee formatting
  const asRupeeText = (value, fallback = '') => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    if (/price on enquiry/i.test(text)) return 'Price on enquiry';
    const clean = text.replace(/^Rs\.?\s*/i, '₹').trim();
    return clean.startsWith('₹') ? clean : `₹${clean}`;
  };

  const baseLooks = useMemo(() => {
    return rawLooks.map((look, i) => {
      const defaultLook = SHOPPABLE_LOOKS.find((sl) => sl.id === look.id) || SHOPPABLE_LOOKS[i] || {};
      return {
        ...defaultLook,
        ...look,
        items: (look.items && look.items.length > 0) ? look.items : (defaultLook.items || []),
        costumePrice: asRupeeText(look.costumePrice || defaultLook.costumePrice, 'Price on enquiry'),
        originalPrice: asRupeeText(look.originalPrice || defaultLook.originalPrice),
        costumeNumericPrice: Number(look.costumeNumericPrice ?? defaultLook.costumeNumericPrice ?? 0) || 0,
      };
    });
  }, [rawLooks]);

  const totalBase = baseLooks.length;
  // 3-set buffer for seamless infinite rotation
  const extendedLooks = useMemo(() => [...baseLooks, ...baseLooks, ...baseLooks], [baseLooks]);
  const totalItems = extendedLooks.length;

  const initialIndex = totalBase + Math.min(2, Math.floor(totalBase / 2));

  // State
  const [isMuted, setIsMuted] = useState(true);
  const [isSectionVisible, setIsSectionVisible] = useState(true);
  const [isDocVisible, setIsDocVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const sectionRef = useRef(null);
  const videoRefs = useRef([]);
  const autoPlayTimerRef = useRef(null);

  const isPlayingHighlight = isVideoPlaying && isSectionVisible && isDocVisible;

  // Hook for native centered scroll snap & GPU scale interpolation
  const {
    containerRef,
    cardMediaRefs,
    cardWrapperRefs,
    activeIndex,
    isDragging,
    isScrolling,
    hasMoved,
    scrollToIndex,
    handleMouseDown,
    handleKeyDown,
    measurements
  } = useCenteredCarousel({
    totalItems,
    totalBase,
    initialIndex,
    isPaused: isHovered || !isSectionVisible || !isDocVisible,
    isCenterPlaying: isPlayingHighlight,
    activeHighlightScale: 1.08,
    sideScale: 0.82
  });

  const { cardWidth, gap, paddingLeft } = measurements;

  // Viewport IntersectionObserver to pause videos when out of view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Browser visibility listener to pause video when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsDocVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Video playback management: play centered video, pause all side videos
  useEffect(() => {
    const shouldPlay = isSectionVisible && isDocVisible;

    let activeIsPlaying = false;

    extendedLooks.forEach((look, i) => {
      const video = videoRefs.current[i];
      if (!video) return;

      const isVideo = Boolean(look.video) || look.mediaType === 'video' || 
        (typeof look.image === 'string' && (look.image.endsWith('.mp4') || look.image.endsWith('.webm') || look.image.startsWith('data:video/')));

      if (i === activeIndex && isVideo && shouldPlay) {
        video.muted = isMuted;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsVideoPlaying(true);
            })
            .catch(() => {
              setIsVideoPlaying(false);
            });
        }
        activeIsPlaying = true;
      } else {
        video.pause();
      }
    });

    // If the active card is an editorial image look, mark it as active showcase highlight when visible
    if (!activeIsPlaying && shouldPlay) {
      setIsVideoPlaying(true);
    } else if (!shouldPlay) {
      setIsVideoPlaying(false);
    }
  }, [activeIndex, isSectionVisible, isDocVisible, isMuted, extendedLooks]);

  // Sync mute state to all video elements
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Autoplay rotation every 4.8 seconds when not hovered or dragged
  useEffect(() => {
    if (isHovered || isDragging || !isSectionVisible || !isDocVisible || totalBase <= 1 || measurements.isReducedMotion) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      scrollToIndex(activeIndex + 1);
    }, 4800);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isHovered, isDragging, isSectionVisible, isDocVisible, totalBase, measurements.isReducedMotion, activeIndex, scrollToIndex]);

  // Handlers
  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  const handleLookClick = useCallback((look) => {
    if (onOpenLook) {
      onOpenLook(look);
    } else {
      const catalog = products && products.length > 0 ? products : PRODUCTS;
      const product = catalog.find((p) => p.id === look.productId);
      if (product) {
        onQuickView?.(product);
      }
    }
  }, [onOpenLook, onQuickView, products]);

  const handleCardClick = (idx, look) => {
    if (hasMoved) return; // Prevent navigation if the user was dragging
    if (idx !== activeIndex) {
      scrollToIndex(idx);
    } else {
      handleLookClick(look);
    }
  };

  // Normalized active index for dots (0 to totalBase - 1)
  const normalizedActive = ((activeIndex % totalBase) + totalBase) % totalBase;

  return (
    <section 
      ref={sectionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Shop The Look Video Carousel"
      className="w-full bg-white py-10 sm:py-14 border-b border-[#E0E5E1] select-none overflow-hidden content-visibility-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sleek Minimalist mnml.la Style Header */}
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 mb-6 sm:mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-[17px] sm:text-[20px] font-bold tracking-wider text-[#111111] uppercase font-['Futura_PT_Book',sans-serif]">
            SHOP THE LOOK
          </h2>
          <p className="text-[12px] sm:text-[13px] text-[#767676] mt-0.5">
            Curated streetwear ensembles — tap any look to shop the exact full costume.
          </p>
        </div>

        {/* Minimal Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-black hover:text-white text-gray-800 flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-[#003F25]"
            aria-label="Previous look"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-black hover:text-white text-gray-800 flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-[#003F25]"
            aria-label="Next look"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* FULL-BLEED NATIVE SCROLL-SNAP STRIP WITH MOMENTUM DRAG */}
      <div className="relative w-full overflow-hidden pt-8 pb-3">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className={`relative w-full overflow-x-auto flex items-end no-scrollbar select-none outline-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            scrollSnapType: isDragging ? 'none' : 'x mandatory',
            scrollBehavior: 'smooth',
            touchAction: 'pan-y',
            overscrollBehaviorX: 'contain',
            paddingLeft: `${paddingLeft}px`,
            paddingRight: `${paddingLeft}px`,
            gap: `${gap}px`
          }}
        >
          {extendedLooks.map((look, idx) => {
            const isCenter = idx === activeIndex;
            const isNearCenter = Math.abs(idx - activeIndex) <= 1;
            const normalizedIdx = ((idx % totalBase) + totalBase) % totalBase;

            const isVideo = Boolean(look.video) || look.mediaType === 'video' || 
              (typeof look.image === 'string' && (look.image.endsWith('.mp4') || look.image.endsWith('.webm') || look.image.startsWith('data:video/')));
            const videoSrc = look.video || (isVideo ? look.image : null);
            const posterImg = (look.image && !look.image.endsWith('.mp4') && !look.image.endsWith('.webm') && !look.image.startsWith('data:video/')) 
              ? look.image 
              : (look.thumbnail || '/assets/editorial/editorial-seated-camo.jpg');
            const thumbImg = look.thumbnail || posterImg;
            const itemsCount = look.items ? look.items.length : 3;

            return (
              <div
                key={`${look.id || 'look'}-${idx}`}
                ref={(el) => (cardWrapperRefs.current[idx] = el)}
                data-carousel-card="true"
                role="group"
                aria-roledescription="slide"
                aria-label={`Look ${normalizedIdx + 1} of ${totalBase}: ${look.title}`}
                onClick={() => handleCardClick(idx, look)}
                style={{
                  width: `${cardWidth}px`,
                  scrollSnapAlign: 'center',
                  flexShrink: 0
                }}
                className={`flex flex-col cursor-pointer group transition-[z-index] duration-300 ${
                  isCenter ? 'z-20' : 'z-10'
                }`}
              >
                {/* Upper Media Box - Bottom-anchored GPU scale interpolation */}
                <div
                  ref={(el) => (cardMediaRefs.current[idx] = el)}
                  data-card-media="true"
                  style={{
                    transformOrigin: 'bottom center',
                    willChange: isScrolling || isDragging ? 'transform, opacity' : 'auto'
                  }}
                  className={`relative w-full aspect-[380/530] overflow-hidden bg-[#111111] border transition-[box-shadow,border-color] duration-500 ${
                    isCenter && isPlayingHighlight
                      ? 'border-black/30 shadow-[0_22px_48px_rgba(0,0,0,0.28)] ring-2 ring-black/15'
                      : isCenter
                      ? 'border-black/20 shadow-lg ring-1 ring-black/10'
                      : 'border-gray-200 shadow-xs'
                  }`}
                >
                  {isVideo && videoSrc ? (
                    <video
                      ref={(el) => (videoRefs.current[idx] = el)}
                      src={videoSrc}
                      poster={posterImg}
                      muted={isMuted}
                      loop
                      playsInline
                      webkit-playsinline="true"
                      preload={isNearCenter ? 'auto' : 'metadata'}
                      onPlaying={() => {
                        if (idx === activeIndex) setIsVideoPlaying(true);
                      }}
                      onPause={() => {
                        if (idx === activeIndex) setIsVideoPlaying(false);
                      }}
                      className="w-full h-full object-cover object-center pointer-events-none select-none"
                    />
                  ) : (
                    <img
                      src={posterImg}
                      alt={look.title}
                      loading={isNearCenter ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                      className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  )}

                  {/* mnml.la Style Video Text Overlay */}
                  {look.tag && isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                      <span className="text-white text-base sm:text-lg font-black uppercase tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] text-center font-['Futura_PT_Book',sans-serif]">
                        {look.tag.includes('GRWM') ? look.tag : `GRWM FT. TONTO`}
                      </span>
                    </div>
                  )}

                  {/* Center Card Pagination Dots (Bottom-Left, mnml.la signature) */}
                  {isCenter && (
                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 pointer-events-none transition-opacity duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50 shadow-xs" />
                    </div>
                  )}

                  {/* Circular Audio Speaker Button (Bottom-Right, mnml.la signature) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted((prev) => !prev);
                    }}
                    className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-white"
                    title={isMuted ? "Unmute audio" : "Mute audio"}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>

                  {/* Interactive Buy Exact Look Center Overlay (Smooth hover reveal, zero jumping) */}
                  <div className="absolute inset-x-0 bottom-12 flex items-center justify-center px-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLookClick(look);
                      }}
                      className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-black hover:text-[#003F25] text-[10px] font-extrabold uppercase tracking-widest rounded-xs shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer border border-gray-200"
                    >
                      <Sparkles size={11} className="text-[#003F25]" />
                      <span>BUY EXACT LOOK ({itemsCount} PIECES)</span>
                    </button>
                  </div>
                </div>

                {/* mnml.la Bottom Product Card Underneath Media - NEVER SCALED OR BLURRED */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLookClick(look);
                  }}
                  className="mt-2 p-2.5 bg-white border border-gray-200 hover:border-gray-400 flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={thumbImg}
                      alt={look.title}
                      loading="lazy"
                      className="w-11 h-13 object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex flex-col overflow-hidden text-left font-['Futura_PT_Book',sans-serif]">
                      <span className="text-[12px] font-bold text-[#111111] uppercase tracking-tight truncate">
                        {look.shortTitle || look.title}
                      </span>
                      {look.fit && (
                        <span className="text-[10px] text-gray-500 truncate -mt-0.5">
                          {look.fit}
                        </span>
                      )}
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        {look.originalPrice && (
                          <span className="text-[10px] text-gray-400 line-through font-mono">
                            {look.originalPrice}
                          </span>
                        )}
                        <span className="text-[12px] font-bold text-[#111111] font-mono">
                          {look.costumePrice || look.price || 'Price on enquiry'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1 text-gray-600 hover:text-black flex-shrink-0">
                    <ChevronUp size={16} strokeWidth={2.5} />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Center Indicator Dots - Smoothly animates into pill shape */}
      <div className="flex items-center justify-center gap-1.5 mt-7">
        {baseLooks.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToIndex(totalBase + i)}
            className={`h-1.5 rounded-full transition-all duration-350 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#003F25] ${
              i === normalizedActive ? 'w-6 bg-black' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Jump to look ${i + 1} of ${totalBase}`}
          />
        ))}
      </div>

    </section>
  );
}
