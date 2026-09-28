import React, { useState } from 'react';
import ChromaGrid from '../components/ChromaGrid';
import AppleFade from '../components/AppleFade';
import { FEATURE_ITEMS } from '../data/features';
import { CheckCircle2 } from 'lucide-react';

export default function CapabilitiesLevel({ onOpenPlayground }) {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle');
  const [waitlistMsg, setWaitlistMsg] = useState('');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;

    setWaitlistStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail })
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistStatus('success');
        setWaitlistMsg(data.message);
        setWaitlistEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMsg(data.message || 'Error joining waitlist.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMsg('Network connection issue. Please retry.');
    }
  };

  const handleCardSelect = (item) => {
    if (item.id === 'feature-tuner') {
      onOpenPlayground('tuner');
    } else if (item.id === 'feature-chords') {
      onOpenPlayground('chords');
    } else if (item.id === 'feature-metronome') {
      onOpenPlayground('metronome');
    } else if (item.id === 'feature-verifier') {
      onOpenPlayground('verifier');
    }
  };

  return (
    <section 
      id="level-3" 
      className="relative min-h-screen w-full bg-[#050307] border-t border-white/[0.06] py-24 px-6 md:px-12 lg:px-20 overflow-hidden flex flex-col justify-between"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#590764]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 right-12 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full pl-10 md:pl-16 relative z-10">
        
        {/* Header with Apple Fade */}
        <AppleFade delay={100} className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-aurora-neon animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-300 uppercase">
              LEVEL 03 // CORE CAPABILITIES
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-sans mb-4">
            Engineered For Absolute Precision
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            Every feature in TuneBreach was built from the ground up with high-order acoustic physics, microtonal tuning algorithms, and real-time auditory machine learning.
          </p>
        </AppleFade>

        {/* ChromaGrid Component with Apple Fade */}
        <AppleFade delay={250} className="relative mb-20">
          <ChromaGrid
            items={FEATURE_ITEMS}
            radius={280}
            columns={4}
            rows={1}
            damping={0.45}
            fadeOut={0.6}
            ease="power3.out"
            onItemSelect={handleCardSelect}
          />
        </AppleFade>

        {/* Early Access / Waitlist banner with Apple Fade */}
        <AppleFade delay={350} className="mt-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#170a22] via-[#0d0714] to-[#12081c] border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-aurora-neon/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <span className="text-xs font-mono tracking-[0.25em] text-aurora-neon uppercase font-semibold">
              JOIN THE HARMONIC FRONTIER
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3 font-sans">
              Be the first to experience TuneBreach Studio
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-light">
              Get early access to our zero-latency WebAudio engine, proprietary chord recognition algorithms, and mobile companion app.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <div className="relative w-full">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-aurora-neon focus:ring-1 focus:ring-aurora-neon transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={waitlistStatus === 'submitting'}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono tracking-wider transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {waitlistStatus === 'submitting' ? 'Registering...' : 'Request Access'}
              </button>
            </form>

            {waitlistStatus === 'success' && (
              <p className="mt-4 text-xs font-mono text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{waitlistMsg}</span>
              </p>
            )}

            {waitlistStatus === 'error' && (
              <p className="mt-4 text-xs font-mono text-rose-400">
                {waitlistMsg}
              </p>
            )}
          </div>
        </AppleFade>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TuneBreach</span>
            <span>// Acoustic Intelligence Engine</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-300 cursor-pointer">Documentation</span>
            <span className="hover:text-zinc-300 cursor-pointer">API Reference</span>
            <span className="hover:text-zinc-300 cursor-pointer">Acoustic Standards</span>
          </div>
          <div>
            <span>© 2026 TuneBreach. All rights reserved.</span>
          </div>
        </footer>

      </div>
    </section>
  );
}
