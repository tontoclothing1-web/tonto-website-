import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { PRODUCTS } from '../data/products';

export default function SearchDialog({ isOpen, onClose, onQuickView, onOpenProduct, products = PRODUCTS }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const catalog = (products && products.length > 0) ? products : PRODUCTS;

  const results = query.trim()
    ? catalog.filter((p) => {
        const q = query.toLowerCase();
        const title = (p.title || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        const colour = (p.colour || '').toLowerCase();
        const fit = (p.fit || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        return (
          title.includes(q) ||
          category.includes(q) ||
          colour.includes(q) ||
          fit.includes(q) ||
          description.includes(q)
        );
      })
    : catalog.slice(0, 4); // Suggested initial items

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-xl bg-white border border-[#E0E5E1] shadow-2xl z-10 p-6 rounded-xs text-left animate-scale-up">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#003F25] pb-3">
          <Search size={20} className="text-[#003F25] mr-3" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search denim, tees, trousers, shirts..."
            className="w-full text-base sm:text-lg font-medium text-[#003F25] placeholder:text-gray-400 focus:outline-none bg-transparent"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-black">
              <X size={16} />
            </button>
          ) : (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-black">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="mt-6 max-h-[60vh] overflow-y-auto space-y-3">
          <p className="text-[11px] font-bold text-[#79867D] uppercase tracking-wider mb-2">
            {query.trim() ? `Search Results (${results.length})` : 'Popular Searches'}
          </p>

          {results.length > 0 ? (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onClose();
                  if (onOpenProduct) {
                    onOpenProduct(p);
                  } else {
                    onQuickView(p);
                  }
                }}
                className="flex items-center gap-3.5 p-2.5 hover:bg-gray-50 rounded-xs cursor-pointer group transition-colors"
              >
                <img
                  src={p.images?.[0]}
                  alt={p.title}
                  className="w-12 h-14 object-cover bg-gray-100 rounded-xs flex-shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-[13px] font-bold text-[#003F25] uppercase group-hover:underline truncate">
                    {p.title}
                  </h4>
                  <p className="text-[11px] text-[#79867D] capitalize">
                    {p.colour} • {p.fit}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#003F25]">
                    {p.price}
                  </span>
                  <ArrowUpRight size={14} className="text-[#79867D] group-hover:text-[#003F25] transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-[#79867D] text-[13px]">
              No pieces match "{query}". Try searching "denim", "oversized", or "shirt".
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
