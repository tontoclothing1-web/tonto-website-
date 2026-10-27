import React, { useState } from 'react';
import { User, Bookmark, Search, ShoppingBag, Menu, X, ArrowUpRight, Shield } from 'lucide-react';
import Logo from './Logo';
import { lockScroll, unlockScroll } from '../lib/scrollLock';

export default function Header({
  activeView,
  onNavigate,
  savedCount,
  bagCount = 0,
  onOpenSaved,
  onOpenSearch,
  onOpenVisit,
  onOpenAccount,
  onOpenBag,
  selectedRegion,
  onOpenRegion,
  onOpenOffer,
  onEnterTargetSection,
  storeSettings,
  onNavigateAdmin
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'FEATURED', view: 'featured' },
    { label: 'NEW ARRIVALS', view: 'new-arrivals' },
    { label: 'SHOP', view: 'collection', filter: 'All' },
    { label: 'TONTO MADE', view: 'lookbook' },
    { label: 'ABOUT US', view: 'about' },
    { label: 'VISIT US', action: 'visit' }
  ];

  const handleNavClick = (link) => {
    setMobileMenuOpen(false);
    if (link.action === 'visit') {
      onOpenVisit();
      return;
    }

    if (link.view === 'collection') {
      onNavigate('collection', link.filter);
    } else if (link.view === 'lookbook') {
      onNavigate('lookbook');
    } else if (link.view === 'featured') {
      onNavigate('featured');
    } else if (link.view === 'new-arrivals') {
      onNavigate('new-arrivals');
    } else if (link.view === 'about') {
      onNavigate('about');
    } else {
      onNavigate('home');
      if (link.targetId) {
        setTimeout(() => {
          const el = document.getElementById(link.targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
        if (link.targetId === 'trending-section' || link.targetId === 'tonto-own-make') {
          onEnterTargetSection?.(link.targetId);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E0E5E1] transition-colors duration-200">
      {/* Top Streetwear Announcement Bar */}
      <div className="bg-[#003F25] text-white py-1.5 px-4 pt-[max(0.375rem,env(safe-area-inset-top,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] text-center text-[10.5px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase">
        <div className="max-w-[1600px] mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <span>{storeSettings?.announcementText || '✦ EXCLUSIVE PRIVILEGE: 15% OFF FIRST ORDER'}</span>
          <span className="hidden sm:inline text-white/40">•</span>
          <button
            onClick={() => onOpenOffer?.('offer')}
            className="underline underline-offset-2 decoration-white/60 hover:decoration-white font-bold cursor-pointer transition-colors"
          >
            CLAIM CODE
          </button>
          <span className="text-white/40">|</span>
          <button
            onClick={() => onOpenAccount?.()}
            className="underline underline-offset-2 decoration-white/60 hover:decoration-white font-bold cursor-pointer transition-colors"
          >
            SIGN IN
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto h-[76px] px-5 sm:px-8 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] flex items-center justify-between">
        
        {/* Left: TONTO Logo */}
        <div className="flex items-center">
          <button 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003F25] rounded p-0.5"
            aria-label="TONTO Clothing Home"
          >
            <Logo variant="header" alt="TONTO Clothing" />
          </button>
        </div>

        {/* Center: Desktop Navigation matching MNML uppercase category typography */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[12.5px] font-bold tracking-[0.06em] text-[#111111]" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link)}
              className="relative py-2 hover:text-[#003F25] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003F25] rounded"
            >
              {link.label}
              {activeView === link.view && !link.targetId && (
                <span className="absolute bottom-1 left-0 w-full h-[1.5px] bg-[#111111] rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Utility Controls */}
        <div className="flex items-center gap-4 sm:gap-6 text-[#003F25]">
          {/* Region / Currency */}
          <button
            onClick={onOpenRegion}
            className="hidden sm:inline-block text-[11px] font-semibold tracking-wider border-b border-[#003F25] pb-[1px] hover:opacity-80 transition-opacity cursor-pointer"
            title={`Current store region: ${selectedRegion?.label || 'India'} (${selectedRegion?.currency || 'INR'})`}
          >
            {selectedRegion?.display || 'INDIA'}
          </button>

          {/* Account */}
          <button
            onClick={onOpenAccount}
            className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003F25] rounded"
            aria-label="Customer Account"
          >
            <User size={19} strokeWidth={1.75} />
          </button>

          {/* Saved Items */}
          <button
            onClick={onOpenSaved}
            className="relative p-2 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003F25] rounded"
            aria-label={`Saved Items (${savedCount})`}
          >
            <Bookmark size={19} strokeWidth={1.75} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#003F25] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                {savedCount}
              </span>
            )}
          </button>

          {/* Search */}
          <button
            onClick={onOpenSearch}
            className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003F25] rounded"
            aria-label="Search Catalog"
          >
            <Search size={19} strokeWidth={1.75} />
          </button>

          {/* Bag */}
          <button
            onClick={onOpenBag}
            className="relative p-2 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003F25] rounded"
            aria-label={`Shopping Bag (${bagCount})`}
          >
            <ShoppingBag size={19} strokeWidth={1.75} />
            {bagCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#003F25] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                {bagCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-70 transition-opacity focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E0E5E1] bg-white px-6 py-6 animate-fade-in">
          <nav className="flex flex-col gap-4 text-[13px] font-bold tracking-wider text-[#003F25]">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="text-left py-2 border-b border-gray-100 flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ArrowUpRight size={16} className="text-[#79867D]" />
              </button>
            ))}
            <div className="pt-2 flex items-center justify-between text-xs text-[#79867D]">
              <button onClick={() => { setMobileMenuOpen(false); onOpenRegion(); }} className="hover:text-[#003F25] font-semibold">
                REGION: {selectedRegion?.display || 'INDIA'} ({selectedRegion?.currency || 'INR'})
              </button>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOffer?.('offer');
              }}
              className="mt-3 w-full py-2.5 bg-[#003F25] text-white text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 rounded-xs"
            >
              <span>CLAIM 15% OFF FIRST ORDER</span>
              <ArrowUpRight size={14} />
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
