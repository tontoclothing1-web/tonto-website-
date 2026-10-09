import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function HeroBanner({ onShopNow }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Settle animation on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-[#0A1A12] select-none" style={{ minHeight: '620px', height: 'calc(100vh - 76px)', maxHeight: '780px' }}>
      {/* Background Campaign Image with subtle settle scale */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src="/assets/hero-banner-clean.jpg"
          alt="TONTO Campaign - Unisex Streetwear Collection"
          className={`w-full h-full object-cover object-[center_12%] transition-opacity duration-700 ${
            mounted ? 'opacity-100' : 'opacity-90'
          }`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* Uniform full-width ambient depth gradient - seamless with zero vertical edges or color shifts */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content - Lower Left Composition perfectly synced with Header Logo */}
      <div className="relative max-w-[1600px] h-full mx-auto px-5 sm:px-8 flex flex-col justify-end pb-12 sm:pb-16 md:pb-20 z-10 pointer-events-none">
        <div className="max-w-xl sm:max-w-2xl pointer-events-auto">
          
          {/* Logo & Supporting Tagline */}
          <div className="overflow-hidden mb-3 flex items-center gap-2.5">
            <img
              src="/assets/logo.png"
              alt="TONTO Logo"
              className={`h-6 sm:h-7 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] transition-all duration-700 delay-100 ease-out ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            />
            <span className="text-white/50 text-[10px]">•</span>
            <span
              className={`text-[10.5px] sm:text-[11.5px] font-medium tracking-[0.22em] text-white/90 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-all duration-700 delay-100 ease-out font-['Futura_PT_Book',sans-serif] ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              THRIFT / IMPORTED / SURPLUS
            </span>
          </div>

          {/* Heading: MADE TO BE DIFFERENT */}
          <div className="overflow-hidden mb-5">
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold tracking-[-0.02em] leading-[0.96] text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] font-['Futura_PT_Book',sans-serif] transition-all duration-700 delay-200 ease-out ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              MADE TO BE<br />DIFFERENT
            </h1>
          </div>

          {/* Underlined "shop now" Link with subtle hover arrow translation */}
          <div className="overflow-hidden">
            <button
              onClick={onShopNow}
              className={`group inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium tracking-wide text-white cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-all duration-700 delay-300 ease-out font-['Futura_PT_Book',sans-serif] ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              <span className="relative pb-0.5 border-b border-white transition-colors group-hover:border-white/70 lowercase">
                shop now
              </span>
              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className="transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
