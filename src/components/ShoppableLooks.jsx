import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, ChevronUp } from 'lucide-react';
import { SHOPPABLE_LOOKS, PRODUCTS } from '../data/products';

export default function ShoppableLooks({ products = PRODUCTS, onSelectProduct, onQuickView, onOpenLook, customLooks }) {
  const rawLooks = customLooks && customLooks.length > 0 ? customLooks : SHOPPABLE_LOOKS;
  
  // Format looks with the store's own pricing text. A look the owner created
  // without a costume price is shown as "Price on enquiry" — inventing Rs. 6,500
  // for it would put a number on screen that no quote will ever honour.
  const asRupeeText = (value, fallback = '') => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    if (/price on enquiry/i.test(text)) return 'Price on enquiry';
    return text.startsWith('₹') || text.startsWith('Rs.')
      ? text.replace('₹', 'Rs. ')
      : `Rs. ${text}`;
  };

  const baseLooks = rawLooks.map((look, i) => {
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

  // 3 sets buffer for lightweight, smooth infinite scrolling
  const extendedLooks = [...baseLooks, ...baseLooks, ...baseLooks];
  const totalBase = baseLooks.length;

  // Start in the middle set
  const [activeIndex, setActiveIndex] = useState(totalBase + Math.min(2, Math.floor(totalBase / 2)));
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);

  // Viewport width tracker for dead-center 50vw positioning
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const trackRef = useRef(null);
  const videoRefs = useRef([]);
  const autoPlayTimerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const isAnimatingRef = useRef(false);

  // Card dimensions: exact mnml.la layout with taller and wider center card
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;

  const sideWidth = isMobile ? 220 : isTablet ? 270 : 310;
  const centerWidth = isMobile ? 270 : isTablet ? 330 : 380;
  const sideHeight = isMobile ? 320 : isTablet ? 390 : 440;
  const centerHeight = isMobile ? 390 : isTablet ? 470 : 530;
  const gap = isMobile ? 12 : isTablet ? 16 : 20;

  // Calculate translation so active center card sits dead center at 50vw
  const trackTranslateX = (viewportWidth / 2) - (activeIndex * (sideWidth + gap) + centerWidth / 2);

  // Infinite wrap reset handler (seamlessly resets position without any visual jump)
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;

    isAnimatingRef.current = false;

    // If drifted too far from the middle set, normalize synchronously with zero jump
    if (activeIndex >= totalBase * 2 || activeIndex < totalBase) {
      const normalized = (activeIndex % totalBase) + totalBase;
      const track = trackRef.current;
      if (track) {
        track.style.transition = 'none';
        const newX = (viewportWidth / 2) - (normalized * (sideWidth + gap) + centerWidth / 2);
        track.style.transform = `translate3d(${newX}px, 0, 0)`;
        void track.offsetHeight; // Force synchronous reflow
        setActiveIndex(normalized);
        requestAnimationFrame(() => {
          track.style.transition = '';
        });
      }
    }
  };

  const handlePrev = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setActiveIndex((prev) => prev - 1);
  }, []);

  const handleNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setActiveIndex((prev) => prev + 1);
  }, []);

  // Continuous auto-rotation every 4.5 seconds
  useEffect(() => {
    if (!isAutoPlayEnabled || isPaused || totalBase <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      if (!isAnimatingRef.current) {
        handleNext();
      }
    }, 4500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlayEnabled, isPaused, totalBase, handleNext]);

  const handleLookClick = (look) => {
    if (onOpenLook) {
      onOpenLook(look);
    } else {
      const catalog = products && products.length > 0 ? products : PRODUCTS;
      const product = catalog.find((p) => p.id === look.productId);
      if (product) {
        onQuickView(product);
      }
    }
  };

  const handleCardClick = (idx, look) => {
    if (idx !== activeIndex) {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      setIsTransitionEnabled(true);
      setActiveIndex(idx);
    } else {
      handleLookClick(look);
    }
  };

  // Video playback management: play centered video, pause uncentered
  useEffect(() => {
    const playTimer = setTimeout(() => {
      extendedLooks.forEach((look, i) => {
        const video = videoRefs.current[i];
        if (!video) return;

        const isVideo = Boolean(look.video) || look.mediaType === 'video' || 
          (typeof look.image === 'string' && (look.image.endsWith('.mp4') || look.image.endsWith('.webm') || look.image.startsWith('data:video/')));
        
        if (i === activeIndex && isVideo) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          video.pause();
        }
      });
    }, 150);

    return () => clearTimeout(playTimer);
  }, [activeIndex, extendedLooks]);

  // Sync mute state across all video elements
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Touch gesture support
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    if (delta > 45) {
      handlePrev();
    } else if (delta < -45) {
      handleNext();
    }
    setTimeout(() => setIsPaused(false), 2500);
  };

  // Normalized active index for indicator dots
  const normalizedActive = ((activeIndex % totalBase) + totalBase) % totalBase;

  return (
    <section 
      className="w-full bg-white py-10 sm:py-14 border-b border-[#E0E5E1] select-none overflow-hidden content-visibility-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-black hover:text-white text-gray-800 flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
            aria-label="Previous look"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-black hover:text-white text-gray-800 flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
            aria-label="Next look"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* FULL-BLEED mnml.la STYLE CAROUSEL STRIP (End-to-End Bleeding Off Screen) */}
      <div className="relative w-full overflow-visible py-2">
        <div
          ref={trackRef}
          onTransitionEnd={handleTransitionEnd}
          className={`flex items-end will-change-transform ${
            isTransitionEnabled ? 'transition-transform duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]' : ''
          }`}
          style={{
            transform: `translate3d(${trackTranslateX}px, 0, 0)`,
            gap: `${gap}px`
          }}
        >
          {extendedLooks.map((look, idx) => {
            const isCenter = idx === activeIndex;
            const isVideo = Boolean(look.video) || look.mediaType === 'video' || 
              (typeof look.image === 'string' && (look.image.endsWith('.mp4') || look.image.endsWith('.webm') || look.image.startsWith('data:video/')));
            const videoSrc = look.video || (isVideo ? look.image : null);
            const posterImg = (look.image && !look.image.endsWith('.mp4') && !look.image.endsWith('.webm') && !look.image.startsWith('data:video/')) 
              ? look.image 
              : (look.thumbnail || '/assets/editorial/editorial-seated-camo.jpg');
            const thumbImg = look.thumbnail || posterImg;
            const itemsCount = look.items ? look.items.length : 3;

            const currentWidth = isCenter ? centerWidth : sideWidth;
            const currentHeight = isCenter ? centerHeight : sideHeight;

            return (
              <div
                key={`${look.id || 'look'}-${idx}`}
                onClick={() => handleCardClick(idx, look)}
                style={{ width: `${currentWidth}px` }}
                className={`flex-shrink-0 flex flex-col cursor-pointer group transition-[width] duration-600 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isCenter ? 'opacity-100 z-20' : 'opacity-90 hover:opacity-100 z-10'
                }`}
              >
                {/* Upper Media Box - mnml.la taller center card with bottom-aligned baseline */}
                <div
                  style={{ height: `${currentHeight}px` }}
                  className={`relative w-full overflow-hidden bg-[#111111] border border-gray-200 transition-[height,box-shadow] duration-600 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[height] ${
                    isCenter ? 'shadow-lg ring-1 ring-black/10' : 'shadow-xs'
                  }`}
                >
                  {isVideo && videoSrc && isCenter ? (
                    <video
                      ref={(el) => (videoRefs.current[idx] = el)}
                      src={videoSrc}
                      poster={posterImg}
                      muted={isMuted}
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover object-center pointer-events-none select-none"
                    />
                  ) : (
                    <img
                      src={posterImg}
                      alt={look.title}
                      className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
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
                      setIsMuted(!isMuted);
                    }}
                    className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer shadow-md"
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

                {/* mnml.la Bottom Product Card Underneath Media */}
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

      {/* Bottom Center Indicator Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-7">
        {baseLooks.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (isAnimatingRef.current) return;
              isAnimatingRef.current = true;
              setIsTransitionEnabled(true);
              setActiveIndex(totalBase * 3 + i);
            }}
            className={`h-1.5 rounded-full transition-all duration-400 cursor-pointer ${
              i === normalizedActive ? 'w-6 bg-black' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Jump to look ${i + 1}`}
          />
        ))}
      </div>

    </section>
  );
}

