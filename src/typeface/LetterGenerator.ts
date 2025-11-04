import { VisualParameters } from '../audio/types';
import paper from 'paper';

/**
 * Generates letterform paths based on visual parameters
 */
export class LetterGenerator {
  private xHeight: number = 70; // x-height (height of lowercase letters like 'a', 'x')
  private time: number = 0;

  // Define which letters have ascenders and descenders
  private ascenders = new Set(['b', 'd', 'f', 'h', 'k', 'l', 't']);
  private descenders = new Set(['g', 'j', 'p', 'q', 'y']);

  /**
   * Generate a path for a character
   */
  generateLetter(
    char: string,
    visualParams: VisualParameters,
    position: paper.Point
  ): paper.Path | paper.CompoundPath {
    // Normalize character
    const letter = char.toLowerCase();

    // Get base letterform structure
    const letterPath = this.getBaseLetterform(letter, visualParams);

    if (!letterPath) {
      return this.createDefaultShape(position, visualParams);
    }

    // Apply visual transformations
    this.applyVisualParameters(letterPath, visualParams, position, letter);

    return letterPath;
  }

  /**
   * Get base letterform structure
   */
  private getBaseLetterform(
    char: string,
    visualParams: VisualParameters
  ): paper.Path | paper.CompoundPath | null {
    const xHeight = this.xHeight;
    const sharpness = visualParams.sharpness;

    // Create letterforms - simplified geometric approach
    // In a full implementation, you'd have complete alphabet
    switch (char) {
      case 'a':
        return this.createA(xHeight, sharpness);
      case 'b':
        return this.createB(xHeight, sharpness);
      case 'c':
        return this.createC(xHeight, sharpness);
      case 'd':
        return this.createD(xHeight, sharpness);
      case 'e':
        return this.createE(xHeight, sharpness);
      case 'f':
        return this.createF(xHeight, sharpness);
      case 'g':
        return this.createG(xHeight, sharpness);
      case 'h':
        return this.createH(xHeight, sharpness);
      case 'i':
        return this.createI(xHeight, sharpness);
      case 'j':
        return this.createJ(xHeight, sharpness);
      case 'k':
        return this.createK(xHeight, sharpness);
      case 'l':
        return this.createL(xHeight, sharpness);
      case 'm':
        return this.createM(xHeight, sharpness);
      case 'n':
        return this.createN(xHeight, sharpness);
      case 'o':
        return this.createO(xHeight, sharpness);
      case 'p':
        return this.createP(xHeight, sharpness);
      case 'q':
        return this.createQ(xHeight, sharpness);
      case 'r':
        return this.createR(xHeight, sharpness);
      case 's':
        return this.createS(xHeight, sharpness);
      case 't':
        return this.createT(xHeight, sharpness);
      case 'u':
        return this.createU(xHeight, sharpness);
      case 'v':
        return this.createV(xHeight, sharpness);
      case 'w':
        return this.createW(xHeight, sharpness);
      case 'x':
        return this.createX(xHeight, sharpness);
      case 'y':
        return this.createY(xHeight, sharpness);
      case 'z':
        return this.createZ(xHeight, sharpness);
      case ' ':
        return null; // Space has no visible form
      default:
        return this.createDefaultShape(new paper.Point(0, 0), { sharpness } as VisualParameters);
    }
  }

  /**
   * Apply visual parameters to the letterform
   */
  private applyVisualParameters(
    path: paper.Path | paper.CompoundPath,
    visualParams: VisualParameters,
    position: paper.Point,
    letter: string
  ): void {
    // Scale ascenders and descenders based on voice pitch
    const segments = path instanceof paper.CompoundPath ?
      path.children.flatMap((child: any) => (child as paper.Path).segments) :
      path.segments;

    // Apply different vertical scaling based on letter type
    if (this.ascenders.has(letter)) {
      // Scale ascenders - parts above x-height
      segments.forEach((segment: paper.Segment) => {
        if (segment.point.y < 0) { // Above baseline (ascender)
          segment.point.y *= visualParams.ascenderLength;
        }
      });
    }

    if (this.descenders.has(letter)) {
      // Scale descenders - parts below baseline
      segments.forEach((segment: paper.Segment) => {
        if (segment.point.y > this.xHeight) { // Below baseline (descender)
          const distanceFromBaseline = segment.point.y - this.xHeight;
          segment.point.y = this.xHeight + distanceFromBaseline * visualParams.descenderLength;
        }
      });
    }

    // Apply baseline waviness
    if (visualParams.baselineWaviness > 0.1) {
      this.applyBaselineWave(path, visualParams.baselineWaviness, position.x);
    }

    // Apply vibrato effect
    if (visualParams.vibrationAmplitude > 0.1) {
      this.applyVibrato(path, visualParams.vibrationFrequency, visualParams.vibrationAmplitude);
    }

    // Set stroke properties
    path.strokeColor = new paper.Color('#ffffff');
    path.strokeWidth = visualParams.strokeWeight;
    path.strokeCap = 'round';
    path.strokeJoin = 'round';

    // Position the letter
    path.position = position;
  }

