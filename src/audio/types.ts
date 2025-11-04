/**
 * Voice parameters extracted from audio analysis
 */
export interface VoiceParameters {
  // Pitch in Hz - affects ascender/descender length
  pitch: number;

  // Volume/RMS - affects line thickness
  volume: number;

  // Articulation measure (spectral features) - affects baseline and letterform sharpness
  articulation: number;

  // Speech rate - affects letter spacing
  rate: number;

  // Vibrato amount - affects line vibration
  vibrato: number;

  // Timestamp
  timestamp: number;
}

/**
 * Smoothed and normalized voice parameters for rendering
 */
export interface NormalizedVoiceParams {
  // Normalized 0-1 values for easier mapping
  pitchNorm: number;      // 0 = low pitch, 1 = high pitch
  volumeNorm: number;     // 0 = quiet, 1 = loud
  articulationNorm: number; // 0 = smooth/slurred, 1 = sharp/enunciated
  rateNorm: number;       // 0 = slow, 1 = fast
  vibratoNorm: number;    // 0 = steady, 1 = vibrato
}

/**
 * Visual parameters derived from voice
 */
export interface VisualParameters {
  // Ascender length multiplier
  ascenderLength: number;

  // Descender length multiplier
  descenderLength: number;

  // Stroke thickness
  strokeWeight: number;

  // Baseline waviness (0 = straight, 1 = wavy)
  baselineWaviness: number;

  // Letterform sharpness (0 = curved, 1 = sharp)
  sharpness: number;

  // Letter spacing multiplier
  letterSpacing: number;

  // Line vibration frequency
  vibrationFrequency: number;

  // Line vibration amplitude
  vibrationAmplitude: number;
}

/**
 * Configuration for voice parameter ranges
 */
export interface VoiceParameterConfig {
  pitch: {
    min: number;  // Min expected pitch in Hz
    max: number;  // Max expected pitch in Hz
  };
  volume: {
    min: number;  // Min RMS value
    max: number;  // Max RMS value
  };
  articulation: {
    min: number;  // Min spectral centroid
    max: number;  // Max spectral centroid
  };
  rate: {
    windowSize: number;  // Window for measuring speech rate
  };
  vibrato: {
    detectionThreshold: number;
    frequencyRange: [number, number];
  };
}
