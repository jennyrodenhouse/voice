import paper from 'paper';
import { VoiceAnalyzer } from '../audio/VoiceAnalyzer';
import { VisualMapper } from './VisualMapper';
import { LetterGenerator } from './LetterGenerator';
import { SpeechRecognizer } from '../speech/SpeechRecognizer';
import { VisualParameters } from '../audio/types';

/**
 * Main typeface renderer that coordinates voice analysis,
 * speech recognition, and visual rendering
 */
export class VoiceTypeface {
  private canvas: HTMLCanvasElement;
  private audioContext: AudioContext | null = null;
  private voiceAnalyzer: VoiceAnalyzer | null = null;
  private visualMapper: VisualMapper;
  private letterGenerator: LetterGenerator;
  private speechRecognizer: SpeechRecognizer;

  private currentVisualParams: VisualParameters;
  private letters: Array<{ char: string; path: paper.Path | paper.CompoundPath; time: number }> = [];
  private currentX: number = 50;
  private currentY: number = 300;
  private lineHeight: number = 150;
  private animationId: number | null = null;

  // Callbacks
  private onParametersUpdate?: (params: any) => void;
  private onTranscriptUpdate?: (text: string) => void;

  constructor(canvas: HTMLCanvasElement) {
    console.log('[VoiceTypeface] Initializing...');
    this.canvas = canvas;

    // Initialize Paper.js
    paper.setup(canvas);

    // Initialize modules (but not audio context yet - needs user gesture)
    this.visualMapper = new VisualMapper();
    this.letterGenerator = new LetterGenerator();
    this.speechRecognizer = new SpeechRecognizer();

    // Default visual parameters
    this.currentVisualParams = {
      ascenderLength: 1.0,
      descenderLength: 1.0,
      strokeWeight: 2,
      baselineWaviness: 0,
      sharpness: 0.5,
      letterSpacing: 1.5,
      vibrationFrequency: 0,
      vibrationAmplitude: 0
    };

    this.setupSpeechRecognition();
    console.log('[VoiceTypeface] Initialized successfully');
  }

  /**
   * Start voice recording and rendering
   */
  async start(): Promise<void> {
    console.log('[VoiceTypeface] Starting...');

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }

      console.log('[VoiceTypeface] Requesting microphone access...');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('[VoiceTypeface] Microphone access granted');

      // Create audio context (must be done in user gesture)
      if (!this.audioContext) {
        console.log('[VoiceTypeface] Creating AudioContext...');
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        console.log('[VoiceTypeface] Resuming AudioContext...');
        await this.audioContext.resume();
      }

      console.log('[VoiceTypeface] AudioContext state:', this.audioContext.state);

      // Initialize voice analyzer
      if (!this.voiceAnalyzer) {
        console.log('[VoiceTypeface] Creating VoiceAnalyzer...');
        this.voiceAnalyzer = new VoiceAnalyzer(this.audioContext);
      }

      console.log('[VoiceTypeface] Initializing VoiceAnalyzer...');
      await this.voiceAnalyzer.initialize(stream);

      // Start speech recognition
      console.log('[VoiceTypeface] Starting speech recognition...');
      this.speechRecognizer.start();

      // Start animation loop
      console.log('[VoiceTypeface] Starting animation loop...');
      this.startAnimation();

