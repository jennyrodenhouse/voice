import { NormalizedVoiceParams, VisualParameters } from '../audio/types';

/**
 * Maps voice parameters to visual typography parameters
 */
export class VisualMapper {
  /**
   * Convert normalized voice parameters to visual parameters
   * SIMPLIFIED: Only uses rate of speech for letter spacing
   * All other parameters are constant for consistent letterforms
   */
  mapToVisual(voiceParams: NormalizedVoiceParams): VisualParameters {
    return {
      // Fixed ascender/descender length for consistent letterforms
      ascenderLength: 1.0,
      descenderLength: 1.0,

      // Fixed stroke weight for uniform line thickness
      strokeWeight: 2.5,

      // No baseline waviness - straight baseline
      baselineWaviness: 0,

      // Medium sharpness for balanced letterforms
      sharpness: 0.5,

      // ONLY VARIABLE: Rate affects letter spacing
      // Slow speech = wide spacing, fast speech = tight spacing
      letterSpacing: this.mapRateToSpacing(voiceParams.rateNorm),

      // No vibration effects
      vibrationFrequency: 0,
      vibrationAmplitude: 0
    };
  }

  /**
   * Map speech rate to letter spacing (0.3 to 4.0)
   * Wider range for more dramatic effect
   * ONLY VOICE PARAMETER USED
   */
  private mapRateToSpacing(rate: number): number {
    // Slow speech = wide spacing (4.0), fast speech = tight spacing (0.3)
    return 4.0 - rate * 3.7;
  }

  /**
   * Apply smoothing to visual parameters for less jittery animation
   */
  smoothParameters(
    current: VisualParameters,
    target: VisualParameters,
    smoothingFactor: number = 0.15
  ): VisualParameters {
    return {
      ascenderLength: this.lerp(current.ascenderLength, target.ascenderLength, smoothingFactor),
      descenderLength: this.lerp(current.descenderLength, target.descenderLength, smoothingFactor),
      strokeWeight: this.lerp(current.strokeWeight, target.strokeWeight, smoothingFactor),
      baselineWaviness: this.lerp(current.baselineWaviness, target.baselineWaviness, smoothingFactor),
      sharpness: this.lerp(current.sharpness, target.sharpness, smoothingFactor),
      letterSpacing: this.lerp(current.letterSpacing, target.letterSpacing, smoothingFactor),
      vibrationFrequency: this.lerp(current.vibrationFrequency, target.vibrationFrequency, smoothingFactor),
      vibrationAmplitude: this.lerp(current.vibrationAmplitude, target.vibrationAmplitude, smoothingFactor)
    };
  }

  /**
   * Linear interpolation
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}
