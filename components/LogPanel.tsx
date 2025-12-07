
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, AnalysisResult } from '../types';
import ExplainCard from './ExplainCard';
import { Terminal, AlertCircle, AlertTriangle, CheckCircle, Info, Volume2, Square, Play } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
  modeName: string;
}

const TTSPlayer: React.FC<{ text: string }> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Stop any previous speech when new text arrives
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.volume = volume;
    u.rate = 1.0;
    
    u.onstart = () => setIsPlaying(true);
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);

    return () => {
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleReplay = () => {
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.volume = volume;
      u.onstart = () => setIsPlaying(true);
      u.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="mt-2 p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button 
            onClick={handleStop}
            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors border border-red-500/20"
            title="Stop TTS"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
           <button 
            onClick={handleReplay}
            className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded transition-colors border border-emerald-500/20"
            title="Replay"
          >
            <Play size={14} fill="currentColor" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex justify-between text-[10px] text-slate-400 font-mono uppercase">
          <span>Voice Output</span>
          <span className={isPlaying ? 'text-emerald-400' : ''}>{isPlaying ? 'Speaking...' : 'Idle'}</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
           {isPlaying && <div className="h-full bg-emerald-500 w-1/2 animate-pulse rounded-full"></div>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-20">
        <Volume2 size={12} className="text-slate-500" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={volume} 
          onChange={handleVolumeChange}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
};

const LogPanel: React.FC<LogPanelProps> = ({ logs, modeName }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getSeverityConfig = (severity: string = 'info') => {
    switch (severity) {
      case 'danger':
        return {
          icon: AlertCircle,
          container: 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]',
          text: 'text-red-200',
          badge: 'text-red-400',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          container: 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(217,119,6,0.1)]',
          text: 'text-amber-200',
          badge: 'text-amber-400',
          iconColor: 'text-amber-500'
        };
      case 'safe':
        return {
          icon: CheckCircle,
          container: 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20', 
          text: 'text-emerald-200/70',
          badge: 'text-emerald-500/70',
          iconColor: 'text-emerald-500/60'
        };
      case 'info':
      default:
        return {
          icon: Info,
          container: 'bg-slate-800/40 border-slate-700/50',
          text: 'text-slate-400',
          badge: 'text-slate-500',
          iconColor: 'text-slate-600'
        };
    }
  };

  const renderMessage = (entry: LogEntry) => {
    if (typeof entry.message === 'string') {
      return entry.message;
    }

    const analysis = entry.message as AnalysisResult;
    const isSafe = analysis.risk_level === 'safe';

    if (isSafe) {
      return (
        <div className="flex flex-col gap-0.5">
          <div className="font-medium text-emerald-300/90 text-sm">Status: Normal</div>
          <div className="text-[11px] opacity-60 leading-tight">{analysis.reason}</div>
        </div>
      );
    }

    return (
      <div className="w-full">
         <ExplainCard data={analysis} thumbnail={entry.thumbnail} />
         {analysis.audio_response && <TTSPlayer text={analysis.audio_response} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl border-l border-white/5 w-full lg:w-96 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0 z-10 backdrop-blur-sm">
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <Terminal size={14} className="text-emerald-500" />
          Live Intelligence
        </h2>
        <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-0.5 rounded bg-slate-900/50">
          {modeName}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm custom-scrollbar scroll-smooth relative">
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4 opacity-50">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border border-slate-800 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1 h-1 bg-slate-500 rounded-full" />
              </div>
            </div>
            <p className="text-xs font-medium uppercase tracking-widest">Awaiting Data Stream</p>
          </div>
        )}
        
        {logs.map((log) => {
          const style = getSeverityConfig(log.severity);
          const Icon = style.icon;
          
          return (
            <div 
              key={log.id} 
              className={`
                flex flex-col gap-1 p-3 rounded-lg border backdrop-blur-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4
                ${style.container}
                ${log.source === 'system' ? 'opacity-60 hover:opacity-100' : 'opacity-100'}
              `}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs">
                   <span className="text-slate-500 font-mono text-[10px]">
                     {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </span>
                   <span className={`uppercase font-bold text-[9px] tracking-wider px-1.5 py-0.5 rounded-sm bg-black/20 ${style.badge}`}>
                     {log.source}
                   </span>
                </div>
                <Icon size={14} className={style.iconColor} />
              </div>
              
              <div className={`leading-snug text-sm ${style.text}`}>
                {renderMessage(log)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogPanel;
