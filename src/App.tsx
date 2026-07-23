import React, { useState } from 'react';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { BcaGuide } from './components/BcaGuide';
import { SettingsModal } from './components/SettingsModal';
import { GameSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'code' | 'guide'>('game');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('highway_racer_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [settings, setSettings] = useState<GameSettings>({
    carColor: '#dc2626', // Ferrari Red
    weatherMode: 'auto',
    difficulty: 'medium',
    soundEnabled: true,
    soundVolume: 0.5,
    showFps: true,
    cameraZoom: true
  });

  const handleUpdateHighScore = (score: number) => {
    if (score > highScore) {
      setHighScore(score);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans antialiased relative overflow-x-hidden">
      
      {/* Background Glow Elements */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-10 left-10 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        highScore={highScore}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 px-2 sm:px-4 relative z-10 max-w-7xl mx-auto w-full">
        {activeTab === 'game' && (
          <GameCanvas
            settings={settings}
            onUpdateHighScore={handleUpdateHighScore}
          />
        )}

        {activeTab === 'code' && (
          <PythonCodeViewer />
        )}

        {activeTab === 'guide' && (
          <BcaGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950/60 backdrop-blur-xl py-4 text-center text-xs text-slate-400 font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>HIGHWAY RACER — Frosted Glass Edition</span>
          </span>
          <span className="text-slate-500">Python 3.12 + Pygame 2.5 Compatible | WebGL & Canvas Engine</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

    </div>
  );
}
