import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function LookbookBanner({ onExploreLookbook }) {
  return (
    <section id="lookbook-section" className="relative w-full overflow-hidden bg-[#0A1A12] select-none" style={{ minHeight: '520px', height: '65vh', maxHeight: '746px' }}>
      {/* Background Campaign Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src="/assets/hero-banner-clean.jpg"
          alt="TONTO Lookbook Edit"
          className="w-full h-full object-cover object-[center_12%] transition-transform duration-700 ease-out hover:scale-[1.01]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Centred Restrained Caption Placement matching reference */}
      <div className="relative max-w-[1600px] h-full mx-auto px-6 flex flex-col items-center justify-end pb-14 sm:pb-20 z-10 text-center">
        <div className="flex flex-col items-center">
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.06em] text-white uppercase mb-4 drop-shadow-sm">
            THE TONTO EDIT
          </h2>

          <div>
            <button
              onClick={onExploreLookbook}
              className="group inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium tracking-wide text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="pb-0.5 border-b border-white transition-colors group-hover:border-white/70">
                explore the lookbook
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
