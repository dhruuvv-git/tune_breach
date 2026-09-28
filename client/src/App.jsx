import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VerticalLevelBar from './components/VerticalLevelBar';
import HeroLevel from './sections/HeroLevel';
import PlatformLevel from './sections/PlatformLevel';
import CapabilitiesLevel from './sections/CapabilitiesLevel';
import InteractiveModal from './components/InteractiveModal';
import AuthView from './components/auth/AuthView';
import DashboardView from './components/dashboard/DashboardView';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [isDissolving, setIsDissolving] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Dhruv', email: 'dhruv@tunebreach.io' });

  // Landing page level state
  const [activeLevel, setActiveLevel] = useState('level-1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('tuner');

  // Cinematic dissolve transition between views
  const transitionTo = (nextView) => {
    setIsDissolving(true);
    setTimeout(() => {
      setCurrentView(nextView);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsDissolving(false);
    }, 450);
  };

  // Scroll to level on landing page
  const handleScrollToLevel = (levelId) => {
    const el = document.getElementById(levelId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveLevel(levelId);
    }
  };

  // Open interactive suite modal (e.g. from Platform/Capabilities levels)
  const handleOpenPlayground = (tab = 'tuner') => {
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  // Scroll spy for landing page
  useEffect(() => {
    if (currentView !== 'landing') return;

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
  }, [currentView]);

  return (
    <div className="relative min-h-screen bg-[#060408] text-white selection:bg-[#e100ff]/30 selection:text-white overflow-x-hidden">
      
      {/* VIEW 1: LANDING PAGE */}
      {currentView === 'landing' && (
        <>
          {/* Truly Fixed UI Chrome (Never disturbed by ancestor transforms) */}
          <Navbar 
            activeLevel={activeLevel}
            onSelectLevel={handleScrollToLevel}
          />

          <VerticalLevelBar 
            activeLevel={activeLevel}
            onSelectLevel={handleScrollToLevel}
          />

          {/* Landing Content Wrapper with Dissolve Effect */}
          <div 
            className={`transition-all duration-500 ease-in-out ${
              isDissolving ? 'opacity-0 blur-md pointer-events-none' : 'opacity-100 blur-0'
            }`}
          >
            <main className="relative">
              <HeroLevel 
                onScrollNext={() => handleScrollToLevel('level-2')}
                onGetStarted={() => transitionTo('auth')}
              />

              <PlatformLevel 
                onOpenPlayground={handleOpenPlayground}
                onScrollNext={() => handleScrollToLevel('level-3')}
              />

              <CapabilitiesLevel 
                onOpenPlayground={handleOpenPlayground}
              />
            </main>

            <InteractiveModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              initialTab={modalInitialTab}
            />
          </div>
        </>
      )}

      {/* VIEW 2: AUTH PAGE (Glass window with dual conveyor belts) */}
      {currentView === 'auth' && (
        <div 
          className={`transition-all duration-500 ease-in-out ${
            isDissolving ? 'opacity-0 blur-md pointer-events-none' : 'opacity-100 blur-0'
          }`}
        >
          <AuthView
            onAuthSuccess={(userData) => {
              setCurrentUser(userData);
              transitionTo('dashboard');
            }}
            onBackToLanding={() => transitionTo('landing')}
          />
        </div>
      )}

      {/* VIEW 3: DASHBOARD (shadcn b0 preset design) */}
      {currentView === 'dashboard' && (
        <div 
          className={`transition-all duration-500 ease-in-out ${
            isDissolving ? 'opacity-0 blur-md pointer-events-none' : 'opacity-100 blur-0'
          }`}
        >
          <DashboardView
            user={currentUser}
            onLogout={() => transitionTo('landing')}
          />
        </div>
      )}

    </div>
  );
}
