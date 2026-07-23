import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Zap, Sparkles, Gauge } from 'lucide-react';
import { CanvasEngine } from '../game/canvasEngine';
import { GameSettings, GameState } from '../types';
import { soundSynth } from '../game/audio';

interface GameCanvasProps {
  settings: GameSettings;
  onUpdateHighScore: (score: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ settings, onUpdateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [hudData, setHudData] = useState({
    speed: 0,
    health: 100,
    nitro: 100,
    score: 0,
    distance: 0,
    fps: 60,
    gear: '1',
    weather: 'sunny'
  });

  // Sync settings with canvas engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings(settings);
      soundSynth.setMuted(!settings.soundEnabled);
      soundSynth.setVolume(settings.soundVolume);
    }
  }, [settings]);

  // Canvas engine initialization
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new CanvasEngine(canvasRef.current, settings);
    engineRef.current = engine;
    engine.startLoop();

    // HUD sync interval
    const interval = setInterval(() => {
      setGameState(engine.state);
      setHudData({
        speed: Math.max(0, Math.round(engine.player.speed)),
        health: Math.max(0, Math.round(engine.player.health)),
        nitro: Math.max(0, Math.round(engine.player.nitroFuel)),
        score: Math.round(engine.score),
        distance: parseFloat(engine.distance.toFixed(1)),
        fps: engine.fps,
        gear: engine.player.gear,
        weather: engine.weather
      });
      if (engine.score > 0) {
        onUpdateHighScore(engine.highScore);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      soundSynth.stopEngine();
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.resetGame();
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      if (engineRef.current.state === 'playing') {
        engineRef.current.state = 'paused';
      } else if (engineRef.current.state === 'paused') {
        engineRef.current.state = 'playing';
      }
    }
  };

  // Virtual touch button handlers for touch/mobile
  const handleVirtualKey = (code: string, isPressed: boolean) => {
    window.dispatchEvent(
      new KeyboardEvent(isPressed ? 'keydown' : 'keyup', { code, bubbles: true })
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-2 sm:p-4">
      
      {/* Main Canvas Frame with Glass Border */}
      <div className="relative w-full aspect-[16/9] bg-slate-950/80 rounded-3xl overflow-hidden border border-white/20 shadow-[0_16px_50px_0_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover select-none"
        />

        {/* HUD Overlay in Playing State */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
            
            {/* Top Bar: Score, Distance & FPS */}
            <div className="flex items-start justify-between">
              
              {/* Score & Distance Badge */}
              <div className="bg-slate-950/50 backdrop-blur-2xl border border-white/15 px-4 py-2.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center space-x-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</div>
                  <div className="text-xl font-black text-amber-300 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(252,211,77,0.3)]">{hudData.score.toLocaleString()}</div>
                </div>
                <div className="h-7 w-px bg-white/15" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distance</div>
                  <div className="text-sm font-bold text-white font-mono">{hudData.distance} KM</div>
                </div>
              </div>

              {/* Top Right Stats & Pause */}
              <div className="flex items-center space-x-3 pointer-events-auto">
                <div className="bg-slate-950/50 backdrop-blur-2xl border border-white/15 px-3.5 py-1.5 rounded-2xl text-xs font-mono text-slate-300 shadow-md">
                  <span className="text-emerald-400 font-bold">{hudData.fps}</span> FPS | <span className="uppercase text-amber-300 font-semibold">{hudData.weather}</span>
                </div>
                
                <button
                  onClick={handleTogglePause}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-2xl border border-white/20 backdrop-blur-2xl shadow-lg transition-all active:scale-95"
                >
                  {gameState === 'paused' ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
                </button>
              </div>

            </div>

            {/* Bottom Dashboard: Speedometer & Gauge */}
            <div className="flex items-end justify-between">
              
              {/* Controls Quick Hint */}
              <div className="hidden sm:flex items-center space-x-2 bg-slate-950/50 backdrop-blur-2xl border border-white/15 px-3.5 py-2 rounded-2xl text-xs text-slate-300 font-mono shadow-md">
                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white border border-white/15 font-bold">W/A/S/D</span> Drive
                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white border border-white/15 font-bold">SHIFT</span> Nitro
                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white border border-white/15 font-bold">SPACE</span> Drift
              </div>

              {/* Instrument Cluster */}
              <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex items-center space-x-5 min-w-[290px]">
                
                {/* Speed Gauge */}
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tighter drop-shadow-md">{hudData.speed}</span>
                    <span className="text-[10px] font-bold text-red-400">KM/H</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider">GEAR: {hudData.gear}</span>
                </div>

                <div className="h-10 w-px bg-white/15" />

                {/* Health & Nitro Bars */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                      <span>ARMOR</span>
                      <span className={hudData.health < 30 ? 'text-red-400' : 'text-emerald-400'}>{hudData.health}%</span>
                    </div>
                    <div className="w-full bg-slate-900/80 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          hudData.health < 30 ? 'bg-red-500 shadow-red-500' : hudData.health < 60 ? 'bg-amber-500 shadow-amber-500' : 'bg-emerald-400 shadow-emerald-400'
                        }`}
                        style={{ width: `${hudData.health}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                      <span className="flex items-center space-x-1"><Zap className="w-3 h-3 text-cyan-400" /> <span>NITRO</span></span>
                      <span className="text-cyan-400 font-mono">{hudData.nitro}%</span>
                    </div>
                    <div className="w-full bg-slate-900/80 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                        style={{ width: `${hudData.nitro}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Start Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600/80 to-amber-500/80 p-0.5 flex items-center justify-center text-white mb-4 shadow-[0_0_30px_rgba(225,29,72,0.4)] border border-white/20 animate-pulse">
              <div className="w-full h-full bg-slate-950/50 rounded-[22px] flex items-center justify-center">
                <Zap className="w-8 h-8 text-amber-300 fill-amber-300/30" />
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-amber-300 tracking-tight mb-2">
              HIGHWAY RACER
            </h2>
            <p className="text-slate-300 text-sm max-w-md mb-6 font-medium">
              Realistic Python & HTML5 Highway Driving Engine with Physics, AI Traffic & Dynamic Weather
            </p>

            <button
              id="btn-start-race"
              onClick={handleStartGame}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-2xl shadow-[0_10px_35px_rgba(220,38,38,0.4)] border border-white/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              <span>START RACING [ENTER]</span>
            </button>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-xl text-xs text-slate-300 bg-white/5 backdrop-blur-2xl p-4 rounded-2xl border border-white/15 shadow-xl">
              <div><span className="font-bold text-white">W / UP</span> Accelerate</div>
              <div><span className="font-bold text-white">S / DOWN</span> Brake / Reverse</div>
              <div><span className="font-bold text-white">A / D</span> Steering</div>
              <div><span className="font-bold text-white">L-SHIFT</span> Nitro Boost</div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-black text-amber-300 mb-2 drop-shadow-md">GAME PAUSED</h3>
            <p className="text-slate-300 text-sm mb-6 font-medium">Press ESC or click below to resume racing</p>
            
            <div className="flex space-x-4">
              <button
                onClick={handleTogglePause}
                className="px-6 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg border border-white/20 backdrop-blur-md transition-all"
              >
                Resume Race
              </button>
              <button
                onClick={handleStartGame}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-slate-100 font-bold rounded-2xl border border-white/15 backdrop-blur-md transition-all"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-950/75 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-5xl mb-2 animate-bounce">💥</div>
            <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">VEHICLE TOTALED!</h2>
            <p className="text-red-200 text-sm mb-6 font-medium">You crashed into AI highway traffic</p>

            <div className="bg-slate-950/60 border border-white/20 rounded-2xl p-4 w-full max-w-sm mb-6 space-y-2 font-mono text-sm backdrop-blur-xl shadow-2xl">
              <div className="flex justify-between text-slate-300">
                <span>Final Score:</span>
                <span className="font-bold text-amber-300">{hudData.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance Driven:</span>
                <span className="font-bold text-white">{hudData.distance} KM</span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(220,38,38,0.5)] border border-white/20 transition-all transform hover:-translate-y-0.5"
            >
              <RotateCcw className="w-5 h-5" />
              <span>RETRY RACE [R]</span>
            </button>
          </div>
        )}

      </div>

      {/* Touch Screen Onscreen Controls for Mobile / Tablets */}
      <div className="w-full mt-4 grid grid-cols-2 sm:hidden gap-3 select-none">
        <div className="flex space-x-2">
          <button
            onMouseDown={() => handleVirtualKey('KeyA', true)}
            onMouseUp={() => handleVirtualKey('KeyA', false)}
            onTouchStart={() => handleVirtualKey('KeyA', true)}
            onTouchEnd={() => handleVirtualKey('KeyA', false)}
            className="flex-1 bg-white/10 border border-white/15 text-white font-bold py-4 rounded-2xl backdrop-blur-md active:bg-red-600 text-lg shadow-lg"
          >
            ◄
          </button>
          <button
            onMouseDown={() => handleVirtualKey('KeyD', true)}
            onMouseUp={() => handleVirtualKey('KeyD', false)}
            onTouchStart={() => handleVirtualKey('KeyD', true)}
            onTouchEnd={() => handleVirtualKey('KeyD', false)}
            className="flex-1 bg-white/10 border border-white/15 text-white font-bold py-4 rounded-2xl backdrop-blur-md active:bg-red-600 text-lg shadow-lg"
          >
            ►
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onMouseDown={() => handleVirtualKey('KeyW', true)}
            onMouseUp={() => handleVirtualKey('KeyW', false)}
            onTouchStart={() => handleVirtualKey('KeyW', true)}
            onTouchEnd={() => handleVirtualKey('KeyW', false)}
            className="flex-1 bg-emerald-600/80 border border-white/20 text-white font-bold py-4 rounded-2xl backdrop-blur-md active:bg-emerald-500 text-sm shadow-lg"
          >
            GAS
          </button>
          <button
            onMouseDown={() => handleVirtualKey('KeyS', true)}
            onMouseUp={() => handleVirtualKey('KeyS', false)}
            onTouchStart={() => handleVirtualKey('KeyS', true)}
            onTouchEnd={() => handleVirtualKey('KeyS', false)}
            className="flex-1 bg-red-600/80 border border-white/20 text-white font-bold py-4 rounded-2xl backdrop-blur-md active:bg-red-500 text-sm shadow-lg"
          >
            BRAKE
          </button>
          <button
            onMouseDown={() => handleVirtualKey('ShiftLeft', true)}
            onMouseUp={() => handleVirtualKey('ShiftLeft', false)}
            onTouchStart={() => handleVirtualKey('ShiftLeft', true)}
            onTouchEnd={() => handleVirtualKey('ShiftLeft', false)}
            className="px-4 bg-cyan-600/80 border border-white/20 text-white font-bold py-4 rounded-2xl backdrop-blur-md active:bg-cyan-500 text-xs shadow-lg"
          >
            NITRO
          </button>
        </div>
      </div>

    </div>
  );
};
