import React from 'react';
import { BookOpen, Cpu, Layers, ShieldCheck, Zap, Code2, Sparkles } from 'lucide-react';

export const BcaGuide: React.FC = () => {
  const oopClasses = [
    {
      name: 'Game',
      role: 'Master Engine & Event Loop',
      description: 'Initializes Pygame display surface (1280x720), mixer audio, clock timer, state machine (menu, playing, paused, gameover), collision dispatcher, and score saver.'
    },
    {
      name: 'PlayerCar',
      role: 'Player Vehicle Dynamics',
      description: 'Calculates acceleration, drag/rolling friction, handbrake drift, steering sensitivity scale based on speed, wheel rotation, and visual roll angle.'
    },
    {
      name: 'TrafficCar',
      role: 'AI Highway Vehicles',
      description: 'Spawns Sedan, SUV, Truck, and Bus variants across 4 lanes. Moves based on relative speed compared to player speed to simulate endless highway motion.'
    },
    {
      name: 'Road',
      role: 'Endless Highway & Parallax Scenery',
      description: 'Animates road scrolling, dashed lane dividers, curbing shoulders, and roadside trees with looping Y-coordinates.'
    },
    {
      name: 'Camera',
      role: 'Smooth Camera Follow & FX',
      description: 'Features target camera interpolation (lag), collision shake decay algorithm, and speed-based zoom scaling.'
    },
    {
      name: 'Weather',
      role: 'Environmental Shader & Effects',
      description: 'Handles Rain drop physics with road reflections, Fog atmospheric overlays, and Night mode headlight ray cone masking.'
    },
    {
      name: 'ParticleSystem',
      role: 'Particle Physics Engine',
      description: 'Object-pooled system generating tire smoke, crash sparks, debris, and exhaust flames with alpha fading and life counters.'
    },
    {
      name: 'HUD',
      role: 'Heads-Up Display',
      description: 'Renders digital Speedometer (KM/H), Health bar, Nitro tank, Score, Distance, and FPS metrics.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-2 sm:p-4 text-slate-100">
      
      {/* Title Hero */}
      <div className="bg-slate-900/50 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-2xl">
        <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>BCA & Computer Science Educational Guide</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Pygame Architecture & Physics Breakdown</h2>
        <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed font-medium">
          Learn how clean Object-Oriented Programming (OOP) design principles, frame-rate independent physics with Delta Time (<code className="text-amber-300 font-mono">dt</code>), and procedural graphics power 60 FPS 2D game development in Python.
        </p>
      </div>

      {/* Core Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Concept 1: Delta Time */}
        <div className="bg-slate-900/50 border border-white/15 rounded-3xl p-6 space-y-3 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">1. Frame-Rate Independence (Delta Time)</h3>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Games must run at the same physical speed whether rendering on a 60Hz or 144Hz screen. Delta time (<code className="text-amber-300 font-mono">dt</code>) measures the elapsed time in seconds between consecutive frames:
          </p>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/10 font-mono text-xs text-amber-300 shadow-inner">
            dt = clock.tick(60) / 1000.0<br/>
            position += velocity * dt
          </div>
        </div>

        {/* Concept 2: Collision Box Math */}
        <div className="bg-slate-900/50 border border-white/15 rounded-3xl p-6 space-y-3 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">2. AABB Collision Box Detection</h3>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Vehicles use slightly inset Axis-Aligned Bounding Boxes (AABB) to allow close near-miss passes without false collisions:
          </p>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/10 font-mono text-xs text-cyan-300 shadow-inner">
            player_rect = pygame.Rect(x + 4, y + 4, width - 8, height - 8)<br/>
            if player_rect.colliderect(traffic_rect): ...
          </div>
        </div>

      </div>

      {/* Class Breakdown List */}
      <div className="bg-slate-900/50 border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-xl text-white">Object-Oriented Class Hierarchy</h3>
          </div>
          <span className="text-xs font-mono text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">8 Modular Classes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {oopClasses.map((item) => (
            <div key={item.name} className="bg-white/5 border border-white/10 hover:border-white/20 p-4 rounded-2xl space-y-2 transition-all backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-red-400 text-sm">{item.name}</span>
                <span className="text-[10px] uppercase font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">{item.role}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
