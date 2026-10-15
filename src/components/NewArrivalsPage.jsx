import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from './ProductCard';
import FilterDrawer from './FilterDrawer';
import { PRODUCTS } from '../data/products';
import { displayPrice } from '../data/priceFallbacks';

const SAMPLE_BADGE_MAP = {
  'tonto-studios-waffle-black': 'just dropped',
  'tonto-waffle-white-blue': 'new arrival',
  'distressed-chain-print-denim': 'limited drop',
  'couch-vintage-fade-flare': 'new drop',
  'epsten-selvedge-black-denim': 'exclusive',
  'sportswear-archive-sweatshirt-navy': 'just dropped',
  'sportswear-archive-sweatshirt-cream': 'limited',
  'pinstripe-crewneck-sweatshirt': 'new arrival',
  'leopard-print-button-shirt': 'just dropped',
  'hardwood-classic-basketball-jerseys': 'curated',
  'heavy-olive-army-utility-shirt': 'new arrival',
  'sun-faded-denim-workshirt': 'new drop',
  'slate-shadow-stripe-shirt': 'new arrival',
  'khaki-pinstripe-oxford-shirt': 'just dropped',
  'charcoal-wrangler-denim-shirt': 'exclusive',
  'y2k-heavy-hardware-statement-belts': 'accessory drop',
  'tonto-archive-brand-hangtags': 'archive pack',
  'extra-wide-denim': 'new arrival',
  'wide-leg-denim-black': 'just dropped',
  'relaxed-fit-trousers-cream': 'new drop',
  'oversized-graphic-tee-black': 'limited drop',
  'embroidered-shirt-burgundy': 'just dropped',
  'dusty-pink-long-sleeve': 'new arrival',
  'camo-layered-tee': 'new drop',
  'layered-graphic-tee-blue': 'just dropped'
};

