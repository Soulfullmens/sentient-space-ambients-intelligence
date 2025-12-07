
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Shield, ShieldAlert, ShieldCheck, Activity, BrainCircuit, ChevronDown, ChevronRight } from 'lucide-react';

interface ExplainCardProps {
  data: AnalysisResult;
  thumbnail?: string;
}

const ExplainCard: React.FC<ExplainCardProps> = ({ data, thumbnail }) => {
  const [showTrace, setShowTrace] = useState(false);
  const isSafe = data.risk_level === 'safe';
  const isDanger = data.risk_level === 'danger';
  
  const borderColor = isSafe ? 'border-emerald-500/30' : isDanger ? 'border-red-500/50' : 'border-amber-500/50';
  const bgColor = isSafe ? 'bg-emerald-950/30' : isDanger ? 'bg-red-950/30' : 'bg-amber-950/30';
  const textColor = isSafe ? 'text-emerald-100' : isDanger ? 'text-red-100' : 'text-amber-100';

  return (
    <div className={`mt-2 rounded-lg border ${borderColor} ${bgColor} overflow-hidden font-sans`}>
      {/* Header */}
      <div className={`px-3 py-2 flex items-center justify-between border-b ${borderColor} bg-black/20`}>
        <div className="flex items-center gap-2">
          {isSafe ? <ShieldCheck size={16} className="text-emerald-400" /> : 
           isDanger ? <ShieldAlert size={16} className="text-red-400" /> : 
           <Shield size={16} className="text-amber-400" />}
          <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
            {data.status}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono opacity-70">
          <BrainCircuit size={12} />
          <span>CONF: {(data.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="p-3 flex gap-3">
        {/* Optional Thumbnail */}
        {thumbnail && (
          <div className="shrink-0 w-16 h-16 rounded border border-white/10 overflow-hidden bg-black">
            <img src={`data:image/jpeg;base64,${thumbnail}`} alt="Analysis frame" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium opacity-90 leading-relaxed mb-2">
            {data.reason}
          </p>
          
          {data.suggestion && (
            <div className="flex items-start gap-2 text-[11px] bg-black/20 p-2 rounded">
              <Activity size={12} className="mt-0.5 text-blue-400 shrink-0" />
              <span className="opacity-80 italic">{data.suggestion}</span>
            </div>
          )}
        </div>
      </div>

      {/* XAI Reasoning Trace */}
      {data.reasoning_trace && data.reasoning_trace.length > 0 && (
         <div className="border-t border-white/5 bg-black/10">
            <button 
              onClick={() => setShowTrace(!showTrace)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1">
                 <BrainCircuit size={10} />
                 <span>Neural Trace</span>
              </div>
              {showTrace ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            
            {showTrace && (
              <div className="px-3 pb-3 space-y-1">
                {data.reasoning_trace.map((step, idx) => (
                  <div key={idx} className="flex gap-2 text-[10px] font-mono text-slate-400 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <span className="text-slate-600 shrink-0">[{idx + 1}]</span>
                    <span className="leading-tight">{step}</span>
                  </div>
                ))}
              </div>
            )}
         </div>
      )}
    </div>
  );
};

export default ExplainCard;
