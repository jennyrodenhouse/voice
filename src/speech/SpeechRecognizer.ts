/**
 * Handles speech recognition using Web Speech API
 */
export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private onTranscriptCallback?: (text: string, isFinal: boolean) => void;
  private onWordCallback?: (word: string) => void;
  private currentTranscript: string = '';
  private words: string[] = [];

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.setupRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
      this.setupRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          this.processNewWords(transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript && this.onTranscriptCallback) {
        this.currentTranscript += finalTranscript;
        this.onTranscriptCallback(this.currentTranscript, true);
      } else if (interimTranscript && this.onTranscriptCallback) {
        this.onTranscriptCallback(this.currentTranscript + interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart if it stops
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };
  }

  /**
   * Process new words and trigger word callback
   */
  private processNewWords(transcript: string): void {
    const newWords = transcript.trim().toLowerCase().split(/\s+/);

    newWords.forEach(word => {
      // Filter out empty strings and very short words
      if (word.length > 0) {
        this.words.push(word);
        if (this.onWordCallback) {
          this.onWordCallback(word);
        }
      }
    });
  }

  /**
   * Start speech recognition
   */
  start(): void {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition already started');
      }
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Set callback for transcript updates
   */
  onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.onTranscriptCallback = callback;
  }

  /**
   * Set callback for individual words
   */
  onWord(callback: (word: string) => void): void {
    this.onWordCallback = callback;
  }

  /**
   * Get current full transcript
   */
  getTranscript(): string {
    return this.currentTranscript;
  }

  /**
   * Clear transcript
   */
  clearTranscript(): void {
    this.currentTranscript = '';
    this.words = [];
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
