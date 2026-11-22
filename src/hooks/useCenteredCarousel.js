import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Compute responsive dimensions so that:
 * - On Mobile (< 640px): Card is nicely proportioned (220px - 260px), leaving room
 *   for the left and right cards to peek in, and fitting comfortably within vertical mobile viewport.
 * - On Tablet (640px - 1024px): 310px card.
 * - On Desktop (>= 1024px): 360px card.
 */
function computeMeasurements(width) {
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  let cardWidth;
  let gap;

  if (isMobile) {
    // 68-72% of screen width, clamped between 220px and 260px
    cardWidth = Math.min(260, Math.max(220, Math.round(width * 0.70)));
    gap = 12;
  } else if (isTablet) {
    cardWidth = Math.min(310, Math.round(width * 0.42));
    gap = 16;
  } else {
    cardWidth = 360;
    gap = 22;
  }

  const itemStep = cardWidth + gap;
  const paddingLeft = Math.max(0, Math.round((width - cardWidth) / 2));
  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    containerWidth: width,
    cardWidth,
    gap,
    itemStep,
    paddingLeft,
    isReducedMotion,
    isMobile
  };
}

/**
 * useCenteredCarousel Hook
 * 
 * High-performance, GPU-accelerated center-snapped carousel controller.
 * - Interpolates scale and opacity via requestAnimationFrame
 * - Writes styles directly to element refs (el.style.transform), zero re-renders on scroll
 * - Native CSS scroll-snap with programmatic smooth centering
 * - Full touch swipe and mouse drag support with momentum
 * - Caches measurements with ResizeObserver
 * - Full cleanup on unmount for React 19 StrictMode & SPA safety
 */
