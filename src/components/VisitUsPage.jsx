import React from 'react';
import { ArrowLeft, MapPin, Phone, MessageCircle, ArrowUpRight, Navigation, PhoneCall } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function VisitUsPage({ onNavigateHome, onNavigateCollection }) {
  const storeAddress = "Opposite to Prozone Mall, Sathy Road, Coimbatore, Tamil Nadu - 641035, India";
  const landmark = "Opposite Prozone Mall";
  const phoneNumber = "+91 82483 21214";
  const phoneRaw = "+918248321214";
  const googleMapsShareUrl = "https://share.google/6kenpRy2HPjbnZ9Lo";
  const googleMapsEmbedUrl = "https://maps.google.com/maps?q=Tonto+Clothing+Opposite+Prozone+Mall+Coimbatore&t=&z=16&ie=UTF8&iwloc=&output=embed";

  return (
    <div className="w-full bg-white text-[#111111] pb-24 selection:bg-[#003F25] selection:text-white">
      
      {/* 1. Breadcrumb Navigation */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-4 text-[12px] text-[#79867D] flex items-center justify-between border-b border-[#E0E5E1]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateHome}
            className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1 font-medium"
          >
            <ArrowLeft size={14} />
            <span>home</span>
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-[#003F25] font-semibold tracking-wider uppercase">visit us</span>
        </div>

        <button
          onClick={onNavigateCollection}
          className="hover:text-[#003F25] transition-colors text-[12px] font-semibold tracking-wider uppercase underline underline-offset-4 cursor-pointer"
        >
          View Collection
        </button>
      </div>

      {/* 2. Page Header */}
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F9FAF9] text-[#003F25] text-[11px] font-bold tracking-[0.2em] uppercase rounded-xs border border-[#E0E5E1] mb-3">
          <MapPin size={13} className="text-[#003F25]" />
          <span>STORE LOCATION & CONTACT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111111] font-['Futura_PT_Book',sans-serif]">
          VISIT TONTO CLOTHING
        </h1>
        <p className="text-[13.5px] sm:text-[14.5px] text-[#79867D] mt-2 max-w-xl">
          Find our physical store in Coimbatore. Drop in for size fittings and in-store pickups.
        </p>
      </div>

      {/* 3. Core Content: Location Details, Phone Number & Map */}
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Location Details & Phone Number (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Card 1: Location Details */}
            <div className="p-6 sm:p-7 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[#003F25]">
                <MapPin size={20} strokeWidth={2.2} />
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase">
                  STORE ADDRESS
                </span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#111111] uppercase tracking-tight font-['Futura_PT_Book',sans-serif]">
                  TONTO CLOTHING
                </h2>
                <p className="text-[14px] text-[#374151] mt-2 leading-relaxed font-medium">
                  {storeAddress}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E0E5E1] flex items-center justify-between text-[12px]">
                <span className="text-[#79867D] font-mono uppercase">Landmark:</span>
                <span className="font-bold text-[#003F25]">{landmark}</span>
              </div>

              {/* Direct Google Maps Share Link Button */}
              <div className="pt-2">
                <a
                  href={googleMapsShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer rounded-xs shadow-xs"
                >
                  <Navigation size={15} />
                  <span>Open in Google Maps</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            {/* Card 2: Phone Number & WhatsApp */}
            <div className="p-6 sm:p-7 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[#003F25]">
                <Phone size={19} strokeWidth={2.2} />
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase">
                  PHONE & WHATSAPP
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#79867D] font-mono uppercase block mb-1">
                  DIRECT CALL / WHATSAPP
                </span>
                <a
                  href={`tel:${phoneRaw}`}
                  className="text-2xl font-extrabold text-[#003F25] tracking-tight hover:underline block font-['Futura_PT_Book',sans-serif]"
                >
                  {phoneNumber}
                </a>
              </div>

              {/* Action Buttons: Call & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${phoneRaw}`}
                  className="py-3 px-4 bg-white border border-[#003F25] text-[#003F25] hover:bg-[#003F25] hover:text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer rounded-xs"
                >
                  <PhoneCall size={14} />
                  <span>Call Store</span>
                </a>

                <a
                  href={`https://wa.me/${phoneRaw.replace('+', '')}?text=Hi%20TONTO,%20I%20am%20enquiring%20about%20your%20store%20location%20and%20collection.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-[#128C7E] hover:bg-[#075E54] text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer rounded-xs"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Embedded Google Map (7 cols) */}
          <div className="lg:col-span-7">
            <div className="border border-[#E0E5E1] rounded-xs overflow-hidden shadow-xs bg-[#F9FAF9]">
              
              {/* Map Bar Header */}
              <div className="px-5 py-3.5 bg-white border-b border-[#E0E5E1] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#003F25]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#111111]">
                    LIVE MAP LOCATION
                  </span>
                </div>
                <a
                  href={googleMapsShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-[#003F25] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>share.google</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>

              {/* Map Iframe */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-gray-100">
                <iframe
                  title="TONTO Clothing Location Map"
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>

              {/* Map Footer Bar */}
              <div className="p-4 bg-white border-t border-[#E0E5E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="text-[12px] text-[#79867D]">
                  <strong className="text-[#111111]">Tonto Clothing</strong> • Opposite to Prozone Mall, Coimbatore
                </div>
                <a
                  href={googleMapsShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#003F25] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#002e1b] transition-colors rounded-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Directions</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
