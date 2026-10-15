import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';

export default function TontoMadeProducts({
  products = [],
  savedIds = [],
  onToggleSave,
  onQuickView,
  onOpenProduct,
  onShopAll
}) {
  // Selected Flagship TONTO Made Pieces
  const tontoMadeIds = [
    'tonto-studios-waffle-black',
    'tonto-waffle-white-blue',
    'chain-print-denim',
    'extra-wide-denim',
    'black-denim-shirt'
  ];

  // Match products from current store state, falling back gracefully
  const curatedProducts = tontoMadeIds
    .map(id => products.find(p => p.id === id || p.slug === id))
    .filter(Boolean);

  // If catalog was updated or has extra products, ensure we display 5 top products
  const remaining = products.filter(p => !curatedProducts.some(cp => cp.id === p.id));
  const displayProducts = [...curatedProducts, ...remaining].slice(0, 5);

  return (
    <section id="tonto-made-products-section" className="w-full bg-white py-10 sm:py-14 border-t border-b border-[#E0E5E1]">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#003F25] mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#003F25]" />
              <span>TONTO MADE SIGNATURES</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
              TOP TONTO MADE PIECES
            </h2>
            <p className="text-[12.5px] sm:text-[13px] text-[#79867D] mt-1 max-w-xl leading-relaxed">
              Proprietary drop-shoulder cuts, heavyweight custom-milled waffle knits, and distinct garment washes developed in Coimbatore.
            </p>
          </div>

          <div>
            <button
              onClick={onShopAll}
              className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#003F25] hover:text-[#002e1b] transition-colors cursor-pointer"
            >
              <span className="border-b border-[#003F25] pb-[1px] group-hover:border-[#002e1b]">
                explore all pieces
              </span>
              <ArrowUpRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>

        {/* 5-Column Responsive Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSaved={savedIds.includes(product.id)}
              onToggleSave={onToggleSave}
              onQuickView={onQuickView}
              onOpenProduct={onOpenProduct}
              showBrandSubtitle={false}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