export default function NewArrivalsPage({
  products = PRODUCTS,
  savedIds = [],
  onToggleSave,
  onQuickView,
  onOpenProduct,
  onNavigateHome,
  onNavigateCollection
}) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('newest'); // New arrivals defaults to newest!
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [gridCols, setGridCols] = useState(4); // 2 or 4

  // Store price + new-arrival ribbon for each piece
  const catalog = useMemo(() => {
    const source = (products && products.length > 0) ? products : PRODUCTS;
    return source.map((p) => ({
      ...p,
      price: displayPrice(p),
      badge: p.badge || SAMPLE_BADGE_MAP[p.id] || 'new arrival',
      isNew: true
    }));
  }, [products]);

  // Filter & Sort Logic for New Arrivals
  const filteredProducts = useMemo(() => {
    let result = [...catalog];

    // Category / capsule filter
    if (selectedCategory && selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      if (catLower === 'tonto made') {
        result = result.filter((p) => p.verifiedBrand?.includes('TONTO') || (p.title || '').includes('TONTO'));
      } else if (catLower === 'tees' || catLower === 'tees & knits' || catLower === 'tops') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'tees' || c === 'tops' || c === 'shirts';
        });
      } else if (catLower === 'denim') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'denim' || (p.id || '').includes('denim');
        });
      } else if (catLower === 'bottoms') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'bottoms' || c === 'denim' || c === 'sweatpants' || (p.id || '').includes('denim') || (p.id || '').includes('trousers');
        });
      } else if (catLower === 'outerwear') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'outerwear' || c === 'layers' || (p.id || '').includes('sweatshirt') || (p.id || '').includes('jacket');
        });
      } else if (catLower === 'accessories') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'accessories' || (p.id || '').includes('belt') || (p.id || '').includes('tag');
        });
      } else {
        result = result.filter((p) => (p.category || '').toLowerCase() === catLower);
      }
    }

    // Color filter
    if (selectedColor && selectedColor !== 'All') {
      result = result.filter((p) =>
        (p.colour || '').toLowerCase().includes(selectedColor.toLowerCase())
      );
    }

    // Size filter
    if (selectedSize && selectedSize !== 'All') {
      result = result.filter((p) => {
        if (!p.variants) return false;
        if (Array.isArray(p.variants)) {
          return p.variants.some((v) => (v || '').toLowerCase() === selectedSize.toLowerCase());
        }
        return String(p.variants).toLowerCase().includes(selectedSize.toLowerCase());
      });
    }

    // Availability filter
    if (selectedAvailability === 'coimbatore') {
      result = result.filter((p) =>
        (p.availability || '').toLowerCase().includes('coimbatore')
      );
    }

    // Sort logic
    if (selectedSort === 'newest') {
      result.sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
    } else if (selectedSort === 'alpha') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (selectedSort === 'price-asc') {
      result.sort((a, b) => {
        const numA = parseInt(String(a.price).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.price).replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
    } else if (selectedSort === 'price-desc') {
      result.sort((a, b) => {
        const numA = parseInt(String(a.price).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.price).replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
    } else if (selectedSort === 'featured') {
      result.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
    }

    return result;
  }, [catalog, selectedCategory, selectedSort, selectedColor, selectedSize, selectedAvailability]);

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedSort('newest');
    setSelectedColor('All');
    setSelectedSize('All');
    setSelectedAvailability('All');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedColor !== 'All' ||
    selectedSize !== 'All' ||
    selectedAvailability !== 'All';

  const categoryBoxes = [
    { label: 'all', filter: 'All' },
    { label: 'denim', filter: 'Denim' },
    { label: 'tees & knits', filter: 'Tees' },
    { label: 'outerwear', filter: 'Outerwear' },
    { label: 'bottoms', filter: 'Bottoms' },
    { label: 'accessories', filter: 'Accessories' },
    { label: 'tonto made', filter: 'Tonto Made' }
  ];

  return (
    <div className="w-full bg-white pb-20 text-[#111111] animate-fade-in text-left">
      {/* Breadcrumb Navigation - Simple & Clean */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-3 text-[12px] text-[#79867D] flex items-center gap-1.5">
        <button
          onClick={onNavigateHome}
          className="hover:text-[#003F25] transition-colors cursor-pointer"
        >
          home
        </button>
        <span className="text-[#D1D5DB]">/</span>
        <span className="text-[#003F25] font-medium">new arrivals</span>
        {selectedCategory !== 'All' && (
          <>
            <span className="text-[#D1D5DB]">/</span>
            <span className="text-[#003F25] font-medium capitalize">{selectedCategory}</span>
          </>
        )}
      </div>

      {/* Clean Centered Header: NEW ARRIVALS Title & Category Boxes (Exact Match to Shop Page) */}
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 pt-8 sm:pt-10 pb-4 text-center">
        <h1 className="text-2xl sm:text-[30px] font-bold tracking-[0.06em] text-black uppercase mb-4 font-['Futura_PT_Book',sans-serif]">
          NEW ARRIVALS
        </h1>

        {/* Minimal Category Filter Boxes */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto pb-4">
          {categoryBoxes.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.filter.toLowerCase();
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(isActive ? 'All' : cat.filter)}
                className={`px-3.5 py-1 text-[11.5px] sm:text-[12px] font-normal lowercase tracking-normal border transition-colors cursor-pointer ${
                  isActive
                    ? 'border-black bg-black text-white font-medium'
                    : 'border-[#D1D5DB] text-[#222222] bg-white hover:border-black'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Sort Bar matching Shop page */}
      <div className="sticky top-[76px] z-30 bg-white border-t border-b border-[#EAEAEA]">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          
          {/* Left: Filter & Sort Button */}
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center gap-2 text-[11.5px] sm:text-[12px] font-bold tracking-[0.08em] text-black uppercase hover:opacity-70 transition-opacity cursor-pointer focus:outline-none"
          >
            <SlidersHorizontal size={14} strokeWidth={2.2} />
            <span>FILTER AND SORT</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
            )}
          </button>

          {/* Right: Layout Toggle & Active Status Label */}
          <div className="flex items-center gap-4 text-[12px] text-[#767676]">
            {/* 2 / 4 Column Grid Toggle */}
            <div className="hidden sm:flex items-center gap-1 border border-[#E0E5E1] p-0.5 rounded-xs">
              <button
                onClick={() => setGridCols(2)}
                className={`px-2 py-0.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  gridCols === 2 ? 'bg-black text-white' : 'text-[#767676] hover:text-black'
                }`}
                title="2 Columns View"
              >
                2
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`px-2 py-0.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  gridCols === 4 ? 'bg-black text-white' : 'text-[#767676] hover:text-black'
                }`}
                title="4 Columns View"
              >
                4
              </button>
            </div>

            <span>
              {selectedCategory === 'All' ? 'All' : selectedCategory} / {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </span>
          </div>

        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-4 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-[#767676] text-[11px] uppercase tracking-wider font-semibold mr-1">Active:</span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#E0E5E1] text-black font-semibold text-[11px] rounded-xs transition-colors cursor-pointer"
            >
              <span>Category: {selectedCategory}</span>
              <X size={12} />
            </button>
          )}
          {selectedColor !== 'All' && (
            <button
              onClick={() => setSelectedColor('All')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#E0E5E1] text-black font-semibold text-[11px] rounded-xs transition-colors cursor-pointer"
            >
              <span className="capitalize">Colour: {selectedColor}</span>
              <X size={12} />
            </button>
          )}
          {selectedSize !== 'All' && (
            <button
              onClick={() => setSelectedSize('All')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#E0E5E1] text-black font-semibold text-[11px] rounded-xs transition-colors cursor-pointer"
            >
              <span>Size: {selectedSize}</span>
              <X size={12} />
            </button>
          )}
          {selectedAvailability !== 'All' && (
            <button
              onClick={() => setSelectedAvailability('All')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#E0E5E1] text-black font-semibold text-[11px] rounded-xs transition-colors cursor-pointer"
            >
              <span>In Stock (Coimbatore)</span>
              <X size={12} />
            </button>
          )}
          <button
            onClick={handleClearFilters}
            className="text-[11px] text-[#767676] hover:text-black underline ml-2 cursor-pointer font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Product Grid Area with Sample Products */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-6">
        {filteredProducts.length > 0 ? (
          <div
            className={`grid gap-x-4 md:gap-x-6 gap-y-10 sm:gap-y-12 ${
              gridCols === 2
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-[1100px] mx-auto'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSaved={savedIds.includes(product.id)}
                onToggleSave={onToggleSave}
                onQuickView={onQuickView}
                onOpenProduct={onOpenProduct}
                showBrandSubtitle={true}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <p className="text-[15px] font-bold text-[#003F25] mb-2 uppercase">
              No pieces match your selected filters
            </p>
            <p className="text-[13px] text-[#79867D] mb-6">
              Try adjusting your category, size, or colour filters to see available pieces.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Slide-out Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        selectedAvailability={selectedAvailability}
        onSelectAvailability={setSelectedAvailability}
        onClearFilters={handleClearFilters}
        resultCount={filteredProducts.length}
      />
    </div>
  );
}
