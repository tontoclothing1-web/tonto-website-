import React from 'react';

/**
 * Shared TONTO Clothing Brand Logo Component
 * 
 * - 'hero': Standalone enlarged crisp TONTO wordmark (ONLY hero banner has the emblem removed per design preference)
 * - 'header': Official green TONTO lockup (emblem + TONTO + Clothing) for light header
 * - 'footer': Official white TONTO lockup (emblem + TONTO + Clothing) for dark footer
 * - 'admin': Official white TONTO lockup for admin desk
 */
const VARIANTS = {
  hero: {
    src: '/assets/tonto-wordmark.svg',
    className: 'h-6 sm:h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
  },
  header: {
    src: '/assets/tonto-lockup-green.svg',
    className: 'h-10 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:opacity-90',
  },
  footer: {
    src: '/assets/tonto-lockup.svg',
    className: 'h-11 sm:h-12 w-auto object-contain',
  },
  admin: {
    src: '/assets/tonto-lockup.svg',
    className: 'h-6 sm:h-7 w-auto object-contain',
  },
  wordmark: {
    src: '/assets/tonto-wordmark.svg',
    className: 'h-6 sm:h-7 w-auto object-contain',
  },
  'wordmark-green': {
    src: '/assets/tonto-wordmark-green.svg',
    className: 'h-6 sm:h-7 w-auto object-contain',
  },
  'lockup-white': {
    src: '/assets/tonto-lockup.svg',
    className: 'h-10 sm:h-12 w-auto object-contain',
  },
  'lockup-green': {
    src: '/assets/tonto-lockup-green.svg',
    className: 'h-10 sm:h-12 w-auto object-contain',
  },
  mark: {
    src: '/assets/tonto-mark.svg',
    className: 'h-6 w-auto object-contain',
  },
  'mark-white': {
    src: '/assets/tonto-mark-white.svg',
    className: 'h-6 w-auto object-contain',
  },
  full: {
    src: '/assets/tonto-logo.svg',
    className: 'h-16 w-auto object-contain',
  },
};

export default function Logo({
  variant = 'header',
  className = '',
  alt = 'TONTO Clothing',
  loading = 'eager',
  fetchPriority = 'auto',
  ...rest
}) {
  const config = VARIANTS[variant] || VARIANTS.header;
  const combinedClass = className ? `${config.className} ${className}` : config.className;

  return (
    <img
      src={config.src}
      alt={alt}
      className={combinedClass}
      loading={loading}
      fetchPriority={fetchPriority}
      {...rest}
    />
  );
}
