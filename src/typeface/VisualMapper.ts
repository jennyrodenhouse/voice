import { NormalizedVoiceParams, VisualParameters } from '../audio/types';

/**
 * Maps voice parameters to visual typography parameters
 */
export class VisualMapper {
  /**
   * Convert normalized voice parameters to visual parameters
   */
  mapToVisual(voiceParams: NormalizedVoiceParams): VisualParameters {
    return {
      // Pitch affects ascender/descender length
      // Low pitch = short ascenders/descenders, high pitch = long
      ascenderLength: this.mapPitchToAscender(voiceParams.pitchNorm),
      descenderLength: this.mapPitchToDescender(voiceParams.pitchNorm),

      // Volume affects stroke weight
      // Quiet = thin lines, loud = thick lines
      strokeWeight: this.mapVolumeToStrokeWeight(voiceParams.volumeNorm),

      // Articulation affects baseline waviness and letterform sharpness
      // Clear = straight baseline + sharp forms, slurred = wavy baseline + curved forms
      baselineWaviness: this.mapArticulationToWaviness(voiceParams.articulationNorm),
      sharpness: this.mapArticulationToSharpness(voiceParams.articulationNorm),

      // Rate affects letter spacing
      // Slow = wide spacing, fast = tight spacing
      letterSpacing: this.mapRateToSpacing(voiceParams.rateNorm),

      // Vibrato affects line vibration
      vibrationFrequency: this.mapVibratoToFrequency(voiceParams.vibratoNorm),
      vibrationAmplitude: this.mapVibratoToAmplitude(voiceParams.vibratoNorm)
    };
  }

  /**
   * Map pitch to ascender length (0.8 to 2.5)
   * More dramatic range for better visual variation
   */
  private mapPitchToAscender(pitch: number): number {
    // Apply curve for more sensitivity in mid-range
    const curved = Math.pow(pitch, 1.3);
    return 0.8 + curved * 1.7;
  }

  /**
   * Map pitch to descender length (0.8 to 2.5)
   * More dramatic range for better visual variation
   */
  private mapPitchToDescender(pitch: number): number {
    // Apply curve for more sensitivity in mid-range
    const curved = Math.pow(pitch, 1.3);
    return 0.8 + curved * 1.7;
  }

  /**
   * Map volume to stroke weight (0.5 to 25)
   * Wider range with better sensitivity at low volumes
   */
  private mapVolumeToStrokeWeight(volume: number): number {
    // Exponential curve for better sensitivity
    const curved = Math.pow(volume, 0.7);
    return 0.5 + curved * 24.5;
  }

  /**
   * Map articulation to baseline waviness (0 to 1)
   * More responsive in the middle range
   */
  private mapArticulationToWaviness(articulation: number): number {
    // Apply S-curve for better mid-range sensitivity
    const sCurve = 1 / (1 + Math.exp(-10 * (articulation - 0.5)));
    return 1 - sCurve;
  }

  /**
   * Map articulation to letterform sharpness (0 to 1)
   * More responsive in the middle range
   */
  private mapArticulationToSharpness(articulation: number): number {
    // Apply S-curve for better mid-range sensitivity
    return 1 / (1 + Math.exp(-10 * (articulation - 0.5)));
  }

  /**
   * Map speech rate to letter spacing (0.3 to 4.0)
   * Wider range for more dramatic effect
   */
  private mapRateToSpacing(rate: number): number {
    // Slow speech = wide spacing (4.0), fast speech = tight spacing (0.3)
    return 4.0 - rate * 3.7;
  }

  /**
   * Map vibrato to vibration frequency (0 to 15 Hz)
   * Increased range for more visible effect
   */
  private mapVibratoToFrequency(vibrato: number): number {
    // Quadratic curve for better control
    return vibrato * vibrato * 15;
  }

  /**
   * Map vibrato to vibration amplitude (0 to 8 pixels)
   * Increased amplitude for visibility
   */
  private mapVibratoToAmplitude(vibrato: number): number {
    // Quadratic curve for better control
    return vibrato * vibrato * 8;
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
