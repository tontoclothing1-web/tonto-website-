import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, ShoppingBag, Send, Check, ShieldCheck, Sparkles, Plus, Eye, ChevronRight } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function CompleteLookPage({
  look,
  products = [],
  onNavigateHome,
  onNavigateShopLooks,
  onAddToCart,
  onOpenBag,
  onNavigateCheckout,
  onQuickView
}) {
  if (!look) return null;

  // Track selection state and size preferences for each individual item in the costume
  const items = look.items || [];
  
  const [selectedItems, setSelectedItems] = useState(() => {
    const initial = {};
    items.forEach((it) => {
      initial[it.id] = true;
    });
    return initial;
  });

  const [selectedSizes, setSelectedSizes] = useState(() => {
    const initial = {};
    items.forEach((it) => {
      initial[it.id] = it.defaultSize || it.variants?.[0] || 'Standard';
    });
    return initial;
  });

  const [isAddedToBag, setIsAddedToBag] = useState(false);

  // Compute live total for selected items
  const activeItems = items.filter((it) => selectedItems[it.id]);
  const totalCostumePrice = activeItems.reduce((sum, it) => sum + (it.numericPrice || 0), 0);
  const formattedTotalPrice = totalCostumePrice > 0 ? `₹${totalCostumePrice.toLocaleString('en-IN')}` : look.costumePrice || 'Price on enquiry';

  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSelectSize = (itemId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [itemId]: size
    }));
  };

  // Add all selected costume pieces to cart in a single click
  const handleAddCostumeToBag = () => {
    if (activeItems.length === 0) return;

    activeItems.forEach((item) => {
      // Find matching catalog product if available for full metadata
      const matchedProduct = products.find((p) => p.id === item.productId || p.slug === item.productId);
      const chosenSize = selectedSizes[item.id] || item.defaultSize || 'Standard';
      const cartPayload = {
        id: matchedProduct?.id || item.productId,
        title: item.title,
        price: item.price,
        colour: item.colour,
        size: chosenSize,
        image: item.image || matchedProduct?.images?.[0],
        images: [item.image || matchedProduct?.images?.[0]],
        variants: item.variants || matchedProduct?.variants || [chosenSize],
        quantity: 1,
        lookId: look.id,
        lookTitle: look.title
      };
      if (onAddToCart) {
        onAddToCart(cartPayload, chosenSize, 1);
      }
    });

    setIsAddedToBag(true);
    setTimeout(() => {
      setIsAddedToBag(false);
      if (onOpenBag) onOpenBag();
    }, 700);
  };

  // Instant Checkout for the entire costume
  const handleInstantCheckout = () => {
    if (activeItems.length === 0) return;
    activeItems.forEach((item) => {
      const matchedProduct = products.find((p) => p.id === item.productId || p.slug === item.productId);
      const chosenSize = selectedSizes[item.id] || item.defaultSize || 'Standard';
      const cartPayload = {
        id: matchedProduct?.id || item.productId,
        title: item.title,
        price: item.price,
        colour: item.colour,
        size: chosenSize,
        image: item.image || matchedProduct?.images?.[0],
        images: [item.image || matchedProduct?.images?.[0]],
        variants: item.variants || matchedProduct?.variants || [chosenSize],
        quantity: 1,
        lookId: look.id,
        lookTitle: look.title
      };
      if (onAddToCart) {
        onAddToCart(cartPayload, chosenSize, 1);
      }
    });
    if (onNavigateCheckout) {
      onNavigateCheckout();
    }
  };

  // Pre-fill WhatsApp concierge order with all pieces, chosen sizes, and total price
  const handleWhatsAppCostumeOrder = () => {
    const itemsSummary = activeItems
      .map((it, idx) => `${idx + 1}. ${it.title} (${it.role}) - Size: ${selectedSizes[it.id] || it.defaultSize} [${it.price}]`)
      .join('\n');

    const message = `Hi TONTO, I would like to order the complete look:\n\n*${look.title}*\nTotal Costume Price: *${formattedTotalPrice}* (${activeItems.length} Pieces)\n\nItems & Sizes Selected:\n${itemsSummary}\n\nPlease verify availability, exact flat measurements, and payment link for dispatch from Coimbatore.`;

    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(BRAND_INFO.phoneRaw)}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full bg-[#FAFBF9] min-h-screen pb-24 text-left">
      
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-[#E0E5E1]">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between text-[12px] text-[#79867D]">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>home</span>
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={onNavigateShopLooks}
              className="hover:text-[#003F25] transition-colors cursor-pointer"
            >
              shop the look
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-[#003F25] font-bold uppercase truncate max-w-[200px] sm:max-w-none">
              {look.title}
            </span>
          </div>

          <button
            onClick={onNavigateShopLooks}
            className="text-[11px] font-bold uppercase tracking-wider text-[#003F25] hover:underline cursor-pointer hidden sm:inline-block"
          >
            ← View All Outfits
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-6 sm:pt-10">
        
        {/* Main 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT 6-COL: Editorial Look Photo & Video Media */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="relative aspect-[3/4.2] sm:aspect-[3/4] bg-[#111111] border border-[#E0E5E1] overflow-hidden rounded-xs shadow-lg group">
              {(() => {
                const isVideo = Boolean(look.video) || look.mediaType === 'video' || (typeof look.image === 'string' && (look.image.endsWith('.mp4') || look.image.endsWith('.webm') || look.image.startsWith('data:video/')));
                const videoSrc = look.video || (isVideo ? look.image : null);
                const posterImg = (look.image && !look.image.endsWith('.mp4') && !look.image.endsWith('.webm') && !look.image.startsWith('data:video/')) 
                  ? look.image 
                  : (look.thumbnail || '/assets/editorial/editorial-seated-camo.jpg');

                return isVideo && videoSrc ? (
                  <video
                    src={videoSrc}
                    poster={posterImg}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <img
                    src={posterImg}
                    alt={look.title}
                    className="w-full h-full object-cover object-center"
                  />
                );
              })()}

              {/* Editorial Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="px-3 py-1 bg-white/95 backdrop-blur-xs text-[#003F25] text-[10.5px] font-bold uppercase tracking-widest border border-gray-200 rounded-xs shadow-xs">
                  COMPLETE COSTUME • {items.length} PIECES
                </span>
                <span className="px-2.5 py-0.5 bg-black/75 text-white text-[10px] font-mono uppercase tracking-wider rounded-xs backdrop-blur-xs w-fit">
                  COIMBATORE EDITORIAL ARCHIVE
                </span>
              </div>

              {/* Interactive Tag Indicators on Look Visual */}
              <div className="absolute bottom-4 left-4 right-4 z-10 p-3 bg-black/70 backdrop-blur-md rounded-xs border border-white/15 text-white flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold uppercase tracking-wider">All Tagged Pieces Matched For Fit</span>
                </div>
                <span className="font-mono text-white/80">{items.length} Curated Items</span>
              </div>
            </div>

            {/* Included Garments Thumbnails Gallery */}
            <div className="p-4 bg-white border border-[#E0E5E1] rounded-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#79867D] block mb-2.5">
                Included Costume Pieces ({items.length})
              </span>
              <div className="grid grid-cols-3 gap-3">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className={`p-2 border rounded-xs flex items-center gap-2.5 transition-colors ${
                      selectedItems[it.id] ? 'border-[#003F25] bg-[#F9FAF9]' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <img
                      src={it.image}
                      alt={it.title}
                      className="w-10 h-12 object-cover rounded-xs border border-gray-200 flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <span className="block text-[10px] font-bold text-[#79867D] uppercase truncate">
                        {it.role}
                      </span>
                      <strong className="block text-[11px] text-[#003F25] font-semibold truncate">
                        {it.price}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 6-COL: Full Costume Breakdown & Single-Click Purchase Panel */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header info */}
            <div className="bg-white border border-[#E0E5E1] p-6 sm:p-8 rounded-xs space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#003F25] text-white text-[10.5px] font-bold uppercase tracking-widest rounded-xs">
                <Sparkles size={11} />
                <span>EXACT CURATED LOOK</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#003F25] font-['Futura_PT_Book',sans-serif]">
                {look.title}
              </h1>

              <p className="text-[13px] text-[#4B5563] leading-relaxed">
                {look.description || "A complete head-to-toe unisex streetwear outfit styled and balanced by TONTO. Engineered with coordinating drape, fabric weights, and wash treatments."}
              </p>

              {/* Total Costume Price Banner */}
              <div className="pt-4 border-t border-[#E0E5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAF9] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-7 rounded-b-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#79867D] block mb-1">
                    Whole Costume Total Price
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#003F25] font-mono tracking-tight">
                      {formattedTotalPrice}
                    </span>
                    <span className="text-[11.5px] font-semibold text-[#128C7E] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {activeItems.length} of {items.length} Pieces Selected
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-[11px] text-[#79867D] block">Fulfillment:</span>
                  <span className="text-[12px] font-bold text-[#003F25]">Coimbatore Express</span>
                </div>
              </div>
            </div>

            {/* Individual Garment Breakdown & Sizing Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#111111]">
                  Costume Pieces & Individual Prices
                </h3>
                <span className="text-[11.5px] text-[#79867D]">
                  Select size for each garment:
                </span>
              </div>

              {items.map((item, idx) => {
                const isChecked = selectedItems[item.id] !== false;
                const chosenSize = selectedSizes[item.id] || item.defaultSize;
                const matchedProduct = products.find((p) => p.id === item.productId || p.slug === item.productId);

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xs p-4 sm:p-5 transition-all ${
                      isChecked ? 'border-[#003F25] shadow-xs' : 'border-gray-200 opacity-60 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Left: Checkbox + Image + Title + Role */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <label className="mt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item.id)}
                            className="w-4 h-4 accent-[#003F25] rounded cursor-pointer"
                          />
                        </label>

                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xs border border-gray-200 flex-shrink-0"
                        />

                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-[#003F25] text-[10px] font-bold uppercase tracking-widest rounded-xs">
                            {item.role}
                          </span>
                          <h4 className="text-[13px] sm:text-[14px] font-bold uppercase text-[#111111] leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11.5px] text-[#79867D] capitalize">
                            Colour: {item.colour}
                          </p>

                          {/* Quick View Button for this single piece */}
                          {matchedProduct && onQuickView && (
                            <button
                              type="button"
                              onClick={() => onQuickView(matchedProduct)}
                              className="text-[11px] text-[#003F25] underline hover:text-[#002e1b] cursor-pointer inline-flex items-center gap-1 pt-1"
                            >
                              <Eye size={12} />
                              <span>Inspect this piece</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Individual Item Price */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] text-[#79867D] block">Individual Price</span>
                        <strong className="text-[15px] font-extrabold text-[#003F25] font-mono">
                          {item.price}
                        </strong>
                      </div>
                    </div>

                    {/* Sizing options row */}
                    {isChecked && item.variants && item.variants.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase text-[#79867D]">
                          Select Size:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.variants.map((variant) => {
                            const isSelected = chosenSize === variant;
                            return (
                              <button
                                key={variant}
                                type="button"
                                onClick={() => handleSelectSize(item.id, variant)}
                                className={`px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#003F25] text-white border-[#003F25]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                                }`}
                              >
                                {variant}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SINGLE-CLICK PRIMARY ACTION BUTTONS */}
            <div className="bg-white border border-[#E0E5E1] p-6 rounded-xs space-y-3 shadow-md">
              
              {/* Button 1: Single Button to buy/add entire costume */}
              <button
                type="button"
                onClick={handleAddCostumeToBag}
                disabled={activeItems.length === 0}
                className="w-full py-4.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13.5px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 rounded-xs shadow-md disabled:opacity-50"
              >
                {isAddedToBag ? (
                  <>
                    <Check size={18} strokeWidth={2.5} />
                    <span>ENTIRE LOOK ADDED TO BAG!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>ADD ENTIRE COSTUME TO BAG ({activeItems.length} PIECES • {formattedTotalPrice})</span>
                  </>
                )}
              </button>

              {/* Button 2: Order Complete Look on WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppCostumeOrder}
                disabled={activeItems.length === 0}
                className="w-full py-3.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-[12.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-xs"
              >
                <Send size={15} />
                <span>ORDER EXACT LOOK ON WHATSAPP ({formattedTotalPrice})</span>
              </button>

              {/* Button 3: Instant Checkout for the entire costume */}
              <button
                type="button"
                onClick={handleInstantCheckout}
                disabled={activeItems.length === 0}
                className="w-full py-3 border border-[#003F25] text-[#003F25] hover:bg-[#F9FAF9] text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-xs"
              >
                <span>Instant Checkout For This Look</span>
                <ArrowUpRight size={14} />
              </button>

              {/* Reassurance notes */}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#79867D]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#003F25] flex-shrink-0" />
                  <span>Free WhatsApp size verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-[#003F25] flex-shrink-0" />
                  <span>Coimbatore dispatch within 24h</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
