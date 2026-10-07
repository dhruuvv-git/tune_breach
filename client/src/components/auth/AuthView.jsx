import React, { useState } from 'react';
import SoftAurora from '../SoftAurora';
import './AuthView.css';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

const CONVEYOR_ITEMS_LEFT = [
  { id: 'c1', title: 'Vintage Stratocaster', img: '/images/photo-1511671782779-c97d3d27a1d4.jpg' },
  { id: 'c2', title: 'Grand Concert Piano', img: '/images/photo-1520523839898-507125cd53c1.jpg' },
  { id: 'c3', title: 'Analog Synthesizer', img: '/images/photo-1598488035139-bdbb2231ce04.jpg' },
  { id: 'c4', title: 'Custom Acoustic Wood', img: '/images/photo-1525201548942-d8732f6617a0.jpg' },
  { id: 'c5', title: 'Harmonic Audio Mixing', img: '/images/photo-1598653222000-6b7b7a552625.jpg' },
];

const CONVEYOR_ITEMS_RIGHT = [
  { id: 'c6', title: 'Studio Piano Keys', img: '/images/photo-1514525253161-7a46d19cd819.jpg' },
  { id: 'c7', title: 'Bass Fretboard Resonance', img: '/images/photo-1465847899084-d164df4dedc6.jpg' },
  { id: 'c8', title: 'Electric Archtop', img: '/images/photo-1550985616-10810253b84d.jpg' },
  { id: 'c9', title: 'Fretboard Inlays', img: '/images/photo-1510915361894-db8b60106cb1.jpg' },
  { id: 'c10', title: 'Vocal Mic & Acoustics', img: '/images/photo-1590602847861-f357a9332bbc.jpg' },
];

export default function AuthView({ onAuthSuccess, onBackToLanding }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate instantaneous authentication & dissolve transition
    setTimeout(() => {
      onAuthSuccess({
        name: fullName.trim(),
        email: email.trim()
      });
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#060408] text-white">
      {/* Background SoftAurora (same background as landing page) */}
      <SoftAurora
        speed={2.5}
        scale={1.6}
        brightness={0.9}
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

      {/* Atmospheric dark overlays */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060408] via-transparent to-[#060408]/80 pointer-events-none" />

      {/* Top Left Back Button */}
      <button
        onClick={onBackToLanding}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-mono text-zinc-300 hover:text-white backdrop-blur-md transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Landing</span>
      </button>

      {/* Main Container: Glassmorphic Modal on Left + Dual Conveyor Belts on Right */}
      <div className="relative z-20 max-w-6xl w-full mx-4 sm:mx-6 my-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        
        {/* LEFT: Glass Window (Mockup reproduction with pill inputs) */}
        <div className="w-full max-w-xl p-8 sm:p-10 rounded-[32px] bg-white/[0.10] border border-white/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300">
          
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
              {isSignUp ? 'Sign Up' : 'Log In'}
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              {isSignUp 
                ? 'Join TuneBreach Acoustic Intelligence' 
                : 'Welcome back to your TuneBreach workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Form Inputs Column */}
            <div className="space-y-3.5">
              {isSignUp && (
                <div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-5 py-3 rounded-full bg-white/95 text-zinc-900 placeholder-zinc-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aurora-neon transition-all shadow-sm"
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-5 py-3 rounded-full bg-white/95 text-zinc-900 placeholder-zinc-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aurora-neon transition-all shadow-sm"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3 rounded-full bg-white/95 text-zinc-900 placeholder-zinc-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aurora-neon transition-all shadow-sm"
                />
              </div>

              {isSignUp && (
                <div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full px-5 py-3 rounded-full bg-white/95 text-zinc-900 placeholder-zinc-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aurora-neon transition-all shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Form Actions Column (Right side of glass card) */}
            <div className="flex flex-col items-center justify-center space-y-4 pt-1">
              
              {/* Primary Sign Up / Log In Pill */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#120a1c] hover:bg-[#1f1030] text-white border border-white/20 font-semibold text-sm shadow-[0_0_20px_rgba(225,0,255,0.25)] hover:shadow-[0_0_30px_rgba(225,0,255,0.45)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Accessing Studio...' : isSignUp ? 'Sign Up' : 'Log In'}
              </button>

              {/* Toggle Sign Up / Log In */}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-zinc-300 hover:text-white font-sans transition-colors cursor-pointer"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="font-bold underline text-white">Log in</span></>
                ) : (
                  <>Don't have an account? <span className="font-bold underline text-white">Sign up</span></>
                )}
              </button>

              <div className="flex items-center gap-3 w-full my-1">
                <span className="flex-1 h-[1px] bg-white/20" />
                <span className="text-[11px] font-mono text-zinc-400">Or</span>
                <span className="flex-1 h-[1px] bg-white/20" />
              </div>

              {/* Social Login Pills */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isSignUp ? 'Sign up with Google' : 'Log in with Google'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{isSignUp ? 'Sign up with Facebook' : 'Log in with Facebook'}</span>
              </button>

            </div>

          </form>

        </div>

        {/* RIGHT: Dual Conveyor Belts (Left column moving UP, Right column moving DOWN) */}
        <div className="hidden lg:flex items-center gap-4 h-[480px] overflow-hidden p-2 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl conveyor-wrapper shadow-2xl relative">
          
          {/* Subtle top and bottom gradient fades */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />

          {/* Left Column: Moving UP */}
          <div className="w-40 flex flex-col gap-4 animate-conveyor-up">
            {[...CONVEYOR_ITEMS_LEFT, ...CONVEYOR_ITEMS_LEFT].map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-white/15 shadow-lg group shrink-0"
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-white/90 leading-tight">
                  {item.title}
                </span>
              </div>
            ))}
          </div>

          {/* Right Column: Moving DOWN */}
          <div className="w-40 flex flex-col gap-4 animate-conveyor-down">
            {[...CONVEYOR_ITEMS_RIGHT, ...CONVEYOR_ITEMS_RIGHT].map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-white/15 shadow-lg group shrink-0"
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-white/90 leading-tight">
                  {item.title}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
