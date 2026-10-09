import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Send } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export default function EnquiryModal({ product, initialSize = '', isOpen, onClose }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [sizePreference, setSizePreference] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);

  useEffect(() => {
    if (initialSize) {
      setSizePreference(initialSize);
    } else if (product?.variants?.[0]) {
      setSizePreference(product.variants[0]);
    } else {
      setSizePreference('');
    }

    if (product) {
      setMessage(
        `Hi TONTO, I am enquiring about the ${product.title} (${product.colour}). Please let me know price, exact measurements, and availability at your Coimbatore studio.`
      );
    } else {
      setMessage(`Hi TONTO, I would like to enquire about your available collection pieces at Coimbatore.`);
    }
    setSubmittedStatus(null);
  }, [product, initialSize, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fullEnquiryText = `TONTO Clothing Enquiry\nPiece: ${product ? product.title : 'General Enquiry'}\nColour: ${product?.colour || 'N/A'}\nPreferred Size: ${sizePreference || 'Standard'}\nClient Name: ${name || 'Customer'}\nContact: ${contact || 'N/A'}\n\n${message}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullEnquiryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstagramDM = () => {
    navigator.clipboard.writeText(fullEnquiryText);
    window.open('https://ig.me/m/tonto_clothing_', '_blank');
  };

  const handleSubmitDraft = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Honest submission state without fabricating backend delivery
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedStatus('ready');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg bg-white border border-[#E0E5E1] shadow-2xl z-10 p-6 sm:p-8 my-auto animate-scale-up text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#003F25] hover:opacity-70 transition-opacity rounded-full focus:outline-none"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <p className="text-[11px] font-bold tracking-[0.15em] text-[#79867D] uppercase mb-1">
            PIECE ENQUIRY
          </p>
          <h2 id="enquiry-modal-title" className="text-xl font-extrabold text-[#003F25] uppercase tracking-tight">
            Ask About This Piece
          </h2>
          <p className="text-[12px] text-[#6B7280] mt-1">
            Prices, measurements, and stock verification are handled directly by TONTO in Coimbatore.
          </p>
        </div>

        {/* Attached Product Context Card */}
        {product && (
          <div className="mb-5 p-3 bg-[#F9FAF9] border border-[#E0E5E1] flex items-center gap-3 rounded-xs">
            <img
              src={product.images?.[0]}
              alt={product.title}
              className="w-14 h-16 object-cover rounded-xs border border-gray-200"
            />
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#003F25] uppercase">
                {product.title}
              </span>
              <span className="text-[11px] text-[#79867D] capitalize">
                {product.colour} • {product.fit}
              </span>
              <span className="text-[11px] font-medium text-[#003F25] mt-0.5">
                {product.price}
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        {submittedStatus === 'ready' ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-sm text-[13px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Check size={16} strokeWidth={3} /> Enquiry drafted successfully
              </p>
              <p className="text-[12px] text-[#15803D]">
                To reach TONTO directly, send this inquiry via Instagram or copy to share via WhatsApp.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm text-[12px] font-mono whitespace-pre-wrap text-gray-700 max-h-36 overflow-y-auto">
              {fullEnquiryText}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={handleCopy}
                className="py-3 px-3 border border-[#003F25] text-[#003F25] font-bold text-[12px] tracking-wider uppercase hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => {
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullEnquiryText)}`, '_blank');
                }}
                className="py-3 px-3 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-[12px] tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={14} />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleInstagramDM}
                className="py-3 px-3 bg-[#003F25] text-white font-bold text-[12px] tracking-wider uppercase hover:bg-[#002e1b] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Instagram</span>
              </button>
            </div>

            <button
              onClick={() => setSubmittedStatus(null)}
              className="w-full text-center text-[12px] text-[#79867D] hover:underline pt-1"
            >
              ← Edit details
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitDraft} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#003F25] uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aravind"
                  className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#003F25] uppercase tracking-wider mb-1">
                  Contact / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone or Instagram handle"
                  className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs"
                />
              </div>
            </div>

            {product?.variants && (
              <div>
                <label className="block text-[11px] font-semibold text-[#003F25] uppercase tracking-wider mb-1">
                  Size Preference
                </label>
                <div className="flex gap-2">
                  {product.variants.map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => setSizePreference(sz)}
                      className={`px-3 py-1.5 text-[12px] border font-medium transition-colors ${
                        sizePreference === sz
                          ? 'bg-[#003F25] text-white border-[#003F25]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#003F25] uppercase tracking-wider mb-1">
                Your Note / Questions
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
              >
                <span>Prepare Enquiry</span>
                <Send size={15} />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
