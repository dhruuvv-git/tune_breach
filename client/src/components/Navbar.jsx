import React from 'react';

export default function Navbar({ activeLevel, onSelectLevel }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onSelectLevel('level-1')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#590764] to-[#e100ff] p-[1px] flex items-center justify-center shadow-[0_0_12px_rgba(225,0,255,0.3)] group-hover:shadow-[0_0_20px_rgba(225,0,255,0.6)] transition-all">
            <div className="w-full h-full bg-[#0d0714] rounded-lg flex items-center justify-center">
              <span className="text-sm font-black font-mono text-white">TB</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white font-sans text-base">TuneBreach</span>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Acoustic Clarity</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="flex items-center gap-6 sm:gap-8 text-xs font-mono tracking-wider">
          <button 
            onClick={() => onSelectLevel('level-1')}
            className={`transition-colors ${activeLevel === 'level-1' ? 'text-aurora-neon font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            01 // REVEAL
          </button>
          <button 
            onClick={() => onSelectLevel('level-2')}
            className={`transition-colors ${activeLevel === 'level-2' ? 'text-aurora-neon font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            02 // PLATFORM
          </button>
          <button 
            onClick={() => onSelectLevel('level-3')}
            className={`transition-colors ${activeLevel === 'level-3' ? 'text-aurora-neon font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            03 // CAPABILITIES
          </button>
        </nav>

        {/* Minimal Right Balancer (Top-right buttons completely removed) */}
        <div className="hidden sm:block w-24" />
      </div>
    </header>
  );
}
