export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        this.cleanup();
        console.log('🎤 Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;

  async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        this.audio = new Audio(audioUrl);
        
        this.audio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        this.audio.onerror = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Failed to play audio'));
        };
        
        this.isPlaying = true;
        this.audio.play();
        console.log('🔊 Playing audio');
      } catch (error) {
        reject(error);
      }
    });
  }

  async playAudioFromUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.audio = new Audio(url);
        
        this.audio.onended = () => {
          this.isPlaying = false;
          resolve();
        };
        
        this.audio.onerror = () => {
          this.isPlaying = false;
          reject(new Error('Failed to play audio from URL'));
        };
        
        this.isPlaying = true;
        this.audio.play();
        console.log('🔊 Playing audio from URL');
      } catch (error) {
        reject(error);
      }
    });
  }

  stopAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      console.log('🔊 Audio stopped');
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  async resumeContext(): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('🔊 Audio context resumed');
      }
    } catch (error) {
      console.warn('Failed to resume audio context:', error);
    }
  }
}
