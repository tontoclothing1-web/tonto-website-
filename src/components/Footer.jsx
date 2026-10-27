import React from 'react';
import Logo from './Logo';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { submitNewsletter, mirror, readList } from '../lib/capture';

const InstagramIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import { BRAND_INFO } from '../data/products';

export default function Footer({ onNavigate, onOpenVisit, onOpenOffer, onOpenAccount, storeSettings, onNavigateAdmin }) {
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);
  const [newsletterBusy, setNewsletterBusy] = React.useState(false);
  const [newsletterNote, setNewsletterNote] = React.useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email || newsletterBusy) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setNewsletterNote('Enter a valid email address.');
      return;
    }

    setNewsletterBusy(true);
    setNewsletterNote('');

    // POST /api/leads/claim-offer is what puts the address in the owner's CRM;
    // the localStorage lists below only feed this browser's Admin Dashboard.
    const result = await submitNewsletter({
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      source: 'Footer Drop Alerts'
    });

    if (result.rejected) {
      setNewsletterBusy(false);
      setNewsletterNote(result.error || 'Could not subscribe that address.');
      return;
    }

    const subscribers = readList('tonto_admin_subscribers');
    if (!subscribers.some((s) => String(s?.email).toLowerCase() === email)) {
      mirror('tonto_admin_subscribers', {
        email,
        source: 'Footer Drop Alerts',
        date: new Date().toISOString().split('T')[0]
      }, { append: true, max: 500, match: 'email' });
    }

    mirror('tonto_admin_leads', {
      id: `LEAD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      phone: '',
      email,
      source: 'TONTO Made Drop Waitlist',
      interest: 'Coimbatore Drop Alert Notifications',
      estimatedValue: 4000,
      stage: 'New',
      date: new Date().toISOString().split('T')[0],
      notes: 'Subscribed to drop alerts from storefront footer.'
    });

    setNewsletterBusy(false);
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };
  return (
    <footer className="w-full bg-[#003F25] border-t border-[#002e1b] pt-14 pb-12 text-white content-visibility-auto">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 pb-12 border-b border-white/15">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <Logo variant="footer" alt="TONTO Clothing" />
            <p className="text-[12px] text-white/80 leading-relaxed max-w-xs">
              Curated unisex streetwear, washed denim, oversized graphics, and surplus finds. Based in Coimbatore, Tamil Nadu.
            </p>
            <div className="flex items-center gap-2 text-[12px] text-white font-medium">
              <MapPin size={15} strokeWidth={2} className="text-white" />
              <span>Coimbatore, Tamil Nadu, India</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-[13px] text-white/80">
              <li>
                <button
                  onClick={() => onNavigate('new-arrivals')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  New Arrivals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('featured')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Featured Styles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('collection', 'All')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  The Full Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('collection', 'Denim')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Washed & Wide Denim
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('lookbook')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  TONTO Made
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About TONTO
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Showroom & Client Care */}
          <div>
            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider mb-4">
              Showroom & Client Care
            </h4>
            <ul className="space-y-2.5 text-[13px] text-white/80">
              <li>
                <button
                  onClick={() => onOpenAccount ? onOpenAccount() : onNavigate('account')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sign In / Member Access
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('visit')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Coimbatore Location & Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'shipping')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shipping & Dispatch
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'returns')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Archive Returns & Exchanges
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'size-guide')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Garment Measuring Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy & Terms
                </button>
              </li>
              <li>
                <a
                  href={BRAND_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Instagram: @{BRAND_INFO.instagram}</span>
                  <ArrowUpRight size={13} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Sourcing & Standard */}
          <div>
            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider mb-4">
              Drop Alerts
            </h4>
            <p className="text-[12px] text-white/80 leading-relaxed mb-3">
              Receive notifications when new thrift, surplus, and denim drops release in Coimbatore.
            </p>
            {newsletterSubscribed ? (
              <p className="text-[12px] font-bold text-white py-2">
                ✓ You are subscribed to TONTO drop alerts.
              </p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-1.5 mb-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-[12px] bg-white text-[#111111] placeholder-gray-500 border border-transparent focus:outline-none rounded-xs"
                />
                <button
                  type="submit"
                  disabled={newsletterBusy}
                  className="px-3.5 py-2 bg-black hover:bg-black/80 text-white text-[11px] font-bold uppercase tracking-wider transition-colors rounded-xs cursor-pointer disabled:opacity-60"
                >
                  {newsletterBusy ? '…' : 'Join'}
                </button>
              </form>
            )}
            {newsletterNote && (
              <p className="text-[11px] text-amber-200 -mt-1 mb-2">{newsletterNote}</p>
            )}

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/70 gap-4">
          <p>© {new Date().getFullYear()} TONTO Clothing. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Coimbatore, India</span>
            <span>Unisex Streetwear</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
