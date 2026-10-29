import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from './ProductCard';
import FilterDrawer from './FilterDrawer';
import { displayPrice } from '../data/priceFallbacks';

export default function CollectionView({
  products = [],
  initialCategory = 'All',
  savedIds = [],
  onToggleSave,
  onQuickView,
  onOpenProduct,
  onNavigateHome
}) {
  const getInitialFilters = () => {
    try {
      const hash = window.location.hash || '';
      const [, queryString] = hash.split('?');
      const params = new URLSearchParams(queryString || '');
      return {
        category: params.get('category') || initialCategory || 'All',
        color: params.get('color') || 'All',
        size: params.get('size') || 'All',
        sort: params.get('sort') || 'featured',
        availability: params.get('availability') || 'All'
      };
    } catch {
      return {
        category: initialCategory || 'All',
        color: 'All',
        size: 'All',
        sort: 'featured',
        availability: 'All'
      };
    }
  };

  const initialFilters = getInitialFilters();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedSort, setSelectedSort] = useState(initialFilters.sort);
  const [selectedColor, setSelectedColor] = useState(initialFilters.color);
  const [selectedSize, setSelectedSize] = useState(initialFilters.size);
  const [selectedAvailability, setSelectedAvailability] = useState(initialFilters.availability);
  const [gridCols, setGridCols] = useState(4); // 2 or 4

  // Show the store's price for each piece; unpriced pieces stay "on enquiry"
  const catalog = useMemo(() => {
    return (products || []).map((p) => ({
      ...p,
      price: displayPrice(p)
    }));
  }, [products]);

  // Keep state synced with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedColor && selectedColor !== 'All') params.set('color', selectedColor);
    if (selectedSize && selectedSize !== 'All') params.set('size', selectedSize);
    if (selectedSort && selectedSort !== 'featured') params.set('sort', selectedSort);
    if (selectedAvailability && selectedAvailability !== 'All') params.set('availability', selectedAvailability);

    const query = params.toString();
    const newHash = query ? `#/collection?${query}` : '#/collection';
    if (window.location.hash.startsWith('#/collection') && window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [selectedCategory, selectedColor, selectedSize, selectedSort, selectedAvailability]);

  // Filter & Sort Logic with verified real data
  const filteredProducts = useMemo(() => {
    let result = [...catalog];

    // Category filter matching MNML categories
    if (selectedCategory && selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      if (catLower === 'new arrivals') {
        result = result.filter((p) => p.isTrending || (p.id || '').includes('waffle') || (p.id || '').includes('denim') || (p.id || '').includes('shirt'));
      } else if (catLower === 'tops') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'tops' || c === 'tees' || c === 'shirts';
        });
      } else if (catLower === 'outerwear') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'outerwear' || c === 'layers' || (p.id || '').includes('sweatshirt') || (p.id || '').includes('jacket');
        });
      } else if (catLower === 'sweatpants' || catLower === 'bottoms') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'sweatpants' || c === 'bottoms' || (p.id || '').includes('trousers') || (p.id || '').includes('wide');
        });
      } else if (catLower === 'accessories') {
        result = result.filter((p) => {
          const c = (p.category || '').toLowerCase();
          return c === 'accessories' || (p.id || '').includes('belt') || (p.id || '').includes('tag');
        });
      } else {
        result = result.filter(
          (p) => (p.category || '').toLowerCase() === catLower
        );
      }
    }

    // Color filter
    if (selectedColor && selectedColor !== 'All') {
      result = result.filter(
        (p) => (p.colour || '').toLowerCase().includes(selectedColor.toLowerCase())
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

    // Sort
    if (selectedSort === 'newest') {
      result.sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
    } else if (selectedSort === 'alpha') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (selectedSort === 'price-low') {
      result.sort((a, b) => {
        const pa = Number(a.numericPrice) || parseInt(String(a.price || '').replace(/\D/g, ''), 10) || 0;
        const pb = Number(b.numericPrice) || parseInt(String(b.price || '').replace(/\D/g, ''), 10) || 0;
        return pa - pb;
      });
    } else if (selectedSort === 'price-high') {
      result.sort((a, b) => {
        const pa = Number(a.numericPrice) || parseInt(String(a.price || '').replace(/\D/g, ''), 10) || 0;
        const pb = Number(b.numericPrice) || parseInt(String(b.price || '').replace(/\D/g, ''), 10) || 0;
        return pb - pa;
      });
    }

    return result;
  }, [catalog, selectedCategory, selectedSort, selectedColor, selectedSize, selectedAvailability]);

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedSort('featured');
    setSelectedColor('All');
    setSelectedSize('All');
    setSelectedAvailability('All');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedColor !== 'All' ||
    selectedSize !== 'All' ||
    selectedAvailability !== 'All';

  return (
    <div className="w-full bg-white pb-20">
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-[1600px] mx-auto px-5 sm:px-8 py-3 text-[12px] text-[#79867D]">
        <ol className="flex items-center gap-1.5 list-none p-0 m-0" itemscope itemtype="https://schema.org/BreadcrumbList">
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" className="flex items-center gap-1.5">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#003F25] transition-colors cursor-pointer"
              itemprop="item"
            >
              <span itemprop="name">home</span>
            </button>
            <meta itemprop="position" content="1" />
            <span className="text-[#D1D5DB]">/</span>
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" className="flex items-center gap-1.5">
            <span className="text-[#003F25] font-medium" itemprop="name">the tonto collection</span>
            <meta itemprop="position" content="2" />
          </li>
          {selectedCategory !== 'All' && (
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" className="flex items-center gap-1.5">
              <span className="text-[#D1D5DB]">/</span>
              <span className="text-[#003F25] font-semibold capitalize" itemprop="name">{selectedCategory}</span>
              <meta itemprop="position" content="3" />
            </li>
          )}
        </ol>
      </nav>

      {/* Streetwear Shop Header with Descriptive H1 & Subtitle */}
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 pt-6 sm:pt-8 pb-4 text-center">
        <h1 className="text-2xl sm:text-[32px] font-extrabold tracking-[0.06em] text-black uppercase mb-2 font-['Futura_PT_Book',sans-serif]">
          {selectedCategory !== 'All' ? `${selectedCategory} Collection` : 'The TONTO Streetwear Collection'}
        </h1>
        <p className="text-[12.5px] sm:text-[13.5px] text-[#767676] max-w-xl mx-auto mb-4 font-normal leading-relaxed">
          Curated thrift drops, imported surplus garments, and heavy washed denim from Coimbatore, India.
        </p>

        {/* Exact Placement for Categories with Boxes matching mnml.la/collections/shop */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto pb-4">
          {[
            { label: 'denim', filter: 'Denim' },
            { label: 'bottoms', filter: 'Bottoms' },
            { label: 'shorts', filter: 'Shorts' },
            { label: 'tees', filter: 'Tees' },
            { label: 'tops', filter: 'Tops' },
            { label: 'outerwear', filter: 'Outerwear' },
            { label: 'loungewear', filter: 'Loungewear' },
            { label: 'accessories', filter: 'Accessories' }
          ].map((cat) => {
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

      {/* Filter and Sort Bar matching MNML */}
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

      {/* Product Grid Area */}
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
