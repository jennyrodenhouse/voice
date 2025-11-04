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

  // Real-time drawing
  private realtimePath: paper.Path | null = null;
  private lastRealtimePoint: paper.Point | null = null;
  private frameCount: number = 0;

  // Zoom and pan
  private zoom: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private isPanning: boolean = false;
  private lastPanPoint: paper.Point | null = null;

  // Callbacks
  private onParametersUpdate?: (params: any) => void;
  private onTranscriptUpdate?: (text: string) => void;

  constructor(canvas: HTMLCanvasElement) {
    console.log('[VoiceTypeface] Initializing...');
    this.canvas = canvas;

    // Initialize Paper.js
    paper.setup(canvas);

    // Set up infinite canvas (no bounds clipping)
    paper.view.autoUpdate = false;

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
    this.setupInteractions();
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
   * Stop recording and rendering (pause but keep everything visible)
   */
  stop(): void {
    console.log('[VoiceTypeface] Stopping...');

    // Stop the animation loop (pauses real-time drawing)
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Finalize any in-progress real-time path
    if (this.realtimePath) {
      this.letters.push({
        char: '~',
        path: this.realtimePath,
        time: Date.now()
      });
      this.realtimePath = null;
      this.lastRealtimePoint = null;
    }

    // Stop speech recognition
    this.speechRecognizer.stop();

    // Stop audio analyzer
    if (this.voiceAnalyzer) {
      this.voiceAnalyzer.destroy();
    }

    // Note: We DON'T clear the canvas - everything stays visible!
    console.log('[VoiceTypeface] Stopped - all typography preserved');
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
    this.resetView();
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
   * Set up zoom and pan interactions
   */
  private setupInteractions(): void {
    // Mouse wheel for zoom
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));

      // Zoom towards mouse position
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      // Calculate the point in world coordinates before zoom
      const worldX = (mouseX - this.canvas.width / 2 - this.panX) / this.zoom;
      const worldY = (mouseY - this.canvas.height / 2 - this.panY) / this.zoom;

      // Update zoom
      this.zoom = newZoom;

      // Adjust pan to keep the mouse point fixed
      this.panX = mouseX - this.canvas.width / 2 - worldX * this.zoom;
      this.panY = mouseY - this.canvas.height / 2 - worldY * this.zoom;

      this.applyViewTransform();
    });

    // Mouse drag for panning
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      // Only pan with middle mouse or ctrl+left mouse
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault();
        this.isPanning = true;
        this.lastPanPoint = new paper.Point(e.offsetX, e.offsetY);
        this.canvas.style.cursor = 'grabbing';
      }
    });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isPanning && this.lastPanPoint) {
        const currentPoint = new paper.Point(e.offsetX, e.offsetY);
        const delta = currentPoint.subtract(this.lastPanPoint);

        this.panX += delta.x;
        this.panY += delta.y;

        this.lastPanPoint = currentPoint;
        this.applyViewTransform();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.lastPanPoint = null;
        this.canvas.style.cursor = 'default';
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.lastPanPoint = null;
        this.canvas.style.cursor = 'default';
      }
    });

    // Touch support for mobile
    let lastTouchDistance: number | null = null;

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.isPanning = true;
        this.lastPanPoint = new paper.Point(
          touch.clientX - rect.left,
          touch.clientY - rect.top
        );
      }
    });

    this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const zoomFactor = currentDistance / lastTouchDistance;
        this.zoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
        lastTouchDistance = currentDistance;

        this.applyViewTransform();
      } else if (e.touches.length === 1 && this.isPanning && this.lastPanPoint) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentPoint = new paper.Point(
          touch.clientX - rect.left,
          touch.clientY - rect.top
        );
        const delta = currentPoint.subtract(this.lastPanPoint);

        this.panX += delta.x;
        this.panY += delta.y;

        this.lastPanPoint = currentPoint;
        this.applyViewTransform();
      }
    });

    this.canvas.addEventListener('touchend', () => {
      this.isPanning = false;
      this.lastPanPoint = null;
      lastTouchDistance = null;
    });
  }

  /**
   * Apply zoom and pan transform to Paper.js view
   */
  private applyViewTransform(): void {
    paper.view.matrix.reset();
    paper.view.matrix.translate(
      this.canvas.width / 2 + this.panX,
      this.canvas.height / 2 + this.panY
    );
    paper.view.matrix.scale(this.zoom);
    paper.view.update();
  }

  /**
   * Reset zoom and pan to default
   */
  resetView(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyViewTransform();
  }

  /**
   * Zoom in
   */
  zoomIn(): void {
    this.zoom = Math.min(10, this.zoom * 1.2);
    this.applyViewTransform();
  }

  /**
   * Zoom out
   */
  zoomOut(): void {
    this.zoom = Math.max(0.1, this.zoom / 1.2);
    this.applyViewTransform();
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
   * Fade out old letters to prevent canvas clutter (disabled to preserve all work)
   */
  private fadeOldLetters(): void {
    // Disabled - we now keep all typography visible
    // Users can use Clear Canvas button if they want to start fresh
    return;

    /* Original fade-out code preserved but disabled:
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
    */
  }

  /**
   * Draw real-time strokes based on voice input
   */
  private drawRealtimeStroke(_voiceParams: any, normalizedParams: any): void {
    const targetVisualParams = this.visualMapper.mapToVisual(normalizedParams);

    // Smooth transition for visual params
    this.currentVisualParams = this.visualMapper.smoothParameters(
      this.currentVisualParams,
      targetVisualParams,
      0.3
    );

    // Only draw if there's significant volume (person is speaking)
    if (normalizedParams.volumeNorm > 0.05) {
      // Calculate position based on pitch and time
      const pitchOffset = (normalizedParams.pitchNorm - 0.5) * 100;
      const timeOffset = this.frameCount * this.currentVisualParams.letterSpacing;

      const x = this.currentX + timeOffset;
      const y = this.currentY + pitchOffset;
      const point = new paper.Point(x, y);

      // Start new path if needed
      if (!this.realtimePath || !this.lastRealtimePoint ||
          this.frameCount % 180 === 0) { // New path every 3 seconds at 60fps
        if (this.realtimePath) {
          this.letters.push({
            char: '~',
            path: this.realtimePath,
            time: Date.now()
          });
        }

        this.realtimePath = new paper.Path();
        this.realtimePath.strokeColor = new paper.Color('#ffffff');
        this.realtimePath.strokeCap = 'round';
        this.realtimePath.strokeJoin = 'round';
        this.realtimePath.add(point);
        this.lastRealtimePoint = point;
      } else {
        // Add point to current path with smoothing
        this.realtimePath.add(point);
        this.realtimePath.smooth({ type: 'continuous' });
      }

      // Update stroke weight in real-time
      this.realtimePath.strokeWidth = this.currentVisualParams.strokeWeight;

      // Apply waviness if articulation is low
      if (this.currentVisualParams.baselineWaviness > 0.2) {
        const segments = this.realtimePath.segments;
        if (segments.length > 1) {
          const lastSegment = segments[segments.length - 1];
          const wave = Math.sin(this.frameCount * 0.1) * this.currentVisualParams.baselineWaviness * 10;
          lastSegment.point.y += wave;
        }
      }

      this.lastRealtimePoint = point;
    } else {
      // No sound - finish current path
      if (this.realtimePath) {
        this.letters.push({
          char: '~',
          path: this.realtimePath,
          time: Date.now()
        });
        this.realtimePath = null;
        this.lastRealtimePoint = null;
      }
    }

    this.frameCount++;
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

      // Draw real-time strokes based on voice
      this.drawRealtimeStroke(voiceParams, normalizedParams);

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
