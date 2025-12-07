
import React, { useState, useRef, useCallback } from 'react';
import VideoFeed from './components/VideoFeed';
import LogPanel from './components/LogPanel';
import ControlBar from './components/ControlBar';
import { AppMode, LogEntry, ClientStatus } from './types';
import { LiveClient } from './services/liveClient';
import { Radio } from 'lucide-react';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.HEALTH);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [clientStatus, setClientStatus] = useState<ClientStatus>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<LiveClient | null>(null);

  const handleLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsActive(false);
    setClientStatus('idle');
    clientRef.current = null;
  }, []);

  const handleStatusChange = useCallback((status: ClientStatus) => {
    setClientStatus(status);
  }, []);

  const toggleActive = async () => {
    if (isActive) {
      // STOP
      if (clientRef.current) {
        clientRef.current.stop();
        clientRef.current = null;
      }
      setIsActive(false);
      setClientStatus('idle');
      handleLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        source: 'system',
        message: 'Monitoring session ended.',
        severity: 'info'
      });
    } else {
      // START
      if (!videoRef.current) {
        console.error("Video reference not ready");
        return;
      }

      try {
        const newClient = new LiveClient({
          mode,
          onLog: handleLog,
          onDisconnect: handleDisconnect,
          onStatusChange: handleStatusChange
        });
        clientRef.current = newClient;
        setIsActive(true);
        // Pass the video element directly to the client
        await newClient.start(videoRef.current, mode);
      } catch (error) {
        console.error("Failed to start:", error);
        setIsActive(false);
        setClientStatus('idle');
        clientRef.current = null;
        handleLog({
            id: Date.now().toString(),
            timestamp: new Date(),
            source: 'system',
            message: 'Failed to connect: ' + (error as Error).message,
            severity: 'danger'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none z-0" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Radio size={20} strokeWidth={3} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Sentient<span className="text-slate-400 font-light">Space</span>
          </h1>
        </div>
        <div className="text-[10px] font-mono text-emerald-400/80 border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
          Gemini 3 Pro Preview :: Online
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        
        {/* Left: Video Canvas */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center items-center relative overflow-hidden">
             
             {/* Grid & Vignette */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
             </div>
             <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/80 pointer-events-none" />

             <div className="w-full max-w-5xl aspect-video relative z-10">
               <VideoFeed ref={videoRef} isActive={isActive} status={clientStatus} mode={mode} />
             </div>
        </div>

        {/* Right: Logs */}
        <div className={`
          border-t lg:border-t-0 lg:border-l border-white/5 
          h-72 lg:h-auto lg:w-[420px] shrink-0
        `}>
          <LogPanel logs={logs} modeName={mode} />
        </div>

      </main>

      {/* Bottom Control Bar */}
      <ControlBar 
        isActive={isActive} 
        currentMode={mode} 
        onToggleActive={toggleActive}
        onModeChange={setMode}
      />
    </div>
  );
};

export default App;
