import React from 'react';

/**
 * Shared TONTO Clothing Brand Logo Component
 * 
 * Renders inline SVG vectors directly so the logo:
 * 1. Never fails to load, regardless of network or server rewrites.
 * 2. Zero extra HTTP network requests.
 * 3. Ultra-crisp vector scaling on all device displays.
 * 
 * Variants:
 * - 'header' / 'lockup-green': Official green TONTO lockup for light navbar
 * - 'footer' / 'lockup-white' / 'admin': Official white TONTO lockup for dark containers
 * - 'hero' / 'wordmark': Official white TONTO wordmark for hero banner
 * - 'wordmark-green': Official green TONTO wordmark
 * - 'mark': Official green T icon mark
 * - 'mark-white': Official white T icon mark
 */

const DEFAULT_CLASSES = {
  header: 'h-[54px] sm:h-[62px] w-auto transition-transform duration-200 group-hover:opacity-90',
  'lockup-green': 'h-[54px] sm:h-[62px] w-auto',
  footer: 'h-11 sm:h-12 w-auto',
  admin: 'h-6 sm:h-7 w-auto',
  'lockup-white': 'h-10 sm:h-12 w-auto',
  hero: 'h-6 sm:h-7 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
  wordmark: 'h-6 sm:h-7 w-auto',
  'wordmark-green': 'h-6 sm:h-7 w-auto',
  mark: 'h-6 w-auto',
  'mark-white': 'h-6 w-auto',
  full: 'h-16 w-auto'
};

export default function Logo({
  variant = 'header',
  className = '',
  alt = 'TONTO Clothing',
  ...rest
}) {
  const baseClass = DEFAULT_CLASSES[variant] || DEFAULT_CLASSES.header;
  const combinedClass = className ? `${baseClass} ${className}` : baseClass;

  // Header / White lockup
  if (variant === 'header' || variant === 'lockup-green') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="222 258 631 630"
        className={combinedClass}
        role="img"
        aria-label={alt}
        preserveAspectRatio="xMidYMid meet"
        {...rest}
      >
        <title>{alt}</title>
        <g fill="#02441F">
          <rect x="431" y="268" width="69" height="56" />
          <rect x="555" y="268" width="70" height="56" />
          <rect x="500" y="324" width="55" height="284" />
          <path d="M232 663H328V705H297V785H263V705H232Z" />
          <path d="M484 785V663H514L558 727V663H590V785H560L516 721V785Z" />
          <path d="M598 663H694V705H663V785H629V705H598Z" />
        </g>
        <g fill="none" stroke="#02441F" strokeWidth="33">
          <ellipse cx="403" cy="725.5" rx="44.5" ry="46" />
          <ellipse cx="769" cy="725.5" rx="44.5" ry="46" />
        </g>
        <text
          x="411"
          y="858"
          fontFamily="Outfit, Poppins, 'Segoe UI', Arial, sans-serif"
          fontSize="58"
          fontWeight="300"
          fill="#02441F"
          textLength="238"
          lengthAdjust="spacingAndGlyphs"
        >
          Clothing
        </text>
      </svg>
    );
  }

  if (variant === 'footer' || variant === 'admin' || variant === 'lockup-white') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="222 258 631 630"
        className={combinedClass}
        role="img"
        aria-label={alt}
        preserveAspectRatio="xMidYMid meet"
        {...rest}
      >
        <title>{alt}</title>
        <g fill="#FFFFFF">
          <rect x="431" y="268" width="69" height="56" />
          <rect x="555" y="268" width="70" height="56" />
          <rect x="500" y="324" width="55" height="284" />
          <path d="M232 663H328V705H297V785H263V705H232Z" />
          <path d="M484 785V663H514L558 727V663H590V785H560L516 721V785Z" />
          <path d="M598 663H694V705H663V785H629V705H598Z" />
        </g>
        <g fill="none" stroke="#FFFFFF" strokeWidth="33">
          <ellipse cx="403" cy="725.5" rx="44.5" ry="46" />
          <ellipse cx="769" cy="725.5" rx="44.5" ry="46" />
        </g>
        <text
          x="411"
          y="858"
          fontFamily="Outfit, Poppins, 'Segoe UI', Arial, sans-serif"
          fontSize="58"
          fontWeight="300"
          fill="#FFFFFF"
          textLength="238"
          lengthAdjust="spacingAndGlyphs"
        >
          Clothing
        </text>
      </svg>
    );
  }

  // Hero / Wordmark White
  if (variant === 'hero' || variant === 'wordmark') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="230 663 604 125"
        className={combinedClass}
        role="img"
        aria-label={alt}
        preserveAspectRatio="xMidYMid meet"
        {...rest}
      >
        <title>{alt}</title>
        <g fill="#FFFFFF">
          <path d="M232 663H328V705H297V785H263V705H232Z" />
          <path d="M484 785V663H514L558 727V663H590V785H560L516 721V785Z" />
          <path d="M598 663H694V705H663V785H629V705H598Z" />
        </g>
        <g fill="none" stroke="#FFFFFF" strokeWidth="33">
          <ellipse cx="403" cy="725.5" rx="44.5" ry="46" />
          <ellipse cx="769" cy="725.5" rx="44.5" ry="46" />
        </g>
      </svg>
    );
  }

  // Wordmark Green
  if (variant === 'wordmark-green') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="230 663 604 125"
        className={combinedClass}
        role="img"
        aria-label={alt}
        preserveAspectRatio="xMidYMid meet"
        {...rest}
      >
        <title>{alt}</title>
        <g fill="#02441F">
          <path d="M232 663H328V705H297V785H263V705H232Z" />
          <path d="M484 785V663H514L558 727V663H590V785H560L516 721V785Z" />
          <path d="M598 663H694V705H663V785H629V705H598Z" />
        </g>
        <g fill="none" stroke="#02441F" strokeWidth="33">
          <ellipse cx="403" cy="725.5" rx="44.5" ry="46" />
          <ellipse cx="769" cy="725.5" rx="44.5" ry="46" />
        </g>
      </svg>
    );
  }

  // Mark
  if (variant === 'mark-white') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="431 268 194 340"
        className={combinedClass}
        role="img"
        aria-label={alt}
        preserveAspectRatio="xMidYMid meet"
        {...rest}
      >
        <title>{alt}</title>
        <g fill="#FFFFFF">
          <rect x="431" y="268" width="69" height="56" />
          <rect x="555" y="268" width="70" height="56" />
          <rect x="500" y="324" width="55" height="284" />
        </g>
      </svg>
    );
  }

  // Default mark / fallback
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="431 268 194 340"
      className={combinedClass}
      role="img"
      aria-label={alt}
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <title>{alt}</title>
      <g fill="#02441F">
        <rect x="431" y="268" width="69" height="56" />
        <rect x="555" y="268" width="70" height="56" />
        <rect x="500" y="324" width="55" height="284" />
      </g>
    </svg>
  );
}
