import Meyda, { MeydaFeaturesObject } from 'meyda';
import { VoiceParameters, VoiceParameterConfig, NormalizedVoiceParams } from './types';

/**
 * Analyzes voice input and extracts parameters in real-time
 */
export class VoiceAnalyzer {
  private audioContext: AudioContext;
  private analyzer: any;
  private pitchHistory: number[] = [];
  private volumeHistory: number[] = [];
  private energyHistory: number[] = [];
  private lastSoundTime: number = 0;
  private rateWindow: number[] = [];

  private config: VoiceParameterConfig = {
    pitch: { min: 80, max: 400 },      // Hz range for human speech
    volume: { min: 0.001, max: 0.3 },  // RMS range
    articulation: { min: 500, max: 3000 }, // Spectral centroid range
    rate: { windowSize: 10 },           // Window for rate calculation
    vibrato: {
      detectionThreshold: 0.1,
      frequencyRange: [4, 8]            // Typical vibrato range in Hz
    }
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Initialize the analyzer with an audio source
   */
  async initialize(stream: MediaStream): Promise<void> {
    const source = this.audioContext.createMediaStreamSource(stream);

    this.analyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: source,
      bufferSize: 512,
      featureExtractors: [
        'rms',              // Volume
        'zcr',              // Zero crossing rate (sharpness)
        'spectralCentroid', // Brightness/articulation
        'energy'            // Overall energy
      ],
      callback: null // We'll use .get() instead for more control
    });

    this.analyzer.start();
  }

  /**
   * Get current voice parameters
   */
  getVoiceParameters(): VoiceParameters {
    if (!this.analyzer) {
      return this.getDefaultParameters();
    }

    const features: MeydaFeaturesObject | null = this.analyzer.get([
      'rms',
      'zcr',
      'spectralCentroid',
      'energy'
    ]);

    // Meyda can return null when there's not enough audio data
    if (!features) {
      return this.getDefaultParameters();
    }

    const pitch = this.estimatePitch(features);
    const volume = features.rms || 0;
    const articulation = features.spectralCentroid || 0;
    const rate = this.calculateRate(features.energy || 0);
    const vibrato = this.detectVibrato();

    // Update histories
    this.updateHistories(pitch, volume, features.energy || 0);

    return {
      pitch,
      volume,
      articulation,
      rate,
      vibrato,
      timestamp: Date.now()
    };
  }

  /**
   * Normalize voice parameters to 0-1 range
   */
  normalizeParameters(params: VoiceParameters): NormalizedVoiceParams {
    return {
      pitchNorm: this.normalize(params.pitch, this.config.pitch.min, this.config.pitch.max),
      volumeNorm: this.normalize(params.volume, this.config.volume.min, this.config.volume.max),
      articulationNorm: this.normalize(params.articulation, this.config.articulation.min, this.config.articulation.max),
      rateNorm: this.normalize(params.rate, 0, 10),
      vibratoNorm: this.normalize(params.vibrato, 0, 1)
    };
  }

  /**
   * Estimate pitch using autocorrelation
   * This is a simplified approach - using spectral centroid as a proxy
   */
  private estimatePitch(features: MeydaFeaturesObject | null): number {
    // For a more accurate pitch, we'd use autocorrelation or YIN algorithm
    // Here we use spectral centroid as a rough estimate
    // In production, you might want to use a dedicated pitch detection library

    if (!features || features.spectralCentroid === null || features.spectralCentroid === undefined) {
      return 150; // Default pitch
    }

    const centroid = features.spectralCentroid;

    // Map spectral centroid to approximate pitch
    // This is a rough heuristic - actual pitch detection is more complex
    const estimatedPitch = Math.max(
      this.config.pitch.min,
      Math.min(centroid * 0.15, this.config.pitch.max)
    );

    return this.smoothPitch(estimatedPitch);
  }

  /**
   * Calculate speech rate based on energy peaks
   */
  private calculateRate(energy: number): number {
    const now = Date.now();

    // Detect sound onset (energy spike)
    if (energy > 0.01 && now - this.lastSoundTime > 50) {
      this.rateWindow.push(now);
      if (this.rateWindow.length > this.config.rate.windowSize) {
        this.rateWindow.shift();
      }
      this.lastSoundTime = now;
    }

    // Calculate rate from time between sounds
    if (this.rateWindow.length < 2) return 5; // Default medium rate

    const timeDiffs: number[] = [];
    for (let i = 1; i < this.rateWindow.length; i++) {
      timeDiffs.push(this.rateWindow[i] - this.rateWindow[i - 1]);
    }

    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const rate = 1000 / avgDiff; // Sounds per second

    return Math.max(0, Math.min(10, rate)); // Clamp to 0-10
  }

  /**
   * Detect vibrato by analyzing pitch variation
   */
  private detectVibrato(): number {
    if (this.pitchHistory.length < 20) return 0;

    const recent = this.pitchHistory.slice(-20);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);

    // Normalize vibrato to 0-1
    return Math.min(1, stdDev / 20);
  }

  /**
   * Smooth pitch values to reduce jitter
   */
  private smoothPitch(pitch: number): number {
    const historyLength = 5;
    this.pitchHistory.push(pitch);
    if (this.pitchHistory.length > historyLength) {
      this.pitchHistory.shift();
    }

    return this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
  }

  /**
   * Update historical data
   */
  private updateHistories(_pitch: number, volume: number, energy: number): void {
    const maxHistory = 50;

    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > maxHistory) this.volumeHistory.shift();

    this.energyHistory.push(energy);
    if (this.energyHistory.length > maxHistory) this.energyHistory.shift();
  }

  /**
   * Normalize value to 0-1 range
   */
  private normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * Get default parameters when no audio is available
   */
  private getDefaultParameters(): VoiceParameters {
    return {
      pitch: 150,
      volume: 0,
      articulation: 1000,
      rate: 5,
      vibrato: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.analyzer) {
      this.analyzer.stop();
    }
  }
}
