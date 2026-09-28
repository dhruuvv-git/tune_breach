import React from 'react';
import SoftAurora from '../components/SoftAurora';
import AppleFade from '../components/AppleFade';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export default function HeroLevel({ onScrollNext, onOpenPlayground }) {
  return (
    <section 
      id="level-1" 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
      {/* SoftAurora WebGL Canvas Background */}
      <SoftAurora
        speed={3}
        scale={1.6}
        brightness={1.0}
        color1="#f7f7f7"
        color2="#590764"
        noiseFrequency={5.5}
        noiseAmplitude={2}
        bandHeight={0.45}
        bandSpread={1.3}
        octaveDecay={0.1}
        layerOffset={0.15}
        colorSpeed={0.5}
        enableMouseInteraction={true}
        mouseInfluence={0.2}
      />

      {/* Subtle radial vignette to soften edges and guarantee crisp typographic legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060408]/60 via-transparent to-[#060408] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,4,8,0.7)_85%)] pointer-events-none" />

      {/* Minimalist Hero Content Container with Apple-Style Fade */}
      <AppleFade className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center pt-16">
        
        {/* Acoustic Engine Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/15 backdrop-blur-xl mb-8 transition-transform hover:scale-105 duration-300">
          <span className="w-2 h-2 rounded-full bg-aurora-neon animate-pulse" />
          <span className="text-xs font-mono tracking-[0.25em] text-zinc-300 uppercase">
            Acoustic Neural Architecture
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-400">
            v1.0
          </span>
        </div>

        {/* Minimalist Reveal of TuneBreach */}
        <div className="relative mb-6">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-[-0.04em] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] font-sans">
            Tune<span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f3c8ff] to-[#a855f7]">Breach</span>
          </h1>

          {/* Minimalist soundwave aesthetic indicator beneath title */}
          <div className="flex items-center justify-center gap-1 mt-4 opacity-75">
            {[4, 10, 16, 28, 42, 24, 48, 32, 18, 40, 22, 34, 16, 8, 4].map((height, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-[#590764] to-[#e100ff]"
                style={{
                  height: `${height}px`,
                  animation: `pulse 1.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Minimalist Tagline */}
        <p className="max-w-xl text-base sm:text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-10 font-sans tracking-wide">
          The next-generation acoustic platform redefining <span className="text-white font-medium">musical clarity</span> through sub-cent pitch detection, deep harmonic intelligence, and real-time chord verification.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => onOpenPlayground('tuner')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-700" />
            <span>Open Interactive Suite</span>
          </button>

          <button
            onClick={onScrollNext}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-mono text-xs tracking-wider border border-white/15 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Explore The Platform</span>
            <span>↓</span>
          </button>
        </div>

      </AppleFade>

      {/* Clean Scroll indicator - only showing "Scroll" as requested */}
      <button 
        onClick={onScrollNext}
        aria-label="Scroll to Level 2"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors group cursor-pointer"
      >
        <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-zinc-500 group-hover:text-aurora-neon transition-colors">
          Scroll
        </span>
        <ChevronDown className="w-4 h-4 animate-bounce text-zinc-400 group-hover:text-white" />
      </button>
    </section>
  );
}