  /**
   * Apply baseline wave effect
   */
  private applyBaselineWave(
    path: paper.Path | paper.CompoundPath,
    waviness: number,
    xOffset: number
  ): void {
    const waveAmplitude = waviness * 20;
    const waveFrequency = 0.01;

    const segments = path instanceof paper.CompoundPath ?
      path.children.flatMap((child: any) => (child as paper.Path).segments) :
      path.segments;

    segments.forEach((segment: paper.Segment) => {
      const wave = Math.sin((segment.point.x + xOffset) * waveFrequency) * waveAmplitude;
      segment.point.y += wave;
    });
  }

  /**
   * Apply vibrato effect to line
   */
  private applyVibrato(
    path: paper.Path | paper.CompoundPath,
    frequency: number,
    amplitude: number
  ): void {
    if (frequency < 0.1) return;

    const segments = path instanceof paper.CompoundPath ?
      path.children.flatMap((child: any) => (child as paper.Path).segments) :
      path.segments;

    segments.forEach((segment: paper.Segment, index: number) => {
      const vibrato = Math.sin(this.time * frequency + index * 0.5) * amplitude;
      segment.point.x += vibrato;
    });

    this.time += 0.1;
  }

  /**
   * Create letterform shapes
   * These are simplified geometric letterforms
   */

  private createA(xHeight: number, sharpness: number): paper.Path {
    const path = new paper.Path();
    const smooth = 1 - sharpness;

    path.add(new paper.Point(0, xHeight));
    path.add(new paper.Point(xHeight * 0.5, 0));
    path.add(new paper.Point(xHeight, xHeight));
    path.add(new paper.Point(xHeight * 0.75, xHeight));
    path.add(new paper.Point(xHeight * 0.6, xHeight * 0.6));
    path.add(new paper.Point(xHeight * 0.4, xHeight * 0.6));
    path.add(new paper.Point(xHeight * 0.25, xHeight));
    path.add(new paper.Point(0, xHeight));

    if (smooth > 0.3) path.smooth({ type: 'continuous', factor: smooth });
    return path;
  }

  private createB(xHeight: number, _sharpness: number): paper.CompoundPath {
    const compound = new paper.CompoundPath({ children: [] });

    // Stem
    const stem = new paper.Path.Rectangle({
      point: [0, 0],
      size: [xHeight * 0.15, xHeight * 1.5]
    });

    // Top bowl
    const topBowl = new paper.Path.Circle({
      center: [xHeight * 0.5, xHeight * 0.35],
      radius: xHeight * 0.35
    });

    // Bottom bowl
    const bottomBowl = new paper.Path.Circle({
      center: [xHeight * 0.5, xHeight * 0.85],
      radius: xHeight * 0.4
    });

    compound.addChild(stem);
    compound.addChild(topBowl);
    compound.addChild(bottomBowl);

    return compound;
  }

  private createC(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path.Arc({
      from: [xHeight * 0.8, xHeight * 0.1],
      through: [xHeight * 0.1, xHeight * 0.5],
      to: [xHeight * 0.8, xHeight * 0.9]
    });

    return path;
  }

  private createD(xHeight: number, _sharpness: number): paper.CompoundPath {
    const compound = new paper.CompoundPath({ children: [] });

    // Stem
    const stem = new paper.Path.Rectangle({
      point: [0, 0],
      size: [xHeight * 0.15, xHeight * 1.5]
    });

    // Bowl
    const bowl = new paper.Path.Circle({
      center: [xHeight * 0.45, xHeight * 0.5],
      radius: xHeight * 0.5
    });

    compound.addChild(stem);
    compound.addChild(bowl);

    return compound;
  }

  private createE(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();

    path.add(new paper.Point(xHeight, 0));
    path.add(new paper.Point(0, 0));
    path.add(new paper.Point(0, xHeight * 0.5));
    path.add(new paper.Point(xHeight * 0.7, xHeight * 0.5));
    path.add(new paper.Point(0, xHeight * 0.5));
    path.add(new paper.Point(0, xHeight));
    path.add(new paper.Point(xHeight, xHeight));

    return path;
  }

  private createO(xHeight: number, sharpness: number): paper.Path {
    if (sharpness > 0.7) {
      return new paper.Path.Rectangle({
        center: [xHeight * 0.5, xHeight * 0.5],
        size: [xHeight * 0.8, xHeight],
        radius: xHeight * 0.1
      });
    } else {
      return new paper.Path.Circle({
        center: [xHeight * 0.5, xHeight * 0.5],
        radius: xHeight * 0.5
      });
    }
  }

