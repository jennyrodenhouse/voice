import { VoiceTypeface } from './typeface/VoiceTypeface';

/**
 * Main application entry point
 */
class App {
  private typeface: VoiceTypeface | null = null;
  private isRecording: boolean = false;

  // UI Elements
  private startBtn!: HTMLButtonElement;
  private clearBtn!: HTMLButtonElement;
  private status!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private transcriptEl!: HTMLElement;
  private pitchVal!: HTMLElement;
  private volumeVal!: HTMLElement;
  private articulationVal!: HTMLElement;
  private rateVal!: HTMLElement;
  private vibratoVal!: HTMLElement;

  constructor() {
    console.log('[App] Initializing application...');
    this.initializeUI();
    this.checkBrowserCompatibility();
    this.setupEventListeners();
    this.resizeCanvas();
    console.log('[App] Application initialized');
  }

  /**
   * Check browser compatibility
   */
  private checkBrowserCompatibility(): void {
    const issues: string[] = [];

    // Check for getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('• Microphone access not supported');
    }

    // Check for AudioContext
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      issues.push('• Web Audio API not supported');
    }

    // Check for Web Speech API (optional but recommended)
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[App] Web Speech API not supported - transcription will not work');
      this.transcriptEl.textContent = 'Speech recognition not available in this browser';
    }

    // Show compatibility issues if any
    if (issues.length > 0) {
      const message = 'Browser compatibility issues detected:\n\n' +
        issues.join('\n') +
        '\n\nPlease use Chrome, Edge, or Safari for the best experience.';

      this.updateStatus('Browser not fully supported', false);
      alert(message);
      this.startBtn.disabled = true;
    } else {
      console.log('[App] Browser compatibility check passed');
    }
  }

  /**
   * Initialize UI element references
   */
  private initializeUI(): void {
    this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    this.status = document.getElementById('status') as HTMLElement;
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.transcriptEl = document.getElementById('transcript') as HTMLElement;
    this.pitchVal = document.getElementById('pitch-val') as HTMLElement;
    this.volumeVal = document.getElementById('volume-val') as HTMLElement;
    this.articulationVal = document.getElementById('articulation-val') as HTMLElement;
    this.rateVal = document.getElementById('rate-val') as HTMLElement;
    this.vibratoVal = document.getElementById('vibrato-val') as HTMLElement;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.startBtn.addEventListener('click', () => this.toggleRecording());
    this.clearBtn.addEventListener('click', () => this.clearCanvas());
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Resize canvas to fill container
   */
  private resizeCanvas(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    }
  }

  /**
   * Toggle recording state
   */
  private async toggleRecording(): Promise<void> {
    console.log('[App] Toggle recording, current state:', this.isRecording);

    if (!this.isRecording) {
      await this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  /**
   * Start recording
   */
  private async startRecording(): Promise<void> {
    console.log('[App] Start recording called');

    try {
      this.updateStatus('Requesting microphone access...', false);
      console.log('[App] Status updated');

      // Initialize typeface
      if (!this.typeface) {
        console.log('[App] Creating VoiceTypeface instance...');
        this.typeface = new VoiceTypeface(this.canvas);

        // Setup callbacks
        this.typeface.setOnParametersUpdate((params) => {
          this.updateParameters(params);
        });

        this.typeface.setOnTranscriptUpdate((text) => {
          this.updateTranscript(text);
        });

        console.log('[App] VoiceTypeface instance created');
      }

      // Start recording
      console.log('[App] Calling typeface.start()...');
      await this.typeface.start();
      console.log('[App] typeface.start() completed');

      this.isRecording = true;
      this.startBtn.textContent = 'Stop Recording';
      this.startBtn.classList.add('recording');
      this.updateStatus('Recording... Speak to draw!', true);

      console.log('[App] Recording started successfully');

    } catch (error) {
      console.error('[App] Failed to start recording:', error);
      this.updateStatus('Error: Could not access microphone', false);

      // Show helpful error message
      if (error instanceof Error) {
        console.error('[App] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Microphone access denied. Please allow microphone access in your browser settings and try again.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          alert('Microphone is being used by another application. Please close other apps using the microphone and try again.');
        } else if (error.name === 'SecurityError') {
          alert('Cannot access microphone due to security restrictions. Make sure you are using HTTPS or localhost.');
        } else {
          alert(`Error: ${error.message}\n\nPlease check the browser console for more details.`);
        }
      }
    }
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    if (this.typeface) {
      this.typeface.stop();
    }

    this.isRecording = false;
    this.startBtn.textContent = 'Start Recording';
    this.startBtn.classList.remove('recording');
    this.updateStatus('Ready to record', false);
  }

  /**
   * Clear canvas
   */
  private clearCanvas(): void {
    if (this.typeface) {
      this.typeface.clear();
      this.updateTranscript('');
    }
  }

  /**
   * Update status message
   */
  private updateStatus(message: string, active: boolean): void {
    this.status.textContent = message;
    if (active) {
      this.status.classList.add('active');
    } else {
      this.status.classList.remove('active');
    }
  }

  /**
   * Update voice parameters display
   */
  private updateParameters(params: any): void {
    this.pitchVal.textContent = params.pitch + ' Hz';
    this.volumeVal.textContent = params.volume;
    this.articulationVal.textContent = params.articulation;
    this.rateVal.textContent = params.rate + ' /s';
    this.vibratoVal.textContent = params.vibrato;
  }

  /**
   * Update transcript display
   */
  private updateTranscript(text: string): void {
    this.transcriptEl.textContent = text || 'Speak to see transcript...';
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
