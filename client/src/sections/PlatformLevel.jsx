import React from 'react';
import Masonry from '../components/Masonry';
import AppleFade from '../components/AppleFade';
import { INSTRUMENT_ITEMS } from '../data/instruments';
import { ArrowRight, AudioWaveform, Cpu, Music2 } from 'lucide-react';

export default function PlatformLevel({ onOpenPlayground, onScrollNext }) {
  return (
    <section 
      id="level-2" 
      className="relative min-h-screen w-full bg-[#07050a] border-t border-white/[0.06] py-24 px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#590764]/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#a855f7]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto pl-10 md:pl-16">
        
        {/* Section Header Tag with Apple Fade */}
        <AppleFade delay={100} className="flex items-center gap-3 mb-8">
          <span className="w-8 h-[1px] bg-aurora-neon" />
          <span className="text-xs font-mono tracking-[0.25em] text-aurora-violet uppercase font-semibold">
            LEVEL 02 // ARCHITECTURAL REVOLUTION
          </span>
        </AppleFade>

        {/* Two-column layout: Left = TuneBreach Editorial / Right = Masonry with Instruments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: TuneBreach - The next platform that redefines musical clarity */}
          <AppleFade delay={200} className="lg:col-span-5 flex flex-col justify-center">
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-[1.1] mb-6">
              Tune<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white">Breach</span>
            </h2>

            <div className="relative pl-4 border-l-2 border-aurora-neon mb-8">
              <p className="text-xl sm:text-2xl font-light text-zinc-100 font-sans leading-snug">
                The next platform that redefines <span className="font-semibold text-white underline decoration-aurora-violet/50 underline-offset-4">musical clarity</span>.
              </p>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed mb-8">
              Every note carries acoustic weight. Traditional digital tuners drift, static chord sheets leave fingers confused, and detached metronomes don't listen. 
              <strong className="text-white font-medium"> TuneBreach</strong> bridges the void between human performance and mathematical harmony through adaptive signal processing, multi-level timing systems, and live chord validation.
            </p>

            {/* Precision Feature Pillars */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:border-aurora-neon/40 transition-colors">
                <div className="p-2 rounded-lg bg-[#590764]/40 text-aurora-neon mt-0.5">
                  <AudioWaveform className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white font-sans">Acoustic Harmonic Isolation</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Identifies true fundamental frequencies across complex instrument resonance, from 88-key grand pianos to down-tuned drop guitars.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:border-aurora-neon/40 transition-colors">
                <div className="p-2 rounded-lg bg-[#590764]/40 text-pink-400 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white font-sans">Sub-Cent Accuracy</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Real-time FFT pitch computation with &lt; 0.05 cent deviation, delivering crystal-clear intonation in studio and stage conditions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:border-aurora-neon/40 transition-colors">
                <div className="p-2 rounded-lg bg-[#590764]/40 text-purple-300 mt-0.5">
                  <Music2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white font-sans">Multi-Instrument Support</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Tailored acoustic profiles optimized for electric & acoustic guitars, grand pianos, synthesizers, and bass fretboards.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onOpenPlayground('chords')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#590764] to-[#a855f7] hover:from-[#6b0877] hover:to-[#c084fc] text-white text-xs font-mono font-medium tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Explore Acoustic Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onScrollNext}
                className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-mono tracking-wider border border-white/10 transition-all active:scale-95"
              >
                <span>View Core Features ↓</span>
              </button>
            </div>

          </AppleFade>

          {/* Right Column: Masonry Component loaded with Instrument Photos */}
          <AppleFade delay={350} className="lg:col-span-7 relative">
            <div className="mb-3 flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACOUSTIC GALLERY // REAL INSTRUMENTS</span>
              </span>
            </div>

            {/* Masonry Canvas Wrapper */}
            <div className="rounded-2xl p-2 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.08] shadow-2xl backdrop-blur-sm">
              <Masonry
                items={INSTRUMENT_ITEMS}
                ease="power3.out"
                duration={0.7}
                stagger={0.06}
                animateFrom="bottom"
                scaleOnHover={true}
                hoverScale={0.96}
                blurToFocus={true}
                colorShiftOnHover={true}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-zinc-500 px-2">
              <span>Optimized for 6 & 7-string guitars, 88-key piano, multi-octave synths</span>
              <span className="text-aurora-violet">GSAP Physics Accelerated</span>
            </div>
          </AppleFade>

        </div>

      </div>
    </section>
  );
}
