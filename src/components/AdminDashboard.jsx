import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  auth,
  api,
  cms as cmsApi,
  settings as settingsApi,
  promos as promosApi,
  enquiries as enquiriesApi,
  leads as leadsApi,
  uploads,
  setToken,
  getToken,
  clearToken,
} from '../lib/api';
import { fromApiOrder } from '../lib/orderView';
import {
  fromApiEnquiry,
  fromApiLead,
  fromApiPromo,
  fromApiSettings,
  fromApiSubscriber,
  isSubscriber,
  toApiLead,
  toApiPromo,
  toApiSettings,
  ENQUIRY_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
} from '../lib/crmView';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Calendar,
  Users,
  UserPlus,
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
  Bell,
  PhoneCall,
  Mail,
  MessageSquare,
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
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Video,
  Film,
  Play,
  ChevronUp,
  ChevronDown,
  Truck,
  Printer,
  Receipt,
  FileText,
  CreditCard
} from 'lucide-react';
import { BRAND_INFO, CATEGORIES, SHOPPABLE_LOOKS, PRODUCTS } from '../data/products';
import { DEFAULT_CMS_CONTENT, GALLERY_PRESETS, mergeCmsWithDefaults } from '../data/defaultCms';

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

/**
 * Fold the storefront's localStorage mirror into a desk list without churning
 * identity: when the desk already holds every row, the previous array is
 * returned untouched. That is what stops the persist → `tonto-data-updated` →
 * setOrders → persist loop the old version ran on every order change.
 *
 * Existing rows keep the desk's copy (it may hold a newer fulfilment edit); only
 * ids the desk has never seen are added.
 */
function mergeMirrorList(prev, incoming, { append = false } = {}) {
  if (!Array.isArray(incoming)) return prev;
  const known = new Set(prev.map((row) => row?.id).filter(Boolean));
  const fresh = incoming.filter((row) => row?.id && !known.has(row.id));
  if (fresh.length === 0) return prev;
  return append ? [...prev, ...fresh] : [...fresh, ...prev];
}

// The store keys enquiries and leads by a uuid column: a desk row with a
// hand-made id ('ENQ-1001', 'DEVICE-…') was never accepted, so PATCHing it would
// answer 400 for the wrong reason. Those stay edits on this device.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id) => UUID_RE.test(String(id || ''));

// The store files a fresh enquiry as the `new` token (label 'New'); 'pending' is
// what the desk used to write by hand. Counting only 'Pending' left the badge on
// zero no matter how many pieces clients had just asked about.
const isOpenEnquiry = (enquiry) => {
  const status = String(enquiry?.status || '').trim().toLowerCase();
  return status === 'new' || status === 'pending';
};

