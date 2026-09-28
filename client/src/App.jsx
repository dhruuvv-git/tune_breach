import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VerticalLevelBar from './components/VerticalLevelBar';
import HeroLevel from './sections/HeroLevel';
import PlatformLevel from './sections/PlatformLevel';
import CapabilitiesLevel from './sections/CapabilitiesLevel';
import InteractiveModal from './components/InteractiveModal';

export default function App() {
  const [activeLevel, setActiveLevel] = useState('level-1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('tuner');

  // Handle smooth scroll to a specific level
  const handleScrollToLevel = (levelId) => {
    const el = document.getElementById(levelId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveLevel(levelId);
    }
  };

  // Open interactive suite modal on specific feature
  const handleOpenPlayground = (tab = 'tuner') => {
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  // Scroll spy to update activeLevel dynamically as the user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const level1 = document.getElementById('level-1');
      const level2 = document.getElementById('level-2');
      const level3 = document.getElementById('level-3');

      const scrollPos = window.scrollY + window.innerHeight * 0.4;

      if (level3 && scrollPos >= level3.offsetTop) {
        setActiveLevel('level-3');
      } else if (level2 && scrollPos >= level2.offsetTop) {
        setActiveLevel('level-2');
      } else if (level1) {
        setActiveLevel('level-1');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#060408] text-white selection:bg-[#e100ff]/30 selection:text-white">
      {/* Top Navigation */}
      <Navbar 
        onOpenPlayground={handleOpenPlayground}
        activeLevel={activeLevel}
        onSelectLevel={handleScrollToLevel}
      />

      {/* Left-Side Vertical Level Indicator */}
      <VerticalLevelBar 
        activeLevel={activeLevel}
        onSelectLevel={handleScrollToLevel}
      />

      {/* Main Page Levels */}
      <main className="relative">
        {/* LEVEL 1: SoftAurora + Minimalist TuneBreach Reveal */}
        <HeroLevel 
          onScrollNext={() => handleScrollToLevel('level-2')}
          onOpenPlayground={handleOpenPlayground}
        />

        {/* LEVEL 2: Left Content + Right Instrument Masonry */}
        <PlatformLevel 
          onOpenPlayground={handleOpenPlayground}
          onScrollNext={() => handleScrollToLevel('level-3')}
        />

        {/* LEVEL 3: ChromaGrid with 4 Core Features */}
        <CapabilitiesLevel 
          onOpenPlayground={handleOpenPlayground}
        />
      </main>

      {/* Interactive Suite Modal */}
      <InteractiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalInitialTab}
      />
    </div>
  );
}
