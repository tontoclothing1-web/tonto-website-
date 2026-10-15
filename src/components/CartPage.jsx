import React from 'react';
import { ArrowLeft, ArrowUpRight, Trash2, Plus, Minus, ShoppingBag, Send, ShieldCheck, Truck } from 'lucide-react';

export default function CartPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onNavigateCollection,
  onNavigateCheckout,
  onOpenProduct
}) {
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const orderSummaryText = `TONTO Clothing Order Enquiry\n\nItems in Bag (${totalQuantity} pieces):\n` +
    cartItems.map((item, idx) => 
      `${idx + 1}. ${item.title} (${item.colour}) - Size: ${item.size || 'Standard'} x ${item.quantity}`
    ).join('\n') +
    `\n\nOrigin: Coimbatore, Tamil Nadu, India\nPlease confirm price, delivery timeline, and payment instructions.`;

  const handleWhatsAppCheckout = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(orderSummaryText)}`, '_blank');
  };

  return (
    <div className="w-full bg-white text-[#111827] pb-32 lg:pb-24">
      
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
          <span className="text-[#003F25] font-semibold">shopping bag</span>
        </div>

        <button
          onClick={onNavigateCollection}
          className="hover:text-[#003F25] transition-colors text-[12px] underline cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
          Your Shopping Bag ({totalQuantity})
        </h1>
        <p className="text-[13px] text-[#79867D] mb-10">
          Curated pieces reserved from the TONTO archive in Coimbatore, Tamil Nadu.
        </p>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left 8 cols: Cart Table / Item list */}
            <div className="lg:col-span-8">
              <div className="border border-[#E0E5E1] divide-y divide-[#E0E5E1]">
                <div className="hidden sm:grid grid-cols-12 px-6 py-3 bg-[#F9FAF9] text-[11px] font-bold text-[#003F25] uppercase tracking-wider">
                  <div className="col-span-6">Piece</div>
                  <div className="col-span-3 text-center">Quantity</div>
                  <div className="col-span-3 text-right">Price / Value</div>
                </div>

                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    
                    {/* Item info */}
                    <div className="sm:col-span-6 flex gap-4 items-center">
                      <div
                        onClick={() => onOpenProduct && onOpenProduct({ id: item.id, title: item.title })}
                        className="w-20 h-26 bg-[#F5F5F5] overflow-hidden border border-[#E0E5E1] flex-shrink-0 cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold tracking-widest text-[#79867D] uppercase">TONTO ARCHIVE</span>
                        <h3
                          onClick={() => onOpenProduct && onOpenProduct({ id: item.id, title: item.title })}
                          className="text-[14px] font-bold text-[#003F25] uppercase hover:underline cursor-pointer"
                        >
                          {item.title}
                        </h3>
                        <p className="text-[12px] text-[#4B5563] capitalize">Colour: {item.colour}</p>
                        <p className="text-[12px] text-[#4B5563]">Size: <span className="font-semibold text-[#003F25]">{item.size || 'Standard'}</span></p>
                        
                        <button
                          onClick={() => onRemoveItem(item.id, item.size)}
                          className="mt-2 text-[11px] text-[#79867D] hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="sm:col-span-3 flex sm:justify-center items-center">
                      <div className="flex items-center border border-[#E0E5E1]">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.size, -1)}
                          className="p-2 hover:bg-gray-100 text-[#003F25] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-10 text-center text-[12px] font-bold text-[#003F25]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.size, 1)}
                          className="p-2 hover:bg-gray-100 text-[#003F25] transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Price / Quote info */}
                    <div className="sm:col-span-3 sm:text-right">
                      <span className="text-[13px] font-semibold text-[#003F25]">
                        {item.price || 'Price on enquiry'}
                      </span>
                      <p className="text-[11px] text-[#79867D]">Condition verified</p>
                    </div>

                  </div>
                ))}
              </div>

              {/* Actions row */}
              <div className="mt-4 flex justify-between items-center text-[12px]">
                <button
                  onClick={onClearCart}
                  className="text-[#79867D] hover:text-red-600 underline cursor-pointer"
                >
                  Empty Entire Bag
                </button>
                <button
                  onClick={onNavigateCollection}
                  className="text-[#003F25] font-semibold hover:underline cursor-pointer"
                >
                  ← Browse More Archive Pieces
                </button>
              </div>

              {/* Heritage Assurance Box */}
              <div className="mt-8 p-5 bg-[#F9FAF9] border border-[#E0E5E1] grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] text-[#4B5563]">
                <div className="flex gap-3">
                  <ShieldCheck size={20} className="text-[#003F25] flex-shrink-0" />
                  <div>
                    <strong className="block text-[#003F25] font-bold">100% Authentic Archive</strong>
                    Verified condition, genuine vintage character and accurate measurements.
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck size={20} className="text-[#003F25] flex-shrink-0" />
                  <div>
                    <strong className="block text-[#003F25] font-bold">Coimbatore Showroom Dispatch</strong>
                    Carefully packaged and tracked shipping across Tamil Nadu & India.
                  </div>
                </div>
              </div>

            </div>

            {/* Right 4 cols: Summary & Checkout */}
            <div className="lg:col-span-4">
              <div className="border border-[#E0E5E1] p-6 bg-white sticky top-24">
                <h2 className="text-[13px] font-extrabold tracking-wider text-[#003F25] uppercase pb-3 border-b border-[#E0E5E1] mb-4">
                  Bag Summary
                </h2>

                <div className="space-y-3 text-[13px] text-[#4B5563] pb-4 border-b border-[#E0E5E1]">
                  <div className="flex justify-between">
                    <span>Total Pieces</span>
                    <span className="font-bold text-[#003F25]">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pricing Mode</span>
                    <span className="font-medium text-[#003F25]">Confirmed on Order</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispatch Hub</span>
                    <span>Coimbatore, TN</span>
                  </div>
                </div>

                <div className="py-4">
                  <button
                    onClick={onNavigateCheckout}
                    className="w-full py-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 mb-3 shadow-sm"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowUpRight size={16} />
                  </button>

                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-3.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-[12px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    <span>WhatsApp Concierge Order</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#79867D] text-center">
                  All thrift and surplus items are single pieces or limited run. Reserving items through checkout locks the piece hold.
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-24 text-center max-w-md mx-auto">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
              Your Bag is Empty
            </h2>
            <p className="text-[13px] text-[#79867D] mb-8">
              Explore our collection of unisex thrift silhouettes, heavy washed denim, and vintage graphics.
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
