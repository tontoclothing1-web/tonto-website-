import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Calendar,
  Users,
  Tag,
  Settings,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Clock,
  PhoneCall,
  Mail,
  Download,
  Copy,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { BRAND_INFO, CATEGORIES } from '../data/products';

// High-resolution presets from the store repository
const ASSET_LIBRARY_PRESETS = [
  { label: 'Waffle Longsleeve Black (Front)', url: '/assets/products/tonto-studios-waffle-black-front.jpg' },
  { label: 'Waffle Longsleeve Black (Back)', url: '/assets/products/tonto-studios-waffle-black-back.jpg' },
  { label: 'Waffle Thermal White / Aqua', url: '/assets/products/tonto-waffle-white-front.jpg' },
  { label: 'Chain Graffiti Denim Detail', url: '/assets/products/chain-print-denim-detail.jpg' },
  { label: 'Extra Wide Washed Denim', url: '/assets/products/extra-wide-denim.jpg' },
  { label: 'Black Denim Shirt & Flared Jeans', url: '/assets/products/black-denim-shirt-flared-jeans.jpg' },
  { label: 'Oversized Graphic Tee Black', url: '/assets/products/oversized-graphic-tee-black.jpg' },
  { label: 'Sportswear Sweatshirt Navy', url: '/assets/products/sportswear-sweatshirt-navy-flat1.jpg' },
  { label: 'Relaxed Fit Trousers Cream', url: '/assets/products/relaxed-fit-trousers-cream.jpg' },
  { label: 'Waffle Tees Hanging Rack', url: '/assets/products/tonto-waffle-tees-hanging.jpg' },
  { label: 'TONTO Custom Hardware & Tags', url: '/assets/branding/tonto-tags.jpg' },
  { label: 'Editorial Seated Camo Campaign', url: '/assets/editorial/editorial-seated-camo.jpg' }
];

