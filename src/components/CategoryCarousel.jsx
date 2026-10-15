import React, { useRef, useState, useEffect } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data/products';

export default function CategoryCarousel({ onSelectCategory, customCategories }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const displayCategories = customCategories && customCategories.length > 0 ? customCategories : CATEGORIES;

  const checkScrollBounds = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScrollBounds();
    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);
    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, []);

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector('div[data-card]')?.clientWidth || 380;
    const scrollDelta = direction === 'left' ? -cardWidth - 24 : cardWidth + 24;
    scrollRef.current.scrollBy({ left: scrollDelta, behavior: 'smooth' });
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section id="categories-section" className="w-full bg-white py-8 sm:py-12 border-b border-[#E0E5E1]">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Header with Title and Nav Arrows */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-bold tracking-wider text-[#111111] uppercase">
            FEATURED COLLECTIONS
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              className="p-2 rounded-full border border-[#E0E5E1] text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
              aria-label="Previous categories"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              className="p-2 rounded-full border border-[#E0E5E1] text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
              aria-label="Next categories"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Carousel Track matching mnml lifestyle-cards */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-2 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayCategories.map((cat) => (
            <div
              key={cat.id}
              data-card="true"
              onClick={() => !isDragging && onSelectCategory(cat.categoryFilter)}
              className="flex-shrink-0 w-[240px] sm:w-[270px] md:w-[300px] lg:w-[320px] flex flex-col group cursor-pointer"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Card Image container with 345/516 mnml aspect ratio & hover zoom */}
              <div className="relative w-full aspect-[345/516] bg-[#F1F3F4] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover object-center transition-transform duration-400 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />

                {/* Floating right arrow badge on hover matching mnml */}
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out shadow-md pointer-events-none">
                  <ChevronRight size={16} strokeWidth={2.4} />
                </div>
              </div>

              {/* Card Metadata matching mnml typography: subline -> uppercase title -> Shop now link */}
              <div className="pt-3.5 flex flex-col items-start">
                <span className="text-[12px] sm:text-[13px] text-[#767676] font-normal lowercase tracking-normal mb-1">
                  {cat.subtitle}
                </span>

                <h3 className="text-[14px] font-bold tracking-tight text-[#111111] uppercase leading-tight mb-2.5">
                  {cat.title}
                </h3>

                <span className="inline-flex items-center text-[12.5px] font-medium text-[#111111] group-hover:text-black transition-colors">
                  <span className="border-b border-[#111111] pb-[1px] group-hover:border-black/60">
                    shop now
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
