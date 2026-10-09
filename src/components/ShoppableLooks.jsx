import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, ChevronUp } from 'lucide-react';
import { SHOPPABLE_LOOKS, PRODUCTS } from '../data/products';

export default function ShoppableLooks({ onSelectProduct, onQuickView }) {
  const [activeIndex, setActiveIndex] = useState(2); // Center card active (look-3)

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : SHOPPABLE_LOOKS.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < SHOPPABLE_LOOKS.length - 1 ? prev + 1 : 0));
  };

  const handleLookClick = (look) => {
    const product = PRODUCTS.find(p => p.id === look.productId);
    if (product) {
      onQuickView(product);
    }
  };

  return (
    <section className="w-full bg-white py-12 sm:py-16 border-b border-[#E0E5E1]">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Carousel Grid - 5 Cards across desktop, Center Card is taller/more prominent */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6 pt-4">
          {SHOPPABLE_LOOKS.map((look, idx) => {
            const isCenter = idx === activeIndex || (idx === 2 && activeIndex === 2);
            return (
              <div
                key={look.id}
                onClick={() => {
                  setActiveIndex(idx);
                  handleLookClick(look);
                }}
                className={`flex-shrink-0 flex flex-col group cursor-pointer transition-all duration-300 ease-out ${
                  isCenter
                    ? 'w-[260px] sm:w-[290px] md:w-[320px] z-10 scale-100'
                    : 'w-[200px] sm:w-[230px] md:w-[260px] opacity-90 hover:opacity-100'
                }`}
              >
                {/* Look Card Image */}
                <div
                  className={`relative w-full overflow-hidden bg-[#EAEAEA] border border-[#E0E5E1] transition-all duration-300 ${
                    isCenter
                      ? 'aspect-[320/490] shadow-md ring-1 ring-[#003F25]/20'
                      : 'aspect-[260/420]'
                  }`}
                >
                  <img
                    src={look.image}
                    alt={look.title}
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Corner interactive hotspot button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLookClick(look);
                    }}
                    className={`absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#003F25] text-white flex items-center justify-center shadow transition-transform duration-200 hover:scale-115 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white`}
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
                  className="mt-3 p-2.5 bg-white border border-[#E0E5E1] rounded-sm flex items-center justify-between shadow-xs hover:border-[#003F25] transition-colors cursor-pointer text-left w-full focus:outline-none"
                  aria-label={`Open details for ${look.title}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={look.thumbnail}
                      alt={look.title}
                      className="w-10 h-10 object-cover rounded-xs border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex flex-col overflow-hidden text-left">
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
          
          <span className="text-[12px] font-semibold text-[#79867D] tracking-widest">
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
