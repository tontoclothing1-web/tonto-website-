import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function FilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
  selectedColor,
  onSelectColor,
  selectedSize = 'All',
  onSelectSize,
  selectedAvailability = 'All',
  onSelectAvailability,
  onClearFilters,
  resultCount
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { label: 'All Categories', value: 'All' },
    { label: 'New Arrivals', value: 'New Arrivals' },
    { label: 'Denim', value: 'Denim' },
    { label: 'Tops', value: 'Tops' },
    { label: 'Outerwear', value: 'Outerwear' },
    { label: 'Sweatpants', value: 'Sweatpants' },
    { label: 'Accessories', value: 'Accessories' }
  ];

  const sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Newest first', value: 'newest' },
    { label: 'Title: A to Z', value: 'alpha' }
  ];

  const colors = [
    { label: 'All Colours', value: 'All' },
    { label: 'Washed Blue', value: 'washed blue' },
    { label: 'Black', value: 'black' },
    { label: 'Cream', value: 'cream' },
    { label: 'Burgundy', value: 'burgundy' },
    { label: 'Dusty Pink', value: 'pink' },
    { label: 'Camo', value: 'camo' },
    { label: 'Royal Blue', value: 'blue' }
  ];

  const sizes = [
    'All', '28', '30', '32', '34', '36', 'M', 'L', 'XL'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop with dimming & subtle blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer from the Left */}
      <div className="relative w-full max-w-[360px] sm:max-w-[400px] h-full bg-white shadow-2xl z-10 flex flex-col justify-between animate-slide-right">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#E0E5E1] flex items-center justify-between">
          <h2 className="text-[14px] font-extrabold tracking-[0.08em] text-[#003F25] uppercase">
            FILTER AND SORT
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#003F25] hover:opacity-70 transition-opacity focus:outline-none"
            aria-label="Close filters"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Filter Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* CATEGORY */}
          <div>
            <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider mb-3">
              CATEGORY
            </h3>
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const checked = selectedCategory === cat.value;
                return (
                  <label
                    key={cat.value}
                    className="flex items-center gap-3 text-[13px] text-[#1F2937] hover:text-[#003F25] cursor-pointer"
                  >
                    <div
                      onClick={() => onSelectCategory(cat.value)}
                      className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                        checked
                          ? 'bg-[#003F25] border-[#003F25] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span onClick={() => onSelectCategory(cat.value)}>{cat.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SORT BY */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider mb-3">
              SORT BY
            </h3>
            <div className="space-y-2.5">
              {sortOptions.map((opt) => {
                const checked = selectedSort === opt.value;
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 text-[13px] text-[#1F2937] hover:text-[#003F25] cursor-pointer"
                  >
                    <div
                      onClick={() => onSelectSort(opt.value)}
                      className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                        checked
                          ? 'bg-[#003F25] border-[#003F25] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span onClick={() => onSelectSort(opt.value)}>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* COLOUR */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider mb-3">
              COLOUR
            </h3>
            <div className="space-y-2.5">
              {colors.map((c) => {
                const checked = selectedColor === c.value;
                return (
                  <label
                    key={c.value}
                    className="flex items-center gap-3 text-[13px] text-[#1F2937] hover:text-[#003F25] cursor-pointer"
                  >
                    <div
                      onClick={() => onSelectColor(c.value)}
                      className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                        checked
                          ? 'bg-[#003F25] border-[#003F25] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span onClick={() => onSelectColor(c.value)}>{c.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SIZE */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider">
                SIZE
              </h3>
              {selectedSize !== 'All' && (
                <button
                  onClick={() => onSelectSize('All')}
                  className="text-[11px] text-[#79867D] hover:text-[#003F25] underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((sz) => {
                const checked = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onSelectSize(sz)}
                    className={`py-2 text-[12px] font-bold border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#003F25] text-white border-[#003F25]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#003F25]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider mb-3">
              AVAILABILITY
            </h3>
            <label className="flex items-center gap-3 text-[13px] text-[#1F2937] hover:text-[#003F25] cursor-pointer">
              <div
                onClick={() => onSelectAvailability(selectedAvailability === 'coimbatore' ? 'All' : 'coimbatore')}
                className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                  selectedAvailability === 'coimbatore'
                    ? 'bg-[#003F25] border-[#003F25] text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedAvailability === 'coimbatore' && <Check size={12} strokeWidth={3} />}
              </div>
              <span onClick={() => onSelectAvailability(selectedAvailability === 'coimbatore' ? 'All' : 'coimbatore')}>
                In stock at Coimbatore studio
              </span>
            </label>
          </div>

        </div>

        {/* Bottom Actions matching preview */}
        <div className="p-6 border-t border-[#E0E5E1] bg-white flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#003F25] text-white text-[13px] font-bold tracking-wider uppercase hover:bg-[#002e1b] transition-colors cursor-pointer"
          >
            {selectedCategory === 'All' ? `Show all (${resultCount})` : `Show ${selectedCategory} (${resultCount})`}
          </button>

          <button
            onClick={onClearFilters}
            className="w-full py-2 text-[12px] text-[#79867D] hover:text-[#003F25] transition-colors cursor-pointer underline text-center"
          >
            Reset all filters
          </button>
        </div>

      </div>
    </div>
  );
}