export default function AdminDashboard({
  products = [],
  onUpdateProducts,
  onNavigateStore,
  initialTab = 'overview'
}) {
  // Authentication State (defaults to true for instant seamless access, can still log out & test passcode)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('tonto_admin_authenticated') !== 'false';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Navigation Tab
  // 'overview' | 'products' | 'enquiries' | 'appointments' | 'subscribers' | 'promos' | 'settings'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All');

  // Product Modal State (Add / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    title: '',
    category: 'Tees',
    colour: 'vintage black',
    fit: 'Relaxed drop-shoulder',
    price: 'Price on enquiry',
    availability: 'In stock - Coimbatore studio',
    isTrending: true,
    variants: 'S, M, L, XL',
    measurements: 'Chest: 48in | Length: 29in | Sleeve: 26in',
    description: 'Heavyweight textured knit crafted in small studio batches. Boxy, relaxed unisex drape.',
    images: ['/assets/products/tonto-studios-waffle-black-front.jpg']
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Enquiries / Orders State with LocalStorage
  const [enquiries, setEnquiries] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_enquiries');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'ENQ-1001',
        clientName: 'Aditya K.',
        contact: '+91 98402 12984',
        productTitle: 'TONTO STUDIOS WAFFLE LONGSLEEVE',
        colour: 'black / woodland camo',
        size: 'L',
        date: '2026-10-10 16:45',
        status: 'In Discussion',
        notes: 'Requested courier delivery to Bangalore.'
      },
      {
        id: 'ENQ-1002',
        clientName: 'Sanjay V.',
        contact: '+91 99520 84729',
        productTitle: 'EXTRA WIDE DENIM',
        colour: 'washed blue',
        size: '32',
        date: '2026-10-11 11:15',
        status: 'Payment Received',
        notes: 'Paid via UPI. Fitting verified.'
      },
      {
        id: 'ENQ-1003',
        clientName: 'Karthik Raja',
        contact: 'karthik.r@example.com',
        productTitle: 'CHAIN-GRAFFITI BAGGY DENIM',
        colour: 'washed grey / black',
        size: '34',
        date: '2026-10-11 13:30',
        status: 'Pending',
        notes: 'Inquired about waist measurements and leg opening.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tonto_admin_enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

  // Appointments State with LocalStorage
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_appointments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'APT-201',
        name: 'Harish M.',
        phone: '+91 94431 82910',
        date: '2026-10-12',
        time: '3:00 PM',
        purpose: 'Try on heavy waffle knit thermals & surplus jackets',
        status: 'Confirmed'
      },
      {
        id: 'APT-202',
        name: 'Praveen Chandran',
        phone: '+91 97890 12345',
        date: '2026-10-14',
        time: '5:30 PM',
        purpose: 'Denim sizing consultation & archive pieces',
        status: 'Pending'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tonto_admin_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Subscribers State with LocalStorage
  const [subscribers, setSubscribers] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_subscribers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { email: 'aditya.fashion@gmail.com', source: '15% Welcome Modal', date: '2026-10-09' },
      { email: 'sneakers.in@gmail.com', source: 'Drop 01 Waitlist', date: '2026-10-10' },
      { email: 'karan.streetwear@outlook.com', source: 'Footer Drop Alerts', date: '2026-10-11' },
      { email: 'varun.b@live.com', source: '15% Welcome Modal', date: '2026-10-11' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tonto_admin_subscribers', JSON.stringify(subscribers));
  }, [subscribers]);

  // Promo Codes State
  const [promos, setPromos] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_promos');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { code: 'TONTO15', discount: '15% OFF', type: 'Welcome Privilege', active: true, uses: 38 },
      { code: 'STUDIOVIP', discount: '20% OFF', type: 'Private Drop Access', active: true, uses: 12 },
      { code: 'ARCHIVE10', discount: '10% OFF', type: 'Return Customer', active: false, uses: 5 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tonto_admin_promos', JSON.stringify(promos));
  }, [promos]);

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      storeName: 'TONTO Clothing',
      studioLocation: 'Coimbatore, Tamil Nadu, India',
      whatsappPhone: '+91 98400 00000',
      instagramHandle: '@tonto_clothing_',
      announcementText: '✦ EXCLUSIVE PRIVILEGE: 15% OFF FIRST ORDER • CLAIM CODE | SIGN IN',
      freeShippingThreshold: '₹2,500'
    };
  });

  useEffect(() => {
    localStorage.setItem('tonto_admin_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Authentication Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    const clean = passcode.trim().toLowerCase();
    if (clean === 'tonto' || clean === 'tonto2026' || clean === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('tonto_admin_authenticated', 'true');
      setAuthError('');
      showToast('Welcome to TONTO Studio Desk');
    } else {
      setAuthError('Incorrect passcode. Hint: Use "tonto" or click 1-Click Access.');
    }
  };

  const handleQuickDemoLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('tonto_admin_authenticated', 'true');
    setAuthError('');
    showToast('Authenticated as Studio Director');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('tonto_admin_authenticated');
    showToast('Logged out of Admin Desk');
  };

  // PRODUCT CRUD HANDLERS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      title: '',
      category: 'Tees',
      colour: 'vintage black',
      fit: 'Relaxed drop-shoulder',
      price: 'Price on enquiry',
      availability: 'In stock - Coimbatore studio',
      isTrending: true,
      variants: 'S, M, L, XL',
      measurements: 'Chest: 48in | Length: 29in | Sleeve: 26in',
      description: 'Heavyweight textured knit crafted in small studio batches. Boxy, relaxed unisex drape.',
      images: ['/assets/products/tonto-studios-waffle-black-front.jpg']
    });
    setImageUrlInput('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductFormData({
      title: prod.title || '',
      category: prod.category || 'Tees',
      colour: prod.colour || '',
      fit: prod.fit || 'Relaxed drape',
      price: prod.price || 'Price on enquiry',
      availability: prod.availability || 'In stock - Coimbatore studio',
      isTrending: !!prod.isTrending,
      variants: Array.isArray(prod.variants)
        ? prod.variants.join(', ')
        : (typeof prod.variants === 'string' ? prod.variants : 'S, M, L, XL'),
      measurements: prod.measurements || '',
      description: prod.description || '',
      images: Array.isArray(prod.images) && prod.images.length > 0
        ? [...prod.images]
        : (prod.image ? [prod.image] : ['/assets/products/extra-wide-denim.jpg'])
    });
    setImageUrlInput('');
    setIsProductModalOpen(true);
  };

  // Image Upload handler (File Reader to Data URL)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setProductFormData((prev) => ({
          ...prev,
          images: [...prev.images, dataUrl]
        }));
        showToast('Image uploaded successfully from device');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddPresetImage = (url) => {
    if (productFormData.images.includes(url)) {
      showToast('Image already added to this piece');
      return;
    }
    setProductFormData((prev) => ({
      ...prev,
      images: [...prev.images, url]
    }));
    showToast('Added photo from studio gallery');
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    if (productFormData.images.includes(url)) {
      showToast('Image already in list');
      return;
    }
    setProductFormData((prev) => ({
      ...prev,
      images: [...prev.images, url]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    setProductFormData((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: nextImages.length > 0 ? nextImages : ['/assets/products/extra-wide-denim.jpg']
      };
    });
  };

  // Product Save / Submit
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productFormData.title || !productFormData.title.trim()) {
      alert('Please enter a product title.');
      return;
    }

    // Auto-include any URL typed in the input box if the user forgot to click "Add"
    let finalImages = [...productFormData.images];
    if (imageUrlInput.trim() && !finalImages.includes(imageUrlInput.trim())) {
      finalImages.push(imageUrlInput.trim());
    }
    if (finalImages.length === 0) {
      finalImages = ['/assets/products/extra-wide-denim.jpg'];
    }

    // Parse variants safely
    let variantsArray = ['S', 'M', 'L', 'XL'];
    if (typeof productFormData.variants === 'string') {
      variantsArray = productFormData.variants
        .split(/[,/]+/)
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (Array.isArray(productFormData.variants)) {
      variantsArray = productFormData.variants;
    }
    if (variantsArray.length === 0) variantsArray = ['Standard'];

    const cleanTitle = productFormData.title.trim();
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (editingProduct) {
      // Edit existing product
      const updatedList = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            ...productFormData,
            title: cleanTitle,
            images: finalImages,
            variants: variantsArray,
            slug: p.slug || slug
          };
        }
        return p;
      });
      if (onUpdateProducts) onUpdateProducts(updatedList);
      showToast(`Updated "${cleanTitle}" successfully`);
    } else {
      // Create brand new product
      const newProduct = {
        id: `tonto-${Date.now()}`,
        slug: slug || `prod-${Date.now()}`,
        title: cleanTitle,
        category: productFormData.category || 'Tees',
        colour: productFormData.colour || 'vintage black',
        fit: productFormData.fit || 'Relaxed drop-shoulder',
        price: productFormData.price || 'Price on enquiry',
        availability: productFormData.availability || 'In stock - Coimbatore studio',
        isTrending: !!productFormData.isTrending,
        images: finalImages,
        alt: `${cleanTitle} in ${productFormData.colour || 'vintage black'}`,
        description: productFormData.description || 'Heavyweight streetwear piece crafted for everyday wear.',
        verifiedBrand: 'unisex / TONTO',
        variants: variantsArray,
        measurements: productFormData.measurements || 'Standard fit',
        createdDate: new Date().toISOString().split('T')[0]
      };

      if (onUpdateProducts) {
        onUpdateProducts([newProduct, ...products]);
      }
      showToast(`Added new piece "${cleanTitle}" to catalog!`);
    }

    // Close modal, reset search & filters, and ensure user is on products tab to see the piece
    setIsProductModalOpen(false);
    setActiveTab('products');
    setSearchQuery('');
    setSelectedCategoryFilter('All');
    setSelectedStockFilter('All');
  };

  const handleDeleteProduct = (productId, productTitle) => {
    if (window.confirm(`Are you sure you want to delete "${productTitle}" from the store catalog?`)) {
      const updated = products.filter((p) => p.id !== productId);
      if (onUpdateProducts) onUpdateProducts(updated);
      showToast(`Deleted "${productTitle}"`);
    }
  };

  const handleToggleTrending = (productId) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, isTrending: !p.isTrending };
      }
      return p;
    });
    if (onUpdateProducts) onUpdateProducts(updated);
    showToast('Updated trending status');
  };

  const handleQuickStockToggle = (productId, currentStatus) => {
    const nextStatus =
      currentStatus === 'In stock - Coimbatore studio'
        ? 'Low stock'
        : currentStatus === 'Low stock'
        ? 'Sold out'
        : 'In stock - Coimbatore studio';

    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, availability: nextStatus };
      }
      return p;
    });
    if (onUpdateProducts) onUpdateProducts(updated);
    showToast(`Stock updated: ${nextStatus}`);
  };

  // Enquiry Status Update
  const handleUpdateEnquiryStatus = (id, newStatus) => {
    setEnquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(`Enquiry ${id} updated to ${newStatus}`);
  };

  // Appointment Status Update
  const handleUpdateAppointmentStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(`Appointment ${id} marked as ${newStatus}`);
  };

  // Export Subscribers to CSV
  const handleExportSubscribersCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Email,Source,Date Joined', ...subscribers.map((s) => `"${s.email}","${s.source}","${s.date}"`)].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tonto_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported');
  };

  const handleCopySubscribers = () => {
    const emails = subscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    showToast('Copied all email addresses to clipboard');
  };

  // Reset to Factory Products
  const handleResetCatalog = () => {
    if (
      window.confirm(
        'Warning: This will reload the default TONTO catalog and remove custom additions. Proceed?'
      )
    ) {
      localStorage.removeItem('tonto_admin_products');
      window.location.reload();
    }
  };

  // Filtered Products List with safe null checks
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const title = p.title || '';
      const colour = p.colour || '';
      const category = p.category || '';
      const availability = p.availability || '';

      const matchesSearch =
        searchQuery === '' ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        colour.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategoryFilter === 'All' || category === selectedCategoryFilter;

      const matchesStock =
        selectedStockFilter === 'All' ||
        (selectedStockFilter === 'In Stock' && availability.includes('In stock')) ||
        (selectedStockFilter === 'Low Stock' && availability.includes('Low stock')) ||
        (selectedStockFilter === 'Sold Out' && availability.includes('Sold out'));

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedStockFilter]);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A1A12] flex items-center justify-center p-4 sm:p-6 text-white select-none">
        <div className="w-full max-w-md bg-[#10241A] border border-[#204E36] rounded-sm p-8 shadow-2xl relative animate-scale-up text-left">
          
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#003F25] border border-[#22C55E]/30 flex items-center justify-center text-white">
                <Lock size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
                  TONTO STUDIO DESK
                </h1>
                <p className="text-[11px] text-[#A5B4AB] tracking-widest uppercase">
                  MANAGEMENT PORTAL • COIMBATORE
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateStore}
              className="text-[#79867D] hover:text-white transition-colors p-1 cursor-pointer"
              title="Return to Storefront"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#A5B4AB] mb-1.5">
                Studio Director Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (hint: tonto)"
                className="w-full px-4 py-3 bg-[#08150E] border border-white/20 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] rounded-xs text-[13px] text-white outline-none transition-all placeholder:text-gray-600 font-mono"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xs text-red-300 text-[12px] flex items-center gap-2 animate-fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12px] uppercase tracking-widest rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#166534]"
            >
              <span>ACCESS ADMIN DESK</span>
              <Unlock size={15} />
            </button>
          </form>

          {/* Quick 1-Click Access for Studio Team */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-[#22C55E] border border-[#22C55E]/30 rounded-xs text-[11.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>1-CLICK INSTANT STUDIO ACCESS</span>
            </button>

            <button
              type="button"
              onClick={onNavigateStore}
              className="text-center text-[12px] text-gray-400 hover:text-white transition-colors cursor-pointer mt-1"
            >
              &larr; Back to Public Storefront
            </button>
          </div>

        </div>
      </div>
    );
  }

  // MAIN ADMIN CONSOLE
  return (
    <div className="min-h-screen bg-[#F6F8F6] text-[#111111] flex flex-col font-sans select-none text-left">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#003F25] text-white px-5 py-3 rounded-xs shadow-2xl flex items-center gap-2.5 text-[12.5px] font-semibold border border-white/20 animate-fade-in">
          <CheckCircle2 size={16} className="text-[#4ADE80]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0D1E16] text-white border-b border-[#1A3828] px-5 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between flex-wrap gap-4">
          
          {/* Left Brand Identifier */}
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateStore}
              className="flex items-center gap-2 group cursor-pointer"
              title="Click to visit live store"
            >
              <img
                src="/assets/logo.png"
                alt="TONTO Logo"
                className="h-6 w-auto object-contain brightness-0 invert"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-white/15 px-2 py-0.5 rounded-xs text-[#E0E5E1]">
                STUDIO DESK
              </span>
            </button>

            <span className="hidden md:inline-block text-[11.5px] text-[#A5B4AB] border-l border-white/15 pl-4">
              Coimbatore Atelier Operations
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddProduct}
              className="px-3.5 py-1.5 bg-[#003F25] hover:bg-[#002e1b] text-white border border-[#22C55E]/40 text-[11px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>ADD PIECE</span>
            </button>

            <button
              onClick={onNavigateStore}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Preview storefront as client"
            >
              <span>PREVIEW STORE</span>
              <ArrowUpRight size={13} />
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 text-[#A5B4AB] hover:text-white transition-colors cursor-pointer rounded-xs"
              title="Sign Out of Admin"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Body: Sidebar + Dynamic Panel */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border border-[#E0E5E1] rounded-xs p-3 shadow-xs shrink-0 self-start">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 text-[12.5px] font-semibold">
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Overview & Pulse</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={16} />
                <span>Products & Catalog</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('enquiries')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'enquiries'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={16} />
                <span>Client Enquiries</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'enquiries' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {enquiries.filter((e) => e.status === 'Pending').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'appointments'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar size={16} />
                <span>Studio Visits</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'appointments' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {appointments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'subscribers'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} />
                <span>Drop List & Leads</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'subscribers' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {subscribers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('promos')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'promos'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag size={16} />
                <span>Promo Codes</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-mono text-[#003F25] font-bold">
                TONTO15
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <Settings size={16} />
              <span>Store Configuration</span>
            </button>

          </nav>

          {/* Studio Summary Pill */}
          <div className="hidden md:block mt-8 pt-4 border-t border-gray-100 text-[11.5px] text-[#79867D]">
            <p className="font-semibold text-[#111111]">Coimbatore Showroom</p>
            <p className="mt-0.5">Avinashi Road, Peelamedu</p>
            <p className="text-[10.5px] text-gray-400 mt-2">Active Session: Director</p>
          </div>
        </aside>

        {/* Dynamic Panel Content */}
        <main className="flex-1 bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 shadow-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-7 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                  STORE PULSE & PERFORMANCE
                </h2>
                <p className="text-[13px] text-[#767676] mt-0.5">
                  Live metrics, active inventory, and Coimbatore showroom engagement.
                </p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Catalog Pieces</span>
                    <Package size={16} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {products.length}
                  </div>
                  <div className="text-[11px] text-[#003F25] mt-1 font-medium">
                    {products.filter((p) => p.isTrending).length} featured trending
                  </div>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Pending Enquiries</span>
                    <ShoppingBag size={16} className="text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {enquiries.filter((e) => e.status === 'Pending').length}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1 font-medium">
                    {enquiries.length} total client inquiries
                  </div>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Studio Bookings</span>
                    <Calendar size={16} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {appointments.length}
                  </div>
                  <div className="text-[11px] text-[#003F25] mt-1 font-medium">
                    Fitting requests scheduled
                  </div>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Drop VIP Leads</span>
                    <Users size={16} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {subscribers.length}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                    Subscribed to drop alerts
                  </div>
                </div>

              </div>

              {/* Quick Actions & Recent Activity Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                
                {/* Recent Inquiries List */}
                <div className="border border-[#E0E5E1] rounded-xs p-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111]">
                      Recent Customer Inquiries
                    </h3>
                    <button
                      onClick={() => setActiveTab('enquiries')}
                      className="text-[11.5px] text-[#003F25] font-semibold hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {enquiries.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 bg-[#F9FAF9] rounded-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-[#111111]">{item.clientName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-white border border-gray-200 rounded font-mono">
                              {item.id}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#4B5563] mt-0.5">
                            {item.productTitle} • Size {item.size}
                          </p>
                        </div>
                        <span className={`text-[10.5px] font-bold px-2 py-1 rounded-xs uppercase ${
                          item.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'Payment Received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Studio Appointments */}
                <div className="border border-[#E0E5E1] rounded-xs p-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111]">
                      Upcoming Studio Appointments
                    </h3>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-[11.5px] text-[#003F25] font-semibold hover:underline cursor-pointer"
                    >
                      Manage &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((apt) => (
                      <div key={apt.id} className="p-3 bg-[#F9FAF9] rounded-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-[#111111]">{apt.name}</span>
                            <span className="text-[11px] text-[#79867D]">{apt.phone}</span>
                          </div>
                          <p className="text-[11.5px] text-[#003F25] font-medium mt-0.5">
                            {apt.date} at {apt.time}
                          </p>
                        </div>
                        <span className="text-[10.5px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-xs uppercase">
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Inventory Breakdown by Category */}
              <div className="border border-[#E0E5E1] rounded-xs p-5 bg-[#F9FAF9]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#79867D] mb-3">
                  Catalog Distribution by Category
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {['Tees', 'Denim', 'Sweats', 'Bottoms', 'Shirts', 'Accessories'].map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategoryFilter(cat);
                          setActiveTab('products');
                        }}
                        className="p-3 bg-white border border-[#E0E5E1] rounded-xs text-left hover:border-[#003F25] transition-colors cursor-pointer"
                      >
                        <span className="text-[11px] font-bold text-[#79867D] uppercase block">{cat}</span>
                        <span className="text-xl font-extrabold text-[#111111]">{count}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">pieces listed</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCTS & CATALOG */}
          {activeTab === 'products' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    CATALOG MANAGEMENT
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Manage products, stock availability, photos, and sizing for the online storefront.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2.5 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12px] uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Plus size={15} />
                  <span>ADD NEW PRODUCT</span>
                </button>
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, colour, or category..."
                    className="w-full pl-9 pr-4 py-2 bg-[#F9FAF9] border border-gray-300 focus:border-[#003F25] rounded-xs text-[13px] outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[12.5px] font-semibold uppercase text-gray-700 outline-none cursor-pointer"
                >
                  <option value="All">All Categories ({products.length})</option>
                  {['Tees', 'Denim', 'Sweats', 'Bottoms', 'Shirts', 'Accessories'].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({products.filter((p) => p.category === cat).length})
                    </option>
                  ))}
                </select>

                {/* Stock Filter */}
                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value)}
                  className="px-3 py-2 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[12.5px] font-semibold uppercase text-gray-700 outline-none cursor-pointer"
                >
                  <option value="All">All Stock Levels</option>
                  <option value="In Stock">In Stock Only</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="border border-[#E0E5E1] rounded-xs overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[11px] font-bold uppercase tracking-wider text-[#79867D]">
                    <tr>
                      <th className="py-3 px-4">Image</th>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4 text-center">Trending</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                        const img = p.images?.[0] || p.image || '/assets/products/extra-wide-denim.jpg';
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                            {/* Image Thumbnail */}
                            <td className="py-3 px-4 w-16">
                              <div className="w-12 h-14 bg-gray-100 rounded-xs overflow-hidden border border-gray-200">
                                <img
                                  src={img}
                                  alt={p.title || 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>

                            {/* Title & Info */}
                            <td className="py-3 px-4 max-w-xs">
                              <span className="font-bold text-[#111111] uppercase block truncate font-['Futura_PT_Book',sans-serif]">
                                {p.title || 'Untitled Piece'}
                              </span>
                              <span className="text-[11px] text-gray-500 lowercase block">
                                {p.colour || 'vintage black'} • {Array.isArray(p.variants) ? p.variants.join('/') : p.variants}
                              </span>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium text-gray-700 uppercase">
                                {p.category || 'Tees'}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4 font-semibold text-[#111111]">
                              {p.price || 'Price on enquiry'}
                            </td>

                            {/* Stock Toggle Button */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleQuickStockToggle(p.id, p.availability)}
                                className={`px-2.5 py-1 rounded-xs text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                                  p.availability?.includes('In stock')
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : p.availability?.includes('Low stock')
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                }`}
                                title="Click to cycle stock status (In stock -> Low stock -> Sold out)"
                              >
                                {p.availability || 'In stock'}
                              </button>
                            </td>

                            {/* Trending Toggle */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleTrending(p.id)}
                                className={`w-6 h-6 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                                  p.isTrending
                                    ? 'bg-[#003F25] text-white'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                                title={p.isTrending ? 'Featured in Trending Styles' : 'Not featured'}
                              >
                                ★
                              </button>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-1.5 text-gray-600 hover:text-[#003F25] hover:bg-gray-100 rounded-xs transition-colors cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id, p.title)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          No products found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>Showing {filteredProducts.length} of {products.length} products</span>
                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="text-gray-400 hover:text-red-600 underline cursor-pointer"
                >
                  Reload Default Catalog
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENT ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    CLIENT INQUIRIES & ORDERS
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Orders and sizing queries initiated from the studio enquiry and WhatsApp concierge.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-xs">
                    {enquiries.filter((e) => e.status === 'Pending').length} Action Required
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[14px] text-[#111111]">{enq.clientName}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 rounded font-mono text-gray-600">
                          {enq.id}
                        </span>
                        <span className="text-xs text-gray-400">{enq.date}</span>
                      </div>
                      <p className="text-[12.5px] text-[#003F25] font-semibold">
                        {enq.productTitle} <span className="text-gray-500 font-normal">({enq.colour} • Size {enq.size})</span>
                      </p>
                      <p className="text-[12px] text-gray-600">
                        Contact: <span className="font-mono font-medium">{enq.contact}</span> • Notes: {enq.notes}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <select
                        value={enq.status}
                        onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xs text-[11px] font-bold uppercase tracking-wider outline-none cursor-pointer border ${
                          enq.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : enq.status === 'Payment Received'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : enq.status === 'Dispatched'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Discussion">In Discussion</option>
                        <option value="Payment Received">Payment Received</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = enq.contact.replace(/[^0-9]/g, '');
                          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=Hi%20${enq.clientName},%20following%20up%20on%20your%20TONTO%20Clothing%20enquiry%20regarding%20the%20${encodeURIComponent(enq.productTitle)}.`, '_blank');
                        }}
                        className="p-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xs transition-colors cursor-pointer"
                        title="Chat with customer on WhatsApp"
                      >
                        <PhoneCall size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STUDIO APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    COIMBATORE STUDIO APPOINTMENTS
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Private fitting sessions and archive viewing appointments at the Coimbatore studio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-5 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[14px] text-[#111111] uppercase">{apt.name}</span>
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-xs uppercase ${
                          apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[12.5px] text-[#003F25] font-semibold mt-2">
                        <Calendar size={14} />
                        <span>{apt.date} at {apt.time}</span>
                      </div>

                      <p className="text-[12px] text-gray-600 mt-2">
                        Phone: <span className="font-mono">{apt.phone}</span>
                      </p>

                      <p className="text-[12px] text-gray-500 italic mt-1">
                        "{apt.purpose}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <select
                        value={apt.status}
                        onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value)}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-xs bg-white cursor-pointer"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = apt.phone.replace(/[^0-9]/g, '');
                          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=Hi%20${apt.name},%20confirming%20your%20TONTO%20Studio%20fitting%20appointment%20on%20${apt.date}%20at%20${apt.time}.`, '_blank');
                        }}
                        className="px-3 py-1 bg-[#003F25] text-white text-[11px] font-bold uppercase rounded-xs hover:bg-[#002e1b] cursor-pointer"
                      >
                        Confirm on WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DROP SUBSCRIBERS */}
          {activeTab === 'subscribers' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    DROP ALERTS & EMAIL REGISTER
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Customer emails captured from the 15% discount popup, Own Make waitlist, and footer drops.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySubscribers}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11.5px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy size={14} />
                    <span>Copy All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSubscribersCSV}
                    className="px-3.5 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-[11.5px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="border border-[#E0E5E1] rounded-xs overflow-hidden">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[11px] font-bold uppercase tracking-wider text-[#79867D]">
                    <tr>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Source Channel</th>
                      <th className="py-3 px-4">Date Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map((sub, i) => (
                      <tr key={i} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                          {sub.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium text-gray-700">
                            {sub.source}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                          {sub.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PROMO CODES */}
          {activeTab === 'promos' && (
            <div className="space-y-5 animate-fade-in">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                  PROMOTIONS & DISCOUNT PRIVILEGES
                </h2>
                <p className="text-[13px] text-[#767676] mt-0.5">
                  Manage active coupon codes and monitor redemption rates across client checkouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promos.map((promo, idx) => (
                  <div key={idx} className="p-5 bg-[#F9FAF9] border-2 border-dashed border-[#003F25]/40 rounded-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold tracking-widest text-[#003F25] font-mono">
                          {promo.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase ${promo.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                          {promo.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{promo.discount}</p>
                      <p className="text-xs text-gray-500">{promo.type}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 text-xs text-[#79867D] flex items-center justify-between">
                      <span>Redeemed {promo.uses} times</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPromos(promos.map((p, i) => i === idx ? { ...p, active: !p.active } : p));
                          showToast(`Toggled promo code ${promo.code}`);
                        }}
                        className="text-[#003F25] font-bold hover:underline cursor-pointer"
                      >
                        {promo.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: STORE SETTINGS & CMS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                  STORE CONFIGURATION & CMS
                </h2>
                <p className="text-[13px] text-[#767676] mt-0.5">
                  Update live announcements, studio details, and store thresholds.
                </p>
              </div>

              <div className="space-y-4 text-[13px]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Sticky Top Announcement Banner Text
                  </label>
                  <input
                    type="text"
                    value={storeSettings.announcementText}
                    onChange={(e) => setStoreSettings({ ...storeSettings, announcementText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[13px] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      WhatsApp Studio Concierge
                    </label>
                    <input
                      type="text"
                      value={storeSettings.whatsappPhone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, whatsappPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[13px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={storeSettings.instagramHandle}
                      onChange={(e) => setStoreSettings({ ...storeSettings, instagramHandle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[13px] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Showroom Physical Location
                  </label>
                  <input
                    type="text"
                    value={storeSettings.studioLocation}
                    onChange={(e) => setStoreSettings({ ...storeSettings, studioLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[13px] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => showToast('Store settings saved successfully')}
                  className="px-6 py-2.5 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-sm"
                >
                  SAVE STORE CONFIGURATION
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
                  Danger Zone
                </h3>
                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
                >
                  Reset Entire Catalog to Factory Default Products
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsProductModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl bg-white border border-[#E0E5E1] shadow-2xl z-10 rounded-xs p-6 sm:p-8 my-auto animate-scale-up text-left max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-5">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                  {editingProduct ? 'EDIT PRODUCT PIECE' : 'ADD NEW CATALOG PIECE'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in the details below. This piece will immediately appear live on the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-gray-400 hover:text-black cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-[13px]">
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.title}
                  onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                  placeholder="e.g. TONTO STUDIOS WAFFLE LONGSLEEVE"
                  className="w-full px-3.5 py-2.5 border border-gray-300 focus:border-[#003F25] rounded-xs outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none bg-white font-medium cursor-pointer"
                  >
                    {['Tees', 'Denim', 'Sweats', 'Bottoms', 'Shirts', 'Accessories'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Colour / Wash
                  </label>
                  <input
                    type="text"
                    value={productFormData.colour}
                    onChange={(e) => setProductFormData({ ...productFormData, colour: e.target.value })}
                    placeholder="e.g. washed blue / black"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Price Tag / Display
                  </label>
                  <input
                    type="text"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    placeholder="Price on enquiry OR ₹2,499"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Availability / Stock
                  </label>
                  <select
                    value={productFormData.availability}
                    onChange={(e) => setProductFormData({ ...productFormData, availability: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="In stock - Coimbatore studio">In stock - Coimbatore studio</option>
                    <option value="Low stock">Low stock</option>
                    <option value="Sold out">Sold out</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Fit & Silhouette
                  </label>
                  <input
                    type="text"
                    value={productFormData.fit}
                    onChange={(e) => setProductFormData({ ...productFormData, fit: e.target.value })}
                    placeholder="e.g. Relaxed drop-shoulder"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Available Sizes (comma or slash separated)
                  </label>
                  <input
                    type="text"
                    value={productFormData.variants}
                    onChange={(e) => setProductFormData({ ...productFormData, variants: e.target.value })}
                    placeholder="S, M, L, XL"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Garment Measurements
                </label>
                <input
                  type="text"
                  value={productFormData.measurements}
                  onChange={(e) => setProductFormData({ ...productFormData, measurements: e.target.value })}
                  placeholder="Chest: 48in | Length: 29in | Sleeve: 26in"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Craftsmanship details, fabric weight, drape, styling notes..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xs outline-none"
                />
              </div>

              {/* Product Images Management with Upload & Presets */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                    Product Photos (Swipable on Storefront)
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {productFormData.images.length} photo(s) selected
                  </span>
                </div>
                
                {/* Image Thumbnails Strip */}
                <div className="flex flex-wrap gap-2.5 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xs">
                  {productFormData.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-16 h-20 bg-gray-200 rounded-xs overflow-hidden border border-gray-300 group shadow-2xs">
                      <img src={imgUrl} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700 cursor-pointer"
                          title="Remove image"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <span className="absolute bottom-0 left-0 bg-black/70 text-white text-[9px] px-1 font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Upload & Preset Options */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* File Upload from Device */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="admin-product-file-upload"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white border border-gray-300 hover:border-[#003F25] text-[#111111] text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Upload size={14} className="text-[#003F25]" />
                      <span>Upload from Device</span>
                    </button>

                    {/* Presets dropdown */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddPresetImage(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-xs text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Choose from Studio Library...</option>
                      {ASSET_LIBRARY_PRESETS.map((preset, pIdx) => (
                        <option key={pIdx} value={preset.url}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual URL Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or paste an image URL here..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xs text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-gray-800 text-white text-xs font-bold uppercase rounded-xs hover:bg-black cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Trending Checkbox */}
              <div className="flex items-center gap-2 pt-2 pb-1">
                <input
                  type="checkbox"
                  id="trending-check"
                  checked={productFormData.isTrending}
                  onChange={(e) => setProductFormData({ ...productFormData, isTrending: e.target.checked })}
                  className="w-4 h-4 accent-[#003F25] cursor-pointer"
                />
                <label htmlFor="trending-check" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Feature in "Trending Styles" row on Homepage
                </label>
              </div>

              {/* Save & Cancel CTAs */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 hover:text-black text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-7 py-2.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer shadow-sm transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Create & Publish Piece'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