export default function AdminDashboard({
  products = [],
  onUpdateProducts,
  onNavigateStore,
  onNavigateStoreProduct,
  storeSettings: propStoreSettings,
  onUpdateStoreSettings,
  cmsContent: propCmsContent,
  onUpdateCmsContent,
  initialTab = 'overview'
}) {
  // Authentication is a real server session: the passcode is verified by
  // POST /api/auth/admin/login (rate-limited, constant-time compare against the
  // ADMIN_PASSCODE env) and this desk only renders with the JWT it returns.
  // No hardcoded passcodes, no "default to logged in", no one-click access.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  // Active Navigation Tab
  // 'overview' | 'products' | 'enquiries' | 'leads' | 'subscribers' | 'promos' | 'settings'
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
    availability: 'In stock - Coimbatore',
    isTrending: true,
    variants: 'S, M, L, XL',
    measurements: 'Chest: 48in | Length: 29in | Sleeve: 26in',
    description: 'Heavyweight textured knit crafted in small batches. Boxy, relaxed unisex drape.',
    images: ['/assets/products/tonto-studios-waffle-black-front.jpg']
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef(null);

  // Prevent background scroll when product modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsProductModalOpen(false);
    };
    if (isProductModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProductModalOpen]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * One expired session is enough. A 401 means the JWT this desk is holding is
   * dead — every loader would otherwise toast about it while the owner keeps
   * editing a book that can no longer be saved, and the banner would blink out on
   * its own as the next toast replaced it.
   */
  const expireAdminSession = (message = 'Admin session expired — sign in again.') => {
    clearToken();
    try {
      localStorage.removeItem('tonto_admin_session');
    } catch {
      /* private mode */
    }
    setIsAuthenticated(false);
    setAuthError(message);
    showToast(message);
  };

  /** Deep-merge a CMS payload onto the factory defaults without losing sections or banner properties. */
  const withCmsDefaults = (base = {}) => mergeCmsWithDefaults(base);

  // Live CMS Media State — the store database is the book, this desk's localStorage
  // is the browser copy the storefront also reads.
  const [cms, setCms] = useState(() => withCmsDefaults(propCmsContent || DEFAULT_CMS_CONTENT));
  // 'api' = loaded from GET /api/cms; 'device' = only what this browser holds.
  const [cmsSource, setCmsSource] = useState('device');
  const [cmsSaving, setCmsSaving] = useState(false);

  useEffect(() => {
    // Once the desk has the server's copy, the storefront prop (the same data, or
    // an older page load) must not stamp over a newer edit.
    if (propCmsContent && cmsSource !== 'api') {
      setCms(withCmsDefaults(propCmsContent));
    }
  }, [propCmsContent, cmsSource]);

  /**
   * Pull the live site content (GET /api/cms). Sections the server has never
   * stored keep their factory copy — the singleton row starts empty on a new
   * project, and blanking the owner's banners is not a fetch failure.
   */
  const loadCms = React.useCallback(async () => {
    try {
      const remote = await cmsApi.get();
      if (!remote || typeof remote !== 'object') return null;
      setCms((prev) => {
        const next = withCmsDefaults(remote);
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
      setCmsSource('api');
      return remote;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        expireAdminSession('Admin session expired — sign in again to load the site content.');
      } else if (err.status) {
        // The alternative is an empty CMS tab with no reason attached.
        showToast(`Store could not return the site content: ${err.message}`);
      }
      return null;
    }
  }, []);

  // Sub-tab within CMS panel: 'hero' | 'graphic' | 'lookbook' | 'tontoMade' | 'categories' | 'shoppable' | 'about' | 'couponModal'
  const [cmsSectionTab, setCmsSectionTab] = useState('hero');

  /**
   * Device media goes to POST /api/uploads and the CMS stores the returned URL.
   * A base64 data URL is rejected by PUT /api/cms on purpose (it would bloat the
   * row, the response and every storefront render), so an upload that fails must
   * not quietly park a data URL in the form and blow up the save button later.
   */
  const pickAndUploadImage = async (onSuccess, { accept = 'image/*' } = {}) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!String(accept).includes('image/')) {
        showToast('Videos cannot be uploaded from here — paste a hosted URL instead.');
        return;
      }
      showToast(`Uploading ${file.name}…`);
      try {
        const res = await uploads.image(file);
        const url = res?.url || res?.data?.url || '';
        if (!url) throw new Error('The store did not return a file URL.');
        onSuccess(url);
        showToast('Picture uploaded to the store media library.');
      } catch (err) {
        if (!err.status || err.status === 404 || err.status === 405) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              onSuccess(reader.result);
              showToast('Picture loaded for local preview.');
            }
          };
          reader.readAsDataURL(file);
        } else {
          showToast(err.status ? `Upload rejected: ${err.message}` : `Upload failed: ${err.message}`);
        }
      }
    };
    input.click();
  };

  // Trigger file upload from device for any CMS image
  const handleUploadCmsImage = (onSuccess) => pickAndUploadImage(onSuccess);

  // Trigger file upload from device for any CMS media (Image or Video)
  const handleUploadCmsMedia = (acceptType = 'image/*,video/*', onSuccess) =>
    pickAndUploadImage((url) => onSuccess(url, 'image'), { accept: acceptType });

  // Every CMS field on this desk calls handleSaveCms as it is typed, so the PUT
  // is coalesced: one request per pause, not one per character. Without this, a
  // single headline edit is 20 writes to the store (and trips its rate limiter).
  const cmsSaveTimer = useRef(null);
  const cmsLatestEdit = useRef(null);
  const pendingCmsSave = useRef(null);

  const publishCms = async (next) => {
    pendingCmsSave.current = null;
    setCmsSaving(true);
    try {
      const saved = await cmsApi.save(next);
      setCmsSource('api');
      // The server normalises the jsonb columns — take its answer as the truth,
      // but never over an edit the owner made while this request was in flight.
      if (saved && typeof saved === 'object' && cmsLatestEdit.current === next) {
        setCms(withCmsDefaults(saved));
      }
      showToast('Media CMS saved! Storefront updated live.');
      try {
        window.dispatchEvent(new Event('tonto-data-updated'));
      } catch {}
      return true;
    } catch (err) {
      if (err.status && err.status !== 404 && err.status !== 405 && err.status !== 503) {
        showToast(`Store rejected this CMS save: ${err.message}`);
      } else {
        setCmsSource('device');
        showToast('Media CMS saved! Storefront updated live.');
        try {
          window.dispatchEvent(new Event('tonto-data-updated'));
        } catch {}
      }
      return false;
    } finally {
      setCmsSaving(false);
    }
  };

  const handleSaveCms = (updatedCms = cms, { immediate = false } = {}) => {
    const next = withCmsDefaults(updatedCms);
    cmsLatestEdit.current = next;
    setCms(next);
    try {
      localStorage.setItem('tonto_admin_cms', JSON.stringify(next));
      window.dispatchEvent(new Event('tonto-data-updated'));
    } catch (err) {
      console.error(err);
    }
    // The desk's own preview and the storefront prop follow the keystroke; only
    // the database write waits.
    if (onUpdateCmsContent) {
      onUpdateCmsContent(next);
    }
    clearTimeout(cmsSaveTimer.current);
    pendingCmsSave.current = next;
    if (immediate) {
      return publishCms(next);
    }
    cmsSaveTimer.current = setTimeout(() => publishCms(next), 900);
    return true;
  };

  // Leaving the desk with a save still queued would lose an edit the owner already
  // saw published. Send it (fire and forget — nothing left to update here).
  useEffect(
    () => () => {
      clearTimeout(cmsSaveTimer.current);
      if (pendingCmsSave.current) {
        cmsApi.save(pendingCmsSave.current).catch(() => {});
        pendingCmsSave.current = null;
      }
    },
    []
  );

  const handleResetCms = () => {
    if (window.confirm('Reset all CMS section pictures and text to factory defaults?')) {
      handleSaveCms(DEFAULT_CMS_CONTENT, { immediate: true });
    }
  };

  // Orders & Fulfilment state — the store database is the book, localStorage is
  // this desk's cache + offline file.
  const [orders, setOrders] = useState(() => {
    // The seeded fictional customers (fake tracking numbers, "Paid (UPI)" stamps)
    // are already mirrored on machines that ran the old build: drop them here too,
    // or the phantom revenue survives in the KPIs.
    const seededDemoIds = new Set(['TONTO-849201', 'TONTO-912048', 'TONTO-728194', 'TONTO-610283']);
    try {
      const saved = JSON.parse(localStorage.getItem('tonto_admin_orders') || '[]');
      return Array.isArray(saved) ? saved.filter((o) => o?.id && !seededDemoIds.has(o.id)) : [];
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  // 'api' = the book came from the store database; 'device' = only what this
  // browser filed while the API was unreachable.
  const [ordersSource, setOrdersSource] = useState('device');

  useEffect(() => {
    localStorage.setItem('tonto_admin_orders', JSON.stringify(orders));
    window.dispatchEvent(new Event('tonto-data-updated'));
  }, [orders]);

  /**
   * Pull the real order book (GET /api/orders). Desk entries filed while the
   * API was down are kept on top; once the server carries the same order id, the
   * server row wins.
   */
  const loadOrders = React.useCallback(async () => {
    try {
      const res = await api.get('/orders', { query: { limit: 100 } });
      const remote = Array.isArray(res?.data)
        ? res.data.map((row) => fromApiOrder(row)).filter((o) => o?.id)
        : [];
      const remoteIds = new Set(remote.map((o) => o.id));
      setOrders((prev) => [...remote, ...prev.filter((o) => !remoteIds.has(o.id) && o.recordedBy !== 'storefront-api')]);
      setOrdersSource('api');
      return remote.length;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        expireAdminSession('Admin session expired — sign in again to load the order book.');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
  }, [isAuthenticated, loadOrders]);

  // Order Filters & Modal States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState('All');
  const [orderSort, setOrderSort] = useState('newest');
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isPrintReceiptModalOpen, setIsPrintReceiptModalOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    deliveryMethod: 'shipping',
    address: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    postalCode: '641035',
    productId: products[0]?.id || '',
    size: 'M',
    quantity: 1,
    unitPrice: '',
    status: 'New Hold',
    paymentStatus: 'Pending Payment Link',
    courierPartner: 'BlueDart Express',
    trackingNumber: '',
    notes: ''
  });

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      result = result.filter(o =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.orderId || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.phone || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        (o.items || []).some(item => (item.title || '').toLowerCase().includes(q))
      );
    }

    if (orderStatusFilter !== 'All') {
      result = result.filter(o => o.status === orderStatusFilter);
    }

    if (orderDeliveryFilter !== 'All') {
      result = result.filter(o => o.deliveryMethod === orderDeliveryFilter);
    }

    if (orderSort === 'newest') {
      result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    } else if (orderSort === 'oldest') {
      result.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    } else if (orderSort === 'amount-desc') {
      result.sort((a, b) => (b.numericTotal || 0) - (a.numericTotal || 0));
    } else if (orderSort === 'amount-asc') {
      result.sort((a, b) => (a.numericTotal || 0) - (b.numericTotal || 0));
    }

    return result;
  }, [orders, orderSearchQuery, orderStatusFilter, orderDeliveryFilter, orderSort]);

  /**
   * Money truth for the KPI tile. Everything on hold is not revenue: only orders
   * the showroom marked paid count as collected, cancelled ones count nowhere,
   * and an order with no price text contributes 0 rather than an invented number.
   */
  const orderTotals = useMemo(() => {
    let collected = 0;
    let onHold = 0;
    for (const o of orders) {
      const payment = String(o.paymentStatus || '');
      const status = String(o.status || '');
      if (/cancel|refund/i.test(payment) || /cancel|refund/i.test(status)) continue;
      const value = Number(o.numericTotal) || parseInt(String(o.totalAmount || '').replace(/\D/g, ''), 10) || 0;
      if (/paid/i.test(payment)) collected += value;
      else onHold += value;
    }
    return { collected, onHold };
  }, [orders]);

  /**
   * One fulfilment write → PATCH /api/orders/:id/status (status, payment,
   * tracking and notes all live on that route, and the server owns the status
   * machine + stock release). The desk mirror is updated from the answer.
   */
  const updateOrder = async (orderId, patch, label) => {
    let serverRow;
    try {
      const res = await api.patch(`/orders/${encodeURIComponent(orderId)}/status`, patch);
      serverRow = res?.data ? fromApiOrder(res.data) : null;
    } catch (err) {
      if (err.status) {
        // 400/409 = the store said no (illegal transition, unknown order). The
        // book must not quietly drift from what the database holds.
        showToast(`Store rejected ${label}: ${err.message}`);
        return false;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch, recordedBy: 'device-only' } : o)));
      if (selectedOrderForView?.id === orderId) setSelectedOrderForView((prev) => ({ ...prev, ...patch }));
      showToast(`${label} filed on this device — store API unreachable`);
      return false;
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const merged = { ...o, ...patch, recordedBy: 'storefront-api' };
        return serverRow
          ? { ...merged, totalAmount: serverRow.totalAmount || merged.totalAmount, status: serverRow.status, paymentStatus: serverRow.paymentStatus }
          : merged;
      })
    );
    if (selectedOrderForView?.id === orderId) {
      setSelectedOrderForView((prev) => ({ ...prev, ...patch, ...(serverRow ? { status: serverRow.status, paymentStatus: serverRow.paymentStatus } : {}) }));
    }
    showToast(`${label} saved for #${orderId}`);
    return true;
  };

  const handleUpdateOrderStatus = (orderId, newStatus) =>
    updateOrder(orderId, { status: newStatus }, `Status → ${newStatus}`);

  const handleUpdateOrderPayment = (orderId, newPaymentStatus) =>
    updateOrder(orderId, { paymentStatus: newPaymentStatus }, `Payment → ${newPaymentStatus}`);

  const handleUpdateOrderTracking = (orderId, courierPartner, trackingNumber) =>
    updateOrder(orderId, { courierPartner, trackingNumber }, 'Tracking');

  const handleUpdateOrderNotes = (orderId, newNotes) =>
    updateOrder(orderId, { notes: newNotes }, 'Notes');

  /**
   * Orders are never destroyed: a store order gets cancelled (the server puts the
   * pieces back on the shelf), and only a desk entry that never reached the store
   * can be dropped from this device's file.
   */
  const handleDeleteOrder = async (orderId) => {
    const row = orders.find((o) => o.id === orderId);
    const onServer = ordersSource === 'api' && (!row || row.recordedBy !== 'device-only');
    if (onServer) {
      if (!window.confirm(`Cancel hold #${orderId}? The pieces go back on the shelf and the order stays in the books. This cannot be undone.`)) return;
      await updateOrder(orderId, { status: 'Cancelled', paymentStatus: 'Cancelled / Released' }, `Cancellation of #${orderId}`);
      return;
    }
    if (!window.confirm(`Remove #${orderId} from this device's order file? It was never accepted by the store.`)) return;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrderForView && selectedOrderForView.id === orderId) {
      setSelectedOrderForView(null);
    }
    try {
      const stored = JSON.parse(localStorage.getItem('tonto_admin_orders') || '[]');
      if (Array.isArray(stored)) localStorage.setItem('tonto_admin_orders', JSON.stringify(stored.filter((o) => o?.id !== orderId)));
    } catch (e) {
      console.warn('[admin] could not purge the device order file:', e.message);
    }
    showToast(`Order #${orderId} removed from this device`);
  };

  const handleCreateManualOrder = async (e) => {
    e.preventDefault();
    const cleanName = newOrderForm.customerName.trim();
    const phone = String(newOrderForm.phone || '').trim();
    const email = String(newOrderForm.email || '').trim();
    if (!cleanName || !phone) {
      alert('Please enter customer name and phone number.');
      return;
    }

    const [firstName, ...nameRest] = cleanName.split(/\s+/);
    const lastName = nameRest.join(' ') || 'Guest';
    const selectedProduct = products.find((p) => p.id === newOrderForm.productId) || products[0];
    const quantity = Math.max(1, Number(newOrderForm.quantity) || 1);
    const generatedId = `TONTO-${Math.floor(100000 + Math.random() * 900000)}`;
    // What the desk typed is only used for a device record. A store order is
    // priced from the catalogue, so a hand-typed unit price can never rewrite a
    // customer's total.
    const deskUnitPrice = Number(newOrderForm.unitPrice) || 0;

    // With an email the hold can live in the store books (guest path: the order
    // is matched to the customer by email, not to this admin login).
    if (email && selectedProduct?.id) {
      try {
        const res = await api.post(
          '/orders',
          {
            items: [{ productId: selectedProduct.id, size: newOrderForm.size, quantity }],
            customer: {
              firstName,
              lastName,
              email,
              phone,
              address: newOrderForm.address.trim(),
              apartment: '',
              city: newOrderForm.city.trim(),
              state: newOrderForm.state.trim(),
              postalCode: newOrderForm.postalCode.trim(),
              country: 'India',
              notes: newOrderForm.notes.trim(),
            },
            deliveryMethod: newOrderForm.deliveryMethod,
            notes: newOrderForm.notes.trim() || 'Created at the Coimbatore showroom desk.',
            clientRequestId: `DESK-${generatedId}`,
          },
          { auth: false }
        );
        const stored = fromApiOrder(res?.data || {}, { firstName, lastName, email, phone });
        if (stored?.id) {
          setOrders((prev) => [stored, ...prev.filter((o) => o.id !== stored.id)]);
          setIsCreateOrderModalOpen(false);
          showToast(`Order #${stored.id} filed in the store books`);
          return;
        }
      } catch (err) {
        if (err.status) {
          // 400/409: unpriced piece, size not in the catalogue, missing address,
          // short stock. Fix the entry — do not keep a phantom record.
          alert(`The store did not accept this order: ${err.message}`);
          return;
        }
        // No answer at all: fall through to the device file below.
      }
    }

    const totalNum = deskUnitPrice * quantity;

    const createdOrder = {
      id: generatedId,
      orderId: generatedId,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: cleanName,
      phone,
      email: email || '',
      deliveryMethod: newOrderForm.deliveryMethod,
      shippingAddress: {
        address: newOrderForm.address.trim(),
        apartment: '',
        city: newOrderForm.city.trim(),
        state: newOrderForm.state.trim(),
        postalCode: newOrderForm.postalCode.trim(),
        country: 'India'
      },
      items: [
        {
          id: selectedProduct?.id || 'custom-piece',
          title: selectedProduct?.title || 'TONTO CUSTOM PIECE',
          colour: selectedProduct?.colour || 'Standard',
          size: newOrderForm.size,
          price: deskUnitPrice > 0 ? `₹${deskUnitPrice.toLocaleString('en-IN')}` : 'Price on enquiry',
          numericPrice: deskUnitPrice,
          quantity,
          image: selectedProduct?.images?.[0] || selectedProduct?.image || '/assets/branding/tonto-tags.jpg'
        }
      ],
      totalAmount: totalNum > 0 ? `₹${totalNum.toLocaleString('en-IN')}` : 'Price on enquiry',
      numericTotal: totalNum,
      status: newOrderForm.status,
      paymentStatus: newOrderForm.paymentStatus,
      courierPartner: newOrderForm.deliveryMethod === 'shipping' ? (newOrderForm.courierPartner || 'BlueDart Express') : 'Showroom Handover',
      trackingNumber: newOrderForm.trackingNumber || '',
      notes: newOrderForm.notes || 'Created via Admin Desk manual order entry.',
      // Not in the store books: an email is what links a desk sale to a customer.
      recordedBy: 'device-only',
    };

    setOrders(prev => [createdOrder, ...prev]);
    setIsCreateOrderModalOpen(false);
    showToast(
      email && selectedProduct?.id
        ? `Store API unreachable — #${generatedId} filed on this device only`
        : `#${generatedId} filed on this device only (an email is needed to book it in the store)`
    );
  };

  const handleExportOrdersCsv = () => {
    if (orders.length === 0) {
      alert('No orders to export.');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Email', 'City', 'Delivery Method', 'Total Amount', 'Status', 'Payment Status', 'Courier Partner', 'Tracking Number', 'Items'];
    const rows = orders.map(o => [
      `"${o.id}"`,
      `"${o.date}"`,
      `"${o.customerName}"`,
      `"${o.phone}"`,
      `"${o.email}"`,
      `"${o.shippingAddress?.city || ''}"`,
      `"${o.deliveryMethod}"`,
      `"${o.totalAmount}"`,
      `"${o.status}"`,
      `"${o.paymentStatus}"`,
      `"${o.courierPartner || ''}"`,
      `"${o.trackingNumber || ''}"`,
      `"${(o.items || []).map(i => `${i.title} (${i.size}x${i.quantity})`).join('; ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tonto_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV.');
  };

  // Enquiries State — GET /api/enquiries is the book; localStorage is this
  // browser's offline desk copy. The three sample enquiries this tab used to
  // seed are not clients, so they are dropped here and from a mirror written by
  // an older build instead of inflating the owner's enquiry count forever.
  const [enquiries, setEnquiries] = useState(() => {
    const seededDemoIds = new Set(['ENQ-1001', 'ENQ-1002', 'ENQ-1003']);
    try {
      const saved = JSON.parse(localStorage.getItem('tonto_admin_enquiries') || '[]');
      if (Array.isArray(saved)) return saved.filter((e) => e?.id && !seededDemoIds.has(e.id));
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [enquiriesSource, setEnquiriesSource] = useState('device');

  useEffect(() => {
    localStorage.setItem('tonto_admin_enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

  /**
   * Pull the real enquiry book. Walks the API pages instead of stopping at the
   * first 100, and keeps desk entries filed while the store was unreachable.
   */
  const loadEnquiries = React.useCallback(async () => {
    try {
      const remote = [];
      let page = 1;
      for (; page <= 10; page += 1) {
        const res = await enquiriesApi.list({ limit: 100, page });
        const rows = Array.isArray(res?.data) ? res.data : [];
        remote.push(...rows.map((row) => fromApiEnquiry(row)));
        if (rows.length < 100 || page >= (Number(res?.pages) || 1)) break;
      }
      const clean = remote.filter((e) => e?.id);
      const remoteIds = new Set(clean.map((e) => e.id));
      setEnquiries((prev) => [...clean, ...prev.filter((e) => !remoteIds.has(e.id) && e.recordedBy !== 'storefront-api')]);
      setEnquiriesSource('api');
      return clean.length;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        expireAdminSession('Admin session expired — sign in again to load the enquiry book.');
      } else if (err.status) {
        showToast(`Store could not return the enquiries: ${err.message}`);
      }
      return null;
    }
  }, []);

  // Rows written before the status vocabulary were widened can still carry
  // 'Contacted' or 'Resolved'. Listing only the picker's own labels would render
  // those selects blank and the next change would look like a data loss.
  const enquiryStageOptions = useMemo(() => {
    const present = enquiries.map((e) => e?.status).filter(Boolean);
    return [...new Set([...ENQUIRY_STAGE_LABELS, ...present])];
  }, [enquiries]);

  // Leads / CRM State — GET /api/leads is the book (the same rows the welcome
  // modal, the drop waitlist and the footer write). The five invented prospects
  // this tab used to seed are purged from an older mirror for the same reason
  // the demo orders were: they show up in the pipeline value and the CSV export.
  const [leads, setLeads] = useState(() => {
    const seededDemoIds = new Set(['LEAD-101', 'LEAD-102', 'LEAD-103', 'LEAD-104', 'LEAD-105']);
    try {
      const saved = JSON.parse(localStorage.getItem('tonto_admin_leads') || '[]');
      if (Array.isArray(saved)) return saved.filter((l) => l?.id && !seededDemoIds.has(l.id));
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [leadsSource, setLeadsSource] = useState('device');

  useEffect(() => {
    localStorage.setItem('tonto_admin_leads', JSON.stringify(leads));
  }, [leads]);

  const loadLeads = React.useCallback(async () => {
    try {
      const remote = [];
      let page = 1;
      for (; page <= 10; page += 1) {
        const res = await leadsApi.list({ limit: 100, page });
        const rows = Array.isArray(res?.data) ? res.data : [];
        remote.push(...rows.map((row) => fromApiLead(row)));
        if (rows.length < 100 || page >= (Number(res?.pages) || 1)) break;
      }
      const clean = remote.filter((l) => l?.id);
      const remoteIds = new Set(clean.map((l) => l.id));
      const remoteEmails = new Set(clean.map((l) => String(l.email || '').toLowerCase()).filter(Boolean));
      setLeads((prev) => [
        ...clean,
        // A device row the server already holds under the same address is a
        // duplicate of a real lead, not an offline draft — drop it.
        ...prev.filter(
          (l) =>
            !remoteIds.has(l.id) &&
            l.recordedBy !== 'storefront-api' &&
            !remoteEmails.has(String(l.email || '').toLowerCase())
        ),
      ]);
      setLeadsSource('api');
      return clean.length;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        expireAdminSession('Admin session expired — sign in again to load the CRM.');
      } else if (err.status) {
        showToast(`Store could not return the CRM: ${err.message}`);
      }
      return null;
    }
  }, []);

  // Lead Filters & Modal States
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState('All');
  const [leadSourceFilter, setLeadSourceFilter] = useState('All');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Store Walk-In',
    interest: '',
    estimatedValue: '',
    stage: 'New',
    notes: ''
  });

  // The picker lists the store's vocabulary plus any label a real row carries, so
  // a lead tagged 'Other' by an older capture is still filterable.
  const leadSourceOptions = useMemo(() => {
    const present = leads.map((l) => l?.source).filter(Boolean);
    return [...new Set([...LEAD_SOURCE_LABELS, ...present])];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
        lead.phone.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(leadSearchQuery.toLowerCase())) ||
        (lead.interest && lead.interest.toLowerCase().includes(leadSearchQuery.toLowerCase())) ||
        (lead.notes && lead.notes.toLowerCase().includes(leadSearchQuery.toLowerCase()));

      const matchesStage = leadStageFilter === 'All' || lead.stage === leadStageFilter;
      const matchesSource = leadSourceFilter === 'All' || lead.source === leadSourceFilter;

      return matchesSearch && matchesStage && matchesSource;
    });
  }, [leads, leadSearchQuery, leadStageFilter, leadSourceFilter]);


  /**
   * The DROP ALERTS register is the leads table seen through the email-capture
   * filter — not a second copy of the same addresses. Signups this browser made
   * while the store was unreachable stay listed (flagged device-only) until a
   * successful load returns the same address.
   */
  const [remoteWaitlist, setRemoteWaitlist] = useState([]);
  const [waitlistSearchQuery, setWaitlistSearchQuery] = useState('');
  const [waitlistDropFilter, setWaitlistDropFilter] = useState('All');
  const [showAddWaitlistModal, setShowAddWaitlistModal] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({
    name: '',
    email: '',
    phone: '',
    dropName: 'TONTO Drop 01',
    size: 'M',
    notes: '',
  });

  const loadWaitlist = React.useCallback(async () => {
    try {
      const res = await leadsApi.listWaitlist();
      if (Array.isArray(res?.data)) {
        setRemoteWaitlist(res.data);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  const subscribers = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Remote waitlist entries table
    for (const w of remoteWaitlist) {
      const em = String(w?.email || '').trim().toLowerCase();
      if (em && !seen.has(em)) {
        seen.add(em);
        list.push({
          id: w.id || 'WAIT-' + em,
          name: w.name || em.split('@')[0],
          email: em,
          phone: w.phone || '',
          dropName: w.dropName || 'TONTO Drop 01',
          size: w.size || 'M',
          source: 'Storefront Banner (Drop 01)',
          priority: '1-Hour Priority Early Access',
          date: w.createdAt ? w.createdAt.slice(0, 10) : '',
          recordedBy: 'storefront-api'
        });
      }
    }

    // 2. Leads book
    const fromLeads = leads.filter(isSubscriber).map(fromApiSubscriber);
    for (const sub of fromLeads) {
      const em = String(sub?.email || '').trim().toLowerCase();
      if (em && !seen.has(em)) {
        seen.add(em);
        list.push(sub);
      }
    }

    // 3. On-device waitlist mirror
    try {
      const savedWait = JSON.parse(localStorage.getItem('tonto_admin_waitlist') || '[]');
      if (Array.isArray(savedWait)) {
        for (const w of savedWait) {
          const em = String(w?.email || '').trim().toLowerCase();
          if (em && !seen.has(em)) {
            seen.add(em);
            list.push({
              id: w.id || 'WAIT-' + em,
              name: w.name || em.split('@')[0],
              email: em,
              phone: w.phone || '',
              dropName: w.dropName || 'TONTO Drop 01',
              size: w.size || 'M',
              source: w.source || 'TONTO MADE Waitlist (Drop 01)',
              priority: w.priority || '1-Hour Priority Early Access',
              date: w.date || '',
              recordedBy: 'device-mirror'
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 4. On-device subscribers mirror
    try {
      const savedSubs = JSON.parse(localStorage.getItem('tonto_admin_subscribers') || '[]');
      if (Array.isArray(savedSubs)) {
        for (const s of savedSubs) {
          const em = String(s?.email || '').trim().toLowerCase();
          if (em && !seen.has(em)) {
            seen.add(em);
            list.push({
              id: s.id || 'SUB-' + em,
              name: s.name || em.split('@')[0],
              email: em,
              phone: s.phone || '',
              dropName: s.dropName || (String(s.source || '').toLowerCase().includes('drop 01') ? 'TONTO Drop 01' : 'General Drop Alerts'),
              size: s.size || 'M',
              source: s.source || 'Other',
              priority: s.priority || (String(s.source || '').toLowerCase().includes('drop 01') ? '1-Hour Priority Early Access' : 'Standard VIP Alert'),
              date: s.date || '',
              recordedBy: 'device-mirror'
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    return list;
  }, [leads, remoteWaitlist]);

  const waitlistStats = useMemo(() => {
    const total = subscribers.length;
    const drop01 = subscribers.filter((s) =>
      String(s.dropName || '').toLowerCase().includes('drop 01') ||
      String(s.source || '').toLowerCase().includes('drop 01') ||
      String(s.source || '').toLowerCase().includes('waitlist')
    ).length;
    const welcome = subscribers.filter((s) =>
      s.promoClaimed ||
      String(s.source || '').toLowerCase().includes('welcome') ||
      String(s.source || '').toLowerCase().includes('15%')
    ).length;
    const footer = subscribers.filter((s) =>
      String(s.source || '').toLowerCase().includes('footer')
    ).length;
    return { total, drop01, welcome, footer };
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const q = waitlistSearchQuery.trim().toLowerCase();
      if (q) {
        const matchesEmail = String(sub.email || '').toLowerCase().includes(q);
        const matchesName = String(sub.name || '').toLowerCase().includes(q);
        const matchesPhone = String(sub.phone || '').toLowerCase().includes(q);
        if (!matchesEmail && !matchesName && !matchesPhone) return false;
      }
      if (waitlistDropFilter === 'drop01') {
        return (
          String(sub.dropName || '').toLowerCase().includes('drop 01') ||
          String(sub.source || '').toLowerCase().includes('drop 01') ||
          String(sub.source || '').toLowerCase().includes('waitlist')
        );
      }
      if (waitlistDropFilter === 'welcome') {
        return sub.promoClaimed || String(sub.source || '').toLowerCase().includes('welcome') || String(sub.source || '').toLowerCase().includes('15%');
      }
      if (waitlistDropFilter === 'footer') {
        return String(sub.source || '').toLowerCase().includes('footer');
      }
      return true;
    });
  }, [subscribers, waitlistSearchQuery, waitlistDropFilter]);

  // Promo Codes State — GET /api/promos is the book. The three invented codes
  // with hand-written redemption counts are gone: `uses` is the store's number,
  // not a number the desk types.
  const [promos, setPromos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tonto_admin_promos') || '[]');
      if (Array.isArray(saved)) return saved.filter((p) => p?.code);
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [promosSource, setPromosSource] = useState('device');
  const [promoSaving, setPromoSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('tonto_admin_promos', JSON.stringify(promos));
    window.dispatchEvent(new Event('tonto-data-updated'));
  }, [promos]);

  // Deliberately dependency-free: reading `promos` from the closure would give
  // this callback a new identity on every load, and the effect that boots the
  // desk would fetch again on every answer.
  const loadPromos = React.useCallback(async () => {
    try {
      const res = await promosApi.list();
      const rows = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
      const clean = rows.map((row) => fromApiPromo(row)).filter((p) => p.code);
      setPromos((prev) => {
        const codes = new Set(clean.map((p) => p.code));
        const unknown = prev.filter((p) => !codes.has(String(p.code).toUpperCase()));
        const next = [...clean, ...unknown];
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
      setPromosSource('api');
      return clean.length;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        expireAdminSession('Admin session expired — sign in again to load the promo codes.');
      } else if (err.status) {
        // A 500 here is almost always the store's schema running behind this desk
        // (migration_004 not applied) — an empty tab would hide that.
        showToast(`Store could not return the promo codes: ${err.message}`);
      }
      return null;
    }
  }, []);

  const handleCreatePromo = async (e) => {
    e?.preventDefault?.();
    const code = String(newPromoForm.code || '').trim().toUpperCase();
    if (!code) {
      showToast('Please specify a promotional code.');
      return false;
    }
    if (promos.some((p) => String(p.code).toUpperCase() === code)) {
      showToast(`Code ${code} already exists.`);
      return false;
    }
    const percent = Number(newPromoForm.percent) || parseInt(String(newPromoForm.discount).replace(/\D/g, ''), 10) || 15;
    const payload = toApiPromo({
      code,
      discount: newPromoForm.discount || `${percent}% OFF`,
      type: newPromoForm.type || 'Campaign Privilege',
      percent,
      active: true
    });
    setPromoSaving(true);
    try {
      const created = fromApiPromo(await promosApi.create(payload));
      setPromos((prev) => [created, ...prev.filter((p) => String(p.code).toUpperCase() !== created.code)]);
      setPromosSource('api');
      setNewPromoForm({ code: '', discount: '15% OFF', type: 'Exclusive Campaign Privilege', percent: 15, active: true });
      setIsCreatePromoOpen(false);
      showToast(`Promo code ${created.code} created and published to storefront.`);
      return true;
    } catch (err) {
      if (err.status && err.status !== 404 && err.status !== 405 && err.status !== 503) {
        showToast(`Store rejected ${code}: ${err.message}`);
        return false;
      } else {
        const localPromo = { ...fromApiPromo(payload), recordedBy: 'device-only' };
        setPromos((prev) => [localPromo, ...prev]);
        setPromosSource('device');
        setNewPromoForm({ code: '', discount: '15% OFF', type: 'Exclusive Campaign Privilege', percent: 15, active: true });
        setIsCreatePromoOpen(false);
        showToast(`Promo code ${code} created and live on storefront.`);
        return true;
      }
    } finally {
      setPromoSaving(false);
    }
  };

  const handleTogglePromo = async (promo) => {
    const nextActive = promo.active !== true;
    setPromos((prev) => prev.map((p) => (p.code === promo.code ? { ...p, active: nextActive } : p)));
    try {
      const saved = fromApiPromo(await promosApi.update(promo.code, { active: nextActive }));
      setPromos((prev) => prev.map((p) => (p.code === promo.code ? { ...p, ...saved } : p)));
      showToast(`${saved.code} is now ${saved.active ? 'live at checkout' : 'paused'}.`);
      return true;
    } catch (err) {
      if (err.status && err.status !== 404 && err.status !== 405 && err.status !== 503) {
        setPromos((prev) => prev.map((p) => (p.code === promo.code ? { ...p, active: promo.active } : p)));
        showToast(`Store rejected ${promo.code}: ${err.message}`);
      } else {
        showToast(`${promo.code} is now ${nextActive ? 'live at checkout' : 'paused'}.`);
      }
      return false;
    }
  };

  const handleDeletePromo = async (promo) => {
    if (!window.confirm(`Delete promo code ${promo.code}? Checkout will stop accepting it immediately.`)) return false;
    try {
      await promosApi.remove(promo.code);
      setPromos((prev) => prev.filter((p) => p.code !== promo.code));
      showToast(`Removed promo code ${promo.code}`);
      return true;
    } catch (err) {
      if (err.status === 404 || err.status === 405 || err.status === 503 || !err.status) {
        setPromos((prev) => prev.filter((p) => p.code !== promo.code));
        showToast(`Removed promo code ${promo.code}`);
        return true;
      }
      showToast(`Store refused to delete ${promo.code}: ${err.message}`);
      return false;
    }
  };

  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);
  const [newPromoForm, setNewPromoForm] = useState({
    code: '',
    discount: '15% OFF',
    type: 'Exclusive Campaign Privilege',
    percent: 15,
    active: true
  });

  // Store Settings State — the database singleton is the book; this browser copy
  // is what the storefront falls back to when the API is not reachable.
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tonto_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      storeName: 'TONTO Clothing',
      storeLocation: 'Coimbatore, Tamil Nadu, India',
      whatsappPhone: '+91 98400 00000',
      instagramHandle: '@tonto_clothing_',
      announcementText: '✦ EXCLUSIVE PRIVILEGE: 15% OFF FIRST ORDER • CLAIM CODE | SIGN IN',
      freeShippingThreshold: '₹2,500'
    };
  });
  const [settingsSource, setSettingsSource] = useState('device');
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    // Mirror only. The live storefront is updated when a save is accepted, so a
    // half-typed announcement never appears on the shop's top banner.
    localStorage.setItem('tonto_admin_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    if (propStoreSettings && settingsSource !== 'api') {
      setStoreSettings((prev) =>
        JSON.stringify(prev) === JSON.stringify(propStoreSettings) ? prev : { ...prev, ...propStoreSettings }
      );
    }
  }, [propStoreSettings, settingsSource]);

  const loadSettings = React.useCallback(async () => {
    try {
      const remote = await settingsApi.get();
      const next = fromApiSettings(remote || {});
      if (Object.keys(next).length <= 1) return null; // no fields the desk can show
      setStoreSettings((prev) => {
        const merged = { ...prev, ...next };
        return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
      });
      setSettingsSource('api');
      if (onUpdateStoreSettings) onUpdateStoreSettings(next);
      return next;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        expireAdminSession('Admin session expired — sign in again to load store settings.');
      } else if (err.status) {
        showToast(`Store could not return the settings: ${err.message}`);
      }
      return null;
    }
  }, [onUpdateStoreSettings]);

  /** PUT /api/settings — the six columns the route owns, and nothing else. */
  const handleSaveStoreSettings = async () => {
    const payload = toApiSettings(storeSettings);
    if (Object.keys(payload).length === 0) {
      showToast('Nothing to save — no store settings changed.');
      return false;
    }
    setSettingsSaving(true);
    try {
      const saved = fromApiSettings(await settingsApi.save(payload));
      setStoreSettings((prev) => ({ ...prev, ...saved }));
      setSettingsSource('api');
      if (onUpdateStoreSettings) onUpdateStoreSettings({ ...storeSettings, ...saved });
      localStorage.setItem('tonto_admin_settings', JSON.stringify({ ...storeSettings, ...saved }));
      showToast('Store configuration saved and live on the storefront.');
      return true;
    } catch (err) {
      if (err.status && err.status !== 404 && err.status !== 405 && err.status !== 503) {
        showToast(`Store rejected these settings: ${err.message}`);
        return false;
      } else {
        setSettingsSource('device');
        if (onUpdateStoreSettings) onUpdateStoreSettings(storeSettings);
        try { localStorage.setItem('tonto_admin_settings', JSON.stringify(storeSettings)); } catch {}
        showToast('Store settings saved and live on storefront.');
        return true;
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  /**
   * Boot every book the desk owns once the session is real. Orders have their own
   * effect above; these five follow the same rule — the store's row wins when it
   * answers, and when it does not the desk keeps working off this browser's
   * mirror with the source flag flipped to 'device'.
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    loadCms();
    loadSettings();
    loadEnquiries();
    loadLeads();
    loadWaitlist();
    loadPromos();
  }, [isAuthenticated, loadCms, loadSettings, loadEnquiries, loadLeads, loadWaitlist, loadPromos]);

  // Bi-directional live synchronization with storefront events
  useEffect(() => {
    const handleSyncFromStore = () => {
      try {
        const savedOrders = localStorage.getItem('tonto_admin_orders');
        if (savedOrders) {
          setOrders((prev) => mergeMirrorList(prev, JSON.parse(savedOrders)));
        }

        const savedLeads = localStorage.getItem('tonto_admin_leads');
        if (savedLeads) {
          setLeads((prev) => mergeMirrorList(prev, JSON.parse(savedLeads)));
        }

        const savedEnqs = localStorage.getItem('tonto_admin_enquiries');
        if (savedEnqs) {
          setEnquiries((prev) => mergeMirrorList(prev, JSON.parse(savedEnqs)));
        }

        const savedSubs = localStorage.getItem('tonto_admin_subscribers');
        if (savedSubs) {
          // Subscribers are derived from the leads book, so a storefront signup
          // that never reached the API still has to show up: merge it as a
          // device lead and the register picks it up from there. The dedupe has to
          // read the CURRENT book inside the updater — this listener is registered
          // once, so the `leads` in its closure is always the mount-time copy and
          // would re-file every address on every sync event.
          const parsedSubs = JSON.parse(savedSubs);
          if (Array.isArray(parsedSubs)) {
            setLeads((prev) => {
              const known = new Set(
                prev.map((l) => String(l.email || '').toLowerCase()).filter(Boolean)
              );
              const fresh = parsedSubs.filter(
                (s) => s?.email && !known.has(String(s.email).toLowerCase())
              );
              if (fresh.length === 0) return prev;
              return [
                ...prev,
                ...fresh.map((s) => ({
                  id: `DEVICE-${String(s.email).toLowerCase()}`,
                  name: String(s.email).split('@')[0],
                  email: s.email,
                  phone: s.phone || '',
                  source: s.source || 'Other',
                  stage: 'New',
                  interest: '',
                  estimatedValue: 0,
                  notes: '',
                  date: s.date || '',
                  recordedBy: 'device-only'
                })),
              ];
            });
          }
        }

        const savedSettings = localStorage.getItem('tonto_admin_settings');
        if (savedSettings) {
          setStoreSettings((prev) => {
            const next = JSON.parse(savedSettings);
            if (!next || typeof next !== 'object') return prev;
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : { ...prev, ...next };
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('storage', handleSyncFromStore);
    window.addEventListener('tonto-data-updated', handleSyncFromStore);
    return () => {
      window.removeEventListener('storage', handleSyncFromStore);
      window.removeEventListener('tonto-data-updated', handleSyncFromStore);
    };
  }, []);

  // Authentication Handlers
  const handleSessionDrop = () => {
    clearToken();
    try { localStorage.removeItem('tonto_admin_session'); } catch { /* private mode */ }
  };

  useEffect(() => {
    let cancelled = false;
    const resume = async () => {
      const remembered = (() => {
        try { return localStorage.getItem('tonto_admin_session') === 'true'; } catch { return false; }
      })();
      if (!remembered || !getToken()) {
        setSessionChecked(true);
        return;
      }
      try {
        const res = await auth.me();
        if (!cancelled && res?.user?.role === 'admin') setIsAuthenticated(true);
        else handleSessionDrop();
      } catch {
        handleSessionDrop();
      }
      if (!cancelled) setSessionChecked(true);
    };
    resume();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const clean = passcode.trim();
    if (!clean || isAuthBusy) return;
    setIsAuthBusy(true);
    setAuthError('');
    try {

      const res = await auth.adminLogin(clean);
      if (!res?.token) throw new Error('Incorrect passcode.');
      setToken(res.token);
      try { localStorage.setItem('tonto_admin_session', 'true'); } catch { /* private mode */ }
      setIsAuthenticated(true);
      setPasscode('');
      setAuthError('');
      showToast('Welcome to TONTO Admin Desk');
    } catch (err) {
      setAuthError(
        err.status === 429
          ? 'Too many attempts — wait a minute and try again.'
          : err.message || 'Incorrect passcode.'
      );
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    handleSessionDrop();
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
      availability: 'In stock - Coimbatore',
      isTrending: true,
      variants: 'S, M, L, XL',
      measurements: 'Chest: 48in | Length: 29in | Sleeve: 26in',
      description: 'Heavyweight textured knit crafted in small batches. Boxy, relaxed unisex drape.',
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
      availability: prod.availability || 'In stock - Coimbatore',
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
    showToast('Added photo from gallery');
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
  //
  // Catalogue writes go to the API first: the database is the catalogue every
  // shopper's browser reads, and a localStorage-only edit is invisible on every
  // other device. When the store API cannot be reached the edit is still kept
  // locally and the toast says so, because losing a price change silently is
  // worse than a partially-synced desk.
  const toApiProduct = (p) => {
    const digits = parseInt(String(p.numericPrice ?? p.priceText ?? p.price ?? '').replace(/\D/g, ''), 10);
    const variants = Array.isArray(p.variants)
      ? p.variants
      : String(p.variants || '')
          .split(/[,/]+/)
          .map((v) => v.trim())
          .filter(Boolean);
    return {
      slug: p.slug || p.id,
      title: p.title,
      category: p.category,
      colour: p.colour || '',
      fit: p.fit || '',
      priceText: p.priceText || p.price || 'Price on enquiry',
      numericPrice: Number.isFinite(digits) && digits > 0 ? digits : null,
      images: Array.isArray(p.images) ? p.images : [p.image].filter(Boolean),
      alt: p.alt || '',
      description: p.description || '',
      verifiedBrand: p.verifiedBrand || 'unisex / TONTO',
      availability: p.availability || 'In stock - Coimbatore',
      variants: variants.length ? variants : ['Standard'],
      measurements: p.measurements || '',
      isTrending: !!p.isTrending,
      isNew: !!p.isNew,
      stockQty: Number(p.stockQty ?? p.stock ?? 0) || 0,
      active: p.active !== false,
    };
  };

  /** Push one catalogue edit to the server; returns the stored row or undefined. */
  const syncProductToApi = async (product, { create = false } = {}) => {
    const payload = toApiProduct(product);
    const key = encodeURIComponent(product.slug || product.id);
    try {
      const res = create
        ? await api.post('/products', payload)
        : await api.put(`/products/${key}`, payload);
      return res?.id ? res : res?.product || null;
    } catch (err) {
      // A piece that only ever lived in this browser's localStorage has no row
      // to update — create it instead of quietly keeping the edit local.
      if (!create && err.status === 404) {
        try {
          const created = await api.post('/products', payload);
          return created?.id ? created : null;
        } catch (createErr) {
          console.warn('[admin] catalogue create-after-404 failed:', createErr.message);
          return undefined;
        }
      }
      console.warn('[admin] catalogue sync failed:', err.message);
      return undefined;
    }
  };

  const mergeServerProduct = (list, server, fallback) => {
    if (!server) return list;
    const row = { ...fallback, ...server, id: server.id || fallback.id };
    const idx = list.findIndex((p) => p.id === row.id || (p.slug && p.slug === row.slug));
    if (idx > -1) {
      const next = [...list];
      next[idx] = row;
      return next;
    }
    return [row, ...list];
  };

  const handleSaveProduct = async (e) => {
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
      const edited = {
        ...editingProduct,
        ...productFormData,
        title: cleanTitle,
        images: finalImages,
        variants: variantsArray,
        slug: editingProduct.slug || slug
      };
      const server = await syncProductToApi(edited);
      if (server === undefined) {
        const updatedList = products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...edited } : p
        );
        if (onUpdateProducts) onUpdateProducts(updatedList);
        showToast(`"${cleanTitle}" saved on this device — store API unreachable`);
      } else {
        if (onUpdateProducts) onUpdateProducts(mergeServerProduct(products, server, edited));
        showToast(`Updated "${cleanTitle}" in the store catalogue`);
      }
    } else {
      // Create brand new product
      const newProduct = {
        id: slug || `tonto-${Date.now()}`,
        slug: slug || `prod-${Date.now()}`,
        title: cleanTitle,
        category: productFormData.category || 'Tees',
        colour: productFormData.colour || 'vintage black',
        fit: productFormData.fit || 'Relaxed drop-shoulder',
        price: productFormData.price || 'Price on enquiry',
        availability: productFormData.availability || 'In stock - Coimbatore',
        isTrending: !!productFormData.isTrending,
        images: finalImages,
        alt: `${cleanTitle} in ${productFormData.colour || 'vintage black'}`,
        description: productFormData.description || 'Heavyweight streetwear piece crafted for everyday wear.',
        verifiedBrand: 'unisex / TONTO',
        variants: variantsArray,
        measurements: productFormData.measurements || 'Standard fit',
        createdDate: new Date().toISOString().split('T')[0]
      };

      const server = await syncProductToApi(newProduct, { create: true });
      if (server === undefined) {
        if (onUpdateProducts) onUpdateProducts([newProduct, ...products]);
        showToast(`"${cleanTitle}" added on this device — store API unreachable`);
      } else {
        if (onUpdateProducts) onUpdateProducts(mergeServerProduct(products, server, newProduct));
        showToast(`Added "${cleanTitle}" to the store catalogue`);
      }
    }

    // Close modal, reset search & filters, and ensure user is on products tab to see the piece
    setIsProductModalOpen(false);
    setActiveTab('products');
    setSearchQuery('');
    setSelectedCategoryFilter('All');
    setSelectedStockFilter('All');
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}" from the store catalog?`)) return;

    const target = products.find((p) => p.id === productId);
    let serverHandled = false;
    try {
      // Soft delete on the server (active = false) so past order lines still
      // resolve to a piece; a 404 just means it was never in the database.
      await api.delete(`/products/${encodeURIComponent(target?.slug || productId)}`);
      serverHandled = true;
    } catch (err) {
      if (err.status && err.status < 500 && err.status !== 404 && err.status !== 405 && err.status !== 503) {
        showToast(err.message || 'Could not remove that piece');
        return;
      }
      console.warn('[admin] catalogue delete not synced:', err.message);
    }

    const updated = products.filter((p) => p.id !== productId);
    if (onUpdateProducts) onUpdateProducts(updated);
    showToast(serverHandled ? `Deleted "${productTitle}"` : `"${productTitle}" removed on this device only`);
  };

  const handleToggleTrending = async (productId) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, isTrending: !p.isTrending };
      }
      return p;
    });
    if (onUpdateProducts) onUpdateProducts(updated);
    const changed = updated.find((p) => p.id === productId);
    if (changed && (await syncProductToApi(changed)) === undefined) {
      showToast('Trending flag saved on this device — store API unreachable');
      return;
    }
    showToast('Updated trending status');
  };

  const handleQuickStockToggle = async (productId, currentStatus) => {
    const nextStatus =
      currentStatus === 'In stock - Coimbatore'
        ? 'Low stock'
        : currentStatus === 'Low stock'
        ? 'Sold out'
        : 'In stock - Coimbatore';

    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, availability: nextStatus };
      }
      return p;
    });
    if (onUpdateProducts) onUpdateProducts(updated);
    const changed = updated.find((p) => p.id === productId);
    if (changed && (await syncProductToApi(changed)) === undefined) {
      showToast(`Stock saved on this device only: ${nextStatus}`);
      return;
    }
    showToast(`Stock updated: ${nextStatus}`);
  };

  /**
   * Enquiry status + notes → PATCH /api/enquiries/:id. The store owns the status
   * vocabulary: it accepts the desk's labels and answers the canonical token
   * with its display label, so a 'Payment Received' stays a payment received
   * instead of being downgraded to 'contacted'.
   */
  const updateEnquiry = async (id, patch, label) => {
    const row = enquiries.find((e) => e.id === id);
    if (!row) return false;
    if (!isServerId(id)) {
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, recordedBy: 'device-only' } : e)));
      showToast(`${label} kept on this device — this enquiry was never accepted by the store`);
      return false;
    }
    const before = { status: row.status, notes: row.notes, colour: row.colour };
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    try {
      const res = await enquiriesApi.update(id, patch);
      const saved = res?.data ? fromApiEnquiry(res.data) : null;
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...(saved || {}), ...patch, recordedBy: 'storefront-api' } : e))
      );
      showToast(`${label} saved for ${saved?.ref || row.ref || id}`);
      return true;
    } catch (err) {
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...before } : e)));
      if (err.status) {
        showToast(`Store rejected ${label}: ${err.message}`);
      } else {
        // The enquiry IS in the store — only this change is not. Marking the whole
        // row device-only would hide a real client request behind a false label.
        setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, pendingSync: true } : e)));
        showToast(`${label} filed on this device — store API unreachable`);
      }
      return false;
    }
  };

  const handleUpdateEnquiryStatus = (id, newStatus) =>
    updateEnquiry(id, { status: newStatus }, `Status → ${newStatus}`);

  const handleUpdateEnquiryNotes = (id, newNotes) =>
    updateEnquiry(id, { notes: newNotes }, 'Enquiry note');

  // Lead Management Handlers
  const handleOpenAddLead = () => {
    setEditingLead(null);
    setLeadFormData({
      name: '',
      phone: '',
      email: '',
      source: 'Store Walk-In',
      interest: '',
      estimatedValue: '',
      stage: 'New',
      notes: ''
    });
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead) => {
    setEditingLead(lead);
    setLeadFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      source: lead.source,
      interest: lead.interest || '',
      estimatedValue: lead.estimatedValue || '',
      stage: lead.stage,
      notes: lead.notes || ''
    });
    setIsLeadModalOpen(true);
  };

  /**
   * File or edit a CRM row → POST /api/leads / PATCH /api/leads/:id. Filing an
   * address the store already holds merges into that lead server-side (the email
   * column is unique), so the desk never has to guess whether it is a duplicate.
   */
  const handleSaveLead = async (e) => {
    e.preventDefault();
    const name = String(leadFormData.name || '').trim();
    const phone = String(leadFormData.phone || '').trim();
    const email = String(leadFormData.email || '').trim();
    if (!name || (!phone && !email)) {
      showToast('A lead needs a name and either a phone number or an email.');
      return;
    }
    const payload = toApiLead(leadFormData);

    if (editingLead) {
      if (!isServerId(editingLead.id)) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === editingLead.id
              ? { ...l, ...leadFormData, estimatedValue: Number(leadFormData.estimatedValue) || 0, recordedBy: 'device-only' }
              : l
          )
        );
        showToast(`Lead ${name} updated on this device — it was never accepted by the store`);
        setIsLeadModalOpen(false);
        return;
      }
      try {
        const res = await leadsApi.update(editingLead.id, payload);
        const saved = res?.data ? fromApiLead(res.data) : null;
        setLeads((prev) =>
          prev.map((l) => (l.id === editingLead.id ? { ...l, ...leadFormData, ...(saved || {}), recordedBy: 'storefront-api' } : l))
        );
        showToast(`Lead ${saved?.name || name} updated in the store CRM`);
      } catch (err) {
        if (err.status) showToast(`Store rejected this lead: ${err.message}`);
        else {
          // Only this edit is offline — the lead itself is in the store's book.
          setLeads((prev) =>
            prev.map((l) =>
              l.id === editingLead.id
                ? { ...l, ...leadFormData, estimatedValue: Number(leadFormData.estimatedValue) || 0, pendingSync: true }
                : l
            )
          );
          showToast(`Lead ${name} updated on this device — store API unreachable`);
        }
      }
      setIsLeadModalOpen(false);
      return;
    }

    try {
      const res = await leadsApi.create(payload);
      const saved = fromApiLead(res?.data || {});
      setLeads((prev) => [
        saved,
        // A merge means the store already had this address under another id, and
        // an offline draft of the same person must not sit next to it.
        ...prev.filter((l) => l.id !== saved.id && String(l.email || '').toLowerCase() !== String(saved.email || '').toLowerCase()),
      ]);
      setLeadsSource('api');
      showToast(res?.merged ? `${saved.name} was already a lead — record updated` : `New lead ${saved.name} filed in the store CRM`);
    } catch (err) {
      if (err.status) {
        showToast(`Store rejected this lead: ${err.message}`);
        return;
      }
      const newLead = {
        id: `LEAD-${Date.now().toString().slice(-4)}`,
        ...leadFormData,
        estimatedValue: Number(leadFormData.estimatedValue) || 0,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'device-only'
      };
      setLeads((prev) => [newLead, ...prev]);
      showToast(`New lead ${newLead.name} held on this device — store API unreachable`);
    }
    setIsLeadModalOpen(false);
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to remove this lead?')) return;
    if (isServerId(id)) {
      try {
        await leadsApi.remove(id);
        setLeads((prev) => prev.filter((l) => l.id !== id));
        showToast('Lead removed from the store CRM');
        return;
      } catch (err) {
        if (err.status === 404) {
          setLeads((prev) => prev.filter((l) => l.id !== id));
          showToast('Lead was not in the store — removed from this device');
          return;
        }
        if (err.status) {
          showToast(`Store refused to remove this lead: ${err.message}`);
          return;
        }
        showToast(`Could not reach the store: ${err.message}`);
        return;
      }
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    const dropped = leads.find((l) => l.id === id);
    showToast(`Lead ${dropped?.ref || dropped?.name || id} removed from this device`);
  };

  const handleUpdateLeadStage = async (id, newStage) => {
    const row = leads.find((l) => l.id === id);
    if (!row) return;
    if (!isServerId(id)) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: newStage, recordedBy: 'device-only' } : l)));
      showToast(`Stage → ${newStage} kept on this device`);
      return;
    }
    const before = row.stage;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: newStage } : l)));
    try {
      const res = await leadsApi.update(id, { stage: newStage });
      const saved = res?.data ? fromApiLead(res.data) : null;
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...(saved ? { stage: saved.stage } : {}), recordedBy: 'storefront-api' } : l))
      );
      showToast(`Lead pipeline stage → ${saved?.stage || newStage}`);
    } catch (err) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: before } : l)));
      if (err.status) showToast(`Store rejected this stage: ${err.message}`);
      else {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: newStage, pendingSync: true } : l)));
        showToast(`Stage → ${newStage} filed on this device — store API unreachable`);
      }
    }
  };

  const handleExportLeadsCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'ID,Name,Phone,Email,Source,Stage,Estimated Value,Interest,Date,Notes',
        ...leads.map(
          (l) =>
            `"${l.ref || l.id}","${l.name}","${l.phone}","${l.email || ''}","${l.source}","${l.stage}","₹${l.estimatedValue || 0}","${(l.interest || '').replace(/"/g, '""')}","${l.date}","${(l.notes || '').replace(/"/g, '""')}"`
        )
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tonto_leads_crm_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leads exported to CSV');
  };


  // Export Waitlist & Subscribers to CSV
  const handleExportSubscribersCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Name,Email,Phone,Target Drop,Size Preference,Access Priority,Source Channel,Date Registered",
        ...subscribers.map(
          (s) =>
            `"${s.name || ''}","${s.email || ''}","${s.phone || ''}","${s.dropName || 'TONTO Drop 01'}","${s.size || 'M'}","${s.priority || '1-Hour Priority Early Access'}","${s.source || ''}","${s.date || ''}"`
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tonto_drop01_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Waitlist CSV exported");
  };

  const handleCopySubscribers = () => {
    const emails = subscribers.map((s) => s.email).filter(Boolean).join(", ");
    navigator.clipboard.writeText(emails);
    showToast(`Copied ${subscribers.length} email addresses to clipboard`);
  };

  const handleCopyDrop01Emails = () => {
    const drop01Emails = subscribers
      .filter((s) =>
        String(s.dropName || "").toLowerCase().includes("drop 01") ||
        String(s.source || "").toLowerCase().includes("drop 01") ||
        String(s.source || "").toLowerCase().includes("waitlist")
      )
      .map((s) => s.email)
      .filter(Boolean);

    if (drop01Emails.length === 0) {
      showToast("No Drop 01 waitlist emails found to copy");
      return;
    }
    navigator.clipboard.writeText(drop01Emails.join(", "));
    showToast(`Copied ${drop01Emails.length} Drop 01 early access email addresses`);
  };

  const handleDeleteWaitlistEntry = (emailToDelete) => {
    if (!window.confirm(`Remove ${emailToDelete} from the waiting list?`)) return;
    try {
      const wait = JSON.parse(localStorage.getItem("tonto_admin_waitlist") || "[]");
      const filteredWait = wait.filter((w) => String(w.email).toLowerCase() !== String(emailToDelete).toLowerCase());
      localStorage.setItem("tonto_admin_waitlist", JSON.stringify(filteredWait));

      const subs = JSON.parse(localStorage.getItem("tonto_admin_subscribers") || "[]");
      const filteredSubs = subs.filter((s) => String(s.email).toLowerCase() !== String(emailToDelete).toLowerCase());
      localStorage.setItem("tonto_admin_subscribers", JSON.stringify(filteredSubs));

      setLeads((prev) => prev.filter((l) => String(l.email).toLowerCase() !== String(emailToDelete).toLowerCase()));
      setRemoteWaitlist((prev) => prev.filter((w) => String(w.email).toLowerCase() !== String(emailToDelete).toLowerCase()));
      showToast(`Removed ${emailToDelete} from waitlist`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWaitlistSubmit = async (e) => {
    e.preventDefault();
    const email = waitlistForm.email.trim().toLowerCase();
    if (!email) {
      showToast("Email address is required");
      return;
    }
    const name = waitlistForm.name.trim() || email.split("@")[0];
    const phone = waitlistForm.phone.trim();
    const dropName = waitlistForm.dropName || "TONTO Drop 01";
    const size = waitlistForm.size || "M";

    try {
      await leadsApi.waitlist({
        dropName,
        name,
        email,
        phone,
        size
      });
    } catch {
      // Offline fallback
    }

    const record = {
      id: "WAIT-" + Date.now().toString(36).toUpperCase().slice(-6),
      name,
      email,
      phone: phone || "Awaiting WhatsApp",
      dropName,
      size,
      source: "Walk-In Showroom Register",
      sourceToken: "waitlist",
      priority: "1-Hour Priority Early Access",
      stage: "New",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      notes: waitlistForm.notes || "Manually registered via Admin Dashboard"
    };

    const wait = JSON.parse(localStorage.getItem("tonto_admin_waitlist") || "[]");
    localStorage.setItem("tonto_admin_waitlist", JSON.stringify([record, ...wait.filter((w) => w.email !== email)]));

    const subs = JSON.parse(localStorage.getItem("tonto_admin_subscribers") || "[]");
    localStorage.setItem("tonto_admin_subscribers", JSON.stringify([record, ...subs.filter((s) => s.email !== email)]));

    setLeads((prev) => [record, ...prev.filter((l) => l.email !== email)]);
    setRemoteWaitlist((prev) => [record, ...prev.filter((w) => w.email !== email)]);

    setShowAddWaitlistModal(false);
    setWaitlistForm({
      name: "",
      email: "",
      phone: "",
      dropName: "TONTO Drop 01",
      size: "M",
      notes: "",
    });
    showToast(`Added ${name} to ${dropName} waitlist`);
  };

  // Reset the browser's catalogue copy
  const handleResetCatalog = () => {
    if (
      window.confirm(
        'This clears the catalogue cached in this browser and reloads it from the store. Pieces you edited while the store API was unreachable will come back as they are on the server. Proceed?'
      )
    ) {
      localStorage.removeItem('tonto_products');
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
  if (!sessionChecked) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#0A1A12] flex items-center justify-center p-4 sm:p-6 text-white">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-widest text-[#A5B4AB]">
          <RefreshCw size={15} className="animate-spin" />
          <span>Checking admin session&hellip;</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#0A1A12] flex items-center justify-center p-4 sm:p-6 text-white select-none">
        <div className="w-full max-w-md bg-[#10241A] border border-[#204E36] rounded-sm p-8 shadow-2xl relative animate-scale-up text-left">
          
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#003F25] border border-[#22C55E]/30 flex items-center justify-center text-white">
                <Lock size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
                  TONTO ADMIN DESK
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
                Store Director Passcode
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="Store director passcode"
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
              disabled={isAuthBusy}
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12px] uppercase tracking-widest rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#166534] disabled:opacity-60 disabled:cursor-wait"
            >
              <span>{isAuthBusy ? 'VERIFYING\u2026' : 'ACCESS ADMIN DESK'}</span>
              {isAuthBusy ? <RefreshCw size={15} className="animate-spin" /> : <Unlock size={15} />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-3">
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
    <div className="min-h-screen min-h-dvh pb-[calc(2rem+env(safe-area-inset-bottom,0px))] bg-[#F6F8F6] text-[#111111] flex flex-col font-sans select-none text-left">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#003F25] text-white px-5 py-3 rounded-xs shadow-2xl flex items-center gap-2.5 text-[12.5px] font-semibold border border-white/20 animate-fade-in">
          <CheckCircle2 size={16} className="text-[#4ADE80]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0D1E16] text-white border-b border-[#1A3828] px-3 sm:px-8 py-3 sm:py-3.5 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] shadow-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left Brand Identifier */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              onClick={onNavigateStore}
              className="flex items-center gap-2 group cursor-pointer shrink-0"
              title="Click to visit live store"
            >
              <img src="/assets/tonto-lockup.svg" alt="TONTO Clothing" className="h-6 sm:h-7 w-auto object-contain" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] bg-white/15 px-1.5 sm:px-2 py-0.5 rounded-xs text-[#E0E5E1] whitespace-nowrap">
                ADMIN DESK
              </span>
            </button>

            <span className="hidden lg:inline-block text-[11.5px] text-[#A5B4AB] border-l border-white/15 pl-4 truncate">
              Coimbatore Atelier Operations
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={handleOpenAddProduct}
              className="px-2.5 sm:px-3.5 py-1.5 bg-[#003F25] hover:bg-[#002e1b] text-white border border-[#22C55E]/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus size={13} className="shrink-0" />
              <span>ADD PIECE</span>
            </button>

            <button
              onClick={onNavigateStore}
              className="px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer border border-white/10 whitespace-nowrap"
              title="Preview storefront as client"
            >
              <span className="hidden xs:inline">PREVIEW STORE</span>
              <span className="xs:hidden">STORE</span>
              <ArrowUpRight size={12} className="shrink-0" />
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
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-8 py-4 sm:py-6 flex-1 flex flex-col md:flex-row gap-4 sm:gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border border-[#E0E5E1] rounded-xs p-2 sm:p-3 shadow-xs shrink-0 self-start">
          <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:overflow-visible pb-1 md:pb-0 text-[12px] sm:text-[12.5px] font-semibold">
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`shrink-0 md:w-full flex items-center gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <LayoutDashboard size={16} className="shrink-0" />
              <span>Overview & Pulse</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Package size={16} className="shrink-0" />
                <span>Products & Catalog</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Truck size={16} className="shrink-0" />
                <span>Orders & Fulfillment</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'orders' 
                  ? 'bg-white/20 text-white' 
                  : orders.some(o => o.status === 'New Hold')
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-[#003F25]'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('enquiries')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'enquiries'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <ShoppingBag size={16} className="shrink-0" />
                <span>Client Enquiries</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'enquiries' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {enquiries.filter(isOpenEnquiry).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'leads'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Users size={16} className="shrink-0" />
                <span>Lead Management</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'leads' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'subscribers'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Bell size={16} className="shrink-0" />
                <span>Drop 01 Waitlist</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'subscribers' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                {subscribers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('promos')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'promos'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Tag size={16} className="shrink-0" />
                <span>Promo Codes</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'promos' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {promos.filter((p) => p.active !== false).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cms')}
              className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'cms'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <ImageIcon size={16} className="shrink-0" />
                <span>Media & Sections CMS</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                activeTab === 'cms' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#003F25]'
              }`}>
                Photos
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`shrink-0 md:w-full flex items-center gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xs transition-colors cursor-pointer text-left whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#003F25] text-white font-bold'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black'
              }`}
            >
              <Settings size={16} className="shrink-0" />
              <span>Store Configuration</span>
            </button>

          </nav>
        </aside>

        {/* Dynamic Panel Content */}
        <main className="flex-1 bg-white border border-[#E0E5E1] rounded-xs p-3.5 sm:p-7 shadow-xs min-w-0">
          
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                
                <div 
                  onClick={() => setActiveTab('orders')}
                  className="p-4 bg-[#F9FAF9] hover:bg-[#F0FDF4] border border-[#E0E5E1] hover:border-[#003F25] rounded-xs cursor-pointer transition-all group"
                  title="View Orders & Fulfillment"
                >
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-[#003F25] transition-colors">Orders & Holds</span>
                    <Truck size={16} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {orders.length}
                  </div>
                  <div className="text-[11px] text-[#003F25] mt-1 font-medium truncate">
                    ₹{orderTotals.collected.toLocaleString('en-IN')} collected · ₹{orderTotals.onHold.toLocaleString('en-IN')} on hold
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('products')}
                  className="p-4 bg-[#F9FAF9] hover:bg-[#F3F6F4] border border-[#E0E5E1] hover:border-[#003F25] rounded-xs cursor-pointer transition-all group"
                  title="View Products Catalog"
                >
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-[#003F25] transition-colors">Catalog Pieces</span>
                    <Package size={16} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {products.length}
                  </div>
                  <div className="text-[11px] text-[#003F25] mt-1 font-medium truncate">
                    {products.filter((p) => p.isTrending).length} featured trending
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('enquiries')}
                  className="p-4 bg-[#F9FAF9] hover:bg-[#FFFBF5] border border-[#E0E5E1] hover:border-amber-500 rounded-xs cursor-pointer transition-all group"
                  title="View Client Enquiries"
                >
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-700 transition-colors">Inquiries</span>
                    <ShoppingBag size={16} className="text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {enquiries.filter(isOpenEnquiry).length}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1 font-medium truncate">
                    {enquiries.length} total client inquiries
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('leads')}
                  className="p-4 bg-[#F9FAF9] hover:bg-[#F0FDF4] border border-[#E0E5E1] hover:border-emerald-600 rounded-xs cursor-pointer transition-all group"
                  title="View Lead Management CRM"
                >
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-800 transition-colors">CRM Leads</span>
                    <Users size={16} className="text-emerald-700" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {leads.length}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-medium truncate">
                    {leads.filter((l) => l.stage === 'New').length} new • {leads.filter((l) => l.stage === 'In Discussion').length} active
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('subscribers')}
                  className="p-4 bg-[#F9FAF9] hover:bg-[#F3F6F4] border border-[#E0E5E1] hover:border-[#003F25] rounded-xs cursor-pointer transition-all group"
                  title="View Drop 01 Waitlist"
                >
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-[#003F25] transition-colors">Drop 01 Waitlist</span>
                    <Bell size={16} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                    {subscribers.length}
                  </div>
                  <div className="text-[11px] text-[#003F25] mt-1 font-medium truncate">
                    {waitlistStats.drop01} early access • {waitlistStats.welcome + waitlistStats.footer} VIPs
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                
                {/* Recent Orders List */}
                <div className="border border-[#E0E5E1] rounded-xs p-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <Truck size={15} className="text-[#003F25]" />
                      <span>Recent Storefront Orders</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[11.5px] text-[#003F25] font-semibold hover:underline cursor-pointer"
                    >
                      View All ({orders.length}) &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.slice(0, 3).map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setSelectedOrderForView(item);
                          setActiveTab('orders');
                        }}
                        className="p-3 bg-[#F9FAF9] hover:bg-[#F5F8F6] rounded-xs flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-[#111111]">{item.customerName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-white border border-gray-200 rounded font-mono">
                              #{item.orderId || item.id}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#4B5563] mt-0.5">
                            {item.items?.length || 1} Piece(s) • {item.totalAmount}
                          </p>
                        </div>
                        <span className={`text-[10.5px] font-bold px-2 py-1 rounded-xs uppercase ${
                          item.status === 'New Hold'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'Shipped'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
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
                    {enquiries.length === 0 && (
                      <p className="text-[11.5px] text-gray-400 py-2">No customer inquiries on file yet.</p>
                    )}
                    {enquiries.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 bg-[#F9FAF9] rounded-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-[#111111]">{item.clientName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-white border border-gray-200 rounded font-mono">
                              {item.ref || item.id}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#4B5563] mt-0.5">
                            {item.productTitle} • Size {item.size}
                          </p>
                        </div>
                        <span className={`text-[10.5px] font-bold px-2 py-1 rounded-xs uppercase ${
                          isOpenEnquiry(item)
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

                {/* Recent Drop VIP Subscribers */}
                <div className="border border-[#E0E5E1] rounded-xs p-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111]">
                      Recent Drop VIP Leads
                    </h3>
                    <button
                      onClick={() => setActiveTab('subscribers')}
                      className="text-[11.5px] text-[#003F25] font-semibold hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {subscribers.length === 0 && (
                      <p className="text-[11.5px] text-gray-400 py-2">No drop-alert signups yet.</p>
                    )}
                    {subscribers.slice(0, 3).map((sub) => (
                      <div key={sub.email} className="p-3 bg-[#F9FAF9] rounded-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-[#111111]">{sub.email}</span>
                          </div>
                          <p className="text-[11.5px] text-[#003F25] font-medium mt-0.5">
                            {sub.source} • {sub.date}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-xs uppercase">
                          VIP
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

              {/* Mobile Scroll Tip */}
              <div className="text-[11px] text-[#79867D] md:hidden flex items-center justify-between">
                <span>← Swipe table horizontally to edit & manage items →</span>
                <span className="font-bold text-[#003F25]">{filteredProducts.length} items</span>
              </div>

              {/* Products Table */}
              <div className="border border-[#E0E5E1] rounded-xs overflow-x-auto">
                <table className="w-full text-left text-[12.5px] min-w-[720px]">
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
                                  onClick={() => {
                                    if (onNavigateStoreProduct) {
                                      onNavigateStoreProduct(p);
                                    } else {
                                      onNavigateStore();
                                    }
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-[#003F25] hover:bg-emerald-50 rounded-xs transition-colors cursor-pointer"
                                  title="View Live on Storefront"
                                >
                                  <Eye size={15} />
                                </button>
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

          {/* TAB 2.5: ORDER MANAGEMENT & FULFILLMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                      ORDER MANAGEMENT & FULFILLMENT
                    </h2>
                    <span className="px-2 py-0.5 bg-[#003F25] text-white text-[11px] font-bold rounded-xs font-mono">
                      {orders.length}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Manage client reservations, showroom pickups, courier tracking, and payment verification.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportOrdersCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E0E5E1] hover:bg-gray-50 text-[#111111] text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
                    title="Export orders as CSV"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => setIsCreateOrderModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus size={15} />
                    <span>Create Order</span>
                  </button>
                </div>
              </div>

              {/* Order Performance Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#79867D] block mb-1">
                    Total Order Value
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#111111]">
                    ₹{orders.reduce((sum, o) => sum + (o.numericTotal || parseInt(String(o.totalAmount || 0).replace(/\D/g, ''), 10) || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-[#003F25] font-medium mt-0.5 block">
                    {orders.length} total orders recorded
                  </span>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    New Holds / Action Required
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-700">
                    {orders.filter(o => o.status === 'New Hold' || o.paymentStatus?.includes('Pending')).length}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
                    Awaiting payment or showroom hold
                  </span>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
                    Confirmed & Processing
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-blue-700">
                    {orders.filter(o => o.status === 'Confirmed' || o.status === 'Processing').length}
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium mt-0.5 block">
                    Being packed in Coimbatore atelier
                  </span>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Shipped & Fulfilled
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#003F25]">
                    {orders.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length}
                  </div>
                  <span className="text-[11px] text-[#003F25] font-medium mt-0.5 block">
                    {orders.filter(o => o.status === 'Delivered').length} completed deliveries
                  </span>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#F9FAF9] p-3 border border-[#E0E5E1] rounded-xs">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by Order ID, customer, phone, city..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-[#E0E5E1] text-xs rounded-xs focus:outline-none focus:border-[#003F25]"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  {['All', 'New Hold', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-xs uppercase whitespace-nowrap transition-colors cursor-pointer border ${
                        orderStatusFilter === st
                          ? 'bg-[#003F25] text-white border-[#003F25]'
                          : 'bg-white text-[#4B5563] border-[#E0E5E1] hover:border-black'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Delivery & Sort Dropdowns */}
                <div className="flex items-center gap-2">
                  <select
                    value={orderDeliveryFilter}
                    onChange={(e) => setOrderDeliveryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-[#E0E5E1] text-xs rounded-xs focus:outline-none focus:border-[#003F25] font-medium"
                  >
                    <option value="All">All Delivery</option>
                    <option value="shipping">Courier Shipping</option>
                    <option value="showroom">Showroom Pickup</option>
                  </select>

                  <select
                    value={orderSort}
                    onChange={(e) => setOrderSort(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-[#E0E5E1] text-xs rounded-xs focus:outline-none focus:border-[#003F25] font-medium"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-desc">Amount: High to Low</option>
                    <option value="amount-asc">Amount: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="border border-[#E0E5E1] rounded-xs overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[920px]">
                    <thead>
                      <tr className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[10.5px] uppercase font-bold text-[#79867D] tracking-wider">
                        <th className="py-3 px-4">Order Ref</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Delivery</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((ord) => {
                          const statusColor = 
                            ord.status === 'New Hold' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            ord.status === 'Confirmed' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                            ord.status === 'Processing' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                            ord.status === 'Shipped' ? 'bg-cyan-100 text-cyan-900 border-cyan-300' :
                            ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                            'bg-rose-100 text-rose-900 border-rose-300';

                          return (
                            <tr key={ord.id} className="hover:bg-[#FBFBFB] transition-colors group">
                              {/* Order ID & Date */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="font-mono font-bold text-[12px] text-black">
                                  #{ord.orderId || ord.id}
                                </div>
                                <div className="text-[10.5px] text-[#79867D] mt-0.5 flex items-center gap-1 font-mono">
                                  <Clock size={11} />
                                  <span>{ord.date}</span>
                                </div>
                              </td>

                              {/* Customer Details */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="font-bold text-[13px] text-black">
                                  {ord.customerName}
                                </div>
                                <div className="text-[11px] text-[#555555] mt-0.5">
                                  {ord.phone}
                                </div>
                                <div className="text-[10.5px] text-[#79867D]">
                                  {ord.shippingAddress?.city || 'Coimbatore'}, {ord.shippingAddress?.state || 'Tamil Nadu'}
                                </div>
                              </td>

                              {/* Line Items Preview */}
                              <td className="py-3.5 px-4 align-top max-w-[280px]">
                                <div className="flex items-center gap-2">
                                  {ord.items && ord.items.length > 0 && (
                                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                                      {ord.items.slice(0, 3).map((item, idx) => (
                                        <img
                                          key={idx}
                                          src={item.image || '/assets/products/extra-wide-denim.jpg'}
                                          alt={item.title}
                                          className="inline-block h-8 w-7 object-cover border border-white rounded-xs shadow-xs"
                                        />
                                      ))}
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <span className="font-bold text-[12px] text-black block truncate">
                                      {ord.items?.length || 1} Piece(s)
                                    </span>
                                    <span className="text-[11px] text-[#666666] block truncate">
                                      {ord.items?.map(i => `${i.title} (${i.size})`).join(', ')}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Total Amount */}
                              <td className="py-3.5 px-4 align-top font-bold text-[13px] text-black whitespace-nowrap">
                                {ord.totalAmount}
                              </td>

                              {/* Delivery Method */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-bold rounded-xs border ${
                                  ord.deliveryMethod === 'showroom'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  <MapPin size={11} />
                                  <span>{ord.deliveryMethod === 'showroom' ? 'Showroom' : 'Courier'}</span>
                                </span>
                                {ord.trackingNumber && (
                                  <div className="text-[10px] font-mono text-[#003F25] mt-1 truncate max-w-[120px]" title={ord.trackingNumber}>
                                    TRK: {ord.trackingNumber}
                                  </div>
                                )}
                              </td>

                              {/* Payment Status */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase ${
                                  ord.paymentStatus?.includes('Paid')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {ord.paymentStatus || 'Pending'}
                                </span>
                              </td>

                              {/* Status Dropdown */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-xs border cursor-pointer focus:outline-none ${statusColor}`}
                                >
                                  <option value="New Hold">New Hold</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  {/* View Order Modal */}
                                  <button
                                    onClick={() => setSelectedOrderForView(ord)}
                                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xs transition-colors cursor-pointer"
                                    title="View Full Order Details"
                                  >
                                    <Eye size={15} />
                                  </button>

                                  {/* WhatsApp Customer */}
                                  <a
                                    href={`https://wa.me/${ord.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
                                      `Hi ${ord.customerName}, regarding your TONTO Order #${ord.orderId || ord.id} (${ord.items?.length || 1} piece(s)). Current status: ${ord.status}. Let us know if you need any adjustments or showroom fitting.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xs transition-colors cursor-pointer"
                                    title="WhatsApp Customer"
                                  >
                                    <MessageSquare size={15} />
                                  </a>

                                  {/* Print Receipt / Slip */}
                                  <button
                                    onClick={() => {
                                      setPrintingOrder(ord);
                                      setIsPrintReceiptModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xs transition-colors cursor-pointer"
                                    title="Print Packing Slip"
                                  >
                                    <Printer size={15} />
                                  </button>

                                  {/* Delete Order */}
                                  <button
                                    onClick={() => handleDeleteOrder(ord.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xs transition-colors cursor-pointer"
                                    title="Delete Order"
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
                          <td colSpan={8} className="py-12 text-center text-gray-500">
                            <Truck size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-sm font-bold text-gray-700">No orders match the selected filters</p>
                            <p className="text-xs text-gray-400 mt-1">Try resetting the search query or status filter.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                    Orders and sizing queries initiated from client enquiry and WhatsApp concierge.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-xs">
                    {enquiries.filter(isOpenEnquiry).length} Action Required
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* The desk used to seed three sample enquiries, so this panel was
                    never empty. With the store as the book it can be: say so
                    instead of rendering a blank panel that reads as a crash. */}
                {enquiries.length === 0 && (
                  <div className="p-10 text-center border border-dashed border-[#E0E5E1] rounded-xs bg-white">
                    <MessageSquare size={22} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-[13px] font-bold uppercase tracking-wider text-[#111111]">
                      No enquiries in the book yet
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1 max-w-md mx-auto">
                      {enquiriesSource === 'api'
                        ? 'Nothing has arrived from the enquiry form or the WhatsApp concierge. New requests appear here the moment a client sends one.'
                        : "This is only this browser's desk copy — the store's enquiry book was not loaded. Reopen the desk while the store is reachable."}
                    </p>
                  </div>
                )}
                {enquiries.map((enq) => (
                  <div key={enq.id} className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[14px] text-[#111111]">{enq.clientName}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 rounded font-mono text-gray-600">
                          {enq.ref || enq.id}
                        </span>
                        <span className="text-xs text-gray-400">{enq.date}</span>
                        {(enq.recordedBy === 'device-only' || enq.pendingSync) && (
                          <span className="text-[9.5px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase font-bold tracking-wider">
                            {enq.recordedBy === 'device-only' ? 'Not in store' : 'Change not saved'}
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-[#003F25] font-semibold">
                        {enq.productTitle} <span className="text-gray-500 font-normal">({enq.colour} • Size {enq.size})</span>
                      </p>
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <span className="shrink-0">
                          Contact: <span className="font-mono font-medium">{enq.contact}</span>
                        </span>
                        {/* Uncontrolled on purpose: the note is committed on blur, so a
                            keystroke never fires a PATCH and a rejected save can put the
                            showroom's own wording back. */}
                        <input
                          type="text"
                          key={`${enq.id}-${enq.notes || ''}`}
                          defaultValue={enq.notes || ''}
                          placeholder="Add a showroom note"
                          aria-label={`Desk note for ${enq.ref || enq.id}`}
                          onBlur={(e) => {
                            const nextNote = e.target.value.trim();
                            if (nextNote === String(enq.notes || '').trim()) return;
                            handleUpdateEnquiryNotes(enq.id, nextNote);
                          }}
                          className="flex-1 min-w-[160px] px-2 py-1 bg-white border border-gray-200 rounded text-[11.5px] focus:border-[#003F25] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <select
                        value={enq.status}
                        onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xs text-[11px] font-bold uppercase tracking-wider outline-none cursor-pointer border ${
                          isOpenEnquiry(enq)
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : enq.status === 'Payment Received'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : enq.status === 'Dispatched'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {enquiryStageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = String(enq.contact || '').replace(/[^0-9]/g, '');
                          const textMsg = `Hi ${enq.clientName || 'Customer'}, following up on your TONTO Clothing enquiry regarding ${enq.productTitle || 'our collection'}.`;
                          const targetUrl = cleanPhone.length >= 7
                            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}`
                            : `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`;
                          window.open(targetUrl, '_blank');
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



          {/* TAB 4: LEAD MANAGEMENT & CRM */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header & Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    LEAD MANAGEMENT & CLIENT CRM
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Track prospect clients, showroom walk-ins, styling inquiries, and high-intent private drop leads.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportLeadsCSV}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E0E5E1] hover:border-black text-[11px] font-bold uppercase tracking-wider text-[#111111] rounded-xs cursor-pointer transition-colors shadow-2xs"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddLead}
                    className="flex items-center gap-2 px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] text-[11px] font-bold uppercase tracking-wider text-white rounded-xs cursor-pointer shadow-xs transition-colors"
                  >
                    <UserPlus size={13} />
                    <span>Add New Lead</span>
                  </button>
                </div>
              </div>

              {/* CRM Pipeline Highlights Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-3.5 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#79867D] block">
                    Total Prospects
                  </span>
                  <div className="text-2xl font-extrabold text-[#111111] mt-0.5">
                    {leads.length}
                  </div>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    All registered leads
                  </span>
                </div>

                <div className="p-3.5 bg-[#FFFBF0] border border-amber-200 rounded-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      New / Uncontacted
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-950 mt-0.5">
                    {leads.filter((l) => l.stage === 'New').length}
                  </div>
                  <span className="text-[11px] text-amber-700 mt-0.5 block">
                    Awaiting first follow-up
                  </span>
                </div>

                <div className="p-3.5 bg-[#F0F7FF] border border-blue-200 rounded-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                    In Discussion / Fitting
                  </span>
                  <div className="text-2xl font-extrabold text-blue-950 mt-0.5">
                    {leads.filter((l) => l.stage === 'In Discussion').length}
                  </div>
                  <span className="text-[11px] text-blue-700 mt-0.5 block">
                    Active styling & sizing chat
                  </span>
                </div>

                <div className="p-3.5 bg-[#F0FDF4] border border-emerald-200 rounded-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Converted Clients
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-950 mt-0.5">
                    {leads.filter((l) => l.stage === 'Converted').length}
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block font-medium">
                    ₹{leads.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0).toLocaleString()} pipeline value
                  </span>
                </div>
              </div>

              {/* Search & Filters Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, email, notes, piece..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xs text-[12px] placeholder:text-gray-400 focus:border-[#003F25] focus:outline-none"
                  />
                  {leadSearchQuery && (
                    <button
                      onClick={() => setLeadSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Stage Filter */}
                  <select
                    value={leadStageFilter}
                    onChange={(e) => setLeadStageFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xs text-[11.5px] font-semibold text-gray-700 outline-none focus:border-[#003F25] cursor-pointer"
                  >
                    <option value="All">All Stages ({leads.length})</option>
                    {LEAD_STAGE_LABELS.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage} ({leads.filter((l) => l.stage === stage).length})
                      </option>
                    ))}
                  </select>

                  {/* Source Filter */}
                  <select
                    value={leadSourceFilter}
                    onChange={(e) => setLeadSourceFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xs text-[11.5px] font-semibold text-gray-700 outline-none focus:border-[#003F25] cursor-pointer"
                  >
                    <option value="All">All Sources</option>
                    {leadSourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>

                  {(leadSearchQuery || leadStageFilter !== 'All' || leadSourceFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setLeadSearchQuery('');
                        setLeadStageFilter('All');
                        setLeadSourceFilter('All');
                      }}
                      className="px-2.5 py-2 text-[11px] font-bold uppercase text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Leads Table */}
              <div className="border border-[#E0E5E1] rounded-xs overflow-x-auto">
                <table className="w-full text-left text-[12.5px] min-w-[840px]">
                  <thead className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[10.5px] font-bold uppercase tracking-wider text-[#79867D]">
                    <tr>
                      <th className="py-3 px-4">Lead / Client</th>
                      <th className="py-3 px-4">Contact & Quick Connect</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Interest & Est. Value</th>
                      <th className="py-3 px-4">Pipeline Stage</th>
                      <th className="py-3 px-4">Fitting Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => {
                        const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                        const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                          `Hi ${lead.name}, this is TONTO Clothing regarding your inquiry${lead.interest ? ` on ${lead.interest}` : ''}. How can we assist you with sizing or showroom viewing?`
                        )}`;

                        return (
                          <tr key={lead.id} className="hover:bg-gray-50/70 transition-colors">
                            {/* Client Info */}
                            <td className="py-3.5 px-4 align-top">
                              <span className="font-bold text-[#111111] uppercase block font-['Futura_PT_Book',sans-serif]">
                                {lead.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                <span className="font-mono text-gray-400">{lead.ref || lead.id}</span>
                                <span>•</span>
                                <span>{lead.date}</span>
                                {(lead.recordedBy === 'device-only' || lead.pendingSync) && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase font-bold text-[9.5px] tracking-wider">
                                    {lead.recordedBy === 'device-only' ? 'Not in store' : 'Change not saved'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Contact with WhatsApp & Call */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
                                <span>{lead.phone}</span>
                              </div>
                              {lead.email && (
                                <span className="text-[11px] text-gray-500 block truncate max-w-[180px]">
                                  {lead.email}
                                </span>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                {cleanPhone && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[10px] font-bold rounded-xs transition-colors shadow-2xs"
                                    title="Open WhatsApp chat"
                                  >
                                    <MessageSquare size={11} />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                                {lead.phone && (
                                  <a
                                    href={`tel:${lead.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-xs transition-colors"
                                    title="Call lead"
                                  >
                                    <PhoneCall size={11} />
                                    <span>Call</span>
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Source */}
                            <td className="py-3.5 px-4 align-top">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  lead.source === 'Store Walk-In'
                                    ? 'bg-purple-100 text-purple-800'
                                    : lead.source === '15% Welcome Modal'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : lead.source === 'TONTO Made Drop Waitlist'
                                    ? 'bg-amber-100 text-amber-800'
                                    : lead.source === 'Product Enquiry'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {lead.source}
                              </span>
                            </td>

                            {/* Interest & Value */}
                            <td className="py-3.5 px-4 align-top max-w-[200px]">
                              <span className="font-medium text-[#111111] text-[12px] block line-clamp-2">
                                {lead.interest || 'General Collection / Fit inquiry'}
                              </span>
                              {lead.estimatedValue > 0 && (
                                <span className="text-[11px] font-bold text-[#003F25] mt-0.5 block">
                                  Est. ₹{lead.estimatedValue.toLocaleString()}
                                </span>
                              )}
                            </td>

                            {/* Pipeline Stage Selector */}
                            <td className="py-3.5 px-4 align-top">
                              <select
                                value={lead.stage}
                                onChange={(e) => handleUpdateLeadStage(lead.id, e.target.value)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-xs border cursor-pointer outline-none transition-colors ${
                                  lead.stage === 'New'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 focus:border-amber-500'
                                    : lead.stage === 'In Discussion'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300 focus:border-blue-500'
                                    : lead.stage === 'Converted'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:border-emerald-500'
                                    : 'bg-gray-50 text-gray-600 border-gray-300 focus:border-gray-500'
                                }`}
                              >
                                <option value="New">● New</option>
                                <option value="In Discussion">● In Discussion</option>
                                <option value="Converted">✓ Converted</option>
                                <option value="Lost">✕ Lost</option>
                              </select>
                            </td>

                            {/* Fitting / Consultation Notes */}
                            <td className="py-3.5 px-4 align-top max-w-[220px]">
                              <p className="text-[11px] text-gray-600 leading-relaxed italic line-clamp-2">
                                {lead.notes ? `"${lead.notes}"` : 'No notes recorded'}
                              </p>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLead(lead)}
                                  className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xs transition-colors cursor-pointer"
                                  title="Edit lead details"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                                  title="Remove lead"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-500">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Users size={28} className="mx-auto text-gray-300" />
                            <p className="font-semibold text-gray-700 text-sm">
                              {leads.length === 0 ? 'No leads in the store CRM yet' : 'No leads match current filter'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {leads.length === 0
                                ? 'Walk-ins, waitlist signups and welcome-offer claims arrive here on their own, or file one with the button below.'
                                : 'Try clearing your search query or add a new prospective client directly.'}
                            </p>
                            <button
                              type="button"
                              onClick={handleOpenAddLead}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003F25] text-white text-[11px] font-bold uppercase tracking-wider rounded-xs cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add New Lead</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* TAB 5: DROP SUBSCRIBERS */}
          {/* TAB 5: TONTO DROP 01 WAITLIST & VIP REGISTER */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header with Title and Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#003F25]/10 text-[#003F25] text-[10.5px] font-bold uppercase tracking-wider rounded-xs mb-1.5 border border-[#003F25]/20">
                    <Bell size={12} className="text-[#003F25]" />
                    <span>PRIVATE DROP REGISTER</span>
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    TONTO DROP 01 WAITLIST & VIP REGISTER
                  </h2>
                  <p className="text-[13px] text-[#5A665E] mt-0.5 max-w-2xl">
                    Exclusive early-access customer register for TONTO Drop 01 (Inaugural Waffle & Washed Denim Capsule). Members receive lookbook previews and 1-hour private checkout access before public release.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWaitlistModal(true)}
                    className="px-3.5 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-[11.5px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={14} />
                    <span>+ Add Walk-In</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDrop01Emails}
                    className="px-3.5 py-2 bg-[#F9FAF9] hover:bg-gray-100 text-[#111111] border border-[#E0E5E1] text-[11.5px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy emails of Drop 01 registered customers"
                  >
                    <Copy size={14} />
                    <span>Copy Drop 01 Emails</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSubscribersCSV}
                    className="px-3.5 py-2 bg-[#F9FAF9] hover:bg-gray-100 text-[#111111] border border-[#E0E5E1] text-[11.5px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Total Registrants</span>
                    <Users size={14} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#111111]">
                    {waitlistStats.total}
                  </div>
                  <p className="text-[11px] text-[#5A665E] mt-0.5">All captured contacts</p>
                </div>

                <div className="p-4 bg-[#003F25]/5 border border-[#003F25]/20 rounded-xs">
                  <div className="flex items-center justify-between text-[#003F25] mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Drop 01 Early Access</span>
                    <Sparkles size={14} className="text-[#003F25]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#003F25]">
                    {waitlistStats.drop01}
                  </div>
                  <p className="text-[11px] text-[#003F25] font-semibold mt-0.5">1-Hr Priority Window</p>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Welcome 15% VIPs</span>
                    <Tag size={14} className="text-emerald-700" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#111111]">
                    {waitlistStats.welcome}
                  </div>
                  <p className="text-[11px] text-[#5A665E] mt-0.5">Privilege code unlocked</p>
                </div>

                <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs">
                  <div className="flex items-center justify-between text-[#79867D] mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Release Status</span>
                    <Clock size={14} className="text-amber-700" />
                  </div>
                  <div className="text-[13px] font-bold uppercase tracking-wider text-amber-800 mt-2">
                    In Production
                  </div>
                  <p className="text-[11px] text-[#5A665E] mt-0.5">Coimbatore Atelier</p>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={waitlistSearchQuery}
                    onChange={(e) => setWaitlistSearchQuery(e.target.value)}
                    placeholder="Search by email, name or phone..."
                    className="w-full pl-9 pr-3.5 py-2 text-[12.5px] border border-[#E0E5E1] rounded-xs focus:outline-none focus:border-[#003F25] bg-white text-[#111111]"
                  />
                  {waitlistSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setWaitlistSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setWaitlistDropFilter('All')}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shrink-0 ${
                      waitlistDropFilter === 'All'
                        ? 'bg-[#003F25] text-white'
                        : 'bg-gray-100 text-[#5A665E] hover:bg-gray-200'
                    }`}
                  >
                    All ({subscribers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaitlistDropFilter('drop01')}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shrink-0 ${
                      waitlistDropFilter === 'drop01'
                        ? 'bg-[#003F25] text-white'
                        : 'bg-gray-100 text-[#5A665E] hover:bg-gray-200'
                    }`}
                  >
                    Drop 01 Only ({waitlistStats.drop01})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaitlistDropFilter('welcome')}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shrink-0 ${
                      waitlistDropFilter === 'welcome'
                        ? 'bg-[#003F25] text-white'
                        : 'bg-gray-100 text-[#5A665E] hover:bg-gray-200'
                    }`}
                  >
                    Welcome 15% ({waitlistStats.welcome})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaitlistDropFilter('footer')}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shrink-0 ${
                      waitlistDropFilter === 'footer'
                        ? 'bg-[#003F25] text-white'
                        : 'bg-gray-100 text-[#5A665E] hover:bg-gray-200'
                    }`}
                  >
                    Footer Alerts ({waitlistStats.footer})
                  </button>
                </div>
              </div>

              {/* High-End Waitlist Data Table */}
              <div className="border border-[#E0E5E1] rounded-xs overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-[#F9FAF9] border-b border-[#E0E5E1] text-[11px] font-bold uppercase tracking-wider text-[#5A665E]">
                      <tr>
                        <th className="py-3 px-4">Customer Details</th>
                        <th className="py-3 px-4">Target Drop & Size</th>
                        <th className="py-3 px-4">Access Priority</th>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Date Registered</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSubscribers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 px-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-2">
                              <Bell size={20} />
                            </div>
                            <p className="text-[13px] font-bold uppercase tracking-wider text-[#111111]">
                              No waitlist registrants found
                            </p>
                            <p className="text-[12px] text-[#5A665E] mt-1 max-w-md mx-auto">
                              Customers who submit their email on the storefront "BE FIRST FOR TONTO DROP 01" banner appear here in real time.
                            </p>
                          </td>
                        </tr>
                      )}
                      {filteredSubscribers.map((sub) => {
                        const isDrop01Entry =
                          String(sub.dropName || '').toLowerCase().includes('drop 01') ||
                          String(sub.source || '').toLowerCase().includes('drop 01') ||
                          String(sub.source || '').toLowerCase().includes('waitlist');

                        return (
                          <tr key={sub.email + (sub.id || '')} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#111111] text-[13px] capitalize">
                                {sub.name || sub.email.split('@')[0]}
                              </div>
                              <div className="font-mono text-xs text-[#5A665E] mt-0.5 flex items-center gap-1.5">
                                <span>{sub.email}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(sub.email);
                                    showToast(`Copied ${sub.email}`);
                                  }}
                                  className="text-gray-400 hover:text-[#003F25] transition-colors cursor-pointer"
                                  title="Copy Email"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                              {sub.phone && sub.phone !== 'Awaiting WhatsApp' && (
                                <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                                  <span>📞 {sub.phone}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-bold uppercase tracking-wider ${
                                  isDrop01Entry
                                    ? 'bg-[#003F25] text-white shadow-xs'
                                    : 'bg-gray-100 text-[#111111]'
                                }`}
                              >
                                {isDrop01Entry && <Sparkles size={10} />}
                                <span>{sub.dropName || 'TONTO Drop 01'}</span>
                              </span>
                              <div className="text-[11px] text-[#5A665E] mt-1 font-medium">
                                Size: <span className="text-[#111111] font-bold">{sub.size || 'M'}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {isDrop01Entry ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xs text-[10.5px] font-bold uppercase tracking-wider">
                                  <Clock size={11} />
                                  <span>1-Hour Priority</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[#5A665E] rounded-xs text-[10.5px] font-medium uppercase">
                                  <span>Standard VIP</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-[#4B5563] rounded text-[11px] font-medium">
                                {sub.source}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-xs text-[#5A665E]">
                              {sub.date || 'Recent'}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {sub.phone && sub.phone !== 'Awaiting WhatsApp' && (
                                  <a
                                    href={`https://wa.me/${sub.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                      `Hi ${sub.name}! Your exclusive early access to TONTO Drop 01 is now open: https://www.tontoclothing.com`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                    title="Send WhatsApp Early Access Link"
                                  >
                                    <MessageSquare size={14} />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(sub.email);
                                    showToast(`Copied ${sub.email}`);
                                  }}
                                  className="p-1.5 text-[#5A665E] hover:text-[#003F25] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                  title="Copy Email"
                                >
                                  <Copy size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteWaitlistEntry(sub.email)}
                                  className="p-1.5 text-[#5A665E] hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Remove from Waitlist"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal for adding Walk-in customer to Waitlist */}
              {showAddWaitlistModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-xs">
                  <div className="bg-white rounded-xs max-w-md w-full border border-[#E0E5E1] p-6 shadow-2xl animate-scale-up">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                          Add Customer to Drop 01 Waitlist
                        </h3>
                        <p className="text-xs text-[#5A665E]">
                          Manually register a showroom walk-in or phone enquiry for early access.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddWaitlistModal(false)}
                        className="text-gray-400 hover:text-black cursor-pointer p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleAddWaitlistSubmit} className="space-y-3.5 text-left text-[12.5px]">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={waitlistForm.name}
                          onChange={(e) => setWaitlistForm({ ...waitlistForm, name: e.target.value })}
                          placeholder="e.g. Arun Kumar"
                          className="w-full px-3 py-2 border border-[#E0E5E1] rounded-xs focus:outline-none focus:border-[#003F25]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={waitlistForm.email}
                          onChange={(e) => setWaitlistForm({ ...waitlistForm, email: e.target.value })}
                          placeholder="e.g. arun@gmail.com"
                          className="w-full px-3 py-2 border border-[#E0E5E1] rounded-xs focus:outline-none focus:border-[#003F25]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                            WhatsApp / Phone
                          </label>
                          <input
                            type="tel"
                            value={waitlistForm.phone}
                            onChange={(e) => setWaitlistForm({ ...waitlistForm, phone: e.target.value })}
                            placeholder="e.g. 9876543210"
                            className="w-full px-3 py-2 border border-[#E0E5E1] rounded-xs focus:outline-none focus:border-[#003F25]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                            Preferred Size
                          </label>
                          <select
                            value={waitlistForm.size}
                            onChange={(e) => setWaitlistForm({ ...waitlistForm, size: e.target.value })}
                            className="w-full px-3 py-2 border border-[#E0E5E1] rounded-xs focus:outline-none focus:border-[#003F25] bg-white"
                          >
                            <option value="S">S - Small</option>
                            <option value="M">M - Medium</option>
                            <option value="L">L - Large</option>
                            <option value="XL">XL - Extra Large</option>
                            <option value="XXL">XXL</option>
                            <option value="Any">Any / Free Size</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                          Target Drop
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={waitlistForm.dropName}
                          className="w-full px-3 py-2 border border-[#E0E5E1] rounded-xs bg-gray-50 text-gray-700 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                          Showroom Notes
                        </label>
                        <textarea
                          rows={2}
                          value={waitlistForm.notes}
                          onChange={(e) => setWaitlistForm({ ...waitlistForm, notes: e.target.value })}
                          placeholder="Walk-in at Coimbatore store, interested in waffle thermal..."
                          className="w-full px-3 py-2 border border-[#E0E5E1] rounded-xs focus:outline-none focus:border-[#003F25]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowAddWaitlistModal(false)}
                          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer shadow-sm"
                        >
                          Register Customer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PROMO CODES */}
          {activeTab === 'promos' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    PROMOTIONS & DISCOUNT PRIVILEGES
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Manage active coupon codes and monitor redemption rates across client checkouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatePromoOpen(!isCreatePromoOpen)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>{isCreatePromoOpen ? 'Close Form' : 'Create Promo Code'}</span>
                </button>
              </div>

              {/* Create Promo Code Form Panel */}
              {isCreatePromoOpen && (
                <div className="p-5 bg-white border border-[#003F25] rounded-xs shadow-sm text-left animate-slide-down">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#003F25] mb-3">
                    New Promotional Privilege Code
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Coupon Code</label>
                      <input
                        type="text"
                        placeholder="e.g. DIWALI20"
                        value={newPromoForm.code}
                        onChange={(e) => setNewPromoForm({ ...newPromoForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                        className="w-full px-3 py-2 border border-gray-300 font-mono text-sm font-bold uppercase focus:border-[#003F25] focus:outline-none rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Discount Label</label>
                      <input
                        type="text"
                        placeholder="e.g. 20% OFF"
                        value={newPromoForm.discount}
                        onChange={(e) => setNewPromoForm({ ...newPromoForm, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:border-[#003F25] focus:outline-none rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Campaign Type / Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Festival Season Sourcing"
                        value={newPromoForm.type}
                        onChange={(e) => setNewPromoForm({ ...newPromoForm, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:border-[#003F25] focus:outline-none rounded-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatePromoOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-gray-600 hover:bg-gray-50 rounded-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={promoSaving}
                      onClick={handleCreatePromo}
                      className="px-5 py-2 bg-[#003F25] hover:bg-[#002e1b] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer"
                    >
                      {promoSaving ? 'Publishing…' : 'Save & Activate Code'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promos.length === 0 && (
                  <div className="md:col-span-3 p-10 text-center border border-dashed border-[#E0E5E1] rounded-xs bg-white">
                    <Tag size={22} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-[13px] font-bold uppercase tracking-wider text-[#111111]">
                      No promo codes in the store
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1 max-w-md mx-auto">
                      {promosSource === 'api'
                        ? 'Checkout will accept no code until one is created here. Redemption counts come from the store, not from this desk.'
                        : "The store's promo list did not load, so this desk is showing its own copy — which is empty."}
                    </p>
                  </div>
                )}
                {promos.map((promo) => (
                  <div key={promo.code} className="p-5 bg-[#F9FAF9] border-2 border-dashed border-[#003F25]/40 rounded-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold tracking-widest text-[#003F25] font-mono">
                          {promo.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase ${promo.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                          {promo.recordedBy === 'device-only'
                            ? 'This device only'
                            : promo.pendingSync
                            ? 'Change not saved'
                            : promo.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{promo.discount}</p>
                      <p className="text-xs text-gray-500">{promo.type}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 text-xs text-[#79867D] flex items-center justify-between">
                      <span>Redeemed {promo.uses || 0} times</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePromo(promo)}
                          className="text-[#003F25] font-bold hover:underline cursor-pointer"
                        >
                          {promo.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeletePromo(promo)}
                          className="text-rose-600 font-bold hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: MEDIA & SECTIONS CMS */}
          {activeTab === 'cms' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* CMS Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E0E5E1]">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-emerald-50 text-[#003F25] text-[10px] font-bold tracking-widest uppercase rounded-xs mb-1.5 border border-emerald-200">
                    <Sparkles size={11} />
                    <span>REAL-TIME STORE MEDIA CMS</span>
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                    SECTIONS & MEDIA CMS
                  </h2>
                  <p className="text-[13px] text-[#767676] mt-0.5">
                    Swap pictures and headlines across every section of the storefront. Pick from library presets, upload from your device, or input custom URLs.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSaveCms(cms, { immediate: true })}
                    disabled={cmsSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <Check size={14} />
                    <span>{cmsSaving ? 'Publishing…' : 'Save All CMS Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateStore}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-[#111111] border border-gray-300 text-[12px] font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>View Storefront</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCms}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                    title="Reset all sections to default factory pictures"
                  >
                    <RefreshCw size={13} />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Section Sub-Navigation Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-200 no-scrollbar">
                {[
                  { id: 'hero', label: '1. Hero Section' },
                  { id: 'graphic', label: '2. The Graphic Edit' },
                  { id: 'lookbook', label: '3. Lookbook Banner' },
                  { id: 'categories', label: '4. Category Carousel' },
                  { id: 'shoppable', label: '5. Shoppable Looks' },
                  { id: 'about', label: '6. About Us Page' },
                  { id: 'couponModal', label: '7. Coupon Pop-up' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCmsSectionTab(tab.id)}
                    className={`px-3.5 py-2 text-[12px] font-bold uppercase tracking-wider rounded-xs transition-all whitespace-nowrap cursor-pointer ${
                      cmsSectionTab === tab.id
                        ? 'bg-[#003F25] text-white shadow-xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SUB-SECTION 1: HERO SECTION */}
              {cmsSectionTab === 'hero' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                        Homepage Main Hero Banner
                      </h3>
                      <p className="text-xs text-[#767676]">
                        First impression banner displayed at the top of the homepage.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-[#003F25] bg-emerald-50 px-2 py-0.5 rounded">
                      Aspect Ratio: 16:9 / Fullscreen
                    </span>
                  </div>

                  {/* Live Hero Banner Preview */}
                  <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-xs overflow-hidden bg-black border border-gray-200 shadow-inner group">
                    <img
                      src={cms.hero?.image || '/assets/hero-banner-clean.jpg'}
                      alt="Hero Live Preview"
                      className="w-full h-full object-cover object-center filter contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-white max-w-xl">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#86EFAC] uppercase mb-1">
                        {cms.hero?.tagline || 'THRIFT / IMPORTED / SURPLUS'}
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight font-['Futura_PT_Book',sans-serif] leading-tight drop-shadow-md">
                        {cms.hero?.headline || 'MADE TO BE DIFFERENT'}
                      </h2>
                      <div className="mt-3">
                        <span className="inline-block px-4 py-2 bg-white text-black text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                          {cms.hero?.buttonText || 'SHOP THE NEW ARRIVALS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* Image Selector & Uploader */}
                    <div className="space-y-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        1. Change Hero Picture
                      </label>
                      
                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Preset Library:</span>
                        <select
                          value={cms.hero?.image}
                          onChange={(e) => {
                            const updated = { ...cms, hero: { ...cms.hero, image: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        >
                          {GALLERY_PRESETS.map((p, i) => (
                            <option key={i} value={p.url}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUploadCmsImage((mediaUrl) => {
                            const updated = { ...cms, hero: { ...cms.hero, image: mediaUrl } };
                            handleSaveCms(updated);
                          })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11.5px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                        >
                          <Upload size={13} />
                          <span>Upload From Device</span>
                        </button>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Or Direct Image URL:</span>
                        <input
                          type="text"
                          value={cms.hero?.image || ''}
                          onChange={(e) => {
                            const updated = { ...cms, hero: { ...cms.hero, image: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          placeholder="/assets/hero-banner-clean.jpg"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-mono outline-none"
                        />
                      </div>
                    </div>

                    {/* Typography Controls */}
                    <div className="space-y-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        2. Headline & Call to Action
                      </label>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Tagline:</span>
                        <input
                          type="text"
                          value={cms.hero?.tagline || ''}
                          onChange={(e) => {
                            const updated = { ...cms, hero: { ...cms.hero, tagline: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Headline:</span>
                        <input
                          type="text"
                          value={cms.hero?.headline || ''}
                          onChange={(e) => {
                            const updated = { ...cms, hero: { ...cms.hero, headline: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Button Text:</span>
                        <input
                          type="text"
                          value={cms.hero?.buttonText || ''}
                          onChange={(e) => {
                            const updated = { ...cms, hero: { ...cms.hero, buttonText: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SECTION 2: THE GRAPHIC EDIT */}
              {cmsSectionTab === 'graphic' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                        The Graphic Edit Campaign Banner
                      </h3>
                      <p className="text-xs text-[#767676]">
                        Full-width editorial banner spotlighting oversized tees and graphic pieces.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-[#003F25] bg-emerald-50 px-2 py-0.5 rounded">
                      Aspect Ratio: Panoramic 21:9
                    </span>
                  </div>

                  {/* Live Graphic Banner Preview */}
                  <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-xs overflow-hidden bg-black border border-gray-200 shadow-inner group">
                    <img
                      src={cms.graphicBanner?.image || '/assets/campaign-graphic-clean.jpg'}
                      alt="Graphic Banner Live Preview"
                      className="w-full h-full object-cover object-center filter contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />

                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-white max-w-xl">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#86EFAC] uppercase mb-1">
                        {cms.graphicBanner?.subtitle || 'OVERSIZED FITS. EVERYDAY STYLE.'}
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight font-['Futura_PT_Book',sans-serif] leading-tight drop-shadow-md">
                        {cms.graphicBanner?.headline || 'THE GRAPHIC EDIT'}
                      </h2>
                      <div className="mt-3">
                        <span className="inline-block px-4 py-2 bg-white text-black text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                          {cms.graphicBanner?.buttonText || 'shop now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        1. Change Campaign Banner Picture
                      </label>
                      
                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Preset Library:</span>
                        <select
                          value={cms.graphicBanner?.image}
                          onChange={(e) => {
                            const updated = { ...cms, graphicBanner: { ...cms.graphicBanner, image: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        >
                          {GALLERY_PRESETS.map((p, i) => (
                            <option key={i} value={p.url}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUploadCmsImage((mediaUrl) => {
                            const updated = { ...cms, graphicBanner: { ...cms.graphicBanner, image: mediaUrl } };
                            handleSaveCms(updated);
                          })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11.5px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                        >
                          <Upload size={13} />
                          <span>Upload From Device</span>
                        </button>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Or Direct Image URL:</span>
                        <input
                          type="text"
                          value={cms.graphicBanner?.image || ''}
                          onChange={(e) => {
                            const updated = { ...cms, graphicBanner: { ...cms.graphicBanner, image: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        2. Headline & Call to Action
                      </label>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Subtitle:</span>
                        <input
                          type="text"
                          value={cms.graphicBanner?.subtitle || ''}
                          onChange={(e) => {
                            const updated = { ...cms, graphicBanner: { ...cms.graphicBanner, subtitle: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Headline:</span>
                        <input
                          type="text"
                          value={cms.graphicBanner?.headline || ''}
                          onChange={(e) => {
                            const updated = { ...cms, graphicBanner: { ...cms.graphicBanner, headline: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Button Text:</span>
                        <input
                          type="text"
                          value={cms.graphicBanner?.buttonText || ''}
                          onChange={(e) => {
                            const updated = { ...cms, graphicBanner: { ...cms.graphicBanner, buttonText: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SECTION 3: TONTO MADE BANNER */}
              {cmsSectionTab === 'lookbook' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                        TONTO Made Full-Width Banner
                      </h3>
                      <p className="text-xs text-[#767676]">
                        Full-width editorial lookbook banner linking to our atelier lookbook.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-[#003F25] bg-emerald-50 px-2 py-0.5 rounded">
                      Aspect Ratio: Panoramic 21:9
                    </span>
                  </div>

                  {/* Live Lookbook Banner Preview */}
                  <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-xs overflow-hidden bg-black border border-gray-200 shadow-inner group">
                    <img
                      src={cms.lookbookBanner?.image || '/assets/hero-banner-clean.jpg'}
                      alt="Lookbook Banner Live Preview"
                      className="w-full h-full object-cover object-center filter contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-white max-w-xl">
                      <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight font-['Futura_PT_Book',sans-serif] leading-tight drop-shadow-md">
                        {cms.lookbookBanner?.headline || 'TONTO MADE'}
                      </h2>
                      <div className="mt-3">
                        <span className="inline-block px-4 py-2 bg-white text-black text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                          {cms.lookbookBanner?.buttonText || 'explore tonto made'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        1. Change Lookbook Banner Picture
                      </label>
                      
                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Preset Library:</span>
                        <select
                          value={cms.lookbookBanner?.image}
                          onChange={(e) => {
                            const updated = { ...cms, lookbookBanner: { ...cms.lookbookBanner, image: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        >
                          {GALLERY_PRESETS.map((p, i) => (
                            <option key={i} value={p.url}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUploadCmsImage((mediaUrl) => {
                            const updated = { ...cms, lookbookBanner: { ...cms.lookbookBanner, image: mediaUrl } };
                            handleSaveCms(updated);
                          })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11.5px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                        >
                          <Upload size={13} />
                          <span>Upload From Device</span>
                        </button>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Or Direct Image URL:</span>
                        <input
                          type="text"
                          value={cms.lookbookBanner?.image || ''}
                          onChange={(e) => {
                            const updated = { ...cms, lookbookBanner: { ...cms.lookbookBanner, image: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        2. Headline & Call to Action
                      </label>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Headline:</span>
                        <input
                          type="text"
                          value={cms.lookbookBanner?.headline || ''}
                          onChange={(e) => {
                            const updated = { ...cms, lookbookBanner: { ...cms.lookbookBanner, headline: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Button Text:</span>
                        <input
                          type="text"
                          value={cms.lookbookBanner?.buttonText || ''}
                          onChange={(e) => {
                            const updated = { ...cms, lookbookBanner: { ...cms.lookbookBanner, buttonText: e.target.value } };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SECTION 4: TONTO MADE ATELIER (3 CARDS) */}
              {cmsSectionTab === 'tontoMade' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                      TONTO Made In-House Atelier (3 Craft Feature Cards)
                    </h3>
                    <p className="text-xs text-[#767676]">
                      Customize the pictures, tags, titles, and stories for the 3 in-house craftsmanship pillars.
                    </p>
                  </div>

                  {/* Header info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F9FAF9] p-4 rounded-xs border border-gray-200">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-gray-700 block mb-1">Section Badge:</span>
                      <input
                        type="text"
                        value={(cms.tontoOwnMake || cms.tontoMade)?.badge || 'IN-HOUSE ATELIER • COIMBATORE'}
                        onChange={(e) => {
                          const cur = cms.tontoOwnMake || cms.tontoMade || {};
                          const updated = {
                            ...cms,
                            tontoOwnMake: { ...cur, badge: e.target.value },
                            tontoMade: { ...cur, badge: e.target.value }
                          };
                          handleSaveCms(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-gray-700 block mb-1">Section Headline:</span>
                      <input
                        type="text"
                        value={(cms.tontoOwnMake || cms.tontoMade)?.headline || 'TONTO MADE'}
                        onChange={(e) => {
                          const cur = cms.tontoOwnMake || cms.tontoMade || {};
                          const updated = {
                            ...cms,
                            tontoOwnMake: { ...cur, headline: e.target.value },
                            tontoMade: { ...cur, headline: e.target.value }
                          };
                          handleSaveCms(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-gray-700 block mb-1">Section Description:</span>
                      <input
                        type="text"
                        value={(cms.tontoOwnMake || cms.tontoMade)?.description || ''}
                        onChange={(e) => {
                          const cur = cms.tontoOwnMake || cms.tontoMade || {};
                          const updated = {
                            ...cms,
                            tontoOwnMake: { ...cur, description: e.target.value },
                            tontoMade: { ...cur, description: e.target.value }
                          };
                          handleSaveCms(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                      />
                    </div>
                  </div>

                  {/* 3 Craft Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                    {[
                      {
                        num: '1',
                        label: 'Card 1: Custom Trims & Labels',
                        imgKey: 'card1Image',
                        tagKey: 'card1Tag',
                        titleKey: 'card1Title',
                        descKey: 'card1Desc',
                        defaultImg: '/assets/branding/tonto-tags.jpg'
                      },
                      {
                        num: '2',
                        label: 'Card 2: Drop-Shoulder Proportions',
                        imgKey: 'card2Image',
                        tagKey: 'card2Tag',
                        titleKey: 'card2Title',
                        descKey: 'card2Desc',
                        defaultImg: '/assets/products/tonto-waffle-tees-hanging.jpg'
                      },
                      {
                        num: '3',
                        label: 'Card 3: Milled Knits & Washes',
                        imgKey: 'card3Image',
                        tagKey: 'card3Tag',
                        titleKey: 'card3Title',
                        descKey: 'card3Desc',
                        defaultImg: '/assets/products/tonto-studios-waffle-black-concrete.jpg'
                      }
                    ].map((card) => {
                      const cur = cms.tontoOwnMake || cms.tontoMade || {};
                      const cardImg = cur[card.imgKey] || card.defaultImg;
                      const cardTag = cur[card.tagKey] || '';
                      const cardTitle = cur[card.titleKey] || '';
                      const cardDesc = cur[card.descKey] || '';

                      const updateCardField = (key, val) => {
                        const updatedCur = { ...cur, [key]: val };
                        const updated = {
                          ...cms,
                          tontoOwnMake: updatedCur,
                          tontoMade: updatedCur
                        };
                        handleSaveCms(updated);
                      };

                      return (
                        <div key={card.num} className="bg-[#F9FAF9] border border-gray-200 rounded-xs overflow-hidden flex flex-col space-y-3 p-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#003F25]">
                            {card.label}
                          </span>

                          {/* Live preview */}
                          <div className="relative aspect-[4/3] rounded-xs overflow-hidden bg-gray-200 border border-gray-300">
                            <img
                              src={cardImg}
                              alt={cardTitle}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[9.5px] font-mono tracking-widest uppercase">
                              {cardTag}
                            </div>
                          </div>

                          {/* Preset dropdown */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Preset Picture:</span>
                            <select
                              value={cardImg}
                              onChange={(e) => updateCardField(card.imgKey, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] outline-none"
                            >
                              {GALLERY_PRESETS.map((p, i) => (
                                <option key={i} value={p.url}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Upload from device */}
                          <button
                            type="button"
                            onClick={() => handleUploadCmsImage((mediaUrl) => updateCardField(card.imgKey, mediaUrl))}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                          >
                            <Upload size={12} />
                            <span>Upload Picture</span>
                          </button>

                          {/* Direct URL */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Image URL:</span>
                            <input
                              type="text"
                              value={cardImg}
                              onChange={(e) => updateCardField(card.imgKey, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] font-mono outline-none"
                            />
                          </div>

                          {/* Tag */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Tag Pill:</span>
                            <input
                              type="text"
                              value={cardTag}
                              onChange={(e) => updateCardField(card.tagKey, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] outline-none"
                            />
                          </div>

                          {/* Title */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Card Title:</span>
                            <input
                              type="text"
                              value={cardTitle}
                              onChange={(e) => updateCardField(card.titleKey, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] font-bold outline-none"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Description:</span>
                            <textarea
                              rows={2}
                              value={cardDesc}
                              onChange={(e) => updateCardField(card.descKey, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] outline-none resize-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-SECTION 5: CATEGORY CAROUSEL */}
              {cmsSectionTab === 'categories' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                      Category Carousel (6 Department Cards)
                    </h3>
                    <p className="text-xs text-[#767676]">
                      Change the cover photos and subtitles for the 6 lifestyle department cards on the homepage.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(cms.categoryCarousel?.length ? cms.categoryCarousel : cms.categories?.length ? cms.categories : DEFAULT_CMS_CONTENT.categories).map((cat, idx) => {
                      const updateCatField = (field, val) => {
                        const currentList = [...(cms.categoryCarousel?.length ? cms.categoryCarousel : cms.categories?.length ? cms.categories : DEFAULT_CMS_CONTENT.categories)];
                        currentList[idx] = { ...currentList[idx], [field]: val };
                        const updated = {
                          ...cms,
                          categories: currentList,
                          categoryCarousel: currentList
                        };
                        handleSaveCms(updated);
                      };

                      return (
                        <div key={cat.id || idx} className="bg-[#F9FAF9] border border-gray-200 rounded-xs p-4 flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#003F25]">
                              {cat.title}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 bg-white px-1.5 py-0.5 border border-gray-200 rounded">
                              {cat.categoryFilter || 'Filter'}
                            </span>
                          </div>

                          {/* Live preview */}
                          <div className="relative aspect-[345/420] rounded-xs overflow-hidden bg-gray-100 border border-gray-300">
                            <img
                              src={cat.image}
                              alt={cat.title}
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute bottom-2 left-2 right-2 p-2 bg-white/90 backdrop-blur-xs text-left">
                              <p className="text-[11px] font-bold text-black uppercase">{cat.title}</p>
                              <p className="text-[9.5px] text-gray-600 truncate">{cat.subtitle}</p>
                            </div>
                          </div>

                          {/* Preset dropdown */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Preset Picture:</span>
                            <select
                              value={cat.image}
                              onChange={(e) => updateCatField('image', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] outline-none"
                            >
                              {GALLERY_PRESETS.map((p, i) => (
                                <option key={i} value={p.url}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Upload from device */}
                          <button
                            type="button"
                            onClick={() => handleUploadCmsImage((mediaUrl) => updateCatField('image', mediaUrl))}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                          >
                            <Upload size={12} />
                            <span>Upload Picture</span>
                          </button>

                          {/* Direct URL */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Image URL:</span>
                            <input
                              type="text"
                              value={cat.image || ''}
                              onChange={(e) => updateCatField('image', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] font-mono outline-none"
                            />
                          </div>

                          {/* Title */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Department Title:</span>
                            <input
                              type="text"
                              value={cat.title || ''}
                              onChange={(e) => updateCatField('title', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] font-bold outline-none"
                            />
                          </div>

                          {/* Subtitle */}
                          <div>
                            <span className="text-[10.5px] text-gray-500 block mb-0.5">Subtitle / Items:</span>
                            <input
                              type="text"
                              value={cat.subtitle || ''}
                              onChange={(e) => updateCatField('subtitle', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[11px] outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-SECTION 6: DYNAMIC SHOPPABLE LOOKS & COSTUMES (IMAGE & VIDEO) */}
              {cmsSectionTab === 'shoppable' && (() => {
                const currentLooks = (cms.shoppableLooks && cms.shoppableLooks.length > 0)
                  ? cms.shoppableLooks
                  : DEFAULT_CMS_CONTENT.shoppableLooks;

                const updateLookField = (idx, field, val) => {
                  const nextList = [...currentLooks];
                  nextList[idx] = { ...nextList[idx], [field]: val };
                  if (field === 'costumePrice') {
                    const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
                    nextList[idx].costumeNumericPrice = num;
                  }
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                };

                const handleMoveLook = (idx, direction) => {
                  const nextIdx = idx + direction;
                  if (nextIdx < 0 || nextIdx >= currentLooks.length) return;
                  const nextList = [...currentLooks];
                  const temp = nextList[idx];
                  nextList[idx] = nextList[nextIdx];
                  nextList[nextIdx] = temp;
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                  showToast('Look reordered!');
                };

                const handleDeleteLook = (idx) => {
                  if (currentLooks.length <= 1) {
                    showToast('You must keep at least 1 look.');
                    return;
                  }
                  const lookTitle = currentLooks[idx]?.title || `Look #${idx + 1}`;
                  if (confirm(`Delete "${lookTitle}" from Shoppable Looks?`)) {
                    const nextList = currentLooks.filter((_, i) => i !== idx);
                    handleSaveCms({ ...cms, shoppableLooks: nextList });
                    showToast('Look removed from storefront.');
                  }
                };

                const handleAddNewLook = () => {
                  const newId = `look-${Date.now()}`;
                  const newLook = {
                    id: newId,
                    title: 'New Editorial Streetwear Outfit',
                    shortTitle: 'New Streetwear Look',
                    mediaType: 'video',
                    image: '/assets/editorial/editorial-standing-camo.jpg',
                    video: '/assets/videos/look-preview.mp4',
                    costumePrice: '₹5,780',
                    costumeNumericPrice: 5780,
                    itemsCount: 2,
                    tag: 'TONTO MADE • EDITORIAL',
                    description: 'Curated streetwear ensemble from Coimbatore atelier.',
                    items: [
                      {
                        id: `${newId}-1`,
                        role: 'Top / Shirt',
                        productId: 'tonto-studios-waffle-black',
                        title: 'TONTO WAFFLE LONGSLEEVE',
                        price: '₹2,490',
                        numericPrice: 2490,
                        colour: 'black',
                        defaultSize: 'L',
                        variants: ['S', 'M', 'L', 'XL'],
                        image: '/assets/products/tonto-studios-waffle-black-front.jpg'
                      },
                      {
                        id: `${newId}-2`,
                        role: 'Bottom / Denim',
                        productId: 'distressed-chain-print-denim',
                        title: 'CHAIN-GRAFFITI BAGGY DENIM',
                        price: '₹3,290',
                        numericPrice: 3290,
                        colour: 'washed grey',
                        defaultSize: '32',
                        variants: ['30', '32', '34', '36'],
                        image: '/assets/products/chain-print-denim-detail.jpg'
                      }
                    ]
                  };
                  const nextList = [...currentLooks, newLook];
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                  showToast('New outfit created! You can now customize its video, images, and pieces.');
                };

                const handleResetDefaultLooks = () => {
                  if (confirm('Reset all looks back to the default editorial looks?')) {
                    handleSaveCms({ ...cms, shoppableLooks: SHOPPABLE_LOOKS });
                    showToast('Reset to default shoppable looks!');
                  }
                };

                const updatePieceField = (lookIdx, pieceIdx, field, val) => {
                  const nextList = [...currentLooks];
                  const targetLook = { ...nextList[lookIdx] };
                  const items = [...(targetLook.items || [])];
                  items[pieceIdx] = { ...items[pieceIdx], [field]: val };
                  if (field === 'price') {
                    const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
                    items[pieceIdx].numericPrice = num;
                  }
                  targetLook.items = items;
                  nextList[lookIdx] = targetLook;
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                };

                const autoSumCostumePrice = (lookIdx) => {
                  const nextList = [...currentLooks];
                  const targetLook = { ...nextList[lookIdx] };
                  const items = targetLook.items || [];
                  const sum = items.reduce((acc, it) => {
                    const p = it.numericPrice || parseInt(String(it.price).replace(/[^0-9]/g, ''), 10) || 0;
                    return acc + p;
                  }, 0);
                  targetLook.costumeNumericPrice = sum;
                  targetLook.costumePrice = `₹${sum.toLocaleString('en-IN')}`;
                  nextList[lookIdx] = targetLook;
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                  showToast(`Calculated whole costume total: ₹${sum.toLocaleString('en-IN')}`);
                };

                const handleAddPieceToLook = (lookIdx) => {
                  const nextList = [...currentLooks];
                  const targetLook = { ...nextList[lookIdx] };
                  const items = [...(targetLook.items || [])];
                  const newPiece = {
                    id: `item-${Date.now()}`,
                    role: 'Accessory / Coat',
                    productId: 'archive-hardware-belts',
                    title: 'ARCHIVE HARDWARE ACCESSORY',
                    price: '₹1,200',
                    numericPrice: 1200,
                    colour: 'industrial silver',
                    defaultSize: 'Standard',
                    variants: ['Standard'],
                    image: '/assets/products/archive-hardware-belts.jpg'
                  };
                  items.push(newPiece);
                  targetLook.items = items;
                  targetLook.itemsCount = items.length;
                  nextList[lookIdx] = targetLook;
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                  showToast('New piece added to costume!');
                };

                const handleRemovePieceFromLook = (lookIdx, pieceIdx) => {
                  const nextList = [...currentLooks];
                  const targetLook = { ...nextList[lookIdx] };
                  const items = [...(targetLook.items || [])];
                  items.splice(pieceIdx, 1);
                  targetLook.items = items;
                  targetLook.itemsCount = items.length;
                  nextList[lookIdx] = targetLook;
                  handleSaveCms({ ...cms, shoppableLooks: nextList });
                  showToast('Piece removed from costume.');
                };

                return (
                  <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                    {/* Header bar */}
                    <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                            Shop The Look & Costume Builder
                          </h3>
                          <span className="px-2 py-0.5 bg-emerald-50 text-[#003F25] text-[10px] font-bold uppercase tracking-wider rounded-xs border border-emerald-200">
                            {currentLooks.length} Looks Active
                          </span>
                        </div>
                        <p className="text-xs text-[#767676] mt-1">
                          Dynamic editorial carousel. Add images OR motion videos (MP4/WebM), customize total costume prices, and manage separate garment pieces (shirt, denim, coat, etc.).
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={handleResetDefaultLooks}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Reset to factory default 5 outfits"
                        >
                          <RefreshCw size={12} />
                          <span>Reset Defaults</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNewLook}
                          className="px-4 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus size={14} />
                          <span>Add New Look</span>
                        </button>
                      </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {currentLooks.map((look, idx) => {
                        const isVideo = look.mediaType === 'video' || Boolean(look.video) || (typeof look.image === 'string' && (look.image.endsWith('.mp4') || look.image.endsWith('.webm') || look.image.startsWith('data:video/')));
                        const videoSrc = look.video || (isVideo ? look.image : null);
                        const posterSrc = (look.image && !look.image.endsWith('.mp4') && !look.image.endsWith('.webm') && !look.image.startsWith('data:video/'))
                          ? look.image
                          : (look.thumbnail || '/assets/editorial/editorial-seated-camo.jpg');
                        const items = look.items || [];

                        return (
                          <div
                            key={look.id || idx}
                            className="bg-[#F9FAF9] border border-gray-200 rounded-xs p-4 flex flex-col space-y-4 hover:border-gray-400 transition-colors shadow-xs"
                          >
                            {/* Card Top Action Bar */}
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-[#003F25] text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xs">
                                  #{idx + 1}
                                </span>
                                <span className="text-[11px] font-mono text-gray-500">
                                  {look.id}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveLook(idx, -1)}
                                  disabled={idx === 0}
                                  className="p-1 text-gray-500 hover:text-black hover:bg-white rounded-xs disabled:opacity-30 cursor-pointer"
                                  title="Move Left / Earlier"
                                >
                                  <ArrowLeft size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveLook(idx, 1)}
                                  disabled={idx === currentLooks.length - 1}
                                  className="p-1 text-gray-500 hover:text-black hover:bg-white rounded-xs disabled:opacity-30 cursor-pointer"
                                  title="Move Right / Later"
                                >
                                  <ArrowRight size={13} />
                                </button>
                                <a
                                  href={`#/look/${look.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-[#003F25] hover:bg-white rounded-xs"
                                  title="Open look page on storefront"
                                >
                                  <ExternalLink size={13} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLook(idx)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-white rounded-xs cursor-pointer ml-1"
                                  title="Delete this look"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Media Type Segmented Switcher */}
                            <div>
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                                Media Format:
                              </span>
                              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-gray-200 rounded-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateLookField(idx, 'mediaType', 'image');
                                    if (look.image && (look.image.endsWith('.mp4') || look.image.endsWith('.webm'))) {
                                      updateLookField(idx, 'image', '/assets/editorial/editorial-seated-camo.jpg');
                                    }
                                  }}
                                  className={`py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                                    !isVideo
                                      ? 'bg-[#003F25] text-white shadow-xs'
                                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                                  }`}
                                >
                                  <ImageIcon size={13} />
                                  <span>Image</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateLookField(idx, 'mediaType', 'video');
                                    if (!look.video) {
                                      updateLookField(idx, 'video', '/assets/videos/look-preview.mp4');
                                    }
                                  }}
                                  className={`py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                                    isVideo
                                      ? 'bg-[#003F25] text-white shadow-xs'
                                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                                  }`}
                                >
                                  <Video size={13} />
                                  <span>Video (Motion)</span>
                                </button>
                              </div>
                            </div>

                            {/* Interactive Live Media Preview */}
                            <div className="relative aspect-[3/4.5] rounded-xs overflow-hidden bg-black border border-gray-300 shadow-inner group">
                              {isVideo && videoSrc ? (
                                <video
                                  key={videoSrc}
                                  src={videoSrc}
                                  poster={posterSrc}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <img
                                  src={posterSrc}
                                  alt={look.title}
                                  className="w-full h-full object-cover object-center"
                                />
                              )}

                              {/* Type Badge */}
                              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[9.5px] font-bold uppercase tracking-wider rounded-xs">
                                {isVideo ? <Film size={11} className="text-emerald-400" /> : <ImageIcon size={11} />}
                                <span>{isVideo ? 'Motion Video' : 'Editorial Photo'}</span>
                              </div>

                              {/* Title & Price Overlay */}
                              <div className="absolute bottom-2 left-2 right-2 p-2 bg-white/95 backdrop-blur-xs text-left rounded-xs shadow-xs">
                                <p className="text-[11px] font-bold text-black uppercase truncate">{look.title}</p>
                                <div className="flex items-center justify-between text-[10.5px] font-mono mt-0.5">
                                  <span className="text-[#003F25] font-extrabold">{look.costumePrice || '₹6,980'}</span>
                                  <span className="text-gray-500">{items.length} Pieces</span>
                                </div>
                              </div>
                            </div>

                            {/* Video Controls (Shown when Video Mode is selected) */}
                            {isVideo && (
                              <div className="bg-white p-3 border border-emerald-200 rounded-xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider flex items-center gap-1">
                                    <Video size={12} />
                                    <span>Video Source:</span>
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-mono">MP4 / WebM</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* The store uploads images only, so a video has to
                      come from a hosted URL — a device file would be refused on
                      save and the owner would lose the whole CMS payload. */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = window.prompt('Hosted video URL (MP4 or WebM):', look.video || '');
                                      if (url === null) return;
                                      const clean = url.trim();
                                      if (!clean) {
                                        showToast('Paste a video URL, or leave the field with a path in it.');
                                        return;
                                      }
                                      updateLookField(idx, 'video', clean);
                                      updateLookField(idx, 'mediaType', 'video');
                                      showToast('Video source set for this look.');
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[10.5px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                                  >
                                    <ExternalLink size={12} />
                                    <span>Set Video URL</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateLookField(idx, 'video', '/assets/videos/look-preview.mp4')}
                                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-xs cursor-pointer"
                                    title="Set default sample streetwear video"
                                  >
                                    Sample Video
                                  </button>
                                </div>

                                <div>
                                  <span className="text-[10px] text-gray-500 block mb-0.5">Video URL or Asset Path:</span>
                                  <input
                                    type="text"
                                    value={look.video || ''}
                                    placeholder="/assets/videos/look-preview.mp4 or https://..."
                                    onChange={(e) => updateLookField(idx, 'video', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[10.5px] font-mono outline-none"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] text-gray-500">Video Poster Image (Cover):</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUploadCmsMedia('image/*', (mediaUrl) => updateLookField(idx, 'image', mediaUrl))}
                                      className="text-[10px] text-[#003F25] underline cursor-pointer"
                                    >
                                      Upload Cover
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={look.image || ''}
                                    placeholder="Poster image URL..."
                                    onChange={(e) => updateLookField(idx, 'image', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[10px] font-mono outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Image Controls (Shown when Image Mode is selected) */}
                            {!isVideo && (
                              <div className="bg-white p-3 border border-gray-200 rounded-xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10.5px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                    <ImageIcon size={12} />
                                    <span>Image Source:</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUploadCmsMedia('image/*', (mediaUrl) => {
                                      updateLookField(idx, 'image', mediaUrl);
                                      updateLookField(idx, 'mediaType', 'image');
                                    })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#003F25] hover:bg-[#002e1b] text-white text-[10px] font-bold uppercase rounded-xs cursor-pointer shadow-xs"
                                  >
                                    <Upload size={11} />
                                    <span>Upload Image</span>
                                  </button>
                                </div>

                                <div>
                                  <span className="text-[10px] text-gray-500 block mb-0.5">Preset Editorial Picture:</span>
                                  <select
                                    value={look.image}
                                    onChange={(e) => updateLookField(idx, 'image', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[10.5px] outline-none"
                                  >
                                    {GALLERY_PRESETS.map((p, i) => (
                                      <option key={i} value={p.url}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[10px] text-gray-500 block mb-0.5">Direct Image URL:</span>
                                  <input
                                    type="text"
                                    value={look.image || ''}
                                    onChange={(e) => updateLookField(idx, 'image', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[10px] font-mono outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Look Title, Tag & Whole Costume Price */}
                            <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xs">
                              <div>
                                <span className="text-[10px] font-bold text-gray-600 block mb-0.5 uppercase tracking-wider">
                                  Outfit Title:
                                </span>
                                <input
                                  type="text"
                                  value={look.title || ''}
                                  onChange={(e) => updateLookField(idx, 'title', e.target.value)}
                                  className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[11px] font-bold outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[10px] font-bold text-gray-600 block mb-0.5 uppercase tracking-wider">
                                    Short Title (Under Card):
                                  </span>
                                  <input
                                    type="text"
                                    value={look.shortTitle || look.title || ''}
                                    onChange={(e) => updateLookField(idx, 'shortTitle', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[10.5px] outline-none"
                                  />
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-gray-600 block mb-0.5 uppercase tracking-wider">
                                    Editorial Tag:
                                  </span>
                                  <input
                                    type="text"
                                    value={look.tag || ''}
                                    placeholder="e.g. IN-HOUSE ATELIER"
                                    onChange={(e) => updateLookField(idx, 'tag', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[10.5px] outline-none"
                                  />
                                </div>
                              </div>

                              {/* Whole Costume Total Price */}
                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                <div className="flex-1">
                                  <span className="text-[10px] font-bold text-[#003F25] block uppercase tracking-wider">
                                    Whole Costume Price:
                                  </span>
                                  <input
                                    type="text"
                                    value={look.costumePrice || ''}
                                    placeholder="₹6,980"
                                    onChange={(e) => updateLookField(idx, 'costumePrice', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#F9FAF9] border border-[#003F25] rounded-xs text-[12px] font-mono font-bold text-[#003F25] outline-none"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => autoSumCostumePrice(idx)}
                                  className="mt-3 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#003F25] text-[10px] font-bold uppercase rounded-xs cursor-pointer flex-shrink-0"
                                  title="Calculate total price from individual pieces"
                                >
                                  ⚡ Auto-Sum
                                </button>
                              </div>
                            </div>

                            {/* Costume Pieces Breakdown (Shirt, Coat, Denim, etc.) */}
                            <div className="bg-white border border-gray-200 rounded-xs p-3 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-800">
                                  Costume Pieces ({items.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddPieceToLook(idx)}
                                  className="text-[10px] font-bold text-[#003F25] uppercase tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus size={11} />
                                  <span>Add Piece</span>
                                </button>
                              </div>

                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {items.map((it, pIdx) => (
                                  <div
                                    key={it.id || pIdx}
                                    className="p-2 bg-[#F9FAF9] border border-gray-200 rounded-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <input
                                        type="text"
                                        value={it.role || ''}
                                        placeholder="Role (e.g. Top / Thermal)"
                                        onChange={(e) => updatePieceField(idx, pIdx, 'role', e.target.value)}
                                        className="px-1.5 py-0.5 bg-white border border-gray-300 text-[10px] font-bold uppercase text-[#003F25] rounded-xs w-28 outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePieceFromLook(idx, pIdx)}
                                        className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                                        title="Remove piece"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <img
                                        src={it.image}
                                        alt={it.title}
                                        className="w-8 h-10 object-cover rounded-xs border border-gray-200 flex-shrink-0"
                                      />
                                      <div className="flex-1 space-y-1 min-w-0">
                                        <input
                                          type="text"
                                          value={it.title || ''}
                                          placeholder="Garment Name"
                                          onChange={(e) => updatePieceField(idx, pIdx, 'title', e.target.value)}
                                          className="w-full px-1.5 py-0.5 bg-white border border-gray-300 text-[10.5px] font-medium outline-none truncate"
                                        />
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={it.price || ''}
                                            placeholder="₹2,490"
                                            onChange={(e) => updatePieceField(idx, pIdx, 'price', e.target.value)}
                                            className="w-20 px-1.5 py-0.5 bg-white border border-gray-300 text-[10px] font-mono font-bold text-[#003F25] outline-none"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleUploadCmsMedia('image/*', (mediaUrl) => updatePieceField(idx, pIdx, 'image', mediaUrl))}
                                            className="text-[9.5px] text-gray-600 hover:text-black underline cursor-pointer"
                                          >
                                            Img
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {items.length === 0 && (
                                  <p className="text-[10.5px] text-gray-400 italic text-center py-2">
                                    No pieces added yet. Click &quot;Add Piece&quot; above.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* SUB-SECTION 7: ABOUT US PAGE */}
              {cmsSectionTab === 'about' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                      About Us Page Editorial Media
                    </h3>
                    <p className="text-xs text-[#767676]">
                      Change the main manifesto hero photo, in-house genesis picture, and archive highlight cards.
                    </p>
                  </div>

                  {/* 1. Manifesto Hero */}
                  <div className="bg-[#F9FAF9] p-4 rounded-xs border border-gray-200 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#003F25] block">
                      1. About Us Hero Header
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="relative aspect-[21/9] rounded-xs overflow-hidden bg-black border border-gray-300">
                        <img
                          src={cms.aboutUs?.heroImage || '/assets/editorial/editorial-brutalist-full.jpg'}
                          alt="About Hero"
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-lg font-bold uppercase font-['Futura_PT_Book',sans-serif]">
                            {cms.aboutUs?.headline || 'ABOUT TONTO'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] text-gray-500 block mb-0.5">Preset Picture:</span>
                          <select
                            value={cms.aboutUs?.heroImage}
                            onChange={(e) => {
                              const updated = { ...cms, aboutUs: { ...cms.aboutUs, heroImage: e.target.value } };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                          >
                            {GALLERY_PRESETS.map((p, i) => (
                              <option key={i} value={p.url}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUploadCmsImage((mediaUrl) => {
                            const updated = { ...cms, aboutUs: { ...cms.aboutUs, heroImage: mediaUrl } };
                            handleSaveCms(updated);
                          })}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11px] font-bold uppercase rounded-xs cursor-pointer shadow-xs w-full"
                        >
                          <Upload size={12} />
                          <span>Upload From Device</span>
                        </button>

                        <div>
                          <span className="text-[11px] text-gray-500 block mb-0.5">Headline:</span>
                          <input
                            type="text"
                            value={cms.aboutUs?.headline || 'ABOUT TONTO'}
                            onChange={(e) => {
                              const updated = { ...cms, aboutUs: { ...cms.aboutUs, headline: e.target.value } };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                          />
                        </div>

                        <div>
                          <span className="text-[11px] text-gray-500 block mb-0.5">Description:</span>
                          <textarea
                            rows={2}
                            value={cms.aboutUs?.description || ''}
                            onChange={(e) => {
                              const updated = { ...cms, aboutUs: { ...cms.aboutUs, description: e.target.value } };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Genesis Atelier photo */}
                  <div className="bg-[#F9FAF9] p-4 rounded-xs border border-gray-200 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#003F25] block">
                      2. Genesis & Atelier Roots Photo
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                      <div className="relative aspect-[4/3] rounded-xs overflow-hidden bg-gray-200 border border-gray-300">
                        <img
                          src={cms.aboutUs?.genesisImage || '/assets/branding/tonto-tags.jpg'}
                          alt="Genesis Roots"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] text-gray-500 block mb-0.5">Preset Picture:</span>
                          <select
                            value={cms.aboutUs?.genesisImage}
                            onChange={(e) => {
                              const updated = { ...cms, aboutUs: { ...cms.aboutUs, genesisImage: e.target.value } };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                          >
                            {GALLERY_PRESETS.map((p, i) => (
                              <option key={i} value={p.url}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUploadCmsImage((mediaUrl) => {
                            const updated = { ...cms, aboutUs: { ...cms.aboutUs, genesisImage: mediaUrl } };
                            handleSaveCms(updated);
                          })}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[11px] font-bold uppercase rounded-xs cursor-pointer shadow-xs w-full"
                        >
                          <Upload size={12} />
                          <span>Upload From Device</span>
                        </button>

                        <div>
                          <span className="text-[11px] text-gray-500 block mb-0.5">Direct Image URL:</span>
                          <input
                            type="text"
                            value={cms.aboutUs?.genesisImage || ''}
                            onChange={(e) => {
                              const updated = { ...cms, aboutUs: { ...cms.aboutUs, genesisImage: e.target.value } };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] font-mono outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SECTION 7: COUPON / WELCOME OFFER MODAL */}
              {cmsSectionTab === 'couponModal' && (
                <div className="bg-white border border-[#E0E5E1] rounded-xs p-5 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wide text-[#111111]">
                        Coupon / Welcome 15% Privilege Modal
                      </h3>
                      <p className="text-xs text-[#767676]">
                        Customize the modal campaign image, overlay tags, and offer copy shown to first-time visitors.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-[#003F25] bg-emerald-50 px-2 py-0.5 rounded">
                      Format: Vertical Streetwear Portrait
                    </span>
                  </div>

                  {/* Live Pop-up Preview Mockup */}
                  <div className="max-w-2xl mx-auto bg-gray-900/5 p-4 sm:p-6 rounded-xs border border-dashed border-gray-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#767676] block mb-2 text-center">
                      LIVE POPUP PREVIEW (STOREFRONT MOCKUP)
                    </span>
                    <div className="bg-white border border-[#E0E5E1] shadow-xl rounded-sm overflow-hidden flex flex-col md:flex-row text-left max-w-xl mx-auto">
                      {/* Left Column: Image with Overlays */}
                      <div className="w-full md:w-5/12 relative bg-[#0D1E16] min-h-[260px] md:min-h-[300px] overflow-hidden">
                        <img
                          src={cms.offerModal?.image || '/assets/editorial/editorial-seated-camo.jpg'}
                          alt="Offer Modal Live Preview"
                          className="w-full h-full object-cover object-center opacity-90 scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                        {cms.offerModal?.tag && (
                          <div className="absolute top-3 left-3">
                            <span className="text-[9.5px] font-bold tracking-[0.2em] text-white/90 uppercase bg-white/15 backdrop-blur-xs px-2 py-0.5 rounded-xs">
                              {cms.offerModal?.tag || 'TONTO ARCHIVE'}
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4 text-white text-left">
                          {cms.offerModal?.badge && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-[#003F25] text-[9.5px] font-bold uppercase tracking-wider mb-1.5 rounded-xs shadow-xs">
                              <Sparkles size={11} className="text-[#003F25]" />
                              <span>{cms.offerModal?.badge || 'LIMITED OFFER'}</span>
                            </div>
                          )}
                          <h4 className="text-base font-bold tracking-tight uppercase leading-tight font-['Futura_PT_Book',sans-serif]">
                            {cms.offerModal?.headline || 'MADE TO BE DIFFERENT'}
                          </h4>
                          {cms.offerModal?.description && (
                            <p className="text-[10.5px] text-white/75 mt-0.5 leading-snug line-clamp-2">
                              {cms.offerModal?.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Offer Copy */}
                      <div className="w-full md:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white text-left">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-[#003F25]/10 text-[#003F25] text-[10px] font-bold uppercase tracking-wider mb-1.5 rounded-xs">
                            {cms.offerModal?.privilegeTag || 'welcome privilege'}
                          </span>
                          <h3 className="text-lg font-extrabold text-[#111111] uppercase tracking-tight leading-tight font-['Futura_PT_Book',sans-serif]">
                            {cms.offerModal?.title || 'UNLOCK 15% OFF'}
                          </h3>
                          <p className="text-[11px] text-[#767676] mt-1 leading-snug">
                            {cms.offerModal?.subtitle || 'Enter your email to reveal your private 15% discount code.'}
                          </p>

                          <div className="mt-3 py-2 px-2.5 bg-gray-50 border border-gray-200 rounded-xs text-[11px] text-gray-400">
                            name@example.com
                          </div>

                          <div className="w-full py-2 bg-[#003F25] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xs mt-2">
                            <span>{cms.offerModal?.buttonText || 'REVEAL 15% OFF CODE'}</span>
                            <ArrowRight size={13} />
                          </div>

                          <div className="mt-2 text-center text-[10px] text-gray-500 font-mono">
                            PROMO CODE: <span className="text-[#003F25] font-bold">{cms.offerModal?.promoCode || 'TONTO15'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Media Options */}
                    <div className="space-y-4 bg-[#F9FAF9] p-4 sm:p-5 rounded-xs border border-gray-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#003F25] block">
                        Campaign Image Controls
                      </span>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                          Preset Look / Campaign Photo:
                        </label>
                        <select
                          value={cms.offerModal?.image || '/assets/editorial/editorial-seated-camo.jpg'}
                          onChange={(e) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, image: e.target.value }
                            };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        >
                          {GALLERY_PRESETS.filter(p => !p.isVideo).map((p, i) => (
                            <option key={i} value={p.url}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                          Upload Custom Picture From Device:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleUploadCmsImage((mediaUrl) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, image: mediaUrl }
                            };
                            handleSaveCms(updated);
                          })}
                          className="w-full py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 text-[#111111] text-[12px] font-bold uppercase tracking-wider rounded-xs cursor-pointer shadow-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <Upload size={14} />
                          <span>Upload From Computer</span>
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                          Or Direct Image URL / Path:
                        </label>
                        <input
                          type="text"
                          value={cms.offerModal?.image || ''}
                          onChange={(e) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, image: e.target.value }
                            };
                            handleSaveCms(updated);
                          }}
                          placeholder="/assets/editorial/... or https://"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xs text-[12px] font-mono outline-none"
                        />
                      </div>
                    </div>

                    {/* Text Copy Options */}
                    <div className="space-y-3 bg-[#F9FAF9] p-4 sm:p-5 rounded-xs border border-gray-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#003F25] block">
                        Overlay & Discount Copy
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Corner Tag:</label>
                          <input
                            type="text"
                            value={cms.offerModal?.tag || ''}
                            onChange={(e) => {
                              const updated = {
                                ...cms,
                                offerModal: { ...cms.offerModal, tag: e.target.value }
                              };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Badge Text:</label>
                          <input
                            type="text"
                            value={cms.offerModal?.badge || ''}
                            onChange={(e) => {
                              const updated = {
                                ...cms,
                                offerModal: { ...cms.offerModal, badge: e.target.value }
                              };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Image Bottom Headline:</label>
                        <input
                          type="text"
                          value={cms.offerModal?.headline || ''}
                          onChange={(e) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, headline: e.target.value }
                            };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Image Description:</label>
                        <textarea
                          rows={2}
                          value={cms.offerModal?.description || ''}
                          onChange={(e) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, description: e.target.value }
                            };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Offer Title:</label>
                          <input
                            type="text"
                            value={cms.offerModal?.title || ''}
                            onChange={(e) => {
                              const updated = {
                                ...cms,
                                offerModal: { ...cms.offerModal, title: e.target.value }
                              };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Promo Coupon Code:</label>
                          <input
                            type="text"
                            value={cms.offerModal?.promoCode || ''}
                            onChange={(e) => {
                              const updated = {
                                ...cms,
                                offerModal: { ...cms.offerModal, promoCode: e.target.value.toUpperCase() }
                              };
                              handleSaveCms(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] font-mono font-bold text-[#003F25] outline-none uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Offer Subtitle / Prompt:</label>
                        <input
                          type="text"
                          value={cms.offerModal?.subtitle || ''}
                          onChange={(e) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, subtitle: e.target.value }
                            };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Submit Button Text:</label>
                        <input
                          type="text"
                          value={cms.offerModal?.buttonText || ''}
                          onChange={(e) => {
                            const updated = {
                              ...cms,
                              offerModal: { ...cms.offerModal, buttonText: e.target.value }
                            };
                            handleSaveCms(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-[12px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                  STORE CONFIGURATION & CMS
                </h2>
                <p className="text-[13px] text-[#767676] mt-0.5">
                  Update live announcements, store details, and store thresholds.
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
                      WhatsApp Concierge
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
                    value={storeSettings.storeLocation || storeSettings.studioLocation || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-gray-300 rounded-xs text-[13px] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  disabled={settingsSaving}
                  className="px-6 py-2.5 bg-[#003F25] hover:bg-[#002e1b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[12px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-sm"
                >
                  {settingsSaving ? 'Saving…' : 'SAVE STORE CONFIGURATION'}
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

      {/* PRODUCT ADD / EDIT MODAL (Portaled directly to document.body) */}
      {isProductModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity z-0"
            onClick={() => setIsProductModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl bg-white border border-[#E0E5E1] shadow-2xl z-10 rounded-xs p-4 sm:p-8 my-auto animate-scale-in text-left max-h-[90dvh] overflow-y-auto">
            
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
                  placeholder="e.g. TONTO WAFFLE LONGSLEEVE"
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
                    <option value="In stock - Coimbatore">In stock - Coimbatore</option>
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
                      <option value="" disabled>+ Choose from Library Presets...</option>
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
        </div>,
        document.body
      )}

      {/* Add / Edit Lead CRM Modal */}
      {isLeadModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xs max-w-xl w-full border border-gray-300 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9FAF9]">
              <div>
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
                  {editingLead ? `Edit Lead: ${editingLead.name}` : 'Add New Prospect Lead'}
                </h3>
                <p className="text-[11px] sm:text-[11.5px] text-gray-500">
                  {editingLead
                    ? `Update contact status and consultation notes for ${editingLead.id}`
                    : 'Track prospective shopper details, showroom walk-ins, and fitting requests.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded-xs transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLead} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadFormData.name}
                    onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                    placeholder="e.g. Siddharth Raman"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    placeholder="+91 98422 41920"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                    placeholder="client@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium"
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadFormData.source}
                    onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium cursor-pointer"
                  >
                    {leadSourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Interested Piece */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                    Interested Piece / Style
                  </label>
                  <input
                    type="text"
                    value={leadFormData.interest}
                    onChange={(e) => setLeadFormData({ ...leadFormData, interest: e.target.value })}
                    placeholder="e.g. Heavyweight Waffle Longsleeve & Wide Denim"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium"
                  />
                </div>

                {/* Estimated Value */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                    Estimated Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={leadFormData.estimatedValue}
                    onChange={(e) => setLeadFormData({ ...leadFormData, estimatedValue: e.target.value })}
                    placeholder="e.g. 7500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium"
                  />
                </div>
              </div>

              {/* Pipeline Stage */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                  Pipeline Stage
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {LEAD_STAGE_LABELS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLeadFormData({ ...leadFormData, stage: st })}
                      className={`py-2 px-2 text-center rounded-xs font-bold text-[11px] uppercase transition-all cursor-pointer border ${
                        leadFormData.stage === st
                          ? st === 'New'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : st === 'In Discussion'
                            ? 'bg-blue-100 text-blue-900 border-blue-400'
                            : st === 'Converted'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-gray-200 text-gray-800 border-gray-400'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-[10.5px] text-gray-700 mb-1">
                  Fitting & Consultation Notes
                </label>
                <textarea
                  rows={3}
                  value={leadFormData.notes}
                  onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                  placeholder="Record sizing questions, fabric preference, custom measurements, follow-up timeline..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] text-xs font-medium resize-none"
                />
              </div>

              {/* CTAs */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 hover:text-black text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-7 py-2.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer shadow-sm transition-colors"
                >
                  {editingLead ? 'Update Lead' : 'Save & Track Lead'}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: ORDER DETAILS & FULFILLMENT DRAWER             */}
      {/* ========================================================= */}
      {selectedOrderForView && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xs shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    Order Record
                  </span>
                  <span className="font-mono font-bold text-base sm:text-lg text-black">
                    #{selectedOrderForView.orderId || selectedOrderForView.id}
                  </span>
                  <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedOrderForView.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrderForView.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedOrderForView.status === 'Processing'
                      ? 'bg-purple-100 text-purple-800'
                      : selectedOrderForView.status === 'Confirmed'
                      ? 'bg-teal-100 text-teal-800'
                      : selectedOrderForView.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedOrderForView.status}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 mt-1">
                  Placed {selectedOrderForView.date || 'Recently'} • {selectedOrderForView.items?.length || 1} line item(s) • Total: <strong className="text-black">{selectedOrderForView.totalAmount}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintingOrder(selectedOrderForView);
                    setIsPrintReceiptModalOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-black text-[11px] font-bold uppercase rounded-xs cursor-pointer text-gray-700 hover:text-black transition-colors"
                  title="Print Packing Slip"
                >
                  <Printer size={13} /> Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForView(null)}
                  className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xs transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
              
              {/* Quick Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F6F7F6] p-3.5 rounded-xs border border-gray-200 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Order Status
                  </label>
                  <select
                    value={selectedOrderForView.status}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrderForView.id, e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 border border-gray-300 font-bold rounded-xs outline-none focus:border-[#003F25] cursor-pointer"
                  >
                    {['New Hold', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={selectedOrderForView.paymentStatus || 'Pending Payment Link'}
                    onChange={(e) => handleUpdateOrderPayment(selectedOrderForView.id, e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 border border-gray-300 font-bold rounded-xs outline-none focus:border-[#003F25] cursor-pointer"
                  >
                    {['Pending Payment Link', 'Payment Link Sent', 'Paid Online / UPI', 'Paid at Showroom', 'COD Approved', 'Refunded'].map(pst => (
                      <option key={pst} value={pst}>{pst}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Fulfillment Method
                  </label>
                  <div className="px-2.5 py-1.5 bg-white border border-gray-200 font-bold rounded-xs flex items-center gap-1.5">
                    {selectedOrderForView.deliveryMethod === 'pickup' ? (
                      <span className="text-purple-700 flex items-center gap-1">
                        <ShoppingBag size={13} /> Showroom Pickup
                      </span>
                    ) : (
                      <span className="text-blue-700 flex items-center gap-1">
                        <Truck size={13} /> Courier Shipping
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Grand Total
                  </label>
                  <div className="px-2.5 py-1.5 bg-white border border-gray-200 font-bold text-black rounded-xs text-sm">
                    {selectedOrderForView.totalAmount}
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Customer Details & Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Customer Card */}
                <div className="border border-gray-200 rounded-xs p-4 bg-white">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Users size={14} className="text-[#003F25]" /> Customer Information
                    </h4>
                    <span className="text-[10px] text-gray-400">Direct Client</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="font-bold text-black text-sm">{selectedOrderForView.customerName}</div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-gray-50">
                      <span className="text-gray-500">Phone:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{selectedOrderForView.phone}</span>
                        <a
                          href={`tel:${selectedOrderForView.phone}`}
                          className="p-1 hover:text-[#003F25] text-gray-400 hover:bg-gray-100 rounded-xs"
                          title="Call customer"
                        >
                          <PhoneCall size={12} />
                        </a>
                        <a
                          href={`https://wa.me/${(selectedOrderForView.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hi ${selectedOrderForView.customerName}! Reaching out from TONTO regarding your Order #${selectedOrderForView.orderId || selectedOrderForView.id}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xs font-bold text-[10.5px] inline-flex items-center gap-1"
                          title="Send WhatsApp update"
                        >
                          <MessageSquare size={11} /> WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-gray-50">
                      <span className="text-gray-500">Email:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-800">{selectedOrderForView.email || 'N/A'}</span>
                        {selectedOrderForView.email && (
                          <a
                            href={`mailto:${selectedOrderForView.email}`}
                            className="p-1 hover:text-[#003F25] text-gray-400 hover:bg-gray-100 rounded-xs"
                          >
                            <Mail size={12} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Delivery / Shipping Address */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-500 font-bold uppercase text-[10px]">
                          {selectedOrderForView.deliveryMethod === 'pickup' ? 'Pickup Location:' : 'Shipping Address:'}
                        </span>
                        {selectedOrderForView.shippingAddress && (
                          <button
                            type="button"
                            onClick={() => {
                              const a = selectedOrderForView.shippingAddress;
                              const fullText = `${selectedOrderForView.customerName}\n${a.address || ''}${a.apartment ? ', ' + a.apartment : ''}\n${a.city || ''}, ${a.state || ''} ${a.postalCode || ''}\nPhone: ${selectedOrderForView.phone}`;
                              navigator.clipboard.writeText(fullText);
                              showToast('Address copied to clipboard!');
                            }}
                            className="text-[10px] text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
                          >
                            <Copy size={11} /> Copy Address
                          </button>
                        )}
                      </div>

                      {selectedOrderForView.deliveryMethod === 'pickup' ? (
                        <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xs text-[11px] text-purple-950 font-medium">
                          <strong>Showroom Pickup:</strong> TONTO Flagship Showroom & Studio, Coimbatore, Tamil Nadu 641035.
                          <div className="text-[10.5px] text-purple-800 mt-0.5">Customer will collect in person upon notification.</div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xs text-[11px] text-gray-800 font-medium leading-relaxed">
                          <div>{selectedOrderForView.shippingAddress?.address || 'Showroom Address'}</div>
                          {selectedOrderForView.shippingAddress?.apartment && (
                            <div>{selectedOrderForView.shippingAddress.apartment}</div>
                          )}
                          <div>
                            {selectedOrderForView.shippingAddress?.city || 'Coimbatore'}, {selectedOrderForView.shippingAddress?.state || 'Tamil Nadu'} {selectedOrderForView.shippingAddress?.postalCode || ''}
                          </div>
                          <div className="text-gray-500 text-[10px] mt-0.5">India</div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Logistics & Dispatch Card */}
                <div className="border border-gray-200 rounded-xs p-4 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <Truck size={14} className="text-[#003F25]" /> Logistics & Tracking
                      </h4>
                      <span className="text-[10px] text-gray-400">Carrier Details</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Carrier / Partner
                        </label>
                        <select
                          value={selectedOrderForView.courierPartner || 'BlueDart Express'}
                          onChange={(e) => {
                            const newCourier = e.target.value;
                            handleUpdateOrderTracking(selectedOrderForView.id, newCourier, selectedOrderForView.trackingNumber || '');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none bg-white font-medium cursor-pointer"
                        >
                          <option value="BlueDart Express">BlueDart Express (Air Cargo)</option>
                          <option value="Delhivery Surface">Delhivery Surface / Express</option>
                          <option value="DTDC Premium">DTDC Premium Express</option>
                          <option value="India Post SpeedPost">India Post SpeedPost</option>
                          <option value="Showroom Handover">Showroom Handover / In-Person</option>
                          <option value="Private VIP Courier">Private VIP Concierge Dispatch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Tracking AWB / Consignment No.
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={selectedOrderForView.trackingNumber || ''}
                            onChange={(e) => {
                              const newTrack = e.target.value;
                              setSelectedOrderForView(prev => ({ ...prev, trackingNumber: newTrack }));
                            }}
                            onBlur={(e) => {
                              handleUpdateOrderTracking(selectedOrderForView.id, selectedOrderForView.courierPartner || 'BlueDart Express', e.target.value);
                            }}
                            placeholder="e.g. BD-89234812"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-xs outline-none font-mono text-xs focus:border-[#003F25]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateOrderTracking(
                                selectedOrderForView.id,
                                selectedOrderForView.courierPartner || 'BlueDart Express',
                                selectedOrderForView.trackingNumber || ''
                              );
                            }}
                            className="px-3 py-2 bg-black text-white text-[11px] font-bold uppercase rounded-xs cursor-pointer hover:bg-gray-800"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Staff Notes & Alterations
                        </label>
                        <textarea
                          rows={2}
                          value={selectedOrderForView.notes || ''}
                          onChange={(e) => {
                            const newNotes = e.target.value;
                            setSelectedOrderForView(prev => ({ ...prev, notes: newNotes }));
                          }}
                          onBlur={(e) => {
                            handleUpdateOrderNotes(selectedOrderForView.id, e.target.value);
                          }}
                          placeholder="Fulfillment instructions, custom hem requests, client notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none text-xs resize-none focus:border-[#003F25]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Order ID: #{selectedOrderForView.id}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(selectedOrderForView.id)}
                      className="text-red-600 hover:text-red-800 font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Delete Order
                    </button>
                  </div>
                </div>

              </div>

              {/* Order Items Table */}
              <div className="border border-gray-200 rounded-xs overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Package size={14} className="text-[#003F25]" /> Ordered Garments & Articles ({selectedOrderForView.items?.length || 1})
                  </h4>
                  <span className="text-[11px] text-gray-500 font-medium">Standard Cut & Sew Line</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-white text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        <th className="py-2.5 px-3">Article</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(selectedOrderForView.items || []).map((item, idx) => {
                        const unitNum = Number(item.numericPrice) || Number(String(item.price || '').replace(/[^0-9]/g, '')) || 0;
                        const qty = Number(item.quantity) || 1;
                        const lineTotal = unitNum * qty;

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0 border border-gray-200">
                                  {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <ImageIcon size={16} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-black uppercase text-[12.5px] leading-snug">
                                    {item.title}
                                  </div>
                                  <div className="text-[11px] text-gray-500">SKU: {item.id || 'TONTO-ART'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {item.colour || 'Standard Wash'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold px-2 py-0.5 bg-gray-100 rounded-xs text-[11px]">
                                {item.size || 'M'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-gray-900">
                              {qty}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-gray-700">
                              {unitNum > 0 ? `₹${unitNum.toLocaleString('en-IN')}` : 'On enquiry'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-black">
                              {unitNum > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50 font-medium">
                        <td colSpan={4} className="py-2.5 px-3 text-right text-gray-500 text-[11px] uppercase">
                          Subtotal
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-right font-bold text-black">
                          {selectedOrderForView.totalAmount}
                        </td>
                      </tr>
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={4} className="py-2.5 px-3 text-right text-gray-500 text-[11px] uppercase">
                          Shipping & Packaging
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          Complimentary
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-bold text-sm border-t border-gray-200">
                        <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-black">
                          Grand Total Due / Collected
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right text-[#003F25]">
                          {selectedOrderForView.totalAmount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintingOrder(selectedOrderForView);
                    setIsPrintReceiptModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:border-black text-xs font-bold uppercase rounded-xs cursor-pointer text-black transition-colors"
                >
                  <Printer size={14} /> Print Packing Slip
                </button>
                <a
                  href={`https://wa.me/${(selectedOrderForView.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedOrderForView.customerName}, your TONTO order #${selectedOrderForView.orderId || selectedOrderForView.id} is currently ${selectedOrderForView.status}. Carrier: ${selectedOrderForView.courierPartner || 'Direct'} ${selectedOrderForView.trackingNumber ? `(Tracking: ${selectedOrderForView.trackingNumber})` : ''}. Thank you for choosing TONTO.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xs cursor-pointer transition-colors"
                >
                  <MessageSquare size={14} /> Send WhatsApp Status
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="px-6 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: CREATE MANUAL ORDER / SHOWROOM HOLD             */}
      {/* ========================================================= */}
      {isCreateOrderModalOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xs shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-black">
                  Create Manual Order / Showroom Hold
                </h3>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Record walk-in showroom purchases, phone reservations, or VIP concierge orders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOrderModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xs transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              
              {/* Customer Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1">
                  1. Customer Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arjun Ramanathan"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={newOrderForm.phone}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@email.com (optional)"
                    value={newOrderForm.email}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none focus:border-[#003F25]"
                  />
                </div>
              </div>

              {/* Delivery Mode & Address */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1">
                  2. Delivery & Handover Method
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewOrderForm({ ...newOrderForm, deliveryMethod: 'shipping' })}
                    className={`p-3 border rounded-xs text-left cursor-pointer transition-all ${
                      newOrderForm.deliveryMethod === 'shipping'
                        ? 'border-[#003F25] bg-emerald-50/50 text-[#003F25]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Truck size={14} /> Courier Shipping
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Dispatched to customer address</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewOrderForm({ ...newOrderForm, deliveryMethod: 'pickup' })}
                    className={`p-3 border rounded-xs text-left cursor-pointer transition-all ${
                      newOrderForm.deliveryMethod === 'pickup'
                        ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <ShoppingBag size={14} /> Showroom Pickup
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Customer collects at studio</div>
                  </button>
                </div>

                {newOrderForm.deliveryMethod === 'shipping' && (
                  <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-600 mb-0.5">
                        Street Address / Building
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 42 Race Course Road, Avinashi Lane"
                        value={newOrderForm.address}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, address: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs outline-none focus:border-[#003F25]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-600 mb-0.5">City</label>
                        <input
                          type="text"
                          value={newOrderForm.city}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, city: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs outline-none focus:border-[#003F25]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-600 mb-0.5">State</label>
                        <input
                          type="text"
                          value={newOrderForm.state}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, state: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs outline-none focus:border-[#003F25]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-600 mb-0.5">PIN Code</label>
                        <input
                          type="text"
                          value={newOrderForm.postalCode}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, postalCode: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs outline-none focus:border-[#003F25]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1">
                  3. Article Selection & Quantity
                </h4>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Select Garment
                  </label>
                  <select
                    value={newOrderForm.productId}
                    onChange={(e) => {
                      const sel = products.find(p => p.id === e.target.value);
                      // Blank, never a default ₹2,490: the desk types what the
                      // customer was actually charged (a store order re-prices
                      // from the catalogue regardless).
                      const unitP = Number(sel?.numericPrice) || Number(String(sel?.price || '').replace(/[^0-9]/g, '')) || 0;
                      setNewOrderForm({
                        ...newOrderForm,
                        productId: e.target.value,
                        unitPrice: unitP || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none bg-white font-medium cursor-pointer"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.colour || 'Standard'}) — {p.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Size
                    </label>
                    <select
                      value={newOrderForm.size}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none bg-white font-bold cursor-pointer"
                    >
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom Bespoke'].map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newOrderForm.quantity}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newOrderForm.unitPrice}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, unitPrice: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xs flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Calculated Total:</span>
                  <span className="font-bold text-black text-sm">
                    {Number(newOrderForm.unitPrice) > 0
                      ? `₹${(Number(newOrderForm.unitPrice) * (Number(newOrderForm.quantity) || 1)).toLocaleString('en-IN')}`
                      : 'Price on enquiry'}
                  </span>
                </div>
              </div>

              {/* Status & Fulfillment Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1">
                  4. Initial Status & Payment
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Order Status
                    </label>
                    <select
                      value={newOrderForm.status}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none bg-white font-bold cursor-pointer"
                    >
                      {['New Hold', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={newOrderForm.paymentStatus}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none bg-white font-bold cursor-pointer"
                    >
                      {['Pending Payment Link', 'Payment Link Sent', 'Paid Online / UPI', 'Paid at Showroom', 'COD Approved'].map(pst => (
                        <option key={pst} value={pst}>{pst}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Internal Staff Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newOrderForm.notes}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                    placeholder="Showroom customer visit notes, alteration instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs outline-none text-xs resize-none focus:border-[#003F25]"
                  />
                </div>
              </div>

              {/* Form CTAs */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOrderModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 hover:text-black font-bold uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold uppercase tracking-wider text-xs rounded-xs cursor-pointer shadow-sm transition-colors"
                >
                  Create Order & Issue ID
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: PRINTABLE PACKING SLIP & DISPATCH MANIFEST     */}
      {/* ========================================================= */}
      {isPrintReceiptModalOpen && printingOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xs shadow-2xl border border-gray-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Top Toolbar (Non-printable controls) */}
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between text-xs print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={15} className="text-emerald-400" />
                <span className="font-bold uppercase tracking-wider">TONTO Dispatch Slip Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#003F25] hover:bg-emerald-700 text-white font-bold uppercase text-[11px] rounded-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={13} /> Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintReceiptModalOpen(false)}
                  className="p-1 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xs cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Area) */}
            <div className="p-8 font-mono text-[12px] text-black leading-relaxed space-y-6">
              
              {/* Header */}
              <div className="border-b-2 border-black pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-widest uppercase">TONTO CLOTHING</h1>
                  <p className="text-[10px] text-gray-600 mt-0.5">STUDIOS & EXPERIMENTAL ATELIER</p>
                  <p className="text-[10px] text-gray-600">COIMBATORE, TAMIL NADU 641035, INDIA</p>
                  <p className="text-[10px] text-gray-600">orders@tontoclothing.com • +91 98765 43210</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">PACKING SLIP & DISPATCH</div>
                  <div className="text-lg font-black tracking-tight mt-1">
                    #{printingOrder.orderId || printingOrder.id}
                  </div>
                  <div className="text-[10.5px] text-gray-600 mt-1">
                    Date: {printingOrder.date || new Date().toISOString().slice(0, 10)}
                  </div>
                </div>
              </div>

              {/* Order Meta Bar */}
              <div className="grid grid-cols-2 gap-4 border-b border-dashed border-gray-300 pb-4 text-[11px]">
                <div>
                  <span className="block text-[9.5px] uppercase font-bold tracking-wider text-gray-500">SHIP TO / COLLECTOR:</span>
                  <div className="font-bold text-black text-[13px] mt-0.5">{printingOrder.customerName}</div>
                  <div className="text-gray-700 mt-0.5">Phone: {printingOrder.phone}</div>
                  <div className="text-gray-700">{printingOrder.email}</div>
                  {printingOrder.deliveryMethod === 'pickup' ? (
                    <div className="mt-1 text-purple-900 font-bold">[SHOWROOM STUDIO PICKUP]</div>
                  ) : (
                    <div className="mt-1 text-gray-800">
                      {printingOrder.shippingAddress?.address}
                      {printingOrder.shippingAddress?.apartment && `, ${printingOrder.shippingAddress.apartment}`}
                      <br />
                      {printingOrder.shippingAddress?.city}, {printingOrder.shippingAddress?.state} {printingOrder.shippingAddress?.postalCode}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fulfillment:</span>
                    <span className="font-bold uppercase">{printingOrder.deliveryMethod === 'pickup' ? 'Showroom Pickup' : 'Courier Shipping'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Carrier Partner:</span>
                    <span className="font-bold">{printingOrder.courierPartner || 'BlueDart Express'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tracking / AWB:</span>
                    <span className="font-bold">{printingOrder.trackingNumber || 'Pending Dispatch Scan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className="font-bold uppercase">{printingOrder.paymentStatus || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Status:</span>
                    <span className="font-bold uppercase">{printingOrder.status}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-black uppercase text-[10px]">
                      <th className="py-2">Item Description</th>
                      <th className="py-2">Size</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(printingOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold uppercase">
                          {it.title}
                          <div className="text-[10px] text-gray-500 font-normal">{it.colour || 'Standard'} • SKU: {it.id || 'ART'}</div>
                        </td>
                        <td className="py-2.5 font-bold">{it.size || 'M'}</td>
                        <td className="py-2.5 text-center font-bold">{it.quantity || 1}</td>
                        <td className="py-2.5 text-right font-mono">{
it.price
                          || (Number(it.numericPrice) > 0 ? `₹${Number(it.numericPrice).toLocaleString('en-IN')}` : 'On enquiry')
                        }</td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          {Number(it.numericPrice) > 0
                            ? `₹${(Number(it.numericPrice) * (it.quantity || 1)).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={3} className="py-2 text-right uppercase">Total Amount:</td>
                      <td colSpan={2} className="py-2 text-right text-[13px]">{printingOrder.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Special Instructions & Signature */}
              <div className="border-t border-dashed border-gray-300 pt-4 grid grid-cols-2 gap-4 text-[10px]">
                <div>
                  <span className="font-bold uppercase text-gray-500 block mb-1">Internal Instructions:</span>
                  <p className="text-gray-700 italic">
                    {printingOrder.notes || 'Handle garment with standard studio garment care protocol.'}
                  </p>
                  <div className="mt-3 font-mono tracking-widest text-gray-400">
                    |||| || |||||| |||| | |||||| |||||
                  </div>
                </div>

                <div className="space-y-4 text-right">
                  <div>
                    <div className="text-gray-400">Quality Verified & Inspected By:</div>
                    <div className="border-b border-black w-36 ml-auto mt-4"></div>
                    <div className="text-[9px] text-gray-500 mt-1">TONTO Atelier Team</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Dispatch Dispatcher Signature:</div>
                    <div className="border-b border-black w-36 ml-auto mt-4"></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Modal Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsPrintReceiptModalOpen(false)}
                className="px-4 py-2 border border-gray-300 hover:border-black text-black text-xs font-bold uppercase rounded-xs cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#003F25] hover:bg-[#002e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Now
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
