/**
 * Unified iOS-safe Body Scroll Lock
 *
 * Prevents mobile Safari rubber-band bleed-through under modals & drawers
 * while strictly preserving and restoring scroll offset on dismissal.
 */

let lockCount = 0;
let savedScrollY = 0;

export function lockScroll() {
  if (typeof window === 'undefined') return;
  lockCount++;
  if (lockCount === 1) {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
}

export function unlockScroll() {
  if (typeof window === 'undefined') return;
  if (lockCount > 0) {
    lockCount--;
    if (lockCount === 0) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
  }
}
