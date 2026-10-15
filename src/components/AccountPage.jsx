import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Package, MapPin, Bell, LogOut, Check, AlertCircle, ArrowUpRight, Shield, RefreshCw, XCircle, Truck } from 'lucide-react';
import { BRAND_INFO, PRODUCTS } from '../data/products';
import { auth, orders as ordersApi, account as accountApi, setToken, getToken, clearToken } from '../lib/api';
import { fromApiOrder, deliveryLabel, isCancellableStatus } from '../lib/orderView';
import { readList, mirrorMerge } from '../lib/capture';

const EMPTY_PROFILE = { name: '', email: '', phone: '', topSize: 'M', bottomWaist: '32' };

export default function AccountPage({
  onNavigateHome,
  onNavigateCollection,
  onOpenProduct,
  onNavigateAdmin
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile' | 'addresses' | 'notifications'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register' | 'recovery'
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authMessage, setAuthMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Signed-in shopper, filled from GET /api/account — no invented defaults, a
  // customer portal that shows somebody else's name is worse than an empty one.
  const [userProfile, setUserProfile] = useState(EMPTY_PROFILE);
  const [profileNote, setProfileNote] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Saved Addresses (GET /api/account/addresses)
  const [addresses, setAddresses] = useState([]);

  // Orders come from GET /api/orders/my. `ordersSource` is 'api' when the server
  // answered and 'device' when we fell back to this browser's own holds.
  const [orders, setOrders] = useState([]);
  const [ordersSource, setOrdersSource] = useState('api');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Orders: GET /api/orders/my — matched on user_id OR the email on the order,
  // so a hold placed as a guest before signing in still shows up here.
  const loadOrders = React.useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await ordersApi.mine();
      setOrders((Array.isArray(res?.data) ? res.data : []).map((o) => fromApiOrder(o)));
      setOrdersSource('api');
    } catch (err) {
      // Unreachable backend: show the holds this device filed and label them as
      // such instead of an empty "you have no orders" screen.
      console.warn('[account] orders from device only:', err.message);
      setOrders(readList('tonto_admin_orders'));
      setOrdersSource('device');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Profile + saved addresses (GET /api/account).
  const loadAccount = React.useCallback(async () => {
    try {
      const res = await accountApi.profile();
      const me = res?.data || {};
      setUserProfile({
        name: me.name || '',
        email: me.email || '',
        phone: me.phone || '',
        topSize: me.topSize || 'M',
        bottomWaist: me.bottomWaist || '32'
      });
      setAddresses(Array.isArray(me.addresses) ? me.addresses : []);
    } catch (err) {
      console.warn('[account] profile unavailable:', err.message);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    loadAccount();
  }, [isAuthenticated, loadOrders, loadAccount]);

  // Live-refresh when another screen writes a hold (Checkout submit, admin desk).
  // Only trusted while we are on the device fallback — the server is the truth
  // otherwise, and localStorage must not overwrite it.
  useEffect(() => {
    const handleSync = () => {
      if (ordersSource !== 'device') return;
      setOrders(readList('tonto_admin_orders'));
    };

    window.addEventListener('tonto-data-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('tonto-data-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [ordersSource]);

  /** Offline fallback: mark the device copy cancelled and give the stock back. */
  const cancelOnDevice = (targetId) => {
    let cancelledItems = [];
    mirrorMerge('tonto_admin_orders', (list) =>
      list.map((ord) => {
        if (ord.id === targetId || ord.orderId === targetId) {
          cancelledItems = ord.items || [];
          return {
            ...ord,
            status: 'Cancelled',
            paymentStatus: 'Cancelled / Released',
            notes: `${ord.notes || ''} [Cancelled by customer on this device]`
          };
        }
        return ord;
      })
    );

    if (cancelledItems.length > 0) {
      mirrorMerge('tonto_products', (prodList) =>
        prodList.map((prod) => {
          const match = cancelledItems.find((i) => i.id === prod.id || i.productId === prod.id);
          if (!match) return prod;
          const prevStock = typeof prod.stock === 'number' ? prod.stock : 5;
          const newStock = prevStock + (match.quantity || 1);
          return { ...prod, stock: newStock, inStock: newStock > 0 };
        })
      );
    }

    setOrders(readList('tonto_admin_orders'));
  };

  // Customer Order Cancellation
  const handleCancelOrder = async (targetId) => {
    if (!window.confirm(`Are you sure you want to cancel order hold #${targetId}? This will release the garment reservation.`)) {
      return;
    }

    try {
      await ordersApi.cancel(targetId);
      await loadOrders();
      window.alert(`Order #${targetId} has been cancelled and the pieces released back to the showroom.`);
    } catch (err) {
      const networked = !err.status || err.status >= 500;
      if (networked && ordersSource === 'device') {
        cancelOnDevice(targetId);
        window.alert(`Order #${targetId} was cancelled on this device. The shop will see it once the store API is reachable.`);
        return;
      }
      window.alert(err.status === 403
        ? 'This order belongs to another customer.'
        : err.message || 'Could not cancel that hold.');
    }
  };

  // Notifications toggles
  const [notifications, setNotifications] = useState({
    denimDrops: true,
    surplusFinds: true,
    vintageGraphics: false,
    showroomAppointments: true
  });

  // Rehydrate the session from the stored JWT. A token is only accepted once
  // GET /api/auth/me confirms it still belongs to a live account.
  useEffect(() => {
    let cancelled = false;
    const resume = async () => {
      if (!getToken()) {
        setSessionChecked(true);
        return;
      }
      try {
        const res = await auth.me();
        if (!cancelled && res?.user) {
          setIsAuthenticated(true);
          setUserProfile((prev) => ({
            ...prev,
            name: res.user.name || '',
            email: res.user.email || '',
            phone: res.user.phone || '',
            topSize: res.user.topSize || prev.topSize,
            bottomWaist: res.user.bottomWaist || prev.bottomWaist
          }));
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
      if (!cancelled) setSessionChecked(true);
    };
    resume();
    return () => { cancelled = true; };
  }, []);

  const handleSignOut = () => {
    setIsAuthenticated(false);
    clearToken();
    setUserProfile(EMPTY_PROFILE);
    setAddresses([]);
    setOrders([]);
    setAuthMessage(null);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const email = authEmail.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setAuthMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (authMode !== 'recovery' && authPassword.length < 6) {
      setAuthMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsLoading(true);
    setAuthMessage(null);

    try {
      if (authMode === 'recovery') {
        await auth.forgotPassword(email);
        setAuthMessage({
          type: 'success',
          text: 'If that address has an account, reset instructions are on their way.'
        });
      } else {
        const payload = authMode === 'register'
          ? { name: authName.trim() || email.split('@')[0], email, password: authPassword, phone: authPhone.trim() }
          : { email, password: authPassword };
        const res = authMode === 'register' ? await auth.register(payload) : await auth.login(payload);
        if (!res?.token) throw Object.assign(new Error('The store did not return a session.'), { status: 500 });
        setToken(res.token);
        setIsAuthenticated(true);
        setAuthPassword('');
        setUserProfile((prev) => ({
          ...prev,
          name: res.user?.name || payload.name || '',
          email: res.user?.email || email,
          phone: res.user?.phone || prev.phone,
          topSize: res.user?.topSize || prev.topSize,
          bottomWaist: res.user?.bottomWaist || prev.bottomWaist
        }));
      }
    } catch (err) {
      setAuthMessage({
        type: 'error',
        text: err.status === 429
          ? 'Too many attempts — please wait a minute and try again.'
          : err.message || 'Could not sign you in.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // PUT /api/auth/profile + /api/account/sizes — the fit preferences a shopper
  // saves here are what the showroom sees when they text about a piece.
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileNote(null);
    try {
      await auth.updateProfile({ name: userProfile.name, phone: userProfile.phone });
      await accountApi.updateSizes({ topSize: userProfile.topSize, bottomWaist: userProfile.bottomWaist });
      setProfileNote({ type: 'success', text: 'Profile saved to your TONTO account.' });
    } catch (err) {
      setProfileNote({
        type: 'error',
        text: err.status >= 500 || !err.status
          ? 'Could not reach the store — your changes were not saved.'
          : err.message || 'Could not save your profile.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="w-full bg-white text-[#111827] pb-24">
      
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
          <span className="text-[#003F25] font-semibold">my account</span>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            className="text-[12px] text-[#79867D] hover:text-[#003F25] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-10">
        
        {!sessionChecked ? (
          <div className="max-w-md mx-auto py-16 text-center text-[12px] uppercase tracking-widest text-[#79867D] flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" />
            <span>Restoring your session&hellip;</span>
          </div>
        ) : !isAuthenticated ? (
          /* AUTHENTICATION FORMS: SIGN IN / REGISTER / RECOVERY */
          <div className="max-w-md mx-auto border border-[#E0E5E1] p-6 sm:p-8 bg-white shadow-xs">
            
            {/* Header Tabs */}
            <div className="flex border-b border-[#E0E5E1] mb-6">
              <button
                onClick={() => { setAuthMode('signin'); setAuthMessage(null); }}
                className={`flex-1 pb-3 text-[13px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  authMode === 'signin'
                    ? 'border-b-2 border-[#003F25] text-[#003F25]'
                    : 'text-[#79867D] hover:text-[#003F25]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthMessage(null); }}
                className={`flex-1 pb-3 text-[13px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  authMode === 'register'
                    ? 'border-b-2 border-[#003F25] text-[#003F25]'
                    : 'text-[#79867D] hover:text-[#003F25]'
                }`}
              >
                Register
              </button>
            </div>

            {authMessage && (
              <div className={`p-3 text-[12px] rounded-xs mb-4 flex items-center gap-2 ${
                authMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {authMessage.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
                <span>{authMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Karthik Raja"
                      className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">WhatsApp / Phone</label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                />
              </div>

              {authMode !== 'recovery' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase">Password</label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode('recovery'); setAuthMessage(null); }}
                        className="text-[11px] text-[#79867D] hover:text-[#003F25] underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading && <RefreshCw size={14} className="animate-spin" />}
                <span>
                  {authMode === 'signin' ? 'Sign In to Account' : authMode === 'register' ? 'Create Account' : 'Send Recovery Link'}
                </span>
              </button>
            </form>

            {authMode === 'recovery' && (
              <button
                onClick={() => { setAuthMode('signin'); setAuthMessage(null); }}
                className="w-full text-center text-[12px] text-[#003F25] underline pt-4 block cursor-pointer"
              >
                Back to Sign In
              </button>
            )}

            {/* Security note: the customer portal has one way in — a real
                account on POST /api/auth/login. No preview bypass. */}

          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Nav (3 cols) */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="border border-[#E0E5E1] p-5 mb-4 bg-white">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-[#003F25] text-white flex items-center justify-center font-bold text-sm">
                    {userProfile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-extrabold text-[#003F25]">{userProfile.name}</h3>
                    <p className="text-[11px] text-[#79867D]">{userProfile.email}</p>
                  </div>
                </div>

                <nav className="mt-4 flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar md:space-y-1 text-[12px] sm:text-[13px] font-semibold pb-1 md:pb-0">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`shrink-0 md:w-full text-left px-3 py-2 sm:p-2.5 rounded-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'orders' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25] bg-gray-50 md:bg-transparent'
                    }`}
                  >
                    <Package size={15} />
                    <span>Order Holds ({orders.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`shrink-0 md:w-full text-left px-3 py-2 sm:p-2.5 rounded-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'profile' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25] bg-gray-50 md:bg-transparent'
                    }`}
                  >
                    <User size={15} />
                    <span>Profile & Fit Preferences</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`shrink-0 md:w-full text-left px-3 py-2 sm:p-2.5 rounded-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'addresses' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25] bg-gray-50 md:bg-transparent'
                    }`}
                  >
                    <MapPin size={15} />
                    <span>Saved Addresses</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`shrink-0 md:w-full text-left px-3 py-2 sm:p-2.5 rounded-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'notifications' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25] bg-gray-50 md:bg-transparent'
                    }`}
                  >
                    <Bell size={15} />
                    <span>Drop Alerts & Sourcing</span>
                  </button>
                </nav>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2.5 text-center text-[12px] text-[#79867D] hover:text-red-600 underline cursor-pointer"
              >
                Log Out of Account
              </button>
            </div>

            {/* Right Content Area (9 cols) */}
            <div className="md:col-span-8 lg:col-span-9">
              
              {/* TAB: ORDERS */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight">
                      Order Holds & Fulfillment
                    </h2>
                    <span className="text-[12px] font-bold text-[#79867D]">
                      {ordersLoading
                        ? 'Loading\u2026'
                        : `${orders.length} ${orders.length === 1 ? 'Record' : 'Records'} ${ordersSource === 'api' ? 'On File With The Showroom' : 'Saved On This Device'}`}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#79867D] mb-6">
                    Real-time status of garment reservations, domestic courier tracking, and atelier pickups.
                  </p>

                  {ordersSource === 'device' && !ordersLoading && orders.length > 0 && (
                    <div className="mb-5 p-3 bg-amber-50 border border-amber-200 text-[12px] text-amber-800 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>
                        The store API is unreachable, so this list is only the holds filed on this device.
                      </span>
                    </div>
                  )}

                  {orders.length === 0 ? (
                    <div className="border border-dashed border-[#E0E5E1] p-12 text-center bg-gray-50/50">
                      <Package size={32} className="mx-auto text-gray-400 mb-3" />
                      <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-1">No Orders Found</h3>
                      <p className="text-xs text-gray-500 mb-4">You have not placed any garment orders or showroom holds yet.</p>
                      <button
                        onClick={onNavigateCollection}
                        className="px-5 py-2.5 bg-[#003F25] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#002e1b] cursor-pointer"
                      >
                        Explore Collection
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {orders.map((ord) => {
                        const orderRef = ord.orderId || ord.id;
                        const isCancellable = isCancellableStatus(ord.status);
                        const statusBadgeClass = 
                          ord.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          ord.status === 'Delivered' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                          (ord.status === 'Shipped' || ord.status === 'Dispatched') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          (ord.status === 'Confirmed' || ord.status === 'Processing') ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-amber-50 text-amber-800 border-amber-200';

                        return (
                          <div key={ord.id || ord.orderId} className="border border-[#E0E5E1] p-5 bg-white shadow-xs">
                            {/* Order Header */}
                            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-100 gap-2 mb-4">
                              <div>
                                <span className="text-[10px] font-bold text-[#79867D] uppercase tracking-wider block">Order Reference</span>
                                <span className="text-[13px] font-mono font-bold text-[#003F25]">#{orderRef}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#79867D] uppercase tracking-wider block">Order Date</span>
                                <span className="text-[12px] text-[#1F2937]">{ord.date}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#79867D] uppercase tracking-wider block">Status</span>
                                <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold border uppercase rounded-xs ${statusBadgeClass}`}>
                                  {ord.status || 'New Hold'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#79867D] uppercase tracking-wider block">Grand Total</span>
                                <span className="text-[13px] font-bold text-[#111111]">
                                  {ord.grandTotal || ord.totalAmount || 'Price on enquiry'}
                                </span>
                              </div>
                            </div>

                            {/* Tracking & Courier Info (if shipped) */}
                            {ord.trackingNumber && ord.trackingNumber !== 'Pending' && (
                              <div className="mb-4 p-3 bg-emerald-50/60 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-emerald-900 font-medium">
                                  <Truck size={15} />
                                  <span>Courier Tracking: <strong className="font-mono">{ord.trackingNumber}</strong></span>
                                </div>
                                <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                                  {ord.courier || 'Domestic Express'} • In Transit
                                </span>
                              </div>
                            )}

                            {/* Delivery & Promo Meta */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#79867D] mb-4 pb-3 border-b border-gray-50">
                              <div>
                                <span className="font-semibold text-gray-700">Fulfillment:</span>{' '}
                                {deliveryLabel(ord.deliveryMethod)}
                                {ord.shippingAddress?.city && ` (${ord.shippingAddress.city}, ${ord.shippingAddress.state || ''})`}
                              </div>
                              {ord.appliedPromo && (
                                <div>
                                  <span className="font-semibold text-gray-700">Privilege Code:</span>{' '}
                                  <span className="font-mono font-bold text-[#003F25]">{ord.appliedPromo}</span>
                                </div>
                              )}
                            </div>

                            {/* Items List */}
                            <div className="divide-y divide-gray-100">
                              {(ord.items || []).map((item, idx) => (
                                <div key={idx} className="py-2.5 flex items-center justify-between text-[12px]">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={item.image || '/assets/products/extra-wide-denim.jpg'}
                                      alt={item.title}
                                      className="w-12 h-14 object-cover border border-gray-200"
                                      onError={(e) => { e.target.src = '/assets/products/extra-wide-denim.jpg'; }}
                                    />
                                    <div>
                                      <h4 className="font-bold text-[#003F25] uppercase">{item.title}</h4>
                                      <span className="text-[#79867D] capitalize">
                                        {item.colour || 'vintage'} • Size {item.size || 'One Size'}
                                        {item.quantity ? ` • Qty ${item.quantity}` : ''}
                                      </span>
                                      <div className="font-medium text-[#111111]">{item.price}</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onOpenProduct && onOpenProduct(item)}
                                    className="text-[11px] text-[#003F25] font-semibold underline hover:opacity-80 cursor-pointer"
                                  >
                                    View Piece ↗
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Action Row */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[11px] text-gray-400">
                                Protected by TONTO Atelier Hold Protocol
                              </span>

                              {isCancellable && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(orderRef)}
                                  className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer flex items-center gap-1"
                                >
                                  <XCircle size={13} />
                                  <span>Cancel Order Hold</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROFILE & FIT PREFERENCES */}
              {activeTab === 'profile' && (
                <div className="border border-[#E0E5E1] p-6 bg-white max-w-xl">
                  <h2 className="text-lg font-extrabold text-[#003F25] uppercase tracking-tight mb-4 pb-2 border-b border-[#E0E5E1]">
                    Profile & Sizing Profile
                  </h2>
                  <div className="space-y-4 text-[13px]">
                    <div>
                      <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={userProfile.email}
                        readOnly
                        title="Your sign-in address is managed by the showroom"
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xs cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">WhatsApp / Phone</label>
                      <input
                        type="tel"
                        value={userProfile.phone}
                        onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Preferred Top Size</label>
                        <select
                          value={userProfile.topSize}
                          onChange={(e) => setUserProfile({ ...userProfile, topSize: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                        >
                          <option value="S">Small (S)</option>
                          <option value="M">Medium (M)</option>
                          <option value="L">Large (L)</option>
                          <option value="XL">Extra Large (XL)</option>
                          <option value="XXL">XXL Oversized</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Preferred Denim Waist</label>
                        <select
                          value={userProfile.bottomWaist}
                          onChange={(e) => setUserProfile({ ...userProfile, bottomWaist: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                        >
                          <option value="28">28 inch</option>
                          <option value="30">30 inch</option>
                          <option value="32">32 inch</option>
                          <option value="34">34 inch</option>
                          <option value="36">36 inch</option>
                        </select>
                      </div>
                    </div>

                    {profileNote && (
                      <div className={`p-3 text-[12px] rounded-xs flex items-center gap-2 ${
                        profileNote.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
                      }`}>
                        {profileNote.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
                        <span>{profileNote.text}</span>
                      </div>
                    )}

                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="mt-4 px-6 py-2.5 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                    >
                      {savingProfile && <RefreshCw size={14} className="animate-spin" />}
                      <span>{savingProfile ? 'Saving\u2026' : 'Save Preferences'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <div>
                  <h2 className="text-lg font-extrabold text-[#003F25] uppercase tracking-tight mb-4">
                    Saved Delivery Addresses
                  </h2>
                  <div className="space-y-4 max-w-xl">
                    {addresses.length === 0 && (
                      <div className="border border-dashed border-[#E0E5E1] p-8 text-center bg-gray-50/50">
                        <MapPin size={26} className="mx-auto text-gray-400 mb-2" />
                        <h3 className="text-[13px] font-bold text-[#111111] uppercase tracking-wider mb-1">No Saved Addresses</h3>
                        <p className="text-xs text-gray-500">
                          Add a delivery address at checkout and it will be kept here for your next hold.
                        </p>
                      </div>
                    )}
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-[#E0E5E1] p-5 bg-white relative">
                        {addr.isDefault && (
                          <span className="absolute top-4 right-4 px-2 py-0.5 bg-[#F5F5F5] border border-gray-200 text-[10px] font-bold text-[#003F25] uppercase">
                            Default Address
                          </span>
                        )}
                        <h4 className="font-bold text-[#003F25] text-[13px] uppercase mb-1">{addr.recipient}</h4>
                        <p className="text-[12px] text-[#4B5563]">{addr.address}</p>
                        <p className="text-[12px] text-[#4B5563]">{addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p className="text-[12px] text-[#79867D] mt-1">{addr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="border border-[#E0E5E1] p-6 bg-white max-w-xl">
                  <h2 className="text-lg font-extrabold text-[#003F25] uppercase tracking-tight mb-2 pb-2 border-b border-[#E0E5E1]">
                    Drop Alerts & Sourcing Preferences
                  </h2>
                  <p className="text-[12px] text-[#79867D] mb-6">
                    Get alerted when new thrift shipments and custom denim cuts arrive at the Coimbatore showroom.
                  </p>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 border border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <strong className="block text-[13px] text-[#003F25]">Heavy Washed Denim Drops</strong>
                        <span className="text-[11px] text-[#79867D]">Alerts for extra wide leg, stacked, and distressed vintage jeans.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.denimDrops}
                        onChange={(e) => setNotifications({ ...notifications, denimDrops: e.target.checked })}
                        className="accent-[#003F25] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <strong className="block text-[13px] text-[#003F25]">Military & Surplus Finds</strong>
                        <span className="text-[11px] text-[#79867D]">Rare overshirts, camo silhouettes, and utility outerwear.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.surplusFinds}
                        onChange={(e) => setNotifications({ ...notifications, surplusFinds: e.target.checked })}
                        className="accent-[#003F25] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <strong className="block text-[13px] text-[#003F25]">Showroom Private Hours</strong>
                        <span className="text-[11px] text-[#79867D]">Invitations to exclusive in-person try-on events in Coimbatore.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.showroomAppointments}
                        onChange={(e) => setNotifications({ ...notifications, showroomAppointments: e.target.checked })}
                        className="accent-[#003F25] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
