import React, { useState, useEffect, useMemo } from 'react';
import { lockScroll, unlockScroll } from '../lib/scrollLock';
import { X, Copy, Check, ExternalLink, Send, MessageSquare, Sparkles, MapPin, Ruler, Package, Scissors, HelpCircle } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { submitEnquiry, mirror } from '../lib/capture';

const ENQUIRY_TOPICS = [
  { id: 'piece', label: 'Piece & Sizing', icon: Ruler, placeholder: 'Ask about sizing, chest/length measurements, in-store stock, or pricing...' },
  { id: 'general', label: 'General Question', icon: HelpCircle, placeholder: 'Ask us anything about TONTO, our curation, drops, or policies...' },
  { id: 'showroom', label: 'Showroom Visit', icon: MapPin, placeholder: 'Let us know your preferred date, time, and pieces to try on at our Coimbatore showroom...' },
  { id: 'custom', label: 'Custom & Tailoring', icon: Scissors, placeholder: 'Ask about custom denim washes, alterations, or bespoke streetwear requests...' },
  { id: 'order', label: 'Order & Delivery', icon: Package, placeholder: 'Inquire about shipping times, delivery to your pin code, or courier status...' },
];

const SUGGESTED_QUESTIONS = {
  piece: [
    'What are the exact chest, length & shoulder measurements?',
    'What size do you recommend for an oversized relaxed drape?',
    'Is this piece currently in stock at the Coimbatore showroom?',
    'Can you share raw fabric & wash close-up photos on WhatsApp?'
  ],
  general: [
    'When is the next private streetwear drop scheduled?',
    'Do you ship pan-India and what are delivery timelines?',
    'Are these imported blanks or in-house manufactured textiles?'
  ],
  showroom: [
    'Can I schedule a private styling session at the Coimbatore store?',
    'What are your showroom opening hours this weekend?',
    'Can you hold this piece until I visit tomorrow?'
  ],
  custom: [
    'Can you alter the length / hem on this denim pair?',
    'Do you accept custom wash or distressing commissions?',
    'Can you source an archival vintage jacket on request?'
  ],
  order: [
    'How long does shipping take to my state / city?',
    'Can I arrange expedited same-day dispatch?',
    'Do you provide order tracking updates via WhatsApp?'
  ]
};

