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
    this.initializeUI();
    this.setupEventListeners();
    this.resizeCanvas();
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
    try {
      this.updateStatus('Requesting microphone access...', false);

      // Initialize typeface
      if (!this.typeface) {
        this.typeface = new VoiceTypeface(this.canvas);

        // Setup callbacks
        this.typeface.setOnParametersUpdate((params) => {
          this.updateParameters(params);
        });

        this.typeface.setOnTranscriptUpdate((text) => {
          this.updateTranscript(text);
        });
      }

      // Start recording
      await this.typeface.start();

      this.isRecording = true;
      this.startBtn.textContent = 'Stop Recording';
      this.startBtn.classList.add('recording');
      this.updateStatus('Recording... Speak to draw!', true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.updateStatus('Error: Could not access microphone', false);

      // Show helpful error message
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`Error: ${error.message}`);
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
