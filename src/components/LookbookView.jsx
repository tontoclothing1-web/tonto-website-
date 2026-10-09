import React from 'react';
import { ArrowLeft, ArrowUpRight, Plus, Eye } from 'lucide-react';
import { SHOPPABLE_LOOKS, PRODUCTS } from '../data/products';

export default function LookbookView({ onNavigateHome, onQuickView, onNavigateProduct }) {
  const handleShopLook = (look) => {
    const product = PRODUCTS.find((p) => p.id === look.productId);
    if (product) {
      onQuickView(product);
    }
  };

  return (
    <div className="w-full bg-white text-[#111827] pb-24">
      
      {/* Breadcrumb Navigation */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-4 text-[12px] text-[#79867D] flex items-center justify-between border-b border-[#E0E5E1]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateHome}
            className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            <span>home</span>
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-[#003F25] font-semibold">lookbook</span>
        </div>
      </div>

      {/* Editorial Lookbook Banner */}
      <div className="relative w-full h-[360px] sm:h-[460px] overflow-hidden bg-[#0A1A12] select-none">
        <img
          src="/assets/lookbook-banner-hd.jpg"
          alt="TONTO Lookbook Campaign"
          className="w-full h-full object-cover object-[center_35%]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/25 pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-[12px] font-bold tracking-[0.25em] text-white/90 uppercase mb-2">
            EDITORIAL VOL. 01
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mb-3 drop-shadow-sm">
            THE TONTO EDIT
          </h1>
          <p className="text-[13px] text-white/80 max-w-md">
            Washed denim silhouettes, oversized graphic cuts, and curated layering pieces. Coimbatore, Tamil Nadu.
          </p>
        </div>
      </div>

      {/* Editorial Gallery Grid */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-12 sm:pt-16">
        <div className="space-y-16 sm:space-y-24">
          {SHOPPABLE_LOOKS.map((look, idx) => {
            const product = PRODUCTS.find((p) => p.id === look.productId);
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={look.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Look Editorial Photo (7 cols) */}
                <div className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-gray-100 overflow-hidden border border-[#E0E5E1] group shadow-sm">
                    <img
                      src={look.image}
                      alt={look.title}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      loading="lazy"
                    />

                    {/* Look Tag Badge */}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-xs border border-gray-200 text-[11px] font-bold text-[#003F25] uppercase tracking-wider">
                      LOOK 0{idx + 1}
                    </div>

                    {/* Interactive Hotspot */}
                    <button
                      onClick={() => handleShopLook(look)}
                      className="absolute bottom-4 right-4 p-3 bg-[#003F25] text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      title="Quick View Piece"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Editorial Description & Shop Action (5 cols) */}
                <div className={`lg:col-span-5 text-left space-y-5 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div>
                    <span className="text-[11px] font-bold text-[#79867D] uppercase tracking-[0.2em] block mb-1">
                      LOOK STYLING • 0{idx + 1}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#003F25] uppercase tracking-tight">
                      {look.title}
                    </h2>
                  </div>

                  <p className="text-[13px] text-[#4B5563] leading-relaxed">
                    Captured on-location in Coimbatore. Styled with vintage wash treatment, relaxed drape, and unisex proportions for everyday streetwear comfort.
                  </p>

                  {/* Connected Product Card */}
                  {product && (
                    <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]}
                          alt={product.title}
                          className="w-14 h-18 object-cover rounded-xs border border-gray-200"
                        />
                        <div>
                          <h4 className="text-[13px] font-bold text-[#003F25] uppercase">
                            {product.title}
                          </h4>
                          <p className="text-[11px] text-[#79867D] capitalize">
                            {product.colour} • {product.fit}
                          </p>
                          <p className="text-[12px] font-medium text-[#003F25] mt-0.5">
                            {product.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleShopLook(look)}
                          className="px-3.5 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Quick View</span>
                        </button>
                        <button
                          onClick={() => onNavigateProduct(product)}
                          className="px-3.5 py-1.5 border border-[#003F25] text-[#003F25] hover:bg-gray-50 text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Details</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-[12px] text-[#79867D]">
                    Available for fitting at Coimbatore Studio Showroom.
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
