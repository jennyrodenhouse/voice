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
   * Map pitch to ascender length (0.5 to 2.0)
   */
  private mapPitchToAscender(pitch: number): number {
    // Higher pitch = longer ascenders
    return 0.5 + pitch * 1.5;
  }

  /**
   * Map pitch to descender length (0.5 to 2.0)
   */
  private mapPitchToDescender(pitch: number): number {
    // Higher pitch = longer descenders
    return 0.5 + pitch * 1.5;
  }

  /**
   * Map volume to stroke weight (1 to 20)
   */
  private mapVolumeToStrokeWeight(volume: number): number {
    // Quiet = very thin (1px), loud = very thick (20px)
    return 1 + volume * 19;
  }

  /**
   * Map articulation to baseline waviness (0 to 1)
   */
  private mapArticulationToWaviness(articulation: number): number {
    // High articulation = straight (0), low articulation = wavy (1)
    return 1 - articulation;
  }

  /**
   * Map articulation to letterform sharpness (0 to 1)
   */
  private mapArticulationToSharpness(articulation: number): number {
    // High articulation = sharp (1), low articulation = curved (0)
    return articulation;
  }

  /**
   * Map speech rate to letter spacing (0.5 to 3.0)
   */
  private mapRateToSpacing(rate: number): number {
    // Slow speech = wide spacing (3.0), fast speech = tight spacing (0.5)
    return 3.0 - rate * 2.5;
  }

  /**
   * Map vibrato to vibration frequency (0 to 10 Hz)
   */
  private mapVibratoToFrequency(vibrato: number): number {
    // More vibrato = higher frequency oscillation
    return vibrato * 10;
  }

  /**
   * Map vibrato to vibration amplitude (0 to 5 pixels)
   */
  private mapVibratoToAmplitude(vibrato: number): number {
    // More vibrato = larger amplitude
    return vibrato * 5;
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
