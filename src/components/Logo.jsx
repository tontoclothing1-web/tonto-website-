import React from 'react';

/**
 * Shared TONTO Clothing Brand Logo & Wordmark Component
 * 
 * Variants:
 * - 'hero': Bold vector TONTO wordmark with drop shadow for hero banner
 * - 'header': Green vector TONTO wordmark for light header
 * - 'footer': White vector TONTO wordmark for dark footer
 * - 'admin': White vector TONTO wordmark for admin top bar
 * - 'wordmark': White TONTO vector wordmark
 * - 'wordmark-green': Green (#02441F) TONTO vector wordmark
 * - 'horizontal': Horizontal lockup (T mark + TONTO) in white
 * - 'horizontal-green': Horizontal lockup (T mark + TONTO) in green
 * - 'lockup-white': Full vertically stacked lockup in white
 * - 'lockup-green': Full vertically stacked lockup in green
 * - 'mark': Minimal 3-rect T mark
 */
const VARIANTS = {
  hero: {
    src: '/assets/tonto-wordmark.svg',
    className: 'h-5 sm:h-6.5 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
  },
  header: {
    src: '/assets/tonto-wordmark-green.svg',
    className: 'h-6 sm:h-7 w-auto object-contain transition-transform duration-200 group-hover:opacity-90',
  },
  footer: {
    src: '/assets/tonto-wordmark.svg',
    className: 'h-7 sm:h-8 w-auto object-contain',
  },
  admin: {
    src: '/assets/tonto-wordmark.svg',
    className: 'h-5 sm:h-6 w-auto object-contain',
  },
  wordmark: {
    src: '/assets/tonto-wordmark.svg',
    className: 'h-6 sm:h-7 w-auto object-contain',
  },
  'wordmark-green': {
    src: '/assets/tonto-wordmark-green.svg',
    className: 'h-6 sm:h-7 w-auto object-contain',
  },
  horizontal: {
    src: '/assets/tonto-horizontal.svg',
    className: 'h-6 sm:h-7 w-auto object-contain',
  },
  'horizontal-green': {
    src: '/assets/tonto-horizontal-green.svg',
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
