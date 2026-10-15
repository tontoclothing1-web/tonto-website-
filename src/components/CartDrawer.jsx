import React, { useEffect, useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowUpRight, Send, Copy, Check, ShoppingBag } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenEnquiry,
  onShopAll,
  onNavigateCheckout,
  onNavigateCart
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Formatted Order Text for WhatsApp or Enquiry
  const orderSummaryText = `TONTO Clothing Order Enquiry\n\nItems in Bag (${totalQuantity} pieces):\n` +
    cartItems.map((item, idx) => 
      `${idx + 1}. ${item.title} (${item.colour}) - Size: ${item.size || 'Standard'} x ${item.quantity}`
    ).join('\n') +
    `\n\nOrigin: Coimbatore, Tamil Nadu, India\nPlease confirm price, delivery timeline, and payment instructions.`;

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(orderSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppCheckout = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(orderSummaryText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-[420px] sm:max-w-[460px] h-full bg-white shadow-2xl z-10 flex flex-col justify-between text-left animate-slide-left">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E0E5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#003F25]" strokeWidth={2.2} />
            <h2 className="text-[13px] sm:text-[14px] font-extrabold tracking-[0.08em] text-[#003F25] uppercase">
              YOUR BAG ({totalQuantity})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#003F25] hover:opacity-70 transition-opacity focus:outline-none cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="p-3 border border-[#E0E5E1] rounded-xs flex gap-3.5 items-start group relative hover:border-[#003F25]/40 transition-colors"
              >
                <img
                  src={item.image || item.images?.[0]}
                  alt={item.title}
                  className="w-16 h-22 object-cover bg-gray-50 flex-shrink-0 border border-gray-100"
                />

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[13px] font-bold text-[#003F25] uppercase truncate pr-2">
                      {item.title}
                    </h3>
                    <button
                      onClick={() => onRemoveItem(item.id, item.size)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                      title="Remove piece"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#79867D] capitalize mt-0.5">
                    {item.colour} {item.size && `• Size: ${item.size}`}
                  </p>

                  <p className="text-[12px] font-semibold text-[#003F25] mt-1">
                    {item.price || 'Price on enquiry'}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-[#E0E5E1] rounded-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.size, item.quantity - 1)}
                        className="px-2 py-1 text-gray-500 hover:text-black transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="px-2 text-[12px] font-bold text-[#003F25]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.size, item.quantity + 1)}
                        className="px-2 py-1 text-gray-500 hover:text-black transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#79867D] mb-3">
                <ShoppingBag size={22} strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-bold text-[#003F25] uppercase mb-1">
                Your bag is empty
              </p>
              <p className="text-[12px] text-[#79867D] max-w-xs mb-6">
                Explore our curated thrift, surplus, and washed denim pieces.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onShopAll();
                }}
                className="px-6 py-2.5 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          )}
        </div>

        {/* Bottom Checkout & Actions */}
        {cartItems.length > 0 && (
          <div className="p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-[#E0E5E1] bg-white space-y-3">
            <div className="flex justify-between items-center text-[13px] font-bold text-[#003F25] pb-2 border-b border-gray-100">
              <span>Total Pieces</span>
              <span>{totalQuantity} Items</span>
            </div>

            <p className="text-[11px] text-[#79867D]">
              Dispatched directly from Coimbatore showroom. Worldwide delivery.
            </p>

            <button
              onClick={() => {
                onClose();
                if (onNavigateCheckout) onNavigateCheckout();
              }}
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowUpRight size={15} />
            </button>

            <button
              onClick={handleWhatsAppCheckout}
              className="w-full py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-[12px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Send size={14} />
              <span>Checkout via WhatsApp Concierge</span>
            </button>

            <div className="flex justify-between items-center text-[12px] pt-1">
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateCart) onNavigateCart();
                }}
                className="text-[#003F25] font-semibold underline hover:opacity-80 cursor-pointer"
              >
                View Full Bag Page ↗
              </button>
              <button
                onClick={onClearCart}
                className="text-[#79867D] hover:text-red-600 hover:underline cursor-pointer"
              >
                Empty Bag
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  const firstImg = cartItems[0]?.image || cartItems[0]?.images?.[0] || '/assets/products/extra-wide-denim.jpg';
                  const combinedPiece = {
                    id: 'bag-order',
                    title: `Bag Order (${totalQuantity} items)`,
                    colour: cartItems.map(i => i.colour || 'Standard').join(', '),
                    fit: 'Multiple',
                    price: 'Order review',
                    images: [firstImg],
                    variants: ['Standard']
                  };
                  onOpenEnquiry?.(combinedPiece);
                }}
                className="py-2.5 border border-[#003F25] text-[#003F25] text-[11px] font-bold tracking-wider uppercase hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Order Enquiry</span>
                <ArrowUpRight size={13} />
              </button>

              <button
                onClick={handleCopyOrder}
                className="py-2.5 border border-gray-300 text-gray-700 text-[11px] font-bold tracking-wider uppercase hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>
            </div>

            <button
              onClick={onClearCart}
              className="w-full text-center text-[11px] text-[#79867D] hover:text-red-600 hover:underline pt-1 cursor-pointer"
            >
              Clear Bag
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
