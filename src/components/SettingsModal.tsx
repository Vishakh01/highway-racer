import React from 'react';
import { X, Volume2, VolumeX, CloudRain, Sun, CloudFog, Moon, Sparkles } from 'lucide-react';
import { GameSettings, WeatherType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const colors = [
    { name: 'Ferrari Red', value: '#dc2626' },
    { name: 'Cobalt Blue', value: '#2563eb' },
    { name: 'Cyber Yellow', value: '#eab308' },
    { name: 'Emerald Green', value: '#16a34a' },
    { name: 'Phantom Black', value: '#18181b' },
    { name: 'Alpine White', value: '#f8fafc' }
  ];

  const weatherOptions: Array<{ id: 'auto' | WeatherType; label: string; icon: React.ReactNode }> = [
    { id: 'auto', label: 'Dynamic Auto', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { id: 'sunny', label: 'Sunny Day', icon: <Sun className="w-4 h-4 text-yellow-400" /> },
    { id: 'rain', label: 'Rainy Road', icon: <CloudRain className="w-4 h-4 text-sky-400" /> },
    { id: 'fog', label: 'Dense Fog', icon: <CloudFog className="w-4 h-4 text-slate-300" /> },
    { id: 'night', label: 'Night Drive', icon: <Moon className="w-4 h-4 text-indigo-400" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xl flex items-center justify-center p-4">
      <div id="settings-modal" className="bg-slate-900/60 border border-white/20 rounded-3xl w-full max-w-md p-6 shadow-[0_20px_60px_0_rgba(0,0,0,0.7)] backdrop-blur-2xl text-slate-100 relative">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>⚙️ Game Customizer & Audio</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 py-4">
          
          {/* Car Body Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">Sports Car Paint Finish</label>
            <div className="grid grid-cols-3 gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onUpdateSettings({ ...settings, carColor: c.value })}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all backdrop-blur-md ${
                    settings.carColor === c.value
                      ? 'border-red-400/80 bg-red-500/20 text-white shadow-md shadow-red-500/20'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: c.value }} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Environmental Weather */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">Weather Condition</label>
            <div className="grid grid-cols-2 gap-2">
              {weatherOptions.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onUpdateSettings({ ...settings, weatherMode: w.id })}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all backdrop-blur-md ${
                    settings.weatherMode === w.id
                      ? 'border-red-400/80 bg-red-500/20 text-white shadow-md shadow-red-500/20'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {w.icon}
                  <span>{w.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Synthesizer */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200 flex items-center space-x-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Engine & FX Synthesizer</span>
              </span>
              <button
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all backdrop-blur-md ${
                  settings.soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {settings.soundEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                  <span>Engine Rev Volume</span>
                  <span className="font-mono text-slate-400">{Math.round(settings.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => onUpdateSettings({ ...settings, soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-red-500 bg-slate-950/60 rounded-lg h-2 cursor-pointer"
                />
              </div>
            )}
          </div>

        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-sm font-bold rounded-2xl shadow-lg border border-white/20 transition-all backdrop-blur-md"
          >
            Save & Apply
          </button>
        </div>

      </div>
    </div>
  );
};