export function useCenteredCarousel({
  totalItems,
  totalBase,
  initialIndex,
  onActiveChange,
  isPaused = false,
  isCenterPlaying = true,
  activeHighlightScale = 1.0,
  sideScale = 1.0
}) {
  const containerRef = useRef(null);
  const cardMediaRefs = useRef([]);
  const cardWrapperRefs = useRef([]);

  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Responsive measurements state & ref
  const [measurements, setMeasurements] = useState(() => {
    const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    return computeMeasurements(initialWidth);
  });
  const measurementsRef = useRef(measurements);

  const activeIndexRef = useRef(initialIndex || 0);
  const isDraggingRef = useRef(false);
  const isCenterPlayingRef = useRef(isCenterPlaying);
  const isScrollingRef = useRef(false);
  const dragInfoRef = useRef({ startX: 0, startScrollLeft: 0, hasMoved: false, lastX: 0, lastTime: 0, velocity: 0 });
  const touchInfoRef = useRef({ startX: 0, startY: 0, hasMoved: false });
  const scrollRafRef = useRef(null);
  const scrollIdleTimerRef = useRef(null);
  const isNormalizingRef = useRef(false);

  // Keep activeIndexRef in sync
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Read card & container measurements
  const updateMeasurements = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const newM = computeMeasurements(containerWidth);

    measurementsRef.current = newM;
    setMeasurements((prev) => {
      if (
        prev.cardWidth === newM.cardWidth &&
        prev.gap === newM.gap &&
        prev.paddingLeft === newM.paddingLeft &&
        prev.isMobile === newM.isMobile
      ) {
        return prev;
      }
      return newM;
    });
  }, []);

  // Frame-by-frame continuous distance interpolation
  const applyTransforms = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { containerWidth, cardWidth, itemStep, paddingLeft, isReducedMotion, isMobile } = measurementsRef.current;
    const scrollLeft = container.scrollLeft;
    const centerX = scrollLeft + containerWidth / 2;

    // Calculate nearest card to center
    const nearestIdx = Math.round((centerX - paddingLeft - cardWidth / 2) / itemStep);
    const clampedIdx = Math.max(0, Math.min(totalItems - 1, nearestIdx));

    if (clampedIdx !== activeIndexRef.current && !isNormalizingRef.current) {
      activeIndexRef.current = clampedIdx;
      setActiveIndex(clampedIdx);
      onActiveChange?.(clampedIdx);
    }

    const isMoving = isDraggingRef.current || isScrollingRef.current;

    // Apply continuous opacity and zIndex to card wrapper without vertical scaling
    const wrappers = cardWrapperRefs.current;
    const len = wrappers.length;

    for (let i = 0; i < len; i++) {
      const wrapperEl = wrappers[i];
      if (!wrapperEl) continue;

      if (isReducedMotion) {
        wrapperEl.style.transform = 'none';
        wrapperEl.style.opacity = '1';
        wrapperEl.style.transition = 'none';
        wrapperEl.style.zIndex = '10';
        continue;
      }

      // Distance from card center to viewport center
      const cardCenter = paddingLeft + i * itemStep + cardWidth / 2;
      const dist = Math.abs(cardCenter - centerX);

      // Interpolation progress: 0 at center, 1 at 1 card away or further
      const progress = Math.min(1, dist / itemStep);

      // Smooth cosine easing curve for continuous focus: 1 at center, 0 at >= 1 card away
      const ease = 0.5 * (1 + Math.cos(Math.PI * progress));

      // Continuous opacity: 1.0 at center, smoothly dropping to 0.65 on side cards
      const opacity = 0.65 + ease * (1.0 - 0.65);

      // Keep vertical alignment strictly static: NO vertical transform / scaling!
      wrapperEl.style.transform = 'none';
      wrapperEl.style.transition = isMoving ? 'none' : 'opacity 350ms ease';
      wrapperEl.style.opacity = opacity.toFixed(3);
      wrapperEl.style.zIndex = Math.round(10 + ease * 20);
    }
  }, [totalItems, onActiveChange]);

  // Sync isCenterPlaying state
  useEffect(() => {
    isCenterPlayingRef.current = isCenterPlaying;
    applyTransforms();
  }, [isCenterPlaying, applyTransforms]);

  // Seamless wrap normalization handler for infinite buffer
  const checkInfiniteLoop = useCallback(() => {
    const container = containerRef.current;
    if (!container || !totalBase || isDraggingRef.current || isNormalizingRef.current) return;

    const { itemStep } = measurementsRef.current;
    if (!itemStep) return;

    const setSpan = totalBase * itemStep;
    const currentScroll = container.scrollLeft;

    // Set 2 is the center set: from setSpan * 2 to setSpan * 3
    const baseOffset = Math.floor((currentScroll - setSpan * 2) / setSpan);

    if (baseOffset !== 0) {
      const shift = baseOffset * setSpan;
      isNormalizingRef.current = true;

      const prevBehavior = container.style.scrollBehavior;
      const prevSnap = container.style.scrollSnapType;

      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';
      container.scrollLeft -= shift;

      const newIdx = activeIndexRef.current - baseOffset * totalBase;
      activeIndexRef.current = newIdx;
      setActiveIndex(newIdx);
      onActiveChange?.(newIdx);

      requestAnimationFrame(() => {
        container.style.scrollSnapType = prevSnap || '';
        container.style.scrollBehavior = prevBehavior || '';
        isNormalizingRef.current = false;
        applyTransforms();
      });
    }
  }, [totalBase, onActiveChange, applyTransforms]);

  // Scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      isScrollingRef.current = true;
      setIsScrolling(true);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setIsScrolling(false);
        applyTransforms();
        checkInfiniteLoop();
      }, 90);

      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        applyTransforms();
        scrollRafRef.current = null;
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };
  }, [applyTransforms, checkInfiniteLoop]);

  // ResizeObserver for responsive measurements & zero-jump recentering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateMeasurements();
    applyTransforms();

    const ro = new ResizeObserver(() => {
      updateMeasurements();
      const c = containerRef.current;
      if (c && measurementsRef.current?.itemStep) {
        c.scrollLeft = activeIndexRef.current * measurementsRef.current.itemStep;
      }
      applyTransforms();
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [updateMeasurements, applyTransforms]);

  // Center target card smoothly
  const scrollToIndex = useCallback((index, smooth = true) => {
    const container = containerRef.current;
    if (!container) return;

    const { itemStep, isReducedMotion } = measurementsRef.current;
    if (!itemStep) return;

    const setSpan = totalBase * itemStep;
    let targetIndex = index;

    // If targetIndex approaches either boundary, normalize first seamlessly
    if (targetIndex >= totalBase * 4) {
      const prevSnap = container.style.scrollSnapType;
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';
      container.scrollLeft -= setSpan;
      targetIndex -= totalBase;
      activeIndexRef.current -= totalBase;
      container.style.scrollSnapType = prevSnap || '';
    } else if (targetIndex < totalBase) {
      const prevSnap = container.style.scrollSnapType;
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';
      container.scrollLeft += setSpan;
      targetIndex += totalBase;
      activeIndexRef.current += totalBase;
      container.style.scrollSnapType = prevSnap || '';
    }

    const targetScrollLeft = Math.max(0, targetIndex * itemStep);
    const useSmooth = smooth && !isReducedMotion;

    container.scrollTo({
      left: targetScrollLeft,
      behavior: useSmooth ? 'smooth' : 'auto'
    });
  }, [totalBase]);

  // Initialize initial scroll position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateMeasurements();
    const { itemStep } = measurementsRef.current;
    const startIdx = initialIndex || 0;
    container.scrollLeft = startIdx * itemStep;

    requestAnimationFrame(() => {
      updateMeasurements();
      applyTransforms();
    });
  }, [initialIndex, updateMeasurements, applyTransforms]);

  // Touch Swipe Handlers for Mobile Devices
  const handleTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    touchInfoRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      hasMoved: false
    };
    dragInfoRef.current.hasMoved = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchInfoRef.current.startX);
    const dy = Math.abs(touch.clientY - touchInfoRef.current.startY);

    if (dx > 6 || dy > 6) {
      touchInfoRef.current.hasMoved = true;
      dragInfoRef.current.hasMoved = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchInfoRef.current.hasMoved) {
      dragInfoRef.current.hasMoved = true;
      setTimeout(() => {
        dragInfoRef.current.hasMoved = false;
        touchInfoRef.current.hasMoved = false;
      }, 120);
    }
  }, []);

  // Mouse Drag with Velocity and Momentum
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    setIsDragging(true);

    dragInfoRef.current = {
      startX: e.clientX,
      startScrollLeft: container.scrollLeft,
      hasMoved: false,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0
    };

    const onMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragInfoRef.current.startX;

      if (Math.abs(dx) > 4) {
        dragInfoRef.current.hasMoved = true;
      }

      container.scrollLeft = dragInfoRef.current.startScrollLeft - dx;

      const now = performance.now();
      const dt = now - dragInfoRef.current.lastTime;
      if (dt > 16) {
        dragInfoRef.current.velocity = (moveEvent.clientX - dragInfoRef.current.lastX) / dt;
        dragInfoRef.current.lastX = moveEvent.clientX;
        dragInfoRef.current.lastTime = now;
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      applyTransforms();

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const v = dragInfoRef.current.velocity;
      if (Math.abs(v) > 0.4) {
        const momentumDistance = v * -220;
        container.scrollBy({ left: momentumDistance, behavior: 'smooth' });
      }

      setTimeout(() => {
        dragInfoRef.current.hasMoved = false;
      }, 50);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(activeIndexRef.current - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(activeIndexRef.current + 1);
    }
  }, [scrollToIndex]);

  return {
    containerRef,
    cardMediaRefs,
    cardWrapperRefs,
    activeIndex,
    isDragging,
    isScrolling,
    hasMoved: dragInfoRef.current.hasMoved,
    scrollToIndex,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    measurements
  };
}
