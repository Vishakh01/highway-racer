import React from 'react';
import { Play, Code, BookOpen, Settings, Trophy, Shield, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'game' | 'code' | 'guide';
  setActiveTab: (tab: 'game' | 'code' | 'guide') => void;
  onOpenSettings: () => void;
  highScore: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenSettings, highScore }) => {
  return (
    <header id="header-container" className="bg-slate-950/65 backdrop-blur-2xl border-b border-white/10 text-slate-100 sticky top-0 z-40 shadow-2xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600/90 to-amber-500/90 p-0.5 shadow-lg shadow-red-500/20 backdrop-blur-md">
            <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center text-amber-300">
              <Zap className="w-5 h-5 fill-amber-300/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                HIGHWAY RACER
              </h1>
              <span className="bg-white/10 backdrop-blur-md text-red-300 text-[11px] px-2.5 py-0.5 rounded-full border border-white/15 font-mono font-semibold">
                Pygame 2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">Single-File Python Engine & Web Canvas Emulator</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center bg-white/5 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-inner">
          <button
            id="tab-btn-game"
            onClick={() => setActiveTab('game')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'game'
                ? 'bg-red-600/90 text-white shadow-lg shadow-red-600/30 border border-red-400/30 backdrop-blur-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="hidden md:inline">Play Web Game</span>
          </button>

          <button
            id="tab-btn-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'code'
                ? 'bg-red-600/90 text-white shadow-lg shadow-red-600/30 border border-red-400/30 backdrop-blur-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Code className="w-4 h-4" />
            <span className="hidden md:inline">Python main.py</span>
          </button>

          <button
            id="tab-btn-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'guide'
                ? 'bg-red-600/90 text-white shadow-lg shadow-red-600/30 border border-red-400/30 backdrop-blur-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">BCA Guide</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-amber-300 font-mono shadow-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold">BEST: {Math.floor(highScore).toLocaleString()}</span>
          </div>

          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl backdrop-blur-md transition-all shadow-sm"
            title="Game Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
