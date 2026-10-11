import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowUpRight, Bookmark, Check, Ruler, ShoppingBag, ChevronDown, ChevronUp, Share2, ZoomIn, X, Plus, Minus } from 'lucide-react';
import ProductCard from './ProductCard';
import SizeGuideModal from './SizeGuideModal';

export default function ProductDetailPage({
  product,
  allProducts,
  onBack,
  onNavigateCategory,
  onQuickView,
  onOpenEnquiry,
  onAddToCart,
  isSaved,
  onToggleSave
}) {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product?.variants?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('measurements'); // 'desc' | 'measurements' | 'shipping'
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setSelectedImgIndex(0);
    setSelectedSize(product?.variants?.[0] || '');
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  if (!product) return null;

  const currentImage = product.images?.[selectedImgIndex] || product.images?.[0];
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.isTrending))
    .slice(0, 4);

  const toggleAccordion = (key) => {
    setActiveAccordion((prev) => (prev === key ? null : key));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `TONTO — ${product.title}`,
        text: `${product.title} in ${product.colour} at TONTO Clothing.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-full bg-white text-[#111827] pb-24">
      
      {/* Breadcrumb Navigation matching reference */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-4 text-[12px] text-[#79867D] flex items-center justify-between border-b border-[#E0E5E1]">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <button
            onClick={onBack}
            className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            <span>back</span>
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <button
            onClick={() => onNavigateCategory('All')}
            className="hover:text-[#003F25] transition-colors cursor-pointer"
          >
            collection
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <button
            onClick={() => onNavigateCategory(product.category)}
            className="hover:text-[#003F25] transition-colors cursor-pointer lowercase"
          >
            {product.category}
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-[#003F25] font-semibold truncate lowercase">
            {product.title}
          </span>
        </div>

        <button
          onClick={handleShare}
          className="text-[12px] text-[#79867D] hover:text-[#003F25] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Share2 size={13} />
          <span>{copiedShare ? 'link copied' : 'share'}</span>
        </button>
      </div>

      {/* Main Product Container */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* Left Column: Image Gallery (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 flex-shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`relative w-16 h-20 md:w-20 md:h-26 border overflow-hidden transition-all flex-shrink-0 cursor-pointer ${
                      selectedImgIndex === idx
                        ? 'border-[#003F25] ring-1 ring-[#003F25]'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 relative aspect-[3/4.1] bg-[#F7F7F7] overflow-hidden border border-[#E0E5E1] group">
              <img
                src={currentImage}
                alt={product.title}
                onClick={() => setIsZoomModalOpen(true)}
                className="w-full h-full object-cover object-center transition-all duration-300 cursor-zoom-in group-hover:scale-[1.02]"
              />

              {/* Bookmark Save Button */}
              <button
                onClick={() => onToggleSave(product)}
                className={`absolute top-4 right-4 z-20 p-2.5 rounded-sm transition-all duration-150 ${
                  isSaved
                    ? 'bg-[#003F25] text-white shadow-md'
                    : 'bg-white/85 text-[#003F25] hover:bg-white'
                }`}
                title={isSaved ? "Saved in Shortlist" : "Save Piece"}
              >
                <Bookmark size={18} className={isSaved ? 'fill-white stroke-white' : ''} />
              </button>

              {/* Zoom Button on top-left */}
              <button
                onClick={() => setIsZoomModalOpen(true)}
                className="absolute top-4 left-4 z-20 p-2 bg-white/85 hover:bg-white text-[#003F25] rounded-sm transition-all shadow-xs flex items-center gap-1 text-[11px] font-bold uppercase cursor-pointer"
                title="Zoom image"
              >
                <ZoomIn size={15} />
                <span className="hidden sm:inline">Zoom</span>
              </button>

              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#003F25] uppercase tracking-widest border border-gray-200">
                TONTO ARCHIVE
              </div>
            </div>

          </div>

          {/* Right Column: Verified Details & Actions (5 cols on desktop, sticky) */}
          <div className="lg:col-span-5 flex flex-col text-left lg:sticky lg:top-24 h-fit">
            
            {/* Brand Category Tag */}
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#79867D] uppercase mb-1.5">
              TONTO / UNISEX • {product.category}
            </p>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2 leading-tight">
              {product.title}
            </h1>

            {/* Price on enquiry */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-lg font-bold text-[#003F25]">
                {product.price}
              </span>
              <span className="text-[12px] text-[#79867D] border-l border-gray-300 pl-3">
                Inclusive of all taxes
              </span>
            </div>

            {/* Colour & Fit attributes */}
            <div className="space-y-2 py-3 border-t border-b border-[#E0E5E1] text-[13px] mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[#79867D]">Colour</span>
                <span className="font-semibold text-[#003F25] capitalize">{product.colour}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#79867D]">Fit Direction</span>
                <span className="font-semibold text-[#003F25]">{product.fit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#79867D]">Availability</span>
                <span className="font-medium text-[#003F25] flex items-center gap-1">
                  <Check size={14} strokeWidth={2.5} />
                  <span>{product.availability}</span>
                </span>
              </div>
            </div>

            {/* Size Variant Selector */}
            {product.variants && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider">
                    Select Size
                  </span>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[11px] text-[#79867D] hover:text-[#003F25] underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler size={13} />
                    <span>Size & Measurement Guide</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {product.variants.map((sz) => {
                    const isSel = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`py-3 text-[13px] font-bold border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-[#003F25] text-white border-[#003F25] shadow-xs'
                            : 'bg-white text-[#1F2937] border-gray-200 hover:border-[#003F25]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Primary Action Buttons */}
            <div className="space-y-3 mb-8">
              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center border border-[#E0E5E1]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-gray-100 text-[#003F25] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-10 text-center text-[13px] font-bold text-[#003F25]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 hover:bg-gray-100 text-[#003F25] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => onAddToCart(product, selectedSize, quantity)}
                className="w-full py-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003F25]"
              >
                <ShoppingBag size={17} strokeWidth={2} />
                <span>Add To Bag {quantity > 1 ? `(${quantity})` : ''} {selectedSize ? `• ${selectedSize}` : ''}</span>
              </button>

              <button
                onClick={() => onOpenEnquiry(product, selectedSize)}
                className="w-full py-3.5 border border-[#003F25] text-[#003F25] hover:bg-[#F9FAF9] text-[13px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Ask about this piece</span>
                <ArrowUpRight size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Accordion Information Sections */}
            <div className="divide-y divide-[#E0E5E1] border-t border-b border-[#E0E5E1] text-[13px]">
              
              {/* Measurements Accordion */}
              <div>
                <button
                  onClick={() => toggleAccordion('measurements')}
                  className="w-full py-3.5 flex items-center justify-between font-bold text-[#003F25] uppercase tracking-wider text-left cursor-pointer"
                >
                  <span>Exact Piece Measurements</span>
                  {activeAccordion === 'measurements' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {activeAccordion === 'measurements' && (
                  <div className="pb-4 text-[#4B5563] text-[12px] space-y-2">
                    <p className="font-mono bg-[#F9FAF9] p-3 border border-gray-100 rounded-xs">
                      {product.measurements || "Waist: Standard unisex proportion. For custom flat measurements, use the inquiry button above."}
                    </p>
                    <p className="text-[11px] text-[#79867D]">
                      Measured flat across garment in inches. Tolerance ± 0.5".
                    </p>
                  </div>
                )}
              </div>

              {/* Description & Fit */}
              <div>
                <button
                  onClick={() => toggleAccordion('desc')}
                  className="w-full py-3.5 flex items-center justify-between font-bold text-[#003F25] uppercase tracking-wider text-left cursor-pointer"
                >
                  <span>Design & Fabric Details</span>
                  {activeAccordion === 'desc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {activeAccordion === 'desc' && (
                  <div className="pb-4 text-[#4B5563] text-[12px] space-y-2 leading-relaxed">
                    <p>{product.description}</p>
                    <p className="text-[11px] text-[#79867D]">
                      Authentic thrift / imported surplus garment. Hand-inspected for silhouette weight and construction integrity.
                    </p>
                  </div>
                )}
              </div>

              {/* Studio & Worldwide Shipping */}
              <div>
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full py-3.5 flex items-center justify-between font-bold text-[#003F25] uppercase tracking-wider text-left cursor-pointer"
                >
                  <span>Coimbatore Studio & Shipping</span>
                  {activeAccordion === 'shipping' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {activeAccordion === 'shipping' && (
                  <div className="pb-4 text-[#4B5563] text-[12px] space-y-2 leading-relaxed">
                    <p>
                      <strong>Studio Showroom:</strong> Coimbatore, Tamil Nadu, India. In-person fitting appointments available by request.
                    </p>
                    <p>
                      <strong>Domestic & Global Shipping:</strong> Dispatched within 24–48 hours from Coimbatore studio. Express delivery available across India and international regions.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Related Products Recommendation Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#E0E5E1]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-extrabold tracking-[0.08em] text-[#003F25] uppercase">
                Complete The Fit / You May Also Like
              </h2>
              <button
                onClick={() => onNavigateCategory(product.category)}
                className="text-[12px] font-medium text-[#003F25] hover:underline"
              >
                view all {product.category}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isSaved={false}
                  onToggleSave={onToggleSave}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Measurement Guidance Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />

      {/* Image Zoom Lightbox Modal */}
      {isZoomModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity z-0"
            onClick={() => setIsZoomModalOpen(false)}
          />
          <div className="relative max-w-5xl max-h-[90vh] bg-white p-2 shadow-2xl z-10 flex flex-col items-center animate-scale-in">
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-[#003F25] text-white hover:bg-[#002e1b] rounded-full transition-colors cursor-pointer shadow-md"
              aria-label="Close zoom preview"
            >
              <X size={20} />
            </button>
            <div className="overflow-auto max-h-[85vh] w-full flex items-center justify-center">
              <img
                src={currentImage}
                alt={`${product.title} detailed zoom view`}
                className="max-h-[82vh] w-auto object-contain cursor-zoom-out"
                onClick={() => setIsZoomModalOpen(false)}
              />
            </div>
            <div className="w-full text-center py-2 text-[12px] font-semibold text-[#003F25] uppercase tracking-wider">
              {product.title} • {product.colour}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
