// Audio utilities for voice conversation system
export class AudioUtils {
  // Generate a simple audio blob for testing/fallback purposes
  static generateSilentAudio(durationMs: number = 1000): Blob {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * durationMs / 1000);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    // Silent audio data (all zeros)
    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, 0, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Create a simple beep sound
  static generateBeepAudio(frequency: number = 440, durationMs: number = 500): Blob {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * durationMs / 1000);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // WAV header (same as above)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    // Generate sine wave
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Convert text to speech using Web Speech API
  static async textToSpeech(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        (voice.lang.startsWith('en') && voice.localService)
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      speechSynthesis.speak(utterance);
    });
  }

  // Check if audio context is available
  static isAudioContextAvailable(): boolean {
    return typeof window !== 'undefined' && 
           (window.AudioContext || (window as any).webkitAudioContext) !== undefined;
  }

  // Check if speech synthesis is available
  static isSpeechSynthesisAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}
