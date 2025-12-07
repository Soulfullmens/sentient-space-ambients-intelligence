
import React from 'react';
import { AppMode } from '../types';
import { Activity, FlaskConical, Briefcase, Play, Square, Settings2 } from 'lucide-react';

interface ControlBarProps {
  isActive: boolean;
  currentMode: AppMode;
  onToggleActive: () => void;
  onModeChange: (mode: AppMode) => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ 
  isActive, 
  currentMode, 
  onToggleActive, 
  onModeChange 
}) => {
  
  const modes = [
    { id: AppMode.HEALTH, label: 'Health', icon: Activity, color: 'text-emerald-400', activeColor: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' },
    { id: AppMode.SCIENCE, label: 'Science', icon: FlaskConical, color: 'text-purple-400', activeColor: 'bg-purple-500/20 text-purple-100 border-purple-500/30' },
    { id: AppMode.BUSINESS, label: 'Business', icon: Briefcase, color: 'text-blue-400', activeColor: 'bg-blue-500/20 text-blue-100 border-blue-500/30' },
  ];

  return (
    <div className="bg-slate-950/80 backdrop-blur-xl border-t border-white/5 p-4 lg:p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
      
      {/* Mode Selectors */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner">
        {modes.map((m) => {
          const Icon = m.icon;
          const isSelected = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => !isActive && onModeChange(m.id)}
              disabled={isActive}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 border border-transparent
                ${isSelected ? `${m.activeColor} shadow-sm border-white/5` : 'hover:bg-white/5 text-slate-500'}
                ${isActive && !isSelected ? 'opacity-30 grayscale cursor-not-allowed' : ''}
              `}
            >
              <Icon size={18} className={isSelected ? 'animate-pulse-slow' : ''} />
              <span className={`font-medium text-sm ${isSelected ? 'font-bold' : ''}`}>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Action Button */}
      <button
        onClick={onToggleActive}
        className={`
          flex items-center gap-3 px-8 py-3.5 rounded-full font-bold uppercase tracking-wider transition-all duration-300 shadow-xl backdrop-blur-sm border
          ${isActive 
            ? 'bg-red-500/10 text-red-500 border-red-500/40 hover:bg-red-500/20 hover:border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
            : 'bg-emerald-500/90 text-slate-950 border-emerald-400 hover:bg-emerald-400 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'}
        `}
      >
        {isActive ? (
          <>
            <Square size={20} fill="currentColor" />
            Stop Monitoring
          </>
        ) : (
          <>
            <Play size={20} fill="currentColor" />
            Start Monitoring
          </>
        )}
      </button>

      {/* Status Indicators */}
      <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2 bg-slate-900/30 px-3 py-1.5 rounded-full border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${isActive ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-600 text-slate-600'}`} />
          API CONNECTION
        </div>
        <div className="flex items-center gap-2 opacity-60">
          <Settings2 size={14} />
          v1.0.4
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