  // Simplified versions for other letters
  private createF(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, xHeight * 1.5], [0, 0], [xHeight * 0.8, 0], [0, 0], [0, xHeight * 0.5], [xHeight * 0.6, xHeight * 0.5]);
    return path;
  }

  private createG(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path.Circle({
      center: [xHeight * 0.5, xHeight * 0.5],
      radius: xHeight * 0.5
    });
    const line = new paper.Path.Line([xHeight * 0.5, xHeight * 0.5], [xHeight, xHeight * 0.5]);
    path.join(line);
    return path;
  }

  private createH(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, xHeight * 1.5], [0, 0], [0, xHeight * 0.5], [xHeight, xHeight * 0.5], [xHeight, 0], [xHeight, xHeight]);
    return path;
  }

  private createI(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path.Line([xHeight * 0.5, 0], [xHeight * 0.5, xHeight]);
    const dot = new paper.Path.Circle({ center: [xHeight * 0.5, -xHeight * 0.2], radius: xHeight * 0.1 });
    path.join(dot);
    return path;
  }

  private createJ(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([xHeight * 0.7, 0], [xHeight * 0.7, xHeight * 0.8]);
    path.arcTo([xHeight * 0.5, xHeight], [0, xHeight * 0.6]);
    return path;
  }

  private createK(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, xHeight * 1.5], [0, 0], [0, xHeight * 0.5], [xHeight, 0], [0, xHeight * 0.5], [xHeight, xHeight]);
    return path;
  }

  private createL(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, 0], [0, xHeight * 1.5], [xHeight * 0.7, xHeight * 1.5]] });
  }

  private createM(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, xHeight], [0, 0], [xHeight * 0.5, xHeight * 0.5], [xHeight, 0], [xHeight, xHeight]);
    return path;
  }

  private createN(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, xHeight], [0, 0], [xHeight, xHeight], [xHeight, 0]] });
  }

  private createP(xHeight: number, sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, xHeight], [0, 0], [xHeight * 0.6, 0], [xHeight * 0.6, xHeight * 0.5], [0, xHeight * 0.5]);
    if (1 - sharpness > 0.3) path.smooth();
    return path;
  }

  private createQ(xHeight: number, _sharpness: number): paper.Path {
    const circle = this.createO(xHeight, _sharpness);
    const tail = new paper.Path.Line([xHeight * 0.7, xHeight * 0.7], [xHeight, xHeight * 1.2]);
    circle.join(tail);
    return circle;
  }

  private createR(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, xHeight], [0, 0], [xHeight * 0.6, 0], [xHeight * 0.6, xHeight * 0.5], [0, xHeight * 0.5], [xHeight, xHeight]);
    return path;
  }

  private createS(xHeight: number, sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([xHeight, 0], [0, 0], [0, xHeight * 0.5], [xHeight, xHeight * 0.5], [xHeight, xHeight], [0, xHeight]);
    if (1 - sharpness > 0.3) path.smooth({ type: 'continuous', factor: 1 - sharpness });
    return path;
  }

  private createT(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, 0], [xHeight, 0], [xHeight * 0.5, 0], [xHeight * 0.5, xHeight * 1.2]] });
  }

  private createU(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, 0], [0, xHeight * 0.7]);
    path.arcTo([xHeight * 0.5, xHeight], [xHeight, xHeight * 0.7]);
    path.add([xHeight, 0]);
    return path;
  }

  private createV(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, 0], [xHeight * 0.5, xHeight], [xHeight, 0]] });
  }

  private createW(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, 0], [xHeight * 0.25, xHeight], [xHeight * 0.5, xHeight * 0.5], [xHeight * 0.75, xHeight], [xHeight, 0]] });
  }

  private createX(xHeight: number, _sharpness: number): paper.Path {
    const path = new paper.Path();
    path.add([0, 0], [xHeight, xHeight], [xHeight * 0.5, xHeight * 0.5], [0, xHeight], [xHeight, 0]);
    return path;
  }

  private createY(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, 0], [xHeight * 0.5, xHeight * 0.5], [xHeight, 0], [xHeight * 0.5, xHeight * 0.5], [xHeight * 0.5, xHeight * 1.2]] });
  }

  private createZ(xHeight: number, _sharpness: number): paper.Path {
    return new paper.Path({ segments: [[0, 0], [xHeight, 0], [0, xHeight], [xHeight, xHeight]] });
  }

  private createDefaultShape(position: paper.Point, visualParams: VisualParameters): paper.Path {
    return new paper.Path.Circle({
      center: position,
      radius: this.xHeight * 0.3,
      strokeColor: new paper.Color('#ffffff'),
      strokeWidth: visualParams.strokeWeight || 2
    });
  }
}
