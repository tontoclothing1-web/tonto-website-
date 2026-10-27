import React, { useState, useEffect } from 'react';
import { X, Check, Copy, QrCode, ArrowUpRight, ShieldCheck, Smartphone, ExternalLink } from 'lucide-react';
import { lockScroll, unlockScroll } from '../lib/scrollLock';

export default function UPIPaymentModal({
  isOpen,
  onClose,
  amount,
  orderId,
  upiId = 'tontoclothing@okaxis',
  merchantName = 'TONTO Clothing',
  onPaymentConfirmed
}) {
  const [copied, setCopied] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [hasPaid, setHasPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      lockScroll();
    }
    return () => {
      if (isOpen) unlockScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const cleanAmount = Number(amount) > 0 ? Number(amount) : 0;

  // Standard UPI URI format
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId || 'Hold'}`)}`;

  // iOS App-Specific Deep Links
  const gpayUrl = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${cleanAmount}&cu=INR`;
  const phonepeUrl = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${cleanAmount}&cu=INR`;
  const paytmUrl = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${cleanAmount}&cu=INR`;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    onPaymentConfirmed?.({
      method: 'UPI',
      txnId: txnId.trim() || `UPI-MANUAL-${Date.now().toString().slice(-6)}`,
      amount: cleanAmount
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upi-modal-title"
        className="relative w-full max-w-[460px] bg-white rounded-sm shadow-2xl border border-gray-200 z-10 p-5 sm:p-7 text-left my-auto max-h-[92dvh] overflow-y-auto overscroll-contain animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#003F25]/10 flex items-center justify-center text-[#003F25]">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 id="upi-modal-title" className="text-sm font-bold text-[#003F25] uppercase tracking-wider">
                Instant UPI Payment
              </h2>
              <span className="text-[11px] text-gray-500">Order #{orderId || 'Hold'} • ₹{cleanAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close UPI modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          
          {/* Mobile Android One-Click Pay */}
          {isAndroid && (
            <div className="space-y-2">
              <a
                href={upiUrl}
                className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[13px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Pay via Installed UPI App</span>
                <ArrowUpRight size={16} />
              </a>
              <p className="text-[11px] text-gray-400 text-center">Opens GPay, PhonePe, Paytm, or BHIM on your phone</p>
            </div>
          )}

          {/* iOS App Deep Links */}
          {isIOS && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#003F25] uppercase tracking-wider block">
                Tap Your UPI App:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={gpayUrl}
                  className="py-2.5 px-2 border border-gray-200 hover:border-[#003F25] rounded-xs text-center text-[11px] font-bold text-gray-800 hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  Google Pay ↗
                </a>
                <a
                  href={phonepeUrl}
                  className="py-2.5 px-2 border border-gray-200 hover:border-[#003F25] rounded-xs text-center text-[11px] font-bold text-gray-800 hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  PhonePe ↗
                </a>
                <a
                  href={paytmUrl}
                  className="py-2.5 px-2 border border-gray-200 hover:border-[#003F25] rounded-xs text-center text-[11px] font-bold text-gray-800 hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  Paytm ↗
                </a>
              </div>
            </div>
          )}

          {/* QR Code and Copy UPI ID (Always available on Desktop & Mobile fallback) */}
          <div className="p-4 bg-[#F9FAF9] border border-gray-200 rounded-xs text-center space-y-3">
            <span className="text-[11px] font-bold text-[#003F25] uppercase tracking-wider block">
              Scan QR or Copy VPA:
            </span>

            {/* Dynamic QR Code */}
            <div className="w-40 h-40 mx-auto bg-white p-2 border border-gray-200 rounded-sm shadow-xs flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                alt="Scan UPI QR Code to pay"
                width="160"
                height="160"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>

            {/* Copyable UPI ID Box */}
            <div className="flex items-center justify-between bg-white border border-gray-300 p-2 rounded-xs">
              <div className="text-left pl-1">
                <span className="text-[10px] text-gray-400 block font-mono uppercase">Merchant UPI VPA</span>
                <span className="text-[12px] font-bold text-[#003F25] font-mono select-all">{upiId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUPI}
                className="py-1 px-3 bg-[#003F25] text-white text-[11px] font-bold uppercase rounded-xs hover:bg-[#002e1b] transition-colors cursor-pointer flex items-center gap-1"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Payment Status Confirmation Form */}
          <form onSubmit={handleConfirm} className="pt-2 border-t border-gray-100 space-y-3">
            <div>
              <label htmlFor="upi-utr-input" className="block text-[11px] font-bold text-[#003F25] uppercase mb-1">
                UPI Reference / UTR Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="upi-utr-input"
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="12-digit UTR number from app receipt"
                className="w-full px-3 py-2 text-base sm:text-[13px] border border-gray-300 rounded-xs focus:border-[#003F25] outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-wait"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Confirming with Showroom\u2026' : "I've Completed UPI Payment"}</span>
            </button>
          </form>

          <p className="text-[10.5px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck size={13} className="text-[#003F25]" />
            <span>Secure 256-bit encrypted peer-to-merchant UPI transfer</span>
          </p>

        </div>
      </div>
    </div>
  );
}