export default function EnquiryModal({ product: initialProduct = null, initialSize = '', isOpen, onClose }) {
  const [attachedProduct, setAttachedProduct] = useState(initialProduct);
  const [topic, setTopic] = useState(initialProduct ? 'piece' : 'general');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [preferredChannel, setPreferredChannel] = useState('WhatsApp');
  const [sizePreference, setSizePreference] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);
  const [delivery, setDelivery] = useState('api');
  const [submitError, setSubmitError] = useState('');

  // Synchronize product and default topic when modal opens
  useEffect(() => {
    setAttachedProduct(initialProduct);
    if (initialProduct) {
      setTopic('piece');
      const title = initialProduct.title || 'Selected Piece';
      setSubject(`Inquiry: ${title}`);
      if (initialSize) {
        setSizePreference(initialSize);
      } else if (Array.isArray(initialProduct.variants) && initialProduct.variants.length > 0) {
        setSizePreference(initialProduct.variants[0]);
      } else {
        setSizePreference('');
      }
      setMessage(`Hi TONTO, I am inquiring about the ${title}${initialProduct.colour ? ` in ${initialProduct.colour}` : ''}. Could you share exact measurements, pricing, and availability?`);
    } else {
      setTopic('general');
      setSubject('General Inquiry');
      setSizePreference('');
      setMessage('Hi TONTO team, I have a question regarding your collection and showroom.');
    }
    setSubmittedStatus(null);
    setSubmitError('');
  }, [initialProduct, initialSize, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      lockScroll();
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle topic change
  const handleSelectTopic = (newTopicId) => {
    setTopic(newTopicId);
    const found = ENQUIRY_TOPICS.find((t) => t.id === newTopicId);
    if (newTopicId === 'piece' && attachedProduct) {
      setSubject(`Inquiry: ${attachedProduct.title}`);
    } else {
      setSubject(found ? found.label : 'Enquiry');
    }
  };

  // Safe product image fallback
  const productImage = useMemo(() => {
    if (!attachedProduct) return null;
    if (Array.isArray(attachedProduct.images) && attachedProduct.images.length > 0 && attachedProduct.images[0]) {
      return attachedProduct.images[0];
    }
    if (attachedProduct.image) return attachedProduct.image;
    return '/assets/products/extra-wide-denim.jpg';
  }, [attachedProduct]);

  // Normalize variants list safely
  const variantsList = useMemo(() => {
    if (!attachedProduct?.variants) return [];
    if (Array.isArray(attachedProduct.variants)) return attachedProduct.variants.map(String);
    if (typeof attachedProduct.variants === 'string') {
      return attachedProduct.variants.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [attachedProduct?.variants]);

  if (!isOpen) return null;

  const fullEnquiryText = [
    `✦ TONTO CLOTHING — CLIENT ENQUIRY ✦`,
    `Topic: ${ENQUIRY_TOPICS.find((t) => t.id === topic)?.label || 'General'}`,
    subject ? `Subject: ${subject}` : null,
    attachedProduct ? `Referenced Piece: ${attachedProduct.title} (${attachedProduct.colour || 'Standard'})` : null,
    sizePreference ? `Preferred Size: ${sizePreference}` : null,
    `Client Name: ${name || 'Customer'}`,
    `Contact: ${contact || 'Not provided'}`,
    email ? `Email: ${email}` : null,
    `Preferred Reply Via: ${preferredChannel}`,
    `\nMessage:`,
    message || 'No additional note provided.'
  ].filter(Boolean).join('\n');

  const handleCopy = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(fullEnquiryText).catch(() => {});
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullEnquiryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy fallback:', err);
    }
  };

  const cleanWhatsappNumber = (BRAND_INFO?.whatsapp || '8248321214').replace(/[^0-9]/g, '');

  const handleWhatsAppSend = () => {
    handleCopy();
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanWhatsappNumber}&text=${encodeURIComponent(fullEnquiryText)}`;
    window.open(waUrl, '_blank');
  };

  const handleInstagramDM = () => {
    handleCopy();
    window.open(BRAND_INFO?.instagramUrl || 'https://ig.me/m/tonto_clothing_', '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const cleanContact = (contact || '').trim();
    const cleanEmail = (email || '').trim();
    const clientName = (name || '').trim() || 'Store Shopper';
    const finalSubject = (subject || '').trim() || ENQUIRY_TOPICS.find((t) => t.id === topic)?.label || 'General Enquiry';
    const finalNotes = (message || '').trim() || `Inquiry regarding ${finalSubject}`;

    const newEnq = {
      id: `ENQ-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      clientName,
      contact: cleanContact || cleanEmail || 'Direct Inquiry',
      productTitle: attachedProduct?.title ? `${attachedProduct.title} [${finalSubject}]` : finalSubject,
      colour: attachedProduct?.colour || 'Standard',
      size: sizePreference || 'Standard',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Pending',
      notes: `${finalNotes}\n(Preferred Channel: ${preferredChannel})`
    };

    const newLead = {
      id: `LEAD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: clientName,
      phone: cleanContact,
      email: cleanEmail,
      source: `Storefront Enquiry (${finalSubject})`,
      interest: attachedProduct ? `${attachedProduct.title} (${sizePreference || 'General'})` : finalSubject,
      estimatedValue: 4500,
      stage: 'New',
      date: new Date().toISOString().split('T')[0],
      notes: finalNotes
    };

    const result = await submitEnquiry({
      name: clientName,
      contact: cleanContact || cleanEmail,
      phone: cleanContact,
      email: cleanEmail,
      productId: attachedProduct?.id || attachedProduct?.slug || '',
      title: attachedProduct?.title || finalSubject,
      colour: attachedProduct?.colour || 'Standard',
      size: sizePreference || 'Standard',
      message: `${finalSubject}: ${finalNotes} (Reply via: ${preferredChannel})`,
      channel: 'form',
    });

    if (result.rejected) {
      setSubmitError(result.error || 'The showroom could not accept this enquiry right now.');
      setIsSubmitting(false);
      return;
    }

    mirror('tonto_admin_enquiries', newEnq);
    mirror('tonto_admin_leads', newLead);
    setDelivery(result.ok ? 'api' : 'local');
    setIsSubmitting(false);
    setSubmittedStatus('ready');
  };

  const currentTopicData = ENQUIRY_TOPICS.find((t) => t.id === topic) || ENQUIRY_TOPICS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-xl bg-white border border-[#E0E5E1] shadow-2xl z-10 p-5 sm:p-7 my-auto animate-scale-up text-left max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#79867D] hover:text-[#003F25] hover:bg-gray-100 transition-all rounded-full focus:outline-none cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F0F5F2] text-[#003F25] text-[10px] font-bold tracking-[0.15em] uppercase rounded-xs mb-1.5">
            <MessageSquare size={12} className="stroke-[2.5]" />
            <span>TONTO CLIENT CONCIERGE</span>
          </div>
          <h2 id="enquiry-modal-title" className="text-xl sm:text-2xl font-black text-[#003F25] uppercase tracking-tight font-heading">
            Ask Us Anything
          </h2>
          <p className="text-[12px] text-[#6B7280] mt-1 leading-relaxed">
            Have a question about a piece, sizing, custom orders, or visiting our Coimbatore showroom? We reply directly via WhatsApp or email.
          </p>
        </div>

        {/* Success View */}
        {submittedStatus === 'ready' ? (
          <div className="space-y-4 py-2 animate-fade-in">
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-xs space-y-1">
              <p className="font-bold text-[13px] flex items-center gap-2">
                <Check size={16} strokeWidth={3} className="text-[#16a34a]" />
                {delivery === 'api' ? 'Enquiry Logged with TONTO Team' : 'Enquiry Saved Locally'}
              </p>
              <p className="text-[12px] text-[#15803D] leading-relaxed">
                {delivery === 'api'
                  ? 'Our team has received your message. For instant verification, you can also forward the summary below directly to our official WhatsApp.'
                  : 'Saved to your session. Connect directly via WhatsApp or Instagram DM for the fastest reply.'}
              </p>
            </div>

            {/* Formatted Summary Box */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xs text-[11.5px] font-mono whitespace-pre-wrap text-gray-700 max-h-44 overflow-y-auto selection:bg-[#003F25] selection:text-white leading-relaxed">
              {fullEnquiryText}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleWhatsAppSend}
                className="py-3 px-3 bg-[#128C7E] hover:bg-[#0d6e62] text-white font-bold text-[12px] tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 rounded-xs cursor-pointer shadow-xs"
              >
                <Send size={14} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleInstagramDM}
                className="py-3 px-3 bg-[#003F25] hover:bg-[#002e1b] text-white font-bold text-[12px] tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 rounded-xs cursor-pointer shadow-xs"
              >
                <ExternalLink size={14} />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="py-3 px-3 border border-[#003F25] text-[#003F25] font-bold text-[12px] tracking-wider uppercase hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 rounded-xs cursor-pointer"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSubmittedStatus(null)}
                className="text-[12px] text-[#79867D] hover:text-[#003F25] font-medium transition-colors cursor-pointer"
              >
                ← Edit enquiry
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] text-[#003F25] font-bold uppercase tracking-wider hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Topic Selection Pills */}
            <div>
              <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1.5">
                What Can We Help You With?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ENQUIRY_TOPICS.map((t) => {
                  const Icon = t.icon;
                  const isSelected = topic === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => handleSelectTopic(t.id)}
                      className={`px-2.5 py-2 text-[11.5px] font-medium border rounded-xs transition-all flex items-center gap-1.5 text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#003F25] text-white border-[#003F25] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={13} className={isSelected ? 'text-white' : 'text-[#79867D]'} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Attached Piece Reference Card */}
            {attachedProduct ? (
              <div className="p-3 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={productImage}
                    alt={attachedProduct.title || 'TONTO Piece'}
                    className="w-12 h-14 object-cover rounded-xs border border-gray-200 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#79867D]">
                      Referenced Piece
                    </span>
                    <span className="text-[13px] font-bold text-[#003F25] uppercase truncate">
                      {attachedProduct.title}
                    </span>
                    <span className="text-[11px] text-gray-600 truncate">
                      {attachedProduct.colour || 'Standard'} {attachedProduct.fit ? `• ${attachedProduct.fit}` : ''} • {attachedProduct.price || 'Price on enquiry'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedProduct(null);
                    setTopic('general');
                    setSubject('General Inquiry');
                  }}
                  className="text-[11px] text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shrink-0 cursor-pointer"
                  title="Remove piece reference to ask a general question"
                >
                  Remove ✕
                </button>
              </div>
            ) : null}

            {/* Size Preference (Only when a piece with variants is attached or piece topic is active) */}
            {attachedProduct && variantsList.length > 0 && (
              <div>
                <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1.5">
                  Size Preference
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {variantsList.map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => setSizePreference(sz)}
                      className={`px-3 py-1.5 text-[12px] font-medium border rounded-xs transition-colors cursor-pointer ${
                        sizePreference === sz
                          ? 'bg-[#003F25] text-white border-[#003F25]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSizePreference('Unsure / Need Advice')}
                    className={`px-3 py-1.5 text-[11px] font-medium border rounded-xs transition-colors cursor-pointer ${
                      sizePreference === 'Unsure / Need Advice'
                        ? 'bg-[#003F25] text-white border-[#003F25]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Unsure / Need Advice
                  </button>
                </div>
              </div>
            )}

            {/* Subject Field */}
            <div>
              <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1">
                Enquiry Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Sizing check, Restock query, or Showroom appointment"
                className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs"
              />
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1">
                  Your Name <span className="text-red-500">*</span>
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
                <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1">
                  WhatsApp / Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91 82483 21214 or phone"
                  className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs"
                />
              </div>
            </div>

            {/* Email & Preferred Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1">
                  Email <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider mb-1">
                  Preferred Reply Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['WhatsApp', 'Email', 'Phone Call'].map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => setPreferredChannel(ch)}
                      className={`py-2 text-[11px] font-medium border rounded-xs transition-colors cursor-pointer text-center truncate ${
                        preferredChannel === ch
                          ? 'bg-[#003F25] text-white border-[#003F25]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider">
                  Your Note / Questions
                </label>
                <span className="text-[11px] text-[#79867D]">
                  Be as specific as you like
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={currentTopicData.placeholder}
                className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] focus:border-[#003F25] focus:outline-none rounded-xs resize-none"
              />
            </div>

            {/* Quick Suggestion Chips */}
            {SUGGESTED_QUESTIONS[topic] && SUGGESTED_QUESTIONS[topic].length > 0 && (
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-[#003F25]" /> Quick questions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS[topic].map((q, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setMessage((prev) => {
                          const trimmed = prev.trim();
                          if (!trimmed) return q;
                          if (trimmed.includes(q)) return prev;
                          return `${trimmed}\n• ${q}`;
                        });
                      }}
                      className="text-[11px] text-gray-600 bg-gray-50 hover:bg-[#F0F5F2] hover:text-[#003F25] border border-gray-200 px-2 py-1 rounded-xs transition-colors text-left cursor-pointer"
                    >
                      + {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              {submitError && (
                <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xs px-3 py-2 mb-2">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 rounded-xs cursor-pointer focus:outline-none disabled:opacity-70 shadow-sm"
              >
                <span>{isSubmitting ? 'Submitting to TONTO…' : 'Send Enquiry'}</span>
                {!isSubmitting && <Send size={15} />}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
