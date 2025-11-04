# Voice Vector Typeface

A real-time generative typeface system that transforms voice characteristics into dynamic vector letterforms. Speak into your microphone and watch as your voice's pitch, volume, articulation, rate, and vibrato are translated into unique typographic forms.

🎤 **[Live Demo](https://jennyrodenhouse.github.io/voice/)** (Coming soon - deploying...)

## Features

### Voice-to-Visual Mappings

- **Pitch → Ascender/Descender Length**: Higher pitch creates longer ascenders and descenders
- **Volume → Stroke Thickness**: Louder voice creates thicker strokes, quieter voice creates thinner strokes
- **Articulation → Baseline & Sharpness**:
  - Clear enunciation produces straight baselines and sharp letterforms
  - Less articulation creates wavy baselines and curved letterforms
- **Speech Rate → Letter Spacing**: Slower speech increases spacing, faster speech tightens it
- **Vibrato → Line Vibration**: More vibrato creates more line oscillation

### Real-Time Processing

- Live audio analysis using Web Audio API and Meyda.js
- Speech-to-text conversion using Web Speech API
- Smooth parameter interpolation for fluid animation
- Vector rendering with Paper.js

## Technology Stack

- **TypeScript**: Type-safe development
- **Vite**: Fast development and build tool
- **Web Audio API**: Real-time audio processing
- **Meyda.js**: Advanced audio feature extraction
- **Web Speech API**: Speech recognition
- **Paper.js**: Vector graphics manipulation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser (Chrome, Edge, or Safari recommended for best Web Audio support)
- A microphone

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. Open the application in your browser
2. Click "Start Recording" and allow microphone access
3. Speak clearly to see your voice rendered as typography
4. Experiment with different vocal qualities:
   - Vary your pitch (high/low)
   - Speak loudly and quietly
   - Enunciate clearly vs. mumble
   - Speak slowly and quickly
   - Add vibrato to your voice

## Project Structure

```
voice/
├── src/
│   ├── audio/
│   │   ├── VoiceAnalyzer.ts      # Extracts voice parameters from audio
│   │   └── types.ts              # Type definitions
│   ├── speech/
│   │   └── SpeechRecognizer.ts   # Speech-to-text conversion
│   ├── typeface/
│   │   ├── LetterGenerator.ts    # Generates vector letterforms
│   │   ├── VisualMapper.ts       # Maps voice params to visual params
│   │   └── VoiceTypeface.ts      # Main coordinator class
│   └── main.ts                   # Application entry point
├── index.html                    # HTML template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts               # Vite configuration
```

## How It Works

### 1. Audio Analysis

The `VoiceAnalyzer` class uses Meyda.js to extract audio features:
- **RMS**: Root mean square for volume detection
- **Spectral Centroid**: Brightness/articulation measurement
- **Zero-Crossing Rate**: Sharpness indicator
- **Energy**: Overall sound energy for rate calculation

### 2. Voice Parameter Extraction

Raw audio features are processed into meaningful voice parameters:
- Pitch estimation from spectral analysis
- Volume from RMS values
- Articulation from spectral centroid
- Rate from energy onset detection
- Vibrato from pitch variation analysis

### 3. Visual Mapping

The `VisualMapper` translates voice parameters to visual attributes:
- Normalized voice values (0-1) are mapped to visual ranges
- Smooth interpolation prevents jittery animation
- Parameters are continuously updated in real-time

### 4. Letterform Generation

The `LetterGenerator` creates vector paths for each character:
- Base letterforms are geometrically constructed
- Sharpness parameter controls curve vs. angular forms
- Baseline waviness is applied
- Vibrato effect adds oscillation

### 5. Real-Time Rendering

Paper.js renders the final output:
- Each spoken word triggers letterform generation
- Letters fade out over time to prevent clutter
- Canvas auto-scrolls when reaching the bottom

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari**: Full support with user gesture requirement
- **Firefox**: Limited Web Speech API support

## Future Enhancements

- Export rendered typography as SVG
- More letterform styles (serif, script, display)
- Color mapping from voice parameters
- Recording and playback features
- Custom alphabet design tools
- Multi-voice comparison mode

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
