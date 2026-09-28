'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './ChromaGrid.css';

export const ChromaGrid = ({
  items,
  className = '',
  radius = 300,
  columns = 4,
  rows = 1,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out',
  onItemSelect
}) => {
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  const data = items || [];

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, '--x', 'px');
    setY.current = gsap.quickSetter(el, '--y', 'px');
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true
    });
  };

  const handleMove = e => {
    const r = rootRef.current.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true
    });
  };

  const handleCardClick = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardMove = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${className}`}
      style={{
        '--r': `${radius}px`,
        '--cols': columns,
        '--rows': rows
      }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {data.map((c, i) => (
        <article
          key={i}
          className="chroma-card group"
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c)}
          style={{
            '--card-border': c.borderColor || '#a855f7',
            '--card-gradient': c.gradient || 'linear-gradient(145deg, #2a0b38, #09060d)',
            cursor: 'pointer'
          }}
        >
          <div className="chroma-img-wrapper">
            <img src={c.image} alt={c.title} loading="lazy" />
            {c.badge && (
              <span className="absolute top-4 right-4 z-10 px-2.5 py-1 text-[11px] font-mono tracking-wider font-semibold rounded-full bg-black/70 border border-white/20 text-white/90 backdrop-blur-md">
                {c.badge}
              </span>
            )}
          </div>
          <footer className="chroma-info">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <h3 className="name text-base font-bold text-white tracking-wide">{c.title}</h3>
                {c.handle && <span className="handle text-xs font-mono text-purple-400">{c.handle}</span>}
              </div>
              <p className="role text-xs text-zinc-300 leading-relaxed font-sans mt-1">{c.subtitle}</p>
              {c.actionPrompt && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-aurora-violet group-hover:text-aurora-neon font-mono transition-colors">
                  <span>{c.actionPrompt}</span>
                  <span>→</span>
                </div>
              )}
            </div>
          </footer>
        </article>
      ))}
      <div className="chroma-overlay" />
      <div ref={fadeRef} className="chroma-fade" />
    </div>
  );
};

export default ChromaGrid;
