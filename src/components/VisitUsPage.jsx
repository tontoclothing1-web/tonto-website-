import React, { useState } from 'react';
import { ArrowLeft, MapPin, Clock, Calendar, PhoneCall, ArrowUpRight, Check, Send, Sparkles } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

const InstagramIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function VisitUsPage({ onNavigateHome, onNavigateCollection }) {
  const [appointmentName, setAppointmentName] = useState('');
  const [appointmentPhone, setAppointmentPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!appointmentName.trim() || !appointmentPhone.trim()) return;
    setIsSubmitted(true);
  };

  const handleWhatsAppBooking = () => {
    const text = `Hi TONTO, I would like to schedule a studio visit at your Coimbatore showroom.\n\nName: ${appointmentName || 'Customer'}\nPreferred Date: ${appointmentDate || 'Upcoming weekend'}\nNotes: ${appointmentNotes || 'Interested in trying on denim and surplus pieces'}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
          <span className="text-[#003F25] font-semibold">visit us</span>
        </div>

        <button
          onClick={onNavigateCollection}
          className="hover:text-[#003F25] transition-colors text-[12px] underline cursor-pointer"
        >
          View Collection
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative w-full h-[280px] sm:h-[360px] overflow-hidden bg-[#0A1A12] select-none">
        <img
          src="/assets/editorial/editorial-standing-camo.jpg"
          alt="TONTO Coimbatore Studio"
          className="w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-[11px] font-bold tracking-[0.25em] text-white/90 uppercase mb-2">
            STUDIO & SHOWROOM
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mb-2">
            VISIT TONTO COIMBATORE
          </h1>
          <p className="text-[13px] text-white/80 max-w-md">
            Private try-ons, custom fit consultations, and firsthand archive selections.
          </p>
        </div>
      </div>

      {/* Main Studio Information & Booking Form */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Location & Hours (6 cols) */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#79867D] uppercase block mb-1">
                OUR LOCATION
              </span>
              <h2 className="text-2xl font-extrabold text-[#003F25] uppercase tracking-tight mb-4">
                The Coimbatore Studio
              </h2>
              <div className="space-y-3 text-[13px] text-[#4B5563]">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#003F25] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#003F25]">Cross Cut Road, Gandhipuram</strong>
                    <span>Coimbatore, Tamil Nadu, 641012, India</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-[#003F25] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#003F25]">Showroom & Fitting Hours</strong>
                    <span>Monday to Saturday: 11:00 AM – 8:30 PM IST</span>
                    <span className="block text-[11px] text-[#79867D]">Sunday by advance appointment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="space-y-3 pt-4 border-t border-[#E0E5E1]">
              <h3 className="text-[12px] font-bold text-[#003F25] uppercase tracking-wider">
                Direct Studio Concierge
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => window.open('https://api.whatsapp.com/send?text=Hi%20TONTO,%20I%20would%20like%20to%20enquire%20about%20visiting%20your%20Coimbatore%20studio.', '_blank')}
                  className="py-3 px-4 bg-[#128C7E] hover:bg-[#075E54] text-white text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
                >
                  <PhoneCall size={14} />
                  <span>WhatsApp Studio</span>
                </button>

                <a
                  href={BRAND_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 border border-[#003F25] text-[#003F25] hover:bg-[#F9FAF9] text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
                >
                  <InstagramIcon size={15} />
                  <span>Instagram @{BRAND_INFO.instagram}</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>

            {/* In-Person Experience Perks */}
            <div className="p-5 bg-[#F9FAF9] border border-[#E0E5E1] space-y-3 text-[12px] text-[#4B5563]">
              <div className="flex items-center gap-2 text-[#003F25] font-bold uppercase tracking-wider">
                <Sparkles size={16} />
                <span>Showroom Private Appointments</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Pre-select archive pieces to be steamed and ready upon your arrival.</li>
                <li>In-person waist and stack measurements for wide-leg denim.</li>
                <li>Surplus overshirts and military outerwear inspection before release.</li>
              </ul>
            </div>

          </div>

          {/* Right Column: Appointment Booking Form (6 cols) */}
          <div className="lg:col-span-6">
            <div className="border border-[#E0E5E1] p-6 sm:p-8 bg-white shadow-xs">
              <h3 className="text-[14px] font-extrabold text-[#003F25] uppercase tracking-wider pb-3 border-b border-[#E0E5E1] mb-6">
                Book a Studio Appointment
              </h3>

              {isSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#003F25] text-white flex items-center justify-center mx-auto">
                    <Check size={24} strokeWidth={3} />
                  </div>
                  <h4 className="text-lg font-bold text-[#003F25] uppercase">
                    Appointment Request Received
                  </h4>
                  <p className="text-[13px] text-[#4B5563] max-w-sm mx-auto">
                    Thank you, <strong className="text-[#003F25]">{appointmentName}</strong>. Our Coimbatore team will confirm your time via WhatsApp at <strong className="text-[#003F25]">{appointmentPhone}</strong>.
                  </p>
                  <button
                    onClick={handleWhatsAppBooking}
                    className="mt-4 px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-[12px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Send Reminder to WhatsApp</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={appointmentName}
                      onChange={(e) => setAppointmentName(e.target.value)}
                      placeholder="e.g. Aravind Shankar"
                      className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">WhatsApp / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={appointmentPhone}
                      onChange={(e) => setAppointmentPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">Items of Interest / Notes</label>
                    <textarea
                      rows={3}
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      placeholder="e.g. Looking for size 32 washed denim and vintage graphic tees."
                      className="w-full px-3 py-2 text-[13px] border border-gray-300 focus:border-[#003F25] focus:outline-none rounded-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Calendar size={15} />
                    <span>Request Studio Appointment</span>
                  </button>

                  <p className="text-[11px] text-[#79867D] text-center pt-1">
                    Free appointments. Walk-ins are also welcome during regular showroom hours.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
