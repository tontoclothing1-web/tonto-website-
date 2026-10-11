import React from 'react';
import { Home, LayoutGrid, Search, Bookmark, ShoppingBag } from 'lucide-react';

export default function MobileBottomNav({
  activeView,
  onNavigate,
  onOpenSearch,
  onOpenSaved,
  onOpenBag,
  savedCount = 0,
  bagCount = 0
}) {
  if (activeView === 'admin') return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E5E1] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-[58px] max-w-md mx-auto items-center px-1">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center h-full transition-all cursor-pointer ${
            activeView === 'home' ? 'text-[#003F25]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Home"
        >
          <Home size={20} strokeWidth={activeView === 'home' ? 2.3 : 1.8} />
          <span className={`text-[10px] tracking-wider uppercase mt-1 ${
            activeView === 'home' ? 'font-bold' : 'font-medium'
          }`}>
            HOME
          </span>
        </button>

        {/* 2. Shop / Collection */}
        <button
          type="button"
          onClick={() => onNavigate('collection', 'All')}
          className={`flex flex-col items-center justify-center h-full transition-all cursor-pointer ${
            activeView === 'collection' ? 'text-[#003F25]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Shop All"
        >
          <LayoutGrid size={20} strokeWidth={activeView === 'collection' ? 2.3 : 1.8} />
          <span className={`text-[10px] tracking-wider uppercase mt-1 ${
            activeView === 'collection' ? 'font-bold' : 'font-medium'
          }`}>
            SHOP
          </span>
        </button>

        {/* 3. Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center h-full text-gray-400 hover:text-[#003F25] transition-all cursor-pointer"
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium tracking-wider uppercase mt-1">
            SEARCH
          </span>
        </button>

        {/* 4. Saved Shortlist */}
        <button
          type="button"
          onClick={onOpenSaved}
          className="relative flex flex-col items-center justify-center h-full text-gray-400 hover:text-[#003F25] transition-all cursor-pointer"
          aria-label={`Saved Items (${savedCount})`}
        >
          <div className="relative">
            <Bookmark size={20} strokeWidth={1.8} />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#003F25] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                {savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wider uppercase mt-1">
            SAVED
          </span>
        </button>

        {/* 5. Bag */}
        <button
          type="button"
          onClick={onOpenBag}
          className="relative flex flex-col items-center justify-center h-full text-gray-400 hover:text-[#003F25] transition-all cursor-pointer"
          aria-label={`Bag (${bagCount})`}
        >
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={1.8} />
            {bagCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#003F25] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                {bagCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wider uppercase mt-1">
            BAG
          </span>
        </button>

      </div>
    </nav>
  );
}
