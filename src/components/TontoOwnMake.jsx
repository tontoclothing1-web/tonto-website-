import React, { useState } from 'react';
import { ArrowUpRight, Sparkles, Scissors, ShieldCheck, Check, Bell, Layers } from 'lucide-react';

export default function TontoOwnMake({ onOpenOffer }) {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setIsJoined(true);
  };

  return (
    <section id="tonto-own-make" className="w-full bg-[#0D1E16] text-white py-16 sm:py-20 border-b border-[#002e1b] relative overflow-hidden select-none">
      {/* Subtle background ambient texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,63,37,0.4),transparent_60%)] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/15">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xs text-[#F4EDE5] text-[11px] font-bold tracking-[0.2em] uppercase rounded-xs mb-3.5 border border-white/10">
              <Scissors size={13} className="text-[#A3E635]" />
              <span>IN-HOUSE ATELIER • COIMBATORE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-[-0.02em] leading-tight font-['Futura_PT_Book',sans-serif]">
              TONTO'S OWN MAKE
            </h2>

            <p className="text-[13.5px] sm:text-[14.5px] text-[#A5B4AB] mt-3 leading-relaxed font-normal">
              Beyond curation. Proprietary cuts, heavyweight custom-milled textiles, and distinct garment washes — patterned, tailored, and hand-finished in small batches under our own studio roof in Coimbatore.
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-start md:items-end">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#003F25] text-white text-[11.5px] font-bold tracking-widest uppercase rounded-xs border border-[#166534]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>DEBUT CAPSULE: IN DEVELOPMENT</span>
            </span>
            <span className="text-[11.5px] text-[#79867D] mt-2 font-mono uppercase tracking-wider">
              PRODUCTS RELEASING SOON
            </span>
          </div>
        </div>

        {/* 3 Visual Atelier Studio Cards (Previewing the Craft & Materiality) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 pb-12">
          {/* Card 1: Archival Labels & Tagging */}
          <div className="group relative bg-[#132A20] border border-white/10 overflow-hidden rounded-xs flex flex-col transition-all duration-300 hover:border-white/30">
            <div className="relative aspect-[4/3.2] overflow-hidden bg-black/40">
              <img
                src="/assets/branding/tonto-tags.jpg"
                alt="TONTO In-House Custom Woven Labels & Hardware"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#132A20] via-black/20 to-transparent opacity-80" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-xs">
                ARCHIVE TAGGING
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#A3E635] uppercase font-mono block mb-1">
                  01 / BESPOKE TRIMS
                </span>
                <h3 className="text-lg font-bold uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
                  CUSTOM HARDWARE & LABELS
                </h3>
                <p className="text-[12.5px] text-[#9CA3AF] mt-2 leading-relaxed">
                  Every garment carries custom woven jacquard labeling, tonal embroidery, and archival industrial details unique to the TONTO studio.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Cut & Sew Pattern Development */}
          <div className="group relative bg-[#132A20] border border-white/10 overflow-hidden rounded-xs flex flex-col transition-all duration-300 hover:border-white/30">
            <div className="relative aspect-[4/3.2] overflow-hidden bg-black/40">
              <img
                src="/assets/products/tonto-waffle-tees-hanging.jpg"
                alt="TONTO Proprietary Silhouette Patterning"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#132A20] via-black/20 to-transparent opacity-80" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-xs">
                PROPRIETARY DRAPE
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#A3E635] uppercase font-mono block mb-1">
                  02 / SILHOUETTE
                </span>
                <h3 className="text-lg font-bold uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
                  DROP-SHOULDER PROPORTIONS
                </h3>
                <p className="text-[12.5px] text-[#9CA3AF] mt-2 leading-relaxed">
                  Engineered unisex fits crafted with wide bodies, relaxed collars, and scalloped hems for effortless streetwear layering.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Custom Milled Fabrics & Pigment Washes */}
          <div className="group relative bg-[#132A20] border border-white/10 overflow-hidden rounded-xs flex flex-col transition-all duration-300 hover:border-white/30">
            <div className="relative aspect-[4/3.2] overflow-hidden bg-black/40">
              <img
                src="/assets/products/tonto-studios-waffle-black-concrete.jpg"
                alt="TONTO Heavyweight Fabrics and Studio Prototypes"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#132A20] via-black/20 to-transparent opacity-80" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-xs">
                CUSTOM MILLED
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#A3E635] uppercase font-mono block mb-1">
                  03 / RAW TEXTILES
                </span>
                <h3 className="text-lg font-bold uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
                  HEAVYWEIGHT KNITS & WASHES
                </h3>
                <p className="text-[12.5px] text-[#9CA3AF] mt-2 leading-relaxed">
                  High-density textured waffle knits, custom mineral dyes, and hand-distressed washed denim developed specifically for our climate.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Private Waitlist & Early Access Capsule Banner */}
        <div className="bg-[#10241A] border border-[#204E36] rounded-xs p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#003F25] text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xs mb-2">
              <Bell size={12} className="text-[#A3E635]" />
              <span>PRIVATE DROP ALERT</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
              BE FIRST FOR TONTO DROP 01
            </h3>
            <p className="text-[13px] text-[#9CA3AF] mt-2 leading-relaxed">
              Our inaugural in-house manufactured collection will release in strictly limited quantities. Join the private drop register to receive lookbook previews and exclusive first-hour checkout access.
            </p>
          </div>

          {/* Interactive Waitlist Form */}
          <div className="w-full lg:w-auto lg:min-w-[420px]">
            {isJoined ? (
              <div className="bg-[#003F25]/80 border border-[#22C55E]/40 p-4 rounded-xs text-left animate-fade-in flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center shrink-0">
                  <Check size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-white">
                    YOU'RE REGISTERED FOR DROP 01
                  </h4>
                  <p className="text-[11.5px] text-[#A5B4AB] mt-0.5">
                    We'll email you private early access 1 hour prior to general release.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for Drop 01 access"
                  className="flex-1 px-4 py-3 bg-white text-[#111111] placeholder-gray-500 text-[12.5px] outline-none focus:ring-2 focus:ring-[#A3E635] rounded-xs"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#A3E635] hover:bg-[#86EFAC] text-[#0A1A12] text-[12px] font-extrabold uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap rounded-xs flex items-center justify-center gap-2"
                >
                  <span>JOIN WAITLIST</span>
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </form>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#79867D]">
              <span>Limited studio batch • Made in Coimbatore</span>
              {onOpenOffer && (
                <button
                  type="button"
                  onClick={() => onOpenOffer('offer')}
                  className="text-white hover:underline cursor-pointer"
                >
                  Claim 15% First Order Privilege &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
