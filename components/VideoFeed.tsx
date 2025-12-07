
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ClientStatus, AppMode } from '../types';
import { BrainCircuit, Loader2 } from 'lucide-react';

interface VideoFeedProps {
  isActive: boolean;
  status: ClientStatus;
  mode: AppMode; // Added mode prop for context-aware text
}

const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(({ isActive, status, mode }, ref) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => localVideoRef.current as HTMLVideoElement);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false 
        });
        currentStream = mediaStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
          localVideoRef.current.play().catch(e => console.error("Auto-play prevented:", e));
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getThinkingText = () => {
      switch (mode) {
          case AppMode.HEALTH: return "ANALYZING GAIT & BIOMETRICS...";
          case AppMode.SCIENCE: return "SCANNING CHEMICAL LABELS...";
          case AppMode.BUSINESS: return "EVALUATING SENTIMENT...";
          default: return "VERIFYING THREAT LEVEL...";
      }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group">
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      <div className="absolute top-4 left-4 flex gap-2 z-10">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg transition-all duration-300">
             <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-300 ${isActive ? 'bg-red-500 animate-pulse text-red-500' : 'bg-slate-500 text-slate-500'}`} />
             <span className="text-xs font-mono font-semibold text-white/90 uppercase tracking-widest shadow-black drop-shadow-sm">
               {isActive ? 'Live Feed' : 'Standby'}
             </span>
         </div>
      </div>

      {/* Thinking Mode Overlay */}
      {status === 'thinking' && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-40 animate-pulse rounded-full"></div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/50 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
               <BrainCircuit className="text-purple-400 animate-pulse" size={20} />
               <span className="text-sm font-bold text-purple-100 tracking-wide">
                 NEURAL REASONING
               </span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-purple-300 font-mono bg-black/50 px-2 py-0.5 rounded">
            {getThinkingText()}
          </div>
        </div>
      )}
      
      {status === 'processing' && (
        <div className="absolute top-4 right-4 z-20">
             <div className="p-2 bg-slate-900/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                <Loader2 className="text-cyan-400 animate-spin" size={16} />
             </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
      </div>
    </div>
  );
});

export default VideoFeed;
