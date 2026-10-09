import React from 'react';
import { ArrowLeft, Bookmark, ShoppingBag, ArrowUpRight, Trash2 } from 'lucide-react';
import ProductCard from './ProductCard';
import { PRODUCTS } from '../data/products';

export default function SavedItemsPage({
  savedIds,
  onToggleSave,
  onRemoveSaved,
  onQuickView,
  onOpenProduct,
  onAddToCart,
  onOpenEnquiry,
  onNavigateHome,
  onNavigateCollection
}) {
  const savedProducts = PRODUCTS.filter((p) => savedIds.includes(p.id));

  const handleEnquireAll = () => {
    if (savedProducts.length === 0) return;
    const combinedPiece = {
      id: 'saved-shortlist',
      title: `Shortlist Enquiry (${savedProducts.length} pieces)`,
      colour: savedProducts.map(p => p.colour).join(', '),
      fit: 'Various',
      price: 'Price on enquiry',
      images: [savedProducts[0]?.images?.[0]]
    };
    onOpenEnquiry(combinedPiece);
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
          <span className="text-[#003F25] font-semibold">saved shortlist</span>
        </div>

        <button
          onClick={onNavigateCollection}
          className="hover:text-[#003F25] transition-colors text-[12px] underline cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-10">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E0E5E1] gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003F25] uppercase tracking-tight">
              Saved Pieces ({savedProducts.length})
            </h1>
            <p className="text-[13px] text-[#79867D] mt-1">
              Your personal archive shortlist saved across visits.
            </p>
          </div>

          {savedProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleEnquireAll}
                className="px-5 py-2.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Enquire About All {savedProducts.length} Pieces</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Saved Grid */}
        {savedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
            {savedProducts.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard
                  product={product}
                  isSaved={true}
                  onToggleSave={onToggleSave}
                  onQuickView={onQuickView}
                  onOpenProduct={onOpenProduct}
                  showBrandSubtitle={true}
                />
                
                {/* Secondary quick action bar */}
                <div className="pt-2 flex justify-between items-center text-[12px] border-t border-gray-100 mt-2">
                  <button
                    onClick={() => onAddToCart && onAddToCart(product, product.variants?.[0])}
                    className="text-[#003F25] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag size={13} />
                    <span>Add to Bag</span>
                  </button>
                  <button
                    onClick={() => onRemoveSaved(product.id)}
                    className="text-[#79867D] hover:text-red-600 transition-colors flex items-center gap-0.5 cursor-pointer text-[11px]"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center max-w-md mx-auto">
            <Bookmark size={44} className="mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
              Your Shortlist is Empty
            </h2>
            <p className="text-[13px] text-[#79867D] mb-8">
              Click the bookmark icon on any piece to save it to your wishlist for quick comparison or collective studio enquiry.
            </p>
            <button
              onClick={onNavigateCollection}
              className="px-8 py-3.5 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer"
            >
              Explore Collection
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
