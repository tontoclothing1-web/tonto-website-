import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { SHOPPABLE_LOOKS, PRODUCTS } from '../data/products';

export default function ShoppableLooks({ onSelectProduct, onQuickView }) {
  const [activeIndex, setActiveIndex] = useState(2); // Center card active by default (look-3)
  const [isMuted, setIsMuted] = useState(true);

  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const videoRefs = useRef([]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : SHOPPABLE_LOOKS.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < SHOPPABLE_LOOKS.length - 1 ? prev + 1 : 0));
  };

  const handleLookClick = (look) => {
    const product = PRODUCTS.find((p) => p.id === look.productId);
    if (product) {
      onQuickView(product);
    }
  };

  const handleCardClick = (idx, look) => {
    if (idx !== activeIndex) {
      setActiveIndex(idx);
    } else {
      handleLookClick(look);
    }
  };

  // Keep the active card centered in the viewport
  useEffect(() => {
    const activeCard = cardRefs.current[activeIndex];
    const track = trackRef.current;
    if (activeCard && track) {
      const trackCenter = track.offsetWidth / 2;
      const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
      const scrollTarget = cardCenter - trackCenter;
      track.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [activeIndex]);

  // Video playback management: play ONLY when centered, pause when uncentered
  useEffect(() => {
    SHOPPABLE_LOOKS.forEach((look, i) => {
      const video = videoRefs.current[i];
      if (!video) return;

      if (i === activeIndex && look.video) {
        // Reset or play smoothly
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser autoplay policy fallback
          });
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex]);

  // Sync mute state across video elements
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  return (
    <section className="w-full bg-white py-12 sm:py-16 border-b border-[#E0E5E1]">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Carousel Grid - 5 Cards across desktop, Center Card is taller/more prominent */}
        <div
          ref={trackRef}
          className="flex items-end justify-start md:justify-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6 pt-4 scroll-smooth"
        >
          {SHOPPABLE_LOOKS.map((look, idx) => {
            const isCenter = idx === activeIndex;
            const hasVideo = Boolean(look.video);

            return (
              <div
                key={look.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                onClick={() => handleCardClick(idx, look)}
                className={`flex-shrink-0 flex flex-col group cursor-pointer transition-all duration-400 ease-out ${
                  isCenter
                    ? 'w-[260px] sm:w-[290px] md:w-[320px] z-10 scale-100'
                    : 'w-[200px] sm:w-[230px] md:w-[260px] opacity-85 hover:opacity-100'
                }`}
              >
                {/* Look Card Media (Video or Image) */}
                <div
                  className={`relative w-full overflow-hidden bg-[#111111] border border-[#E0E5E1] transition-all duration-400 ${
                    isCenter
                      ? 'aspect-[320/490] shadow-xl ring-1 ring-[#003F25]/20'
                      : 'aspect-[260/420]'
                  }`}
                >
                  {hasVideo ? (
                    <video
                      ref={(el) => (videoRefs.current[idx] = el)}
                      src={look.video}
                      poster={look.image}
                      muted={isMuted}
                      loop
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  ) : (
                    <img
                      src={look.image}
                      alt={look.title}
                      className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  )}

                  {/* Sound Toggle (Shown on active card when video is present) */}
                  {hasVideo && isCenter && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                      title={isMuted ? "Unmute audio" : "Mute audio"}
                      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}

                  {/* Corner interactive hotspot button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLookClick(look);
                    }}
                    className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-[#003F25] text-white flex items-center justify-center shadow transition-transform duration-200 hover:scale-115 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label={`View ${look.title} details`}
                    title={`View ${look.title}`}
                  >
                    <Plus size={16} strokeWidth={2.2} />
                  </button>
                </div>

                {/* Product Metadata directly underneath card matching reference */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLookClick(look);
                  }}
                  className={`mt-3 p-2.5 bg-white border rounded-sm flex items-center justify-between shadow-xs transition-colors cursor-pointer text-left w-full focus:outline-none ${
                    isCenter ? 'border-[#003F25]' : 'border-[#E0E5E1] hover:border-[#003F25]'
                  }`}
                  aria-label={`Open details for ${look.title}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={look.thumbnail}
                      alt={look.title}
                      className="w-10 h-10 object-cover rounded-xs border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex flex-col overflow-hidden text-left font-['Futura_PT_Book',sans-serif]">
                      <span className="text-[12px] font-bold text-[#003F25] truncate">
                        {look.title}
                      </span>
                      <span className="text-[11px] text-[#79867D]">
                        {look.price}
                      </span>
                    </div>
                  </div>

                  <ChevronUp size={16} className="text-[#003F25] flex-shrink-0 ml-1 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Previous / Next Controls beneath carousel matching reference */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <button
            onClick={handlePrev}
            className="group flex items-center gap-2 text-[#003F25] hover:opacity-75 transition-opacity cursor-pointer p-2"
            aria-label="Previous look"
          >
            <ArrowLeft size={18} strokeWidth={2} className="transition-transform group-hover:-translate-x-1" />
          </button>
          
          <span className="text-[12px] font-semibold text-[#79867D] tracking-widest font-['Futura_PT_Book',sans-serif]">
            0{activeIndex + 1} / 0{SHOPPABLE_LOOKS.length}
          </span>

          <button
            onClick={handleNext}
            className="group flex items-center gap-2 text-[#003F25] hover:opacity-75 transition-opacity cursor-pointer p-2"
            aria-label="Next look"
          >
            <ArrowRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </section>
  );
}
