import React, { useEffect, useRef, useState } from 'react';

/**
 * AppleFade
 * Reusable wrapper providing Apple-style silky scroll entry animations:
 * - Smooth opacity transition from 0 to 1
 * - Subtle vertical glide from translateY(40px) to 0
 * - Subtle scale expansion from 0.985 to 1.0
 * - Subtle blur clearing from 6px to 0px
 * - Cubic-bezier (0.16, 1, 0.3, 1) timing curve
 */
export default function AppleFade({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
  direction = 'up'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [threshold]);

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1)';
    if (direction === 'up') return 'translate3d(0, 36px, 0) scale(0.985)';
    if (direction === 'down') return 'translate3d(0, -36px, 0) scale(0.985)';
    return 'translate3d(0, 36px, 0) scale(0.985)';
  };

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        filter: isVisible ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform, filter'
      }}
    >
      {children}
    </div>
  );
}
