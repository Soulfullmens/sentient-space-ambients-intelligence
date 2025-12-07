
export enum AppMode {
  HEALTH = 'HEALTH',
  SCIENCE = 'SCIENCE',
  BUSINESS = 'BUSINESS'
}

export type ClientStatus = 'idle' | 'processing' | 'thinking';

export interface AnalysisResult {
  status: string;
  risk_level: 'safe' | 'warning' | 'danger';
  reason: string;
  suggestion: string;
  confidence: number;
  audio_response?: string;
  reasoning_trace?: string[]; // New XAI field
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: 'user' | 'system' | 'ai';
  message: string | AnalysisResult;
  severity?: 'safe' | 'warning' | 'danger' | 'info';
  thumbnail?: string;
}

export interface LiveConfig {
  mode: AppMode;
  onLog: (entry: LogEntry) => void;
  onDisconnect: () => void;
  onStatusChange: (status: ClientStatus) => void;
}

declare global {
  interface Window {
    sentientSimulate: {
      safe: () => void;
      warn: () => void;
      danger: () => void;
      quota: () => void;
    };
  }
}
