import React, { useState } from 'react';
import OptionWheel from './OptionWheel';

const LEVEL_ITEMS = [
  '01 // REVEAL',
  '02 // PLATFORM',
  '03 // CAPABILITIES'
];

export default function VerticalLevelBar({ activeLevel, onSelectLevel }) {
  const [isHovered, setIsHovered] = useState(false);

  // Map activeLevel ('level-1', 'level-2', 'level-3') to index (0, 1, 2)
  const activeIndex = activeLevel === 'level-3' ? 2 : activeLevel === 'level-2' ? 1 : 0;

  const handleWheelChange = (index) => {
    const levelId = `level-${index + 1}`;
    if (levelId !== activeLevel) {
      onSelectLevel(levelId);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center transition-all duration-300 ease-out select-none pointer-events-auto"
      style={{ transform: 'translateY(-50%)' }}
    >
      {/* Collapsed Minimalist Vertical Indicator Bars (Permanently visible on left edge across all slides) */}
      <div className="pl-4 sm:pl-6 pr-3 py-6 flex flex-col items-center gap-3.5 cursor-pointer bg-black/20 backdrop-blur-[2px] rounded-r-2xl border-r border-white/5 shadow-lg">
        {[0, 1, 2].map((idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelectLevel(`level-${idx + 1}`)}
              aria-label={`Jump to level ${idx + 1}`}
              className="group focus:outline-none py-1 flex items-center justify-center cursor-pointer"
            >
              <div
                className={`w-1.5 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'h-14 bg-gradient-to-b from-[#e100ff] via-[#a855f7] to-[#590764] shadow-[0_0_16px_#e100ff]'
                    : 'h-6 bg-white/30 group-hover:h-9 group-hover:bg-white/70'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Expanded OptionWheel Drawer revealed ONLY on hover */}
      <div
        className={`transition-all duration-500 ease-out overflow-hidden flex items-center ${
          isHovered
            ? 'w-[280px] sm:w-[320px] opacity-100 translate-x-0 pointer-events-auto'
            : 'w-0 opacity-0 -translate-x-4 pointer-events-none'
        }`}
      >
        <div className="w-[280px] sm:w-[320px] h-[240px] rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative p-2 flex flex-col justify-center">
          
          <div className="px-4 pt-2 pb-1 border-b border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="text-aurora-neon font-semibold">LEVEL NAVIGATOR</span>
            <span className="text-zinc-500">Drag or Click</span>
          </div>

          <div className="flex-1 w-full relative">
            <OptionWheel
              items={LEVEL_ITEMS}
              defaultSelected={activeIndex}
              textColor="#71717a"
              activeColor="#ffffff"
              side="left"
              fontSize={1.25}
              spacing={1.6}
              curve={1.1}
              tilt={7}
              blur={1.8}
              fade={0.35}
              smoothing={160}
              inset={28}
              loop={false}
              draggable={true}
              onChange={handleWheelChange}
            />
          </div>

          <div className="px-4 py-1.5 border-t border-white/[0.08] text-[9px] font-mono text-zinc-400 flex items-center justify-between">
            <span>TuneBreach Engine</span>
            <span className="text-aurora-violet font-semibold">0{activeIndex + 1} / 03</span>
          </div>
        </div>
      </div>
    </div>
  );
}
