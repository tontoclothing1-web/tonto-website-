import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useCenteredCarousel Hook
 * 
 * High-performance, GPU-accelerated center-snapped carousel controller.
 * - Interpolates scale (1.0 -> 0.82) and opacity (1.0 -> 0.88) via requestAnimationFrame
 * - Writes styles directly to element refs (el.style.transform), zero re-renders on scroll
 * - Native CSS scroll-snap with programmatic smooth centering
 * - Mouse drag with inertia, touch momentum, and trackpad support
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
  activeHighlightScale = 1.16,
  sideScale = 0.85
}) {
  const containerRef = useRef(null);
  const cardMediaRefs = useRef([]);
  const cardWrapperRefs = useRef([]);

  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Cached measurements
  const measurementsRef = useRef({
    containerWidth: 1440,
    cardWidth: 380,
    gap: 20,
    itemStep: 400,
    paddingLeft: 530,
    isReducedMotion: false
  });

  const activeIndexRef = useRef(initialIndex || 0);
  const isDraggingRef = useRef(false);
  const isCenterPlayingRef = useRef(isCenterPlaying);
  const isScrollingRef = useRef(false);
  const dragInfoRef = useRef({ startX: 0, startScrollLeft: 0, hasMoved: false, lastX: 0, lastTime: 0, velocity: 0 });
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
    const firstCard = cardWrapperRefs.current[0];
    const secondCard = cardWrapperRefs.current[1];

    let cardWidth = 380;
    let gap = 20;

    if (firstCard) {
      cardWidth = firstCard.offsetWidth || 380;
      if (secondCard) {
        gap = Math.max(8, secondCard.offsetLeft - (firstCard.offsetLeft + cardWidth));
      }
    } else {
      // Responsive fallback estimations
      if (containerWidth < 640) {
        cardWidth = 270;
        gap = 12;
      } else if (containerWidth < 1024) {
        cardWidth = 330;
        gap = 16;
      }
    }

    const itemStep = cardWidth + gap;
    const paddingLeft = Math.max(0, (containerWidth - cardWidth) / 2);
    const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    measurementsRef.current = {
      containerWidth,
      cardWidth,
      gap,
      itemStep,
      paddingLeft,
      isReducedMotion,
      isMobile: containerWidth < 640
    };
  }, []);

  // Frame-by-frame continuous distance interpolation
  const applyTransforms = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { containerWidth, cardWidth, itemStep, paddingLeft, isReducedMotion } = measurementsRef.current;
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
    const centerScale = isMobile ? 1.12 : activeHighlightScale;
    const minScale = sideScale;

    // Apply continuous GPU scale and opacity to card wrapper
    const wrappers = cardWrapperRefs.current;
    const len = wrappers.length;

    for (let i = 0; i < len; i++) {
      const wrapperEl = wrappers[i];
      if (!wrapperEl) continue;

      if (isReducedMotion) {
        wrapperEl.style.transform = 'scale(1)';
        wrapperEl.style.opacity = '1';
        wrapperEl.style.transition = 'none';
        continue;
      }

      // Distance from card center to viewport center
      const cardCenter = paddingLeft + i * itemStep + cardWidth / 2;
      const dist = Math.abs(cardCenter - centerX);

      // Interpolation progress: 0 at center, 1 at 1 card away or further
      const progress = Math.min(1, dist / itemStep);

      // Smooth cosine easing curve for continuous organic scaling
      const ease = 0.5 * (1 + Math.cos(Math.PI * progress));

      // Continuous scale from centerScale at center down to minScale on sides
      const targetScale = minScale + ease * (centerScale - minScale);

      // Opacity between 1.0 (active center) and 0.78 (side cards)
      const opacity = 0.78 + ease * (1.0 - 0.78);

      wrapperEl.style.transition = isMoving ? 'none' : 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms ease';
      wrapperEl.style.transform = `scale3d(${targetScale.toFixed(4)}, ${targetScale.toFixed(4)}, 1)`;
      wrapperEl.style.opacity = opacity.toFixed(3);
      wrapperEl.style.zIndex = Math.round(10 + ease * 20);
    }
  }, [totalItems, onActiveChange, activeHighlightScale, sideScale]);

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
    const setSpan = totalBase * itemStep;
    const scrollLeft = container.scrollLeft;

    // If drifted too far left or right, adjust scroll position seamlessly
    if (scrollLeft < setSpan * 0.4) {
      isNormalizingRef.current = true;
      container.style.scrollBehavior = 'auto';
      container.scrollLeft += setSpan;
      requestAnimationFrame(() => {
        container.style.scrollBehavior = '';
        isNormalizingRef.current = false;
        applyTransforms();
      });
    } else if (scrollLeft > setSpan * 2.2) {
      isNormalizingRef.current = true;
      container.style.scrollBehavior = 'auto';
      container.scrollLeft -= setSpan;
      requestAnimationFrame(() => {
        container.style.scrollBehavior = '';
        isNormalizingRef.current = false;
        applyTransforms();
      });
    }
  }, [totalBase, applyTransforms]);

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
      }, 120);

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
      applyTransforms();
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [updateMeasurements, applyTransforms]);

  // Center target card smoothly
  const scrollToIndex = useCallback((index, smooth = true) => {
    const container = containerRef.current;
    if (!container) return;

    const { paddingLeft, itemStep, isReducedMotion } = measurementsRef.current;
    const targetScrollLeft = Math.max(0, paddingLeft + index * itemStep - paddingLeft);

    const useSmooth = smooth && !isReducedMotion;
    container.scrollTo({
      left: targetScrollLeft,
      behavior: useSmooth ? 'smooth' : 'auto'
    });
  }, []);

  // Initialize initial scroll position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateMeasurements();
    // Position initially without animation
    const { paddingLeft, itemStep } = measurementsRef.current;
    const initialTarget = Math.max(0, paddingLeft + (initialIndex || 0) * itemStep - paddingLeft);
    container.scrollLeft = initialTarget;

    requestAnimationFrame(() => {
      updateMeasurements();
      applyTransforms();
    });
  }, []);

  // Mouse Drag with Velocity and Momentum
  const handleMouseDown = useCallback((e) => {
    // Only drag with primary mouse button
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

      // Track velocity for release inertia
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

      // Inertia throw
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
    handleKeyDown,
    measurements: measurementsRef.current
  };
}
