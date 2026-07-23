import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, FileCode, CheckCircle, Sparkles } from 'lucide-react';
import { PYTHON_SOURCE_CODE } from '../pythonCode';

export const PythonCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_SOURCE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_SOURCE_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'main.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-2 sm:p-4">
      
      {/* Top Banner & Command Setup */}
      <div className="bg-slate-900/50 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
            <FileCode className="w-4 h-4" />
            <span>Single-File Python Pygame Executable</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">main.py - Highway Racer Source Code</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Complete, fully executable Python 3.12+ script implementing Pygame OOP mechanics, camera follow, realistic car physics, particle system, and dynamic weather.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-100 font-semibold rounded-2xl border border-white/15 backdrop-blur-md transition-all shadow-md active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(220,38,38,0.4)] border border-white/20 backdrop-blur-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download main.py</span>
          </button>
        </div>
      </div>

      {/* Terminal Command Quickstart */}
      <div className="bg-slate-950/60 border border-white/15 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-2 text-slate-400 font-sans font-bold text-xs uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Quick Execution Instructions for Local Desktop</span>
        </div>
        <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 flex items-center justify-between overflow-x-auto">
          <code className="text-amber-300 font-bold">pip install pygame && python main.py</code>
          <span className="text-slate-400 text-[10px] hidden sm:block">Requires Python 3.10+</span>
        </div>
      </div>

      {/* Code Editor Frame */}
      <div className="bg-slate-950/70 border border-white/15 rounded-3xl overflow-hidden shadow-[0_12px_40px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="bg-white/5 px-5 py-3.5 border-b border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block shadow-sm" />
            <span className="ml-2 font-bold text-slate-100">main.py (540 lines)</span>
          </div>
          <span className="text-slate-400">UTF-8 | Python 3.12</span>
        </div>

        <pre className="p-5 text-slate-200 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed max-h-[600px] bg-slate-950/40">
          <code>{PYTHON_SOURCE_CODE}</code>
        </pre>
      </div>

    </div>
  );
};