      console.log('[VoiceTypeface] Started successfully!');

    } catch (error) {
      console.error('[VoiceTypeface] Error starting:', error);

      // Add more detailed error information
      if (error instanceof DOMException) {
        console.error('[VoiceTypeface] DOMException:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
      }

      throw error;
    }
  }

  /**
   * Stop recording and rendering
   */
  stop(): void {
    console.log('[VoiceTypeface] Stopping...');

    if (this.voiceAnalyzer) {
      this.voiceAnalyzer.destroy();
    }
    this.speechRecognizer.stop();

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    console.log('[VoiceTypeface] Stopped');
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    paper.project.activeLayer.removeChildren();
    this.letters = [];
    this.currentX = 50;
    this.currentY = 300;
    this.speechRecognizer.clearTranscript();
  }

  /**
   * Set callback for parameter updates
   */
  setOnParametersUpdate(callback: (params: any) => void): void {
    this.onParametersUpdate = callback;
  }

  /**
   * Set callback for transcript updates
   */
  setOnTranscriptUpdate(callback: (text: string) => void): void {
    this.onTranscriptUpdate = callback;
  }

  /**
   * Setup speech recognition callbacks
   */
  private setupSpeechRecognition(): void {
    this.speechRecognizer.onWord((word) => {
      // Add each character of the word
      for (const char of word) {
        this.addCharacter(char);
      }
      // Add space after word
      this.addCharacter(' ');
    });

    this.speechRecognizer.onTranscript((text, _isFinal) => {
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(text);
      }
    });
  }

  /**
   * Add a character to the canvas
   */
  private addCharacter(char: string): void {
    if (!this.voiceAnalyzer) {
      console.warn('[VoiceTypeface] Voice analyzer not initialized');
      return;
    }

    // Get current visual parameters
    const voiceParams = this.voiceAnalyzer.getVoiceParameters();
    const normalizedParams = this.voiceAnalyzer.normalizeParameters(voiceParams);
    const targetVisualParams = this.visualMapper.mapToVisual(normalizedParams);

    // Smooth transition
    this.currentVisualParams = this.visualMapper.smoothParameters(
      this.currentVisualParams,
      targetVisualParams,
      0.2
    );

    // Handle space
    if (char === ' ') {
      this.currentX += 100 * this.currentVisualParams.letterSpacing;
      this.checkLineWrap();
      return;
    }

    // Generate letter
    const position = new paper.Point(this.currentX, this.currentY);
    const letterPath = this.letterGenerator.generateLetter(
      char,
      this.currentVisualParams,
      position
    );

    // Store letter
    this.letters.push({
      char,
      path: letterPath,
      time: Date.now()
    });

    // Update position
    const letterWidth = letterPath.bounds.width;
    this.currentX += letterWidth + (50 * this.currentVisualParams.letterSpacing);

    // Check if we need to wrap to next line
    this.checkLineWrap();

    // Fade out old letters
    this.fadeOldLetters();
  }

  /**
   * Check if we need to wrap to the next line
   */
  private checkLineWrap(): void {
    if (this.currentX > this.canvas.width - 100) {
      this.currentX = 50;
      this.currentY += this.lineHeight;

      // If we've gone off the bottom, scroll up
      if (this.currentY > this.canvas.height - 100) {
        this.scrollUp();
      }
    }
  }

  /**
   * Scroll content up
   */
  private scrollUp(): void {
    const scrollAmount = this.lineHeight;
    this.currentY -= scrollAmount;

    // Move all existing letters up
    paper.project.activeLayer.children.forEach((child) => {
      child.position.y -= scrollAmount;
    });

    // Remove letters that are now off-screen
    this.letters = this.letters.filter((letter) => {
      if (letter.path.position.y < -100) {
        letter.path.remove();
        return false;
      }
      return true;
    });
  }

  /**
   * Fade out old letters to prevent canvas clutter
   */
  private fadeOldLetters(): void {
    const maxAge = 30000; // 30 seconds
    const fadeStartAge = 25000; // Start fading at 25 seconds
    const now = Date.now();

    this.letters = this.letters.filter((letter) => {
      const age = now - letter.time;

      if (age > maxAge) {
        letter.path.remove();
        return false;
      }

      if (age > fadeStartAge) {
        const fadeProgress = (age - fadeStartAge) / (maxAge - fadeStartAge);
        letter.path.opacity = 1 - fadeProgress;
      }

      return true;
    });
  }

  /**
   * Animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      if (!this.voiceAnalyzer) return;

      // Get current voice parameters
      const voiceParams = this.voiceAnalyzer.getVoiceParameters();
      const normalizedParams = this.voiceAnalyzer.normalizeParameters(voiceParams);

      // Update callback
      if (this.onParametersUpdate) {
        this.onParametersUpdate({
          pitch: voiceParams.pitch.toFixed(1),
          volume: (normalizedParams.volumeNorm * 100).toFixed(0) + '%',
          articulation: (normalizedParams.articulationNorm * 100).toFixed(0) + '%',
          rate: voiceParams.rate.toFixed(1),
          vibrato: (normalizedParams.vibratoNorm * 100).toFixed(0) + '%'
        });
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }
}
