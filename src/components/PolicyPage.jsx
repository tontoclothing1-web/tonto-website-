import React, { useState } from 'react';
import { ArrowLeft, Truck, RefreshCw, Shield, Ruler, HelpCircle } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function PolicyPage({
  initialTab = 'shipping',
  onNavigateHome,
  onNavigateCollection
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'shipping' | 'returns' | 'privacy' | 'terms' | 'size-guide'

  const tabs = [
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'returns', label: 'Archive Returns & Exchanges', icon: RefreshCw },
    { id: 'size-guide', label: 'Garment Measuring Guide', icon: Ruler },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: HelpCircle }
  ];

  return (
    <div className="w-full bg-white text-[#111827] pb-24">
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-[1600px] mx-auto px-5 sm:px-8 py-4 text-[12px] text-[#79867D] flex items-center justify-between border-b border-[#E0E5E1]">
        <ol className="flex items-center gap-1.5 list-none p-0 m-0" itemscope itemtype="https://schema.org/BreadcrumbList">
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" className="flex items-center gap-1">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1"
              itemprop="item"
            >
              <ArrowLeft size={14} />
              <span itemprop="name">home</span>
            </button>
            <meta itemprop="position" content="1" />
            <span className="text-[#D1D5DB]">/</span>
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span className="text-[#003F25] font-semibold" itemprop="name">client care & policies</span>
            <meta itemprop="position" content="2" />
          </li>
        </ol>

        <button
          onClick={onNavigateCollection}
          className="hover:text-[#003F25] transition-colors text-[12px] underline cursor-pointer"
        >
          View Collection
        </button>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10">
        
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#003F25] uppercase tracking-tight mb-2">
          Client Care & Brand Standards
        </h1>
        <p className="text-[13px] text-[#79867D] mb-8">
          Verified guidelines for TONTO Clothing. Coimbatore, Tamil Nadu, India.
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E0E5E1] overflow-x-auto no-scrollbar gap-2 sm:gap-6 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-[12px] sm:text-[13px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSel
                    ? 'border-b-2 border-[#003F25] text-[#003F25]'
                    : 'text-[#79867D] hover:text-[#003F25]'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="border border-[#E0E5E1] p-6 sm:p-10 bg-white text-left leading-relaxed text-[#374151] text-[13px] space-y-6">
          
          {/* TAB: SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#003F25] uppercase tracking-wide mb-2">
                  Showroom Dispatch & Transit Timelines
                </h2>
                <p>
                  Every order is inspected, steam-prepped, and hand-packaged directly at the TONTO showroom in <strong>Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#F9FAF9] border border-gray-200">
                  <strong className="block text-[#003F25] font-bold uppercase text-[12px] mb-1">
                    Tamil Nadu & South India
                  </strong>
                  <p className="text-[12px] text-[#4B5563]">
                    Estimated delivery within 2–4 business days via verified express surface courier.
                  </p>
                </div>
                <div className="p-4 bg-[#F9FAF9] border border-gray-200">
                  <strong className="block text-[#003F25] font-bold uppercase text-[12px] mb-1">
                    Rest of India & Metro Hubs
                  </strong>
                  <p className="text-[12px] text-[#4B5563]">
                    Estimated delivery within 4–7 business days with real-time tracking number provided on WhatsApp.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#003F25] uppercase mb-2">
                  Coimbatore Showroom Pickup
                </h3>
                <p>
                  Customers in and around Coimbatore can select <strong>Showroom Pickup</strong> at checkout to try on pieces directly in our showroom before taking them home. No courier charge applies to showroom pickups.
                </p>
              </div>
            </div>
          )}

          {/* TAB: RETURNS & EXCHANGES */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#003F25] uppercase tracking-wide mb-2">
                  Archive Authenticity & Exchange Policy
                </h2>
                <p>
                  Because TONTO garments are curated <strong>unisex thrift, surplus, and vintage archive pieces</strong>, most styles exist as single one-of-a-kind cuts or limited batches.
                </p>
              </div>

              <div className="p-4 bg-[#F9FAF9] border border-gray-200 space-y-2">
                <strong className="block text-[#003F25] font-bold uppercase text-[12px]">
                  Pre-Dispatch Measurement Verification
                </strong>
                <p className="text-[12px]">
                  To guarantee a flawless fit before your order ships, our concierge team can verify chest, waist, inseam, and leg opening measurements directly with you on WhatsApp (+91).
                </p>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#003F25] uppercase mb-2">
                  Exchange Assistance
                </h3>
                <p>
                  In the event of an sizing discrepancy, please contact our team within 48 hours of delivery. We will assist you with an exchange for another archive piece or store credit.
                </p>
              </div>
            </div>
          )}

          {/* TAB: SIZE GUIDE */}
          {activeTab === 'size-guide' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#003F25] uppercase tracking-wide mb-2">
                  How We Measure Archive Pieces
                </h2>
                <p>
                  Streetwear silhouettes vary by decade and vintage origin. All measurements listed on TONTO are taken with the garment laid flat.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border border-gray-200 text-[12px]">
                  <thead className="bg-[#F9FAF9] text-[#003F25] uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b">Denim Tag</th>
                      <th className="p-3 border-b">True Flat Waist</th>
                      <th className="p-3 border-b">Inseam</th>
                      <th className="p-3 border-b">Leg Opening</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="p-3 font-bold">28</td><td className="p-3">28–29 in</td><td className="p-3">30 in</td><td className="p-3">20 in (Wide)</td></tr>
                    <tr><td className="p-3 font-bold">30</td><td className="p-3">30–31 in</td><td className="p-3">31 in</td><td className="p-3">21 in (Wide)</td></tr>
                    <tr><td className="p-3 font-bold">32</td><td className="p-3">32–33 in</td><td className="p-3">31 in</td><td className="p-3">22 in (Extra Wide)</td></tr>
                    <tr><td className="p-3 font-bold">34</td><td className="p-3">34–35 in</td><td className="p-3">32 in</td><td className="p-3">22.5 in (Extra Wide)</td></tr>
                    <tr><td className="p-3 font-bold">36</td><td className="p-3">36–37 in</td><td className="p-3">32 in</td><td className="p-3">23 in (Extra Wide)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-[13px] leading-relaxed">
              <h2 className="text-lg font-bold text-[#003F25] uppercase tracking-wide mb-2">
                Privacy & Data Integrity (DPDP Act Compliance)
              </h2>
              <p>
                At TONTO Clothing, we value your privacy. We collect customer personal data (such as name, phone number, email, and postal delivery address) strictly for specified, lawful purposes: coordinating garment measurement fit, reserving archive pieces, processing courier dispatch, and sending opt-in drop alerts.
              </p>
              <p>
                We do not sell, rent, or trade your personal data with any external marketing third parties. Data is processed through our secure encrypted backend and trusted courier partners (such as BlueDart) solely for order fulfillment.
              </p>
              <div className="p-4 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-2 mt-4">
                <strong className="block text-[#003F25] font-bold text-[12px] uppercase tracking-wider">
                  Data Subject Rights & Grievance Redressal (India DPDP Act 2023)
                </strong>
                <p className="text-[12px] text-[#4B5563]">
                  Under India's Digital Personal Data Protection Act, 2023, you have the right to access, correct, or request erasure of your personal data, and to withdraw consent at any time.
                </p>
                <p className="text-[12px] text-[#4B5563]">
                  <strong>Grievance Officer:</strong> Customer Care & Grievance Desk, TONTO Clothing, Coimbatore, Tamil Nadu, India.<br />
                  <strong>Direct Inquiries:</strong> <a href="mailto:care@tontoclothing.com" className="text-[#003F25] underline">care@tontoclothing.com</a> | WhatsApp Concierge: +91 82483 21214.
                </p>
              </div>
            </div>
          )}

          {/* TAB: TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#003F25] uppercase tracking-wide mb-2">
                Terms of Service
              </h2>
              <p>
                TONTO operates as a curated unisex fashion archive providing thrift, imported, and surplus apparel in Coimbatore, Tamil Nadu, India.
              </p>
              <p>
                Product availability is subject to physical showroom inventory. Placed orders represent a showroom hold until our team verifies piece specifications and confirms final dispatch.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
