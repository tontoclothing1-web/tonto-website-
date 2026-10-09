import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function TrendingStyles({
  products,
  savedIds,
  onToggleSave,
  onQuickView,
  onOpenProduct,
  onShopAll
}) {
  const trendingProducts = products.filter(p => p.isTrending).slice(0, 5);

  return (
    <section id="trending-section" className="w-full bg-white py-8 sm:py-10 border-b border-[#E0E5E1]">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Section Header matching MNML typography */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-bold tracking-wider text-[#111111] uppercase">
            TRENDING STYLES
          </h2>

          <button
            onClick={onShopAll}
            className="group inline-flex items-center text-[13px] font-medium text-[#111111] hover:text-black transition-colors cursor-pointer"
          >
            <span className="border-b border-[#111111] pb-[1px] group-hover:border-black/60 text-[12.5px] font-medium lowercase">
              shop now
            </span>
          </button>
        </div>

        {/* 5-Product Row for Desktop, Responsive Grid / Scroll for smaller viewports */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {trendingProducts.map((product) => (
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
