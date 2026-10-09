import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function GraphicBanner({ onShopGraphic }) {
  return (
    <section className="relative w-full overflow-hidden bg-[#0A1A12] select-none" style={{ minHeight: '520px', height: '65vh', maxHeight: '746px' }}>
      {/* Background Campaign Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src="/assets/campaign-graphic-clean.jpg"
          alt="TONTO Graphic Edit - Oversized Streetwear T-Shirts"
          className="w-full h-full object-cover object-[center_15%] transition-transform duration-700 ease-out hover:scale-[1.01]"
          loading="lazy"
        />
        {/* Seamless full-width uniform ambient gradient without vertical boundaries */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Lower Left Content matching reference layout */}
      <div className="relative max-w-[1600px] h-full mx-auto px-6 sm:px-10 flex flex-col justify-end pb-12 sm:pb-16 md:pb-20 z-10">
        <div className="max-w-md">
          
          <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.25em] text-white/95 uppercase mb-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            OVERSIZED FITS. EVERYDAY STYLE.
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.05] text-white uppercase mb-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            THE GRAPHIC EDIT
          </h2>

          <div>
            <button
              onClick={onShopGraphic}
              className="group inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium tracking-wide text-white cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
            >
              <span className="pb-0.5 border-b border-white transition-colors group-hover:border-white/70">
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
