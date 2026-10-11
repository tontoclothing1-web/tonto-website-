import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import TrendingStyles from './components/TrendingStyles';
import GraphicBanner from './components/GraphicBanner';
import CategoryCarousel from './components/CategoryCarousel';
import TontoOwnMake from './components/TontoOwnMake';
import LookbookBanner from './components/LookbookBanner';
import ShoppableLooks from './components/ShoppableLooks';
import CollectionView from './components/CollectionView';
import ProductDetailPage from './components/ProductDetailPage';
import LookbookView from './components/LookbookView';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import AccountPage from './components/AccountPage';
import SavedItemsPage from './components/SavedItemsPage';
import VisitUsPage from './components/VisitUsPage';
import PolicyPage from './components/PolicyPage';
import NotFoundPage from './components/NotFoundPage';
import QuickViewModal from './components/QuickViewModal';
import EnquiryModal from './components/EnquiryModal';
import SavedItemsDrawer from './components/SavedItemsDrawer';
import SearchDialog from './components/SearchDialog';
import VisitUsModal from './components/VisitUsModal';
import AccountModal from './components/AccountModal';
import CartDrawer from './components/CartDrawer';
import RegionModal from './components/RegionModal';
import OfferModal from './components/OfferModal';
import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';
import { PRODUCTS, BRAND_INFO } from './data/products';
import { MessageSquare, X, ArrowUpRight, PhoneCall, Calendar } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('home'); 
  // 'home' | 'collection' | 'product' | 'cart' | 'checkout' | 'account' | 'saved' | 'lookbook' | 'visit' | 'policy' | 'admin' | '404'
  const [collectionCategory, setCollectionCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [policyTab, setPolicyTab] = useState('shipping');

  // Dynamic Catalog State persisted with localStorage
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_products');
      return saved ? JSON.parse(saved) : PRODUCTS;
    } catch {
      return PRODUCTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonto_admin_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);
  
  // Selected Region / Currency
  const [selectedRegion, setSelectedRegion] = useState({
    code: 'IN',
    label: 'India',
    currency: 'INR (₹)',
    display: 'INDIA'
  });
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  // Saved items with localStorage persistence
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_saved_items');
      return saved ? JSON.parse(saved) : ['extra-wide-denim'];
    } catch {
      return ['extra-wide-denim'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonto_saved_items', JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedIds]);

  // Shopping Bag / Cart state with localStorage persistence
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_bag_items');
      return saved ? JSON.parse(saved) : [
        {
          id: 'extra-wide-denim',
          title: 'EXTRA WIDE DENIM',
          colour: 'washed blue',
          size: '32',
          price: 'Price on enquiry',
          image: '/assets/products/extra-wide-denim.jpg',
          quantity: 1
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonto_bag_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Modal & Drawer states
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [enquiryInitialSize, setEnquiryInitialSize] = useState('');
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerModalMode, setOfferModalMode] = useState('offer'); // 'offer' | 'signin'

  // Auto-pop offer & sign in modal every time the user opens/visits the main page
  useEffect(() => {
    if (activeView === 'home') {
      const timer = setTimeout(() => {
        setOfferModalMode('offer');
        setIsOfferModalOpen(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [activeView]);

  // URL Hash Routing Listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      const [path, queryString] = hash.split('?');
      const searchParams = new URLSearchParams(queryString || '');

      if (path === '' || path === '#' || path === '#/') {
        setActiveView('home');
      } else if (path === '#/collection') {
        setActiveView('collection');
        const cat = searchParams.get('category') || 'All';
        setCollectionCategory(cat);
      } else if (path.startsWith('#/product/')) {
        const id = path.replace('#/product/', '');
        const found = products.find((p) => p.id === id || p.slug === id);
        if (found) {
          setSelectedProduct(found);
          setActiveView('product');
        } else {
          setActiveView('404');
        }
      } else if (path === '#/cart') {
        setActiveView('cart');
      } else if (path === '#/checkout') {
        setActiveView('checkout');
      } else if (path === '#/account') {
        setActiveView('account');
      } else if (path === '#/saved') {
        setActiveView('saved');
      } else if (path === '#/lookbook') {
        setActiveView('lookbook');
      } else if (path === '#/visit') {
        setActiveView('visit');
      } else if (path === '#/admin') {
        setActiveView('admin');
      } else if (path.startsWith('#/policy')) {
        setActiveView('policy');
        const parts = path.split('/');
        setPolicyTab(parts[2] || 'shipping');
      } else {
        setActiveView('404');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [products]);

  // View Navigation Helper
  const handleNavigate = (view, param = '') => {
    if (view === 'home') {
      window.location.hash = '#/';
    } else if (view === 'collection') {
      window.location.hash = param && param !== 'All' ? `#/collection?category=${encodeURIComponent(param)}` : '#/collection';
    } else if (view === 'product') {
      const id = typeof param === 'string' ? param : param?.id;
      window.location.hash = `#/product/${id}`;
    } else if (view === 'cart') {
      window.location.hash = '#/cart';
    } else if (view === 'checkout') {
      window.location.hash = '#/checkout';
    } else if (view === 'account') {
      window.location.hash = '#/account';
    } else if (view === 'saved') {
      window.location.hash = '#/saved';
    } else if (view === 'lookbook') {
      window.location.hash = '#/lookbook';
    } else if (view === 'visit') {
      window.location.hash = '#/visit';
    } else if (view === 'admin') {
      window.location.hash = '#/admin';
    } else if (view === 'policy') {
      window.location.hash = `#/policy/${param || 'shipping'}`;
    } else {
      window.location.hash = '#/';
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    handleNavigate('product', product.id);
  };

  // Toggle Save Item
  const handleToggleSave = (product) => {
    setSavedIds((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handleRemoveSaved = (id) => {
    setSavedIds((prev) => prev.filter((item) => item !== id));
  };

  // Cart Handlers
  const handleAddToCart = (product, size, qty = 1) => {
    const itemSize = size || (product.variants?.[0] || 'Standard');
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.id === product.id && item.size === itemSize
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + qty
        };
        return next;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            title: product.title,
            colour: product.colour,
            size: itemSize,
            price: product.price,
            image: product.images?.[0],
            quantity: qty
          }
        ];
      }
    });
    setIsBagOpen(true);
  };

  const handleUpdateCartQuantity = (id, size, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveCartItem = (id, size) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.size === size))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenEnquiry = (product, size = '') => {
    setEnquiryProduct(product);
    setEnquiryInitialSize(size);
  };

  const totalBagCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col font-sans selection:bg-[#003F25] selection:text-white relative">
      
      {/* Slim White Sticky Header (76px) - only for storefront */}
      {activeView !== 'admin' && (
        <Header
          activeView={activeView}
          onNavigate={handleNavigate}
          savedCount={savedIds.length}
          bagCount={totalBagCount}
          onOpenSaved={() => setIsSavedDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenVisit={() => setIsVisitOpen(true)}
          onOpenAccount={() => {
            setOfferModalMode('signin');
            setIsOfferModalOpen(true);
          }}
          onOpenOffer={(mode) => {
            setOfferModalMode(mode || 'offer');
            setIsOfferModalOpen(true);
          }}
          onOpenBag={() => setIsBagOpen(true)}
          selectedRegion={selectedRegion}
          onOpenRegion={() => setIsRegionOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main key={activeView} className="flex-1 animate-fade-in">
        {/* 1. HOMEPAGE VIEW */}
        {activeView === 'home' && (
          <>
            {/* Section 2: Full-width campaign hero */}
            <HeroBanner onShopNow={() => handleNavigate('collection', 'All')} />

            {/* Section 3: Trending Styles (5 products desktop row) */}
            <TrendingStyles
              products={products}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onQuickView={(p) => setQuickViewProduct(p)}
              onOpenProduct={handleOpenProduct}
              onShopAll={() => handleNavigate('collection', 'All')}
            />

            {/* Section 4: Second full-width graphic-tee campaign banner */}
            <GraphicBanner onShopGraphic={() => handleNavigate('collection', 'Tees')} />

            {/* Section 5: Featured Collections carousel */}
            <CategoryCarousel
              onSelectCategory={(cat) => handleNavigate('collection', cat)}
            />

            {/* Section 5B: TONTO'S OWN MAKE In-House Atelier Showcase */}
            <TontoOwnMake
              onOpenOffer={(mode) => {
                setOfferModalMode(mode || 'offer');
                setIsOfferModalOpen(true);
              }}
            />

            {/* Section 6: Full-width lookbook banner */}
            <LookbookBanner
              onExploreLookbook={() => handleNavigate('lookbook')}
            />

            {/* Section 7: Shoppable looks carousel with prominent center card */}
            <div id="shoppable-section">
              <ShoppableLooks
                onSelectProduct={handleOpenProduct}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            </div>
          </>
        )}

        {/* 2. COLLECTION PAGE VIEW */}
        {activeView === 'collection' && (
          <CollectionView
            products={products}
            initialCategory={collectionCategory}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenProduct={handleOpenProduct}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {/* 3. PRODUCT DETAIL PAGE VIEW */}
        {activeView === 'product' && (
          <ProductDetailPage
            product={selectedProduct || products[0]}
            allProducts={products}
            onBack={() => handleNavigate('collection')}
            onNavigateCategory={(cat) => handleNavigate('collection', cat)}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenEnquiry={handleOpenEnquiry}
            onAddToCart={handleAddToCart}
            isSaved={selectedProduct ? savedIds.includes(selectedProduct.id) : false}
            onToggleSave={handleToggleSave}
          />
        )}

        {/* 4. DEDICATED FULL CART PAGE */}
        {activeView === 'cart' && (
          <CartPage
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
            onNavigateCheckout={() => handleNavigate('checkout')}
            onOpenProduct={handleOpenProduct}
          />
        )}

        {/* 5. FULL CHECKOUT PAGE */}
        {activeView === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            onClearCart={handleClearCart}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCart={() => handleNavigate('cart')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
          />
        )}

        {/* 6. FULL ACCOUNT PAGE */}
        {activeView === 'account' && (
          <AccountPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
            onOpenProduct={handleOpenProduct}
          />
        )}

        {/* 7. DEDICATED SAVED SHORTLIST PAGE */}
        {activeView === 'saved' && (
          <SavedItemsPage
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onRemoveSaved={handleRemoveSaved}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onOpenEnquiry={handleOpenEnquiry}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
          />
        )}

        {/* 8. EDITORIAL LOOKBOOK VIEW */}
        {activeView === 'lookbook' && (
          <LookbookView
            onNavigateHome={() => handleNavigate('home')}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateProduct={handleOpenProduct}
          />
        )}

        {/* 9. VISIT US / COIMBATORE STUDIO PAGE */}
        {activeView === 'visit' && (
          <VisitUsPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
          />
        )}

        {/* 10. CLIENT CARE & POLICIES PAGE */}
        {activeView === 'policy' && (
          <PolicyPage
            initialTab={policyTab}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
          />
        )}

        {/* 11. BRANDED 404 PAGE */}
        {activeView === '404' && (
          <NotFoundPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {/* 12. FULL TONTO ADMIN DASHBOARD */}
        {activeView === 'admin' && (
          <AdminDashboard
            products={products}
            onUpdateProducts={setProducts}
            onNavigateStore={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Footer - only on storefront views */}
      {activeView !== 'admin' && (
        <Footer
          onNavigate={handleNavigate}
          onOpenVisit={() => setIsVisitOpen(true)}
          onOpenOffer={(mode) => {
            setOfferModalMode(mode || 'offer');
            setIsOfferModalOpen(true);
          }}
        />
      )}

      {/* Concierge Popover Menu - storefront only */}
      {activeView !== 'admin' && isConciergeOpen && (
        <div className="fixed bottom-22 right-6 z-40 w-72 bg-white border border-[#E0E5E1] shadow-2xl rounded-xs p-4 animate-scale-up text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E5E1] mb-3">
            <span className="text-[12px] font-extrabold text-[#003F25] uppercase tracking-wider">
              TONTO Concierge
            </span>
            <button
              onClick={() => setIsConciergeOpen(false)}
              className="text-[#79867D] hover:text-[#003F25] cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-1.5 text-[12px]">
            <button
              onClick={() => {
                setIsConciergeOpen(false);
                handleOpenEnquiry(products[0]);
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-semibold text-[#003F25] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Ask About Sizing & Prices</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              onClick={() => {
                setIsConciergeOpen(false);
                handleNavigate('visit');
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Coimbatore Studio Visits</span>
              <Calendar size={14} className="text-[#003F25]" />
            </button>

            <button
              onClick={() => {
                setIsConciergeOpen(false);
                window.open('https://api.whatsapp.com/send?text=Hi%20TONTO,%20I%20would%20like%20to%20enquire%20about%20your%20pieces.', '_blank');
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Direct WhatsApp Enquiry</span>
              <PhoneCall size={14} className="text-[#128C7E]" />
            </button>

            <button
              onClick={() => {
                setIsConciergeOpen(false);
                window.open(BRAND_INFO.instagramUrl, '_blank');
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Instagram @{BRAND_INFO.instagram}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat / Direct Enquiry Button - storefront only */}
      {activeView !== 'admin' && (
        <button
          onClick={() => setIsConciergeOpen(!isConciergeOpen)}
          className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-[#003F25] text-white flex items-center justify-center shadow-lg hover:bg-[#002e1b] transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#003F25] cursor-pointer"
          aria-label="Direct studio enquiry"
          title="Direct Studio Enquiry"
        >
          {isConciergeOpen ? <X size={20} strokeWidth={2.5} /> : <MessageSquare size={22} className="fill-white stroke-none" />}
        </button>
      )}

      {/* Modals and Drawers */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onOpenEnquiry={handleOpenEnquiry}
        onAddToCart={handleAddToCart}
        onViewFullDetails={(product) => {
          setQuickViewProduct(null);
          handleOpenProduct(product);
        }}
        isSaved={quickViewProduct ? savedIds.includes(quickViewProduct.id) : false}
        onToggleSave={handleToggleSave}
      />

      <EnquiryModal
        product={enquiryProduct}
        initialSize={enquiryInitialSize}
        isOpen={!!enquiryProduct}
        onClose={() => setEnquiryProduct(null)}
      />

      <SavedItemsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedIds={savedIds}
        onRemoveSaved={handleRemoveSaved}
        onQuickView={(p) => setQuickViewProduct(p)}
        onOpenProduct={handleOpenProduct}
        onEnquire={handleOpenEnquiry}
        onNavigateSaved={() => handleNavigate('saved')}
      />

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onQuickView={(p) => setQuickViewProduct(p)}
        onOpenProduct={handleOpenProduct}
        products={products}
      />

      <VisitUsModal
        isOpen={isVisitOpen}
        onClose={() => setIsVisitOpen(false)}
        onOpenEnquiry={handleOpenEnquiry}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onNavigateAccount={() => handleNavigate('account')}
      />

      <CartDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOpenEnquiry={handleOpenEnquiry}
        onShopAll={() => {
          setIsBagOpen(false);
          handleNavigate('collection', 'All');
        }}
        onNavigateCheckout={() => handleNavigate('checkout')}
        onNavigateCart={() => handleNavigate('cart')}
      />

      <RegionModal
        isOpen={isRegionOpen}
        onClose={() => setIsRegionOpen(false)}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />

      {/* Streetwear Showup Offer & Client Sign-In Popup */}
      <OfferModal
        isOpen={isOfferModalOpen}
        initialMode={offerModalMode}
        onClose={() => setIsOfferModalOpen(false)}
        onNavigateCollection={(cat) => {
          setIsOfferModalOpen(false);
          handleNavigate('collection', cat || 'All');
        }}
      />

    </div>
  );
}
