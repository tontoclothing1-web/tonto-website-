import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import TrendingStyles from './components/TrendingStyles';
import GraphicBanner from './components/GraphicBanner';
import CategoryCarousel from './components/CategoryCarousel';
import LookbookBanner from './components/LookbookBanner';
import TontoMadeProducts from './components/TontoMadeProducts';
import DropWaitlistBanner from './components/DropWaitlistBanner';
import ShoppableLooks from './components/ShoppableLooks';
import Footer from './components/Footer';

// Core high-traffic shopping routes (eagerly imported for instant LCP)
import CollectionView from './components/CollectionView';
import FeaturedPage from './components/FeaturedPage';
import NewArrivalsPage from './components/NewArrivalsPage';
import ProductDetailPage from './components/ProductDetailPage';
import LookbookView from './components/LookbookView';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import SavedItemsPage from './components/SavedItemsPage';
import SEO from './components/SEO';

// Secondary routes code-split with React.lazy + Suspense for lean mobile initial chunk
const AccountPage = React.lazy(() => import('./components/AccountPage'));
const VisitUsPage = React.lazy(() => import('./components/VisitUsPage'));
const AboutUsPage = React.lazy(() => import('./components/AboutUsPage'));
const PolicyPage = React.lazy(() => import('./components/PolicyPage'));
const NotFoundPage = React.lazy(() => import('./components/NotFoundPage'));
const CompleteLookPage = React.lazy(() => import('./components/CompleteLookPage'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

// Core interaction drawers
import QuickViewModal from './components/QuickViewModal';
import CartDrawer from './components/CartDrawer';
import SavedItemsDrawer from './components/SavedItemsDrawer';
import SearchDialog from './components/SearchDialog';
import OfferModal from './components/OfferModal';

// Secondary modals lazy loaded on demand
const EnquiryModal = React.lazy(() => import('./components/EnquiryModal'));
const VisitUsModal = React.lazy(() => import('./components/VisitUsModal'));
const AccountModal = React.lazy(() => import('./components/AccountModal'));
const RegionModal = React.lazy(() => import('./components/RegionModal'));

function ViewFallback() {
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center py-20 text-[#003F25]">
      <div className="w-7 h-7 border-2 border-[#003F25] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
import { PRODUCTS, BRAND_INFO, SHOPPABLE_LOOKS } from './data/products';
import { DEFAULT_CMS_CONTENT, mergeCmsWithDefaults } from './data/defaultCms';
import { store, wishlist, cart as cartApi } from './lib/api';
import { MessageSquare, X, ArrowUpRight, PhoneCall, Calendar, MapPin } from 'lucide-react';

function mergeCms(base, remote) {
  return mergeCmsWithDefaults({ ...base, ...remote });
}

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      const hash = window.location.hash || '';
      if (pathname === '/admin' || pathname.endsWith('/admin') || hash === '#/admin' || hash === '#admin') {
        return 'admin';
      }
    }
    return 'home';
  }); 
  // 'home' | 'collection' | 'product' | 'cart' | 'checkout' | 'account' | 'saved' | 'lookbook' | 'look-detail' | 'visit' | 'policy' | 'admin' | '404'
  const [collectionCategory, setCollectionCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLook, setSelectedLook] = useState(null);
  const [policyTab, setPolicyTab] = useState('shipping');

  // Dynamic Catalog State persisted with localStorage
  //
  // One key, `tonto_products`. The desk used to write `tonto_admin_products`
  // while checkout decremented `tonto_products`, so a sold-out piece could still
  // be bought: the two copies never met. The legacy key is migrated once here.
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_products') ?? localStorage.getItem('tonto_admin_products');
      if (saved) return JSON.parse(saved);
    } catch {
      /* fall through to the shipped catalogue */
    }
    return PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonto_products', JSON.stringify(products));
      localStorage.removeItem('tonto_admin_products');
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  // The store database is the real catalogue: it is what the Admin Desk writes
  // and what other shoppers see. Hydrate from it when it answers, and keep the
  // localStorage copy above as the offline cache instead of shipping a blank shop.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await store.bootstrap();
        if (cancelled || !res) return;
        if (Array.isArray(res.products) && res.products.length) setProducts(res.products);
        if (res.settings && Object.keys(res.settings).length) {
          setStoreSettings((prev) => ({ ...prev, ...res.settings }));
        }
        if (res.cms && Object.keys(res.cms).length) {
          setCmsContent((prev) => mergeCmsWithDefaults({ ...prev, ...res.cms }));
        }
      } catch (err) {
        // Offline / backend not configured yet — the cached catalogue stands.
        console.info('[store] using cached catalogue:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Store Configuration Settings synced with Admin Dashboard
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      storeName: 'TONTO Clothing',
      storeLocation: 'Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India',
      whatsappPhone: '+91 82483 21214',
      instagramHandle: '@tonto_clothing_',
      announcementText: '✦ EXCLUSIVE PRIVILEGE: 15% OFF FIRST ORDER • CLAIM CODE | SIGN IN',
      freeShippingThreshold: '₹2,500'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonto_admin_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.error(e);
    }
  }, [storeSettings]);

  // CMS Section & Media Content with localStorage persistence
  const [cmsContent, setCmsContent] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_cms');
      if (saved) {
        return mergeCmsWithDefaults(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CMS_CONTENT;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonto_admin_cms', JSON.stringify(cmsContent));
    } catch (e) {
      console.error(e);
    }
  }, [cmsContent]);

  // Bi-directional live synchronization between Storefront and Admin Dashboard
  useEffect(() => {
    const handleSyncFromAdmin = () => {
      try {
        const savedProducts = localStorage.getItem('tonto_products');
        if (savedProducts) setProducts(JSON.parse(savedProducts));

        const savedSettings = localStorage.getItem('tonto_admin_settings');
        if (savedSettings) setStoreSettings(JSON.parse(savedSettings));

        const savedCms = localStorage.getItem('tonto_admin_cms');
        if (savedCms) {
          setCmsContent(mergeCmsWithDefaults(JSON.parse(savedCms)));
        }
      } catch (err) {
        console.error('Storefront sync error:', err);
      }
    };

    window.addEventListener('storage', handleSyncFromAdmin);
    window.addEventListener('tonto-data-updated', handleSyncFromAdmin);
    return () => {
      window.removeEventListener('storage', handleSyncFromAdmin);
      window.removeEventListener('tonto-data-updated', handleSyncFromAdmin);
    };
  }, []);
  
  // Selected Region / Currency
  const [selectedRegion, setSelectedRegion] = useState({
    code: 'IN',
    label: 'India',
    currency: 'INR (₹)',
    display: 'INDIA'
  });
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  // Saved shortlist. The server wishlist is the record the store keeps; the
  // browser copy is the offline draft. A new visitor starts empty — nothing is
  // pre-saved for them, and the bag count never lies.
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tonto_saved_items') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  // Toggles only write through once the first fetch has settled, otherwise the
  // device list would be pushed as "the truth" before it was ever read.
  const [wishlistReady, setWishlistReady] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('tonto_saved_items', JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedIds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await wishlist.list();
        const remote = (res?.data || []).map((row) => row?.productId).filter(Boolean);
        // Union, not replacement: pieces saved while offline belong to this
        // shopper too, and the next toggle reconciles removals.
        if (!cancelled && remote.length) {
          setSavedIds((prev) => [...new Set([...prev, ...remote])]);
        }
      } catch {
        /* no shortlist service this visit — the device list stands */
      } finally {
        if (!cancelled) setWishlistReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Shopping Bag / Cart state with localStorage persistence
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tonto_bag_items') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [bagReady, setBagReady] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('tonto_bag_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Adopt the server bag only when the device has nothing to show for itself:
  // a new tab on the same browser picking the bag up, never a merge that could
  // bring back a piece the shopper deliberately removed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await cartApi.get();
        const remote = Array.isArray(res?.data?.items) ? res.data.items : [];
        if (!cancelled && res?.data?.persisted && remote.length) {
          setCartItems((prev) => (prev.length ? prev : remote));
        }
      } catch {
        /* bag service down — checkout still re-quotes from the catalogue */
      } finally {
        if (!cancelled) setBagReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Mirror the bag to /api/cart (replace mode) so the store sees the live bag.
  // Debounced: mashing "+" should be one write, and prices are always re-taken
  // from the catalogue server-side, never from what this browser claims.
  useEffect(() => {
    if (!bagReady) return undefined;
    const timer = setTimeout(() => {
      cartApi.sync(cartItems).catch(() => { /* device draft stands */ });
    }, 700);
    return () => clearTimeout(timer);
  }, [cartItems, bagReady]);

  // Modal & Drawer states
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [enquiryInitialSize, setEnquiryInitialSize] = useState('');
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [hasGivenCredentials, setHasGivenCredentials] = useState(() => {
    try {
      return localStorage.getItem('tonto_credentials_submitted') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Offer popup trigger logic:
  // Appears ONLY ONCE on home page open, then in New Arrivals (once), and in TONTO Made (once) only.
  useEffect(() => {
    if (hasGivenCredentials) return;

    const isSubmitted = () => {
      try {
        return localStorage.getItem('tonto_credentials_submitted') === 'true';
      } catch (e) {
        return false;
      }
    };

    if (isSubmitted()) return;

    // 1. Website Home Page opens: appears only once
    if (activeView === 'home') {
      const shownHome = sessionStorage.getItem('tonto_pop_shown_home');
      if (!shownHome) {
        sessionStorage.setItem('tonto_pop_shown_home', 'true');
        const timer = setTimeout(() => {
          if (!isSubmitted()) {
            setIsOfferModalOpen(true);
          }
        }, 900);
        return () => clearTimeout(timer);
      }
    }

    // 2. In New Arrivals view: appears only once
    if (activeView === 'new-arrivals') {
      const shownNewArrivals = sessionStorage.getItem('tonto_pop_shown_new_arrivals');
      if (!shownNewArrivals) {
        sessionStorage.setItem('tonto_pop_shown_new_arrivals', 'true');
        const timer = setTimeout(() => {
          if (!isSubmitted()) {
            setIsOfferModalOpen(true);
          }
        }, 650);
        return () => clearTimeout(timer);
      }
    }

    // 3. In TONTO Made view: appears only once
    if (activeView === 'lookbook') {
      const shownTontoMade = sessionStorage.getItem('tonto_pop_shown_tonto_made');
      if (!shownTontoMade) {
        sessionStorage.setItem('tonto_pop_shown_tonto_made', 'true');
        const timer = setTimeout(() => {
          if (!isSubmitted()) {
            setIsOfferModalOpen(true);
          }
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [activeView, hasGivenCredentials]);

  // URL Routing Listener (Pathname + Hash)
  useEffect(() => {
    const handleRouting = () => {
      const rawPathname = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      const hash = window.location.hash || '';

      // Direct /admin in URL pathname or hash
      if (rawPathname === '/admin' || rawPathname.endsWith('/admin') || hash === '#/admin' || hash === '#admin') {
        setActiveView('admin');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        return;
      }

      // Resolve effective route from hash (if present) or pathname
      let path = '#/';
      let queryString = '';

      if (hash && hash !== '#' && hash !== '#/') {
        const [hPath, hQuery] = hash.split('?');
        path = hPath;
        queryString = hQuery || '';
      } else if (rawPathname !== '/') {
        path = '#' + rawPathname;
        queryString = (window.location.search || '').replace(/^\?/, '');
      }

      const searchParams = new URLSearchParams(queryString);

      if (path === '' || path === '#' || path === '#/') {
        setActiveView('home');
      } else if (path === '#/featured') {
        setActiveView('featured');
      } else if (path === '#/new-arrivals' || path === '#/newarrivals') {
        setActiveView('new-arrivals');
      } else if (path === '#/collection') {
        setActiveView('collection');
        const cat = searchParams.get('category') || 'All';
        setCollectionCategory(cat);
      } else if (path.startsWith('#/product/')) {
        const id = decodeURIComponent(path.replace('#/product/', ''));
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
      } else if (path === '#/lookbook' || path === '#/tonto-made') {
        setActiveView('lookbook');
      } else if (path.startsWith('#/look/')) {
        const lookId = decodeURIComponent(path.replace('#/look/', ''));
        const allLooks = cmsContent?.shoppableLooks && cmsContent.shoppableLooks.length > 0 
          ? cmsContent.shoppableLooks 
          : SHOPPABLE_LOOKS;
        const defaultLook = SHOPPABLE_LOOKS.find((sl) => sl.id === lookId) || {};
        const foundLook = allLooks.find((l) => l.id === lookId) || SHOPPABLE_LOOKS.find((l) => l.id === lookId);
        if (foundLook) {
          const enrichedLook = {
            ...defaultLook,
            ...foundLook,
            items: (foundLook.items && foundLook.items.length > 0) ? foundLook.items : (defaultLook.items || []),
            costumePrice: foundLook.costumePrice || defaultLook.costumePrice || '₹6,490',
            costumeNumericPrice: foundLook.costumeNumericPrice || defaultLook.costumeNumericPrice || 6490
          };
          setSelectedLook(enrichedLook);
          setActiveView('look-detail');
        } else {
          setActiveView('404');
        }
      } else if (path === '#/about' || path === '#/about-us') {
        setActiveView('about');
      } else if (path === '#/visit') {
        setActiveView('visit');
      } else if (path.startsWith('#/policy')) {
        setActiveView('policy');
        const parts = path.split('/');
        setPolicyTab(parts[2] || 'shipping');
      } else {
        setActiveView('404');
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);

    // Discrete secret keyboard shortcut for store owner (Ctrl+Shift+A or Cmd+Shift+A)
    const handleSecretAdminShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        const isAdmin = window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin') || window.location.hash === '#/admin';
        if (isAdmin) {
          window.history.pushState(null, '', '/');
          window.location.hash = '#/';
          setActiveView('home');
        } else {
          window.history.pushState(null, '', '/admin');
          window.location.hash = '#/admin';
          setActiveView('admin');
        }
      }
    };
    window.addEventListener('keydown', handleSecretAdminShortcut);

    return () => {
      window.removeEventListener('hashchange', handleRouting);
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('keydown', handleSecretAdminShortcut);
    };
  }, [products]);

  // Idle prefetch of AdminDashboard so even the back office opens in 0ms
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          import('./components/AdminDashboard');
        });
      } else {
        setTimeout(() => {
          import('./components/AdminDashboard');
        }, 1500);
      }
    }
  }, []);

  // View Navigation Helper — synchronous immediate state update + instant scroll reset
  const handleNavigate = (view, param = '') => {
    // If currently on /admin URL path and navigating back to storefront, clean up pathname
    if (typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin'))) {
      window.history.pushState(null, '', '/');
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (view === 'home') {
      setActiveView('home');
      if (window.location.hash !== '#/') window.location.hash = '#/';
    } else if (view === 'featured') {
      setActiveView('featured');
      if (window.location.hash !== '#/featured') window.location.hash = '#/featured';
    } else if (view === 'new-arrivals' || view === 'newarrivals') {
      setActiveView('new-arrivals');
      if (window.location.hash !== '#/new-arrivals') window.location.hash = '#/new-arrivals';
    } else if (view === 'collection') {
      const cat = param || 'All';
      setCollectionCategory(cat);
      setActiveView('collection');
      const targetHash = cat && cat !== 'All' ? `#/collection?category=${encodeURIComponent(cat)}` : '#/collection';
      if (window.location.hash !== targetHash) window.location.hash = targetHash;
    } else if (view === 'product') {
      const id = typeof param === 'string' ? param : param?.id;
      const found = products.find((p) => p.id === id || p.slug === id);
      if (found) setSelectedProduct(found);
      setActiveView('product');
      const targetHash = `#/product/${id}`;
      if (window.location.hash !== targetHash) window.location.hash = targetHash;
    } else if (view === 'cart') {
      setActiveView('cart');
      if (window.location.hash !== '#/cart') window.location.hash = '#/cart';
    } else if (view === 'checkout') {
      setActiveView('checkout');
      if (window.location.hash !== '#/checkout') window.location.hash = '#/checkout';
    } else if (view === 'account') {
      setActiveView('account');
      if (window.location.hash !== '#/account') window.location.hash = '#/account';
    } else if (view === 'saved') {
      setActiveView('saved');
      if (window.location.hash !== '#/saved') window.location.hash = '#/saved';
    } else if (view === 'lookbook' || view === 'tonto-made') {
      setActiveView('lookbook');
      if (window.location.hash !== '#/tonto-made') window.location.hash = '#/tonto-made';
    } else if (view === 'look-detail') {
      const id = typeof param === 'string' ? param : (param?.id || 'look-3');
      const allLooks = cmsContent?.shoppableLooks && cmsContent.shoppableLooks.length > 0 
        ? cmsContent.shoppableLooks 
        : SHOPPABLE_LOOKS;
      const defaultLook = SHOPPABLE_LOOKS.find((sl) => sl.id === id) || {};
      const foundLook = allLooks.find((l) => l.id === id) || SHOPPABLE_LOOKS.find((l) => l.id === id);
      if (foundLook) {
        setSelectedLook({
          ...defaultLook,
          ...foundLook,
          items: (foundLook.items && foundLook.items.length > 0) ? foundLook.items : (defaultLook.items || []),
          costumePrice: foundLook.costumePrice || defaultLook.costumePrice || '₹6,490',
          costumeNumericPrice: foundLook.costumeNumericPrice || defaultLook.costumeNumericPrice || 6490
        });
      }
      setActiveView('look-detail');
      const targetHash = `#/look/${id}`;
      if (window.location.hash !== targetHash) window.location.hash = targetHash;
    } else if (view === 'about') {
      setActiveView('about');
      if (window.location.hash !== '#/about') window.location.hash = '#/about';
    } else if (view === 'visit') {
      setActiveView('visit');
      if (window.location.hash !== '#/visit') window.location.hash = '#/visit';
    } else if (view === 'admin') {
      window.history.pushState(null, '', '/admin');
      window.location.hash = '#/admin';
      setActiveView('admin');
    } else if (view === 'policy') {
      setPolicyTab(param || 'shipping');
      setActiveView('policy');
      const targetHash = `#/policy/${param || 'shipping'}`;
      if (window.location.hash !== targetHash) window.location.hash = targetHash;
    } else {
      setActiveView('home');
      if (window.location.hash !== '#/') window.location.hash = '#/';
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    handleNavigate('product', product.id);
  };

  // Toggle Save Item — optimistic on this device, written through to the store
  const writeSavedItem = (productId, shouldSave) => {
    if (!productId || !wishlistReady) return;
    (async () => {
      try {
        if (shouldSave) await wishlist.add(productId);
        else await wishlist.remove(productId);
      } catch (err) {
        // 400 = the piece left the catalogue, 404 = it was never on the server
        // list. Either way the click still worked locally; say so in the log
        // rather than throwing a modal at the shopper.
        console.info(`[wishlist] "${productId}" held on this device: ${err.message}`);
      }
    })();
  };

  const handleToggleSave = (product) => {
    if (!product?.id) return;
    const wasSaved = savedIds.includes(product.id);
    setSavedIds((prev) =>
      wasSaved ? prev.filter((id) => id !== product.id) : [...new Set([...prev, product.id])]
    );
    writeSavedItem(product.id, !wasSaved);
  };

  const handleRemoveSaved = (id) => {
    setSavedIds((prev) => prev.filter((item) => item !== id));
    writeSavedItem(id, false);
  };

  // Cart Handlers
  const handleAddToCart = (product, size, qty = 1) => {
    const itemSize = size || product.size || (product.variants?.[0] || 'Standard');
    const itemQty = qty || product.quantity || 1;
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.id === product.id && item.size === itemSize
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + itemQty
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
            image: product.image || product.images?.[0],
            quantity: itemQty
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

  const handleOpenEnquiry = (product = null, size = '') => {
    setEnquiryProduct(product || null);
    setEnquiryInitialSize(size || (Array.isArray(product?.variants) ? product.variants[0] : ''));
    setIsEnquiryOpen(true);
  };

  const totalBagCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col font-sans selection:bg-[#003F25] selection:text-white relative">
      <SEO
        view={activeView}
        category={collectionCategory}
        product={selectedProduct}
        look={selectedLook}
        policyTab={policyTab}
      />
      
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
            setIsAccountOpen(true);
          }}
          onOpenOffer={() => {
            setIsOfferModalOpen(true);
          }}
          onOpenBag={() => setIsBagOpen(true)}
          selectedRegion={selectedRegion}
          onOpenRegion={() => setIsRegionOpen(true)}
          storeSettings={storeSettings}
          onNavigateAdmin={() => handleNavigate('admin')}
        />
      )}

      {/* Main Content Area */}
      <main key={activeView} className={`flex-1 ${activeView === 'admin' ? '' : 'animate-fade-in'}`}>
        {/* 1. HOMEPAGE VIEW */}
        {activeView === 'home' && (
          <>
            {/* Section 2: Full-width campaign hero */}
            <HeroBanner
              heroMedia={cmsContent?.hero}
              onShopNow={() => handleNavigate('collection', 'All')}
            />

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
            <GraphicBanner
              graphicMedia={cmsContent?.graphicBanner}
              onShopGraphic={() => handleNavigate('collection', 'Tees')}
            />

            {/* Section 5: Featured Collections carousel */}
            <CategoryCarousel
              customCategories={cmsContent?.categoryCarousel?.length ? cmsContent.categoryCarousel : cmsContent?.categories}
              onSelectCategory={(cat) => handleNavigate('collection', cat)}
            />

            {/* Section 6: Full-width lookbook banner (TONTO MADE) */}
            <LookbookBanner
              lookbookMedia={cmsContent?.lookbookBanner}
              onExploreLookbook={() => handleNavigate('lookbook')}
            />

            {/* Top Products of TONTO MADE in between TONTO MADE and Waitlist */}
            <TontoMadeProducts
              products={products}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onQuickView={(p) => setQuickViewProduct(p)}
              onOpenProduct={handleOpenProduct}
              onShopAll={() => handleNavigate('collection', 'All')}
            />

            {/* Private Drop 01 Waitlist Banner under TONTO MADE */}
            <DropWaitlistBanner
              onOpenOffer={() => {
                setIsOfferModalOpen(true);
              }}
            />

            {/* Section 7: Shoppable looks carousel with prominent center card */}
            <div id="shoppable-section">
              <ShoppableLooks
                products={products}
                customLooks={cmsContent?.shoppableLooks}
                onSelectProduct={handleOpenProduct}
                onQuickView={(p) => setQuickViewProduct(p)}
                onOpenLook={(look) => {
                  setSelectedLook(look);
                  handleNavigate('look-detail', look.id);
                }}
              />
            </div>
          </>
        )}

        {/* DEDICATED FEATURED PAGE VIEW */}
        {activeView === 'featured' && (
          <FeaturedPage
            products={products}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenProduct={handleOpenProduct}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={(cat) => handleNavigate('collection', cat)}
          />
        )}

        {/* DEDICATED NEW ARRIVALS PAGE VIEW */}
        {activeView === 'new-arrivals' && (
          <NewArrivalsPage
            products={products}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenProduct={handleOpenProduct}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={(cat) => handleNavigate('collection', cat)}
          />
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
            onNavigateAccount={() => handleNavigate('account')}
            onUpdateProducts={setProducts}
            storeSettings={storeSettings}
          />
        )}

        {/* 6. FULL ACCOUNT PAGE */}
        {activeView === 'account' && (
          <AccountPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
            onOpenProduct={handleOpenProduct}
            onNavigateAdmin={() => handleNavigate('admin')}
          />
        )}

        {/* 7. DEDICATED SAVED SHORTLIST PAGE */}
        {activeView === 'saved' && (
          <SavedItemsPage
            products={products}
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
            products={products}
            onNavigateHome={() => handleNavigate('home')}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateProduct={handleOpenProduct}
            onOpenLook={(look) => {
              setSelectedLook(look);
              handleNavigate('look-detail', look.id);
            }}
          />
        )}

        {/* 8.5 DEDICATED COMPLETE COSTUME / EXACT LOOK PAGE */}
        {activeView === 'look-detail' && (
          <CompleteLookPage
            look={selectedLook || SHOPPABLE_LOOKS[2]}
            products={products}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShopLooks={() => {
              handleNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('shoppable-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            onAddToCart={handleAddToCart}
            onOpenBag={() => setIsBagOpen(true)}
            onNavigateCheckout={() => handleNavigate('checkout')}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {/* 9. ABOUT US PAGE */}
        {activeView === 'about' && (
          <AboutUsPage
            aboutMedia={cmsContent?.aboutUs}
            products={products}
            onOpenProduct={handleOpenProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCollection={() => handleNavigate('collection', 'All')}
            onNavigateVisit={() => handleNavigate('visit')}
            onNavigateLookbook={() => handleNavigate('lookbook')}
          />
        )}

        {/* 10. VISIT US / COIMBATORE SHOWROOM PAGE */}
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
          <React.Suspense fallback={<ViewFallback />}>
            <AdminDashboard
              products={products}
              onUpdateProducts={setProducts}
              storeSettings={storeSettings}
              onUpdateStoreSettings={setStoreSettings}
              cmsContent={cmsContent}
              onUpdateCmsContent={setCmsContent}
              onNavigateStore={() => handleNavigate('home')}
              onNavigateStoreProduct={(prod) => {
                handleOpenProduct(prod);
              }}
            />
          </React.Suspense>
        )}
      </main>

      {/* Footer - only on storefront views */}
      {activeView !== 'admin' && (
        <Footer
          onNavigate={handleNavigate}
          onOpenVisit={() => setIsVisitOpen(true)}
          onOpenOffer={() => {
            setIsOfferModalOpen(true);
          }}
          onOpenAccount={() => {
            setIsAccountOpen(true);
          }}
          storeSettings={storeSettings}
          onNavigateAdmin={() => handleNavigate('admin')}
        />
      )}

      {/* Concierge Popover Menu - storefront only */}
      {activeView !== 'admin' && isConciergeOpen && (
        <div className="fixed bottom-36 right-4 lg:bottom-22 lg:right-6 z-40 w-72 bg-white border border-[#E0E5E1] shadow-2xl rounded-xs p-4 animate-scale-up text-left">
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
                handleOpenEnquiry(null);
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-semibold text-[#003F25] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Ask Us Anything (Concierge)</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              onClick={() => {
                setIsConciergeOpen(false);
                handleNavigate('visit');
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Coimbatore Location</span>
              <MapPin size={14} className="text-[#003F25]" />
            </button>

            <button
              onClick={() => {
                setIsConciergeOpen(false);
                const cleanWa = (storeSettings?.whatsappPhone || BRAND_INFO?.whatsapp || '8248321214').replace(/[^0-9]/g, '');
                const waUrl = cleanWa
                  ? `https://api.whatsapp.com/send?phone=${cleanWa}&text=Hi%20TONTO,%20I%20would%20like%20to%20enquire%20about%20your%20pieces.`
                  : 'https://api.whatsapp.com/send?text=Hi%20TONTO,%20I%20would%20like%20to%20enquire%20about%20your%20pieces.';
                window.open(waUrl, '_blank');
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Direct WhatsApp Enquiry</span>
              <PhoneCall size={14} className="text-[#128C7E]" />
            </button>

            <button
              onClick={() => {
                setIsConciergeOpen(false);
                window.open(BRAND_INFO?.instagramUrl || 'https://instagram.com/tonto_clothing_', '_blank');
              }}
              className="w-full text-left p-2 hover:bg-[#F9FAF9] rounded-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Instagram @{BRAND_INFO?.instagram || 'tonto_clothing_'}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat / Direct Enquiry Button - storefront only */}
      {activeView !== 'admin' && (
        <button
          onClick={() => setIsConciergeOpen(!isConciergeOpen)}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-12 h-12 lg:w-13 lg:h-13 rounded-full bg-[#003F25] text-white flex items-center justify-center shadow-xl hover:bg-[#002e1b] transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#003F25] cursor-pointer"
          aria-label="Direct enquiry"
          title="Direct Enquiry"
        >
          {isConciergeOpen ? <X size={19} strokeWidth={2.5} /> : <MessageSquare size={20} className="fill-white stroke-none" />}
        </button>
      )}



      {/* Modals and Drawers - Eagerly available for 0ms response */}
      {quickViewProduct && (
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
        )}

        {isEnquiryOpen && (
          <EnquiryModal
            product={enquiryProduct}
            initialSize={enquiryInitialSize}
            isOpen={isEnquiryOpen}
            onClose={() => {
              setIsEnquiryOpen(false);
              setEnquiryProduct(null);
            }}
          />
        )}

        {isSavedDrawerOpen && (
          <SavedItemsDrawer
            isOpen={isSavedDrawerOpen}
            onClose={() => setIsSavedDrawerOpen(false)}
            products={products}
            savedIds={savedIds}
            onRemoveSaved={handleRemoveSaved}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenProduct={handleOpenProduct}
            onEnquire={handleOpenEnquiry}
            onNavigateSaved={() => handleNavigate('saved')}
          />
        )}

        {isSearchOpen && (
          <SearchDialog
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenProduct={handleOpenProduct}
            products={products}
          />
        )}

        {isVisitOpen && (
          <VisitUsModal
            isOpen={isVisitOpen}
            onClose={() => setIsVisitOpen(false)}
            onOpenEnquiry={handleOpenEnquiry}
          />
        )}

        {isAccountOpen && (
          <AccountModal
            isOpen={isAccountOpen}
            onClose={() => setIsAccountOpen(false)}
            onOpenSaved={() => setIsSavedDrawerOpen(true)}
            onNavigateAccount={() => handleNavigate('account')}
          />
        )}

        {isBagOpen && (
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
        )}

        {isRegionOpen && (
          <RegionModal
            isOpen={isRegionOpen}
            onClose={() => setIsRegionOpen(false)}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        )}

        {/* Streetwear 15% Off Privilege Popup */}
        {isOfferModalOpen && (
          <OfferModal
            isOpen={isOfferModalOpen}
            onClose={() => setIsOfferModalOpen(false)}
            offerModalMedia={cmsContent?.offerModal}
            onCredentialsSubmitted={() => {
              setHasGivenCredentials(true);
            }}
            onNavigateCollection={(cat) => {
              setIsOfferModalOpen(false);
              handleNavigate('collection', cat || 'All');
            }}
          />
        )}


    </div>
  );
}
