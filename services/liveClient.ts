
import { GoogleGenAI } from '@google/genai';
import { AppMode, LogEntry, AnalysisResult, LiveConfig, ClientStatus } from '../types';
import { calculateDecibels, encodeWAV, arrayBufferToBase64 } from './audioUtils';
import { sendAlert, logIncident } from './mockTools';

export class LiveClient {
  private ai: GoogleGenAI;
  private onLog: (entry: LogEntry) => void;
  private onDisconnect: () => void;
  private onStatusChange: (status: ClientStatus) => void;
  
  private videoElement: HTMLVideoElement | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioBuffer: Float32Array[] = []; // Rolling buffer
  private isRunning: boolean = false;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private isProcessingRequest: boolean = false;
  
  private requestCount: number = 0;
  private readonly MAX_REQUESTS = 200;

  constructor(config: LiveConfig) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onLog = config.onLog;
    this.onDisconnect = config.onDisconnect;
    this.onStatusChange = config.onStatusChange;

    this.setupSimulator();
  }

  async start(videoElement: HTMLVideoElement, mode: AppMode) {
    this.videoElement = videoElement;
    this.isRunning = true;
    this.requestCount = 0;
    this.onStatusChange('idle');

    try {
      // 1. Setup Audio
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use ScriptProcessor for raw access to audio data (bufferSize 4096 = ~0.25s at 16k)
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isRunning) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Clone the data
        this.audioBuffer.push(new Float32Array(inputData));
        
        // Keep only last ~2.5 seconds (approx 10 buffers of 4096 at 16k)
        if (this.audioBuffer.length > 10) {
          this.audioBuffer.shift();
        }
      };

      this.log('system', `Monitoring started in ${mode} mode.`, 'safe');

      // 2. Start Loop
      this.processingInterval = setInterval(() => this.processInterval(mode), 2000);

    } catch (err) {
      this.log('system', 'Error accessing media devices.', 'danger');
      console.error(err);
      this.onDisconnect();
    }
  }

  private async processInterval(mode: AppMode) {
    if (this.isProcessingRequest || !this.isRunning) return;
    
    // [UNIT] Quota Logic: Check if requestsToday >= 200
    if (this.requestCount >= this.MAX_REQUESTS) {
      this.log('system', 'Daily request quota (200) reached. Monitoring paused.', 'danger');
      this.stop();
      this.onDisconnect();
      return;
    }

    this.isProcessingRequest = true;

    try {
      // 1. Capture Frame
      const frameBase64 = this.captureFrame();
      
      // 2. Process Audio (VAD)
      const audioData = this.flattenAudioBuffer();
      const db = calculateDecibels(audioData);
      const isLoud = db > -40; // VAD threshold
      
      let audioBlob: globalThis.Blob | null = null;

      if (isLoud) {
        // Encode as WAV if sound is detected
        audioBlob = encodeWAV(audioData);
      }

      // 3. Send to Gemini (With Thinking Logic)
      await this.sendToGeminiWithThinking(frameBase64, audioBlob, mode);

    } catch (e) {
      console.error("Processing error", e);
    } finally {
      this.isProcessingRequest = false;
      this.onStatusChange('idle');
    }
  }

  private captureFrame(): string {
    if (!this.videoElement) throw new Error("Video element not found");
    
    const canvas = document.createElement('canvas');
    // Downscale to 320px width (maintain aspect ratio)
    const scale = 320 / this.videoElement.videoWidth;
    canvas.width = 320;
    canvas.height = this.videoElement.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    
    // Return base64 without prefix for helper, but API might need handled differently
    return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
  }

  private flattenAudioBuffer(): Float32Array {
    const length = this.audioBuffer.reduce((acc, b) => acc + b.length, 0);
    const result = new Float32Array(length);
    let offset = 0;
    for (const buf of this.audioBuffer) {
      result.set(buf, offset);
      offset += buf.length;
    }
    return result;
  }

  /**
   * [UNIT] Wrapper for Thinking Mode logic
   * Implements the 2-step verification pipeline.
   */
  private async sendToGeminiWithThinking(frameBase64: string, audioBlob: globalThis.Blob | null, mode: AppMode) {
    this.onStatusChange('processing');

    // [STEP A] Fast Pass (Standard)
    // Call sendToGemini(..., {thinking_mode:false})
    const result1 = await this.sendToGeminiRaw(frameBase64, audioBlob, mode, false);
    if (!result1) return;

    let finalResult = result1;

    // [STEP B] Thinking Pass Check
    // Logic: If resp.confidence >= 0.80 and resp.status !== 'safe', call with thinking_mode:true
    // Note: We use risk_level !== 'safe' as proxy for status !== 'safe'
    const conf = Number(finalResult.confidence);
    
    if (conf >= 0.8 && finalResult.risk_level !== 'safe') {
       this.log('system', 'High confidence threat detected. Escalating to deep thinking analysis...', 'warning');
       this.onStatusChange('thinking');
       
       // [STEP B.2] Deep Thinking Call
       const result2 = await this.sendToGeminiRaw(frameBase64, audioBlob, mode, true);
       if (result2) {
         finalResult = result2;
       }
    }

    // [STEP C] Logging & Tools
    // Log the FINAL decision to the event log
    this.log('ai', finalResult, finalResult.risk_level, frameBase64);

    // [STEP D] Tool Execution (Mock)
    // Only call tools if final risk is 'danger' (equivalent to 'high' in requirements)
    if (finalResult.risk_level === 'danger') {
       // Mock alert
       sendAlert('911', `[SentientSpace] DANGER DETECTED: ${finalResult.reason}`);
       // Log incident
       logIncident({
         timestamp: new Date().toISOString(),
         mode,
         analysis: finalResult
       });
    }
  }

  private async sendToGeminiRaw(
    frameBase64: string, 
    audioBlob: globalThis.Blob | null, 
    mode: AppMode, 
    thinkingMode: boolean
  ): Promise<AnalysisResult | null> {
    this.requestCount++;
    
    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: frameBase64
        }
      }
    ];

    if (audioBlob) {
      const audioBase64 = arrayBufferToBase64(await audioBlob.arrayBuffer());
      parts.push({
        inlineData: {
          mimeType: 'audio/wav',
          data: audioBase64
        }
      });
    }

    // [STRATEGY] Specific Personas & Privacy Rules
    const personaConfig = this.getPersonaPrompt(mode);
    const privacyRule = "PRIVACY RULE: Data Minimalism is active. Do not describe facial features or identity (e.g., 'Subject A', not 'The blond man'). Describe actions and safety states only.";
    
    let prompt = `${personaConfig}
    ${privacyRule}
    Return JSON with:
    - status
    - risk_level (safe, warning, danger)
    - reason
    - suggestion
    - confidence (0.0-1.0)
    - audio_response (text for TTS)
    - reasoning_trace (array of strings showing step-by-step logic)`;
    
    if (thinkingMode) {
      // [UNIT] Thinking Mode Prompt Injection
      prompt += " CRITICAL: You are in Deep Thinking Mode. Perform a step-by-step reasoning check before concluding. If danger is confirmed, be extremely precise.";
      console.log("[Thinking Mode] Injecting rigorous prompt override.");
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            ...parts,
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (text) {
        try {
          return JSON.parse(text) as AnalysisResult;
        } catch (e) {
          if (!thinkingMode) { 
             this.log('ai', `Raw Output (Parse Error): ${text}`, 'info');
          }
          return null;
        }
      }
      return null;
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (!thinkingMode) {
           this.log('system', "API Error: " + (error as Error).message, 'danger');
        }
        return null;
    }
  }

  private getPersonaPrompt(mode: AppMode): string {
      switch (mode) {
          case AppMode.HEALTH:
              return "You are 'NeuroSync', an advanced medical safety agent monitoring 'Alex', a user with mobility challenges. Prioritize fall detection, gait analysis, and pain distress signals in voice. Tone: Empathetic, calm, authoritative in emergencies.";
          case AppMode.SCIENCE:
              return "You are 'ChemGuard', an AI lab partner monitoring 'Sarah', a chemistry student. Prioritize PPE compliance (goggles), chemical reaction safety, and hazard identification. Tone: Educational but firm on safety violations.";
          case AppMode.BUSINESS:
              return "You are 'BizVibe', a communication coach helping 'Marcus' during a high-stakes sales call. Prioritize engagement detection, sentiment analysis, and objection handling suggestions. Tone: Professional, concise, strategic.";
          default:
              return "Analyze safety and user status.";
      }
  }

  public stop() {
    this.isRunning = false;
    this.onStatusChange('idle');
    if (this.processingInterval) clearInterval(this.processingInterval);
    
    if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
    }
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
    }
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
    this.videoElement = null;
    this.audioBuffer = [];
  }

  private log(source: 'user' | 'system' | 'ai', message: string | AnalysisResult, severity: 'safe' | 'warning' | 'danger' | 'info' = 'info', thumbnail?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      source,
      message,
      severity,
      thumbnail
    };
    this.onLog(entry);
  }

  /**
   * Simulator Tools exposed to window.sentientSimulate
   */
  private setupSimulator() {
    window.sentientSimulate = {
      safe: () => this.simulateResponse('safe'),
      warn: () => this.simulateResponse('warning'),
      danger: () => this.simulateResponse('danger'),
      quota: () => {
        this.requestCount = this.MAX_REQUESTS;
        console.log("Simulator: Quota maxed out. Next request should fail.");
      }
    };
    console.log("%c[SIMULATOR] Tools Ready. Use window.sentientSimulate.{safe|warn|danger|quota}()", "color: cyan");
  }

  private simulateResponse(level: 'safe' | 'warning' | 'danger') {
      const mockResult: AnalysisResult = {
          status: level.toUpperCase(),
          risk_level: level,
          reason: `Simulated ${level} event for testing purposes.`,
          suggestion: "Verify system response.",
          confidence: level === 'danger' ? 0.95 : level === 'warning' ? 0.75 : 0.99,
          audio_response: level === 'danger' ? "Warning. Danger detected. Please intervene immediately." : undefined,
          reasoning_trace: [
              "Visual: Motion detected in vertical axis.",
              "Audio: Amplitude spike > -20dB detected.",
              "Context: Subject posture matches 'fall' profile.",
              "Conclusion: High probability of safety incident."
          ]
      };
      
      console.log(`[SIMULATOR] Injecting ${level} response...`);
      
      // Inject directly into the flow
      if (level === 'danger') {
          // Simulate thinking escalation manually
          this.log('system', 'High confidence threat detected. Escalating to deep thinking analysis...', 'warning');
          this.onStatusChange('thinking');
          setTimeout(() => {
              this.log('ai', mockResult, level, 'PLACEHOLDER_BASE64');
              if (mockResult.risk_level === 'danger') {
                  sendAlert('911', `[SentientSpace] DANGER DETECTED: ${mockResult.reason}`);
                  logIncident({ timestamp: new Date().toISOString(), mode: 'SIMULATOR', analysis: mockResult });
              }
              this.onStatusChange('idle');
          }, 1500);
      } else {
          this.onStatusChange('processing');
          setTimeout(() => {
              this.log('ai', mockResult, level);
              this.onStatusChange('idle');
          }, 800);
      }
  }
}
