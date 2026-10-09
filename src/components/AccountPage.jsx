import React, { useState } from 'react';
import { ArrowLeft, User, Package, MapPin, Bell, LogOut, Check, AlertCircle, ArrowUpRight, Shield, RefreshCw } from 'lucide-react';
import { BRAND_INFO, PRODUCTS } from '../data/products';

export default function AccountPage({
  onNavigateHome,
  onNavigateCollection,
  onOpenProduct
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile' | 'addresses' | 'notifications'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register' | 'recovery'
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authMessage, setAuthMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // User Profile Data (demo state)
  const [userProfile, setUserProfile] = useState({
    name: 'Karthik Raja',
    email: 'karthik@example.com',
    phone: '+91 94432 10987',
    topSize: 'L',
    bottomWaist: '32'
  });

  // Saved Addresses
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      label: 'Primary Delivery',
      recipient: 'Karthik Raja',
      phone: '+91 94432 10987',
      address: '142 Avinashi Road, Peelamedu',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641004',
      isDefault: true
    }
  ]);

  // Order History (Test fixtures clearly labeled)
  const [orders] = useState([
    {
      id: 'TONTO-TN-84920',
      date: '22 Sep 2026',
      status: 'Dispatched from Coimbatore Studio',
      statusColor: 'text-[#003F25]',
      trackingNumber: 'TN-EXP-940294',
      items: [
        {
          id: 'extra-wide-denim',
          title: 'EXTRA WIDE DENIM',
          colour: 'washed blue',
          size: '32',
          price: 'Price on enquiry',
          image: '/assets/products/extra-wide-denim.jpg'
        }
      ]
    },
    {
      id: 'TONTO-TN-71824',
      date: '10 Aug 2026',
      status: 'Delivered',
      statusColor: 'text-gray-600',
      trackingNumber: 'TN-EXP-819284',
      items: [
        {
          id: 'camo-military-overshirt',
          title: 'CAMO MILITARY OVERSHIRT',
          colour: 'camo',
          size: 'L',
          price: 'Price on enquiry',
          image: '/assets/products/camo-military-overshirt.jpg'
        }
      ]
    }
  ]);

  // Notifications toggles
  const [notifications, setNotifications] = useState({
    denimDrops: true,
    surplusFinds: true,
    vintageGraphics: false,
    studioAppointments: true
  });

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    
    setIsLoading(true);
    setAuthMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      if (authMode === 'recovery') {
        setAuthMessage({ type: 'success', text: 'Password reset instructions have been sent to your email.' });
      } else {
        setIsAuthenticated(true);
        if (authName) {
          setUserProfile(prev => ({ ...prev, name: authName, email: authEmail, phone: authPhone || prev.phone }));
        }
      }
    }, 600);
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
            onClick={() => setIsAuthenticated(false)}
            className="text-[12px] text-[#79867D] hover:text-[#003F25] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-10">
        
        {!isAuthenticated ? (
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

            {/* Quick Demo Login Option */}
            <div className="mt-8 pt-6 border-t border-[#E0E5E1] text-center">
              <span className="text-[11px] text-[#79867D] block mb-2">Development / Client Preview:</span>
              <button
                type="button"
                onClick={() => setIsAuthenticated(true)}
                className="w-full py-2.5 border border-dashed border-[#003F25] text-[#003F25] text-[11px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Preview Verified Customer Dashboard
              </button>
              <p className="text-[10px] text-[#79867D] mt-2">
                Pure client-side authentication mode. No passwords or sensitive credentials are saved in browser storage.
              </p>
            </div>

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

                <nav className="mt-4 space-y-1 text-[13px] font-semibold text-[#4B5563]">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left p-2.5 rounded-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'orders' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25]'
                    }`}
                  >
                    <Package size={16} />
                    <span>Order Holds ({orders.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left p-2.5 rounded-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'profile' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25]'
                    }`}
                  >
                    <User size={16} />
                    <span>Profile & Fit Preferences</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left p-2.5 rounded-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'addresses' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25]'
                    }`}
                  >
                    <MapPin size={16} />
                    <span>Saved Addresses</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left p-2.5 rounded-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'notifications' ? 'bg-[#003F25] text-white' : 'hover:bg-gray-100 text-[#003F25]'
                    }`}
                  >
                    <Bell size={16} />
                    <span>Drop Alerts & Sourcing</span>
                  </button>
                </nav>
              </div>

              <button
                onClick={() => setIsAuthenticated(false)}
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
                  <h2 className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
                    Studio Order Holds & History
                  </h2>
                  <p className="text-[13px] text-[#79867D] mb-6">
                    Archive reservations and orders dispatched from the Coimbatore showroom.
                  </p>

                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div key={ord.id} className="border border-[#E0E5E1] p-5 bg-white">
                        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-100 gap-2 mb-4">
                          <div>
                            <span className="text-[11px] font-bold text-[#79867D] uppercase tracking-wider block">Order Reference</span>
                            <span className="text-[13px] font-mono font-bold text-[#003F25]">#{ord.id}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-[#79867D] uppercase tracking-wider block">Date</span>
                            <span className="text-[12px] text-[#1F2937]">{ord.date}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-[#79867D] uppercase tracking-wider block">Status</span>
                            <span className={`text-[12px] font-bold ${ord.statusColor}`}>{ord.status}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-[#79867D] uppercase tracking-wider block">Tracking</span>
                            <span className="text-[12px] font-mono text-[#003F25]">{ord.trackingNumber}</span>
                          </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between text-[12px]">
                              <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.title} className="w-12 h-14 object-cover border border-gray-200" />
                                <div>
                                  <h4 className="font-bold text-[#003F25] uppercase">{item.title}</h4>
                                  <span className="text-[#79867D] capitalize">{item.colour} • Size {item.size}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => onOpenProduct && onOpenProduct(item)}
                                className="text-[11px] text-[#003F25] font-semibold underline hover:opacity-80"
                              >
                                View Piece ↗
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                        onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
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

                    <button
                      onClick={() => alert('Profile updated successfully.')}
                      className="mt-4 px-6 py-2.5 bg-[#003F25] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors cursor-pointer"
                    >
                      Save Preferences
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
                        <strong className="block text-[13px] text-[#003F25]">Studio Showroom Private Hours</strong>
                        <span className="text-[11px] text-[#79867D]">Invitations to exclusive in-person try-on events in Coimbatore.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.studioAppointments}
                        onChange={(e) => setNotifications({ ...notifications, studioAppointments: e.target.checked })}
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
