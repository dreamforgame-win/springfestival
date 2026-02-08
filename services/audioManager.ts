


// A zero-dependency retro sound synthesizer using Web Audio API

// Music Note Definition (Frequency in Hz)
const NOTES = {
  E2: 82.41, F2: 87.31, Fs2: 92.50,
  G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00,
  C6: 1046.50,
  REST: 0
};

type BGMTheme = 'START' | 'HOME' | 'SCHOOL' | 'COMPANY' | 'BATTLE' | 'NONE';

interface NoteEvent {
  freq: number;
  dur: number; // Duration in seconds relative to tempo
}

class AudioManager {
  public ctx: AudioContext | null = null; // Made public for direct access if needed, or keep private and add getter
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  
  private isSfxMuted: boolean = false;
  private isBgmMuted: boolean = false;
  private initialized: boolean = false;

  // BGM State
  private currentBgmOscillators: OscillatorNode[] = [];
  private currentBgmGainNodes: GainNode[] = [];
  private currentTheme: BGMTheme = 'NONE';
  private bgmTimeout: any = null;
  private bgmNoteIndex: number = 0;

  constructor() {
    // Lazy initialization
  }

  public init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // SFX Gain Channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.sfxGain.gain.value = this.isSfxMuted ? 0 : 0.3; 

      // BGM Gain Channel (Separate)
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.ctx.destination);
      this.bgmGain.gain.value = this.isBgmMuted ? 0 : 0.15;

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  // Mobile Unlock: Call this on first user interaction
  public resumeContext() {
    if (!this.initialized || !this.ctx) this.init();
    
    if (this.ctx) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        // Mobile Safari unlock hack: Play a silent buffer
        try {
            const buffer = this.ctx.createBuffer(1, 1, 22050);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            source.start(0);
        } catch(e) {
            // Ignore errors here
        }
    }
  }

  public isContextRunning(): boolean {
      return this.ctx !== null && this.ctx.state === 'running';
  }

  public setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : 0.3, this.ctx.currentTime);
    }
  }

  public setBgmMuted(muted: boolean) {
    this.isBgmMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
  }

  public getAudioState() {
    return {
      bgm: !this.isBgmMuted,
      sfx: !this.isSfxMuted
    };
  }

  // --- BGM ENGINE ---

  public playBGM(theme: BGMTheme) {
    if (!this.initialized) this.init();
    
    // Auto-resume if suspended (attempt)
    if (this.ctx?.state === 'suspended') this.ctx.resume();

    if (this.currentTheme === theme) return;

    this.stopBGM();
    this.currentTheme = theme;
    this.bgmNoteIndex = 0;

    if (theme !== 'NONE') {
      this.scheduleNextNote();
    }
  }

  public stopBGM() {
    // Clear timeout
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
    // Stop currently playing oscillators
    this.currentBgmOscillators.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    this.currentBgmOscillators = [];
    this.currentBgmGainNodes = [];
    this.currentTheme = 'NONE';
  }

  private scheduleNextNote() {
    if (!this.ctx || !this.bgmGain || this.currentTheme === 'NONE') return;

    // Safety: If context is suspended, we shouldn't pile up timeouts too fast.
    // However, for BGM continuity, we generally rely on the resume() unfreezing time.
    // But if state is suspended, currentTime doesn't advance, so scheduling at startTime (currentTime) works,
    // but they will all play at once when resumed if we aren't careful.
    // Ideally, wait until running.
    if (this.ctx.state === 'suspended') {
        this.bgmTimeout = setTimeout(() => this.scheduleNextNote(), 500);
        return;
    }

    // Define Patterns
    let sequence: NoteEvent[] = [];
    let tempo = 1.0; // Seconds per beat (lower is faster if notes are fractions)
    let waveType: OscillatorType = 'sine';

    switch (this.currentTheme) {
      case 'START':
        // New Year Style (Pentatonic, Upbeat)
        waveType = 'square';
        tempo = 0.22; 
        sequence = [
          // Intro
          {freq: NOTES.C5, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.C5, dur: 2}, 
          {freq: NOTES.A4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.E4, dur: 2},
          // Theme A
          {freq: NOTES.C4, dur: 2}, {freq: NOTES.D4, dur: 2}, {freq: NOTES.E4, dur: 2}, {freq: NOTES.G4, dur: 2},
          {freq: NOTES.A4, dur: 4}, {freq: NOTES.G4, dur: 4},
          {freq: NOTES.E4, dur: 2}, {freq: NOTES.G4, dur: 2}, {freq: NOTES.A4, dur: 2}, {freq: NOTES.C5, dur: 2},
          {freq: NOTES.D5, dur: 4}, {freq: NOTES.D5, dur: 4},
          // Theme B
          {freq: NOTES.C5, dur: 2}, {freq: NOTES.A4, dur: 2}, {freq: NOTES.G4, dur: 2}, {freq: NOTES.E4, dur: 2},
          {freq: NOTES.G4, dur: 2}, {freq: NOTES.A4, dur: 2}, {freq: NOTES.G4, dur: 4},
          {freq: NOTES.E4, dur: 2}, {freq: NOTES.D4, dur: 2}, {freq: NOTES.C4, dur: 2}, {freq: NOTES.D4, dur: 2},
          {freq: NOTES.C4, dur: 8},
          // Bridge
          {freq: NOTES.A4, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.A4, dur: 1}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.E4, dur: 2}, {freq: NOTES.G4, dur: 2},
          {freq: NOTES.D4, dur: 1}, {freq: NOTES.E4, dur: 1}, {freq: NOTES.D4, dur: 1}, {freq: NOTES.C4, dur: 1},
          {freq: NOTES.A3, dur: 2}, {freq: NOTES.G3, dur: 2},
          // Outro
          {freq: NOTES.C4, dur: 4}, {freq: NOTES.REST, dur: 4}
        ];
        break;

      case 'HOME':
        // Cozy Waltz (Triangle)
        waveType = 'triangle';
        tempo = 0.5;
        sequence = [
          {freq: NOTES.C4, dur: 1}, {freq: NOTES.E4, dur: 1}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.C4, dur: 1}, {freq: NOTES.E4, dur: 1}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.A4, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.E4, dur: 2}, {freq: NOTES.D4, dur: 1},
          {freq: NOTES.F4, dur: 1}, {freq: NOTES.A4, dur: 1}, {freq: NOTES.C5, dur: 1},
          {freq: NOTES.B4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.E4, dur: 1},
          {freq: NOTES.D4, dur: 1}, {freq: NOTES.F4, dur: 1}, {freq: NOTES.E4, dur: 1},
          {freq: NOTES.C4, dur: 3},
          {freq: NOTES.E4, dur: 1.5}, {freq: NOTES.F4, dur: 0.5}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.A4, dur: 2}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.F4, dur: 1.5}, {freq: NOTES.E4, dur: 0.5}, {freq: NOTES.D4, dur: 1},
          {freq: NOTES.C4, dur: 3},
          {freq: NOTES.REST, dur: 2}
        ];
        break;

      case 'SCHOOL':
        // Playful March (Square)
        waveType = 'square';
        tempo = 0.2;
        sequence = [
          {freq: NOTES.G4, dur: 2}, {freq: NOTES.E4, dur: 2}, {freq: NOTES.A4, dur: 2}, {freq: NOTES.G4, dur: 4},
          {freq: NOTES.REST, dur: 2},
          {freq: NOTES.C4, dur: 1}, {freq: NOTES.E4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.C4, dur: 1}, {freq: NOTES.E4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.A4, dur: 1}, {freq: NOTES.A4, dur: 1}, {freq: NOTES.G4, dur: 2}, 
          {freq: NOTES.F4, dur: 1}, {freq: NOTES.F4, dur: 1}, {freq: NOTES.E4, dur: 2},
          {freq: NOTES.D4, dur: 1}, {freq: NOTES.E4, dur: 1}, {freq: NOTES.F4, dur: 1}, {freq: NOTES.D4, dur: 1},
          {freq: NOTES.C4, dur: 2}, {freq: NOTES.REST, dur: 2},
          {freq: NOTES.E5, dur: 1}, {freq: NOTES.D5, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.G4, dur: 1},
          {freq: NOTES.A4, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.G4, dur: 2},
          {freq: NOTES.F4, dur: 1}, {freq: NOTES.A4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.E4, dur: 1},
          {freq: NOTES.D4, dur: 2}, {freq: NOTES.G3, dur: 2},
          {freq: NOTES.C4, dur: 4}, {freq: NOTES.REST, dur: 4}
        ];
        break;

      case 'COMPANY':
        // Depressing Mechanical Loop (Sawtooth)
        waveType = 'sawtooth';
        tempo = 0.3;
        sequence = [
          {freq: NOTES.A2, dur: 1}, {freq: NOTES.E3, dur: 1}, {freq: NOTES.A2, dur: 1}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.A2, dur: 1}, {freq: NOTES.E3, dur: 1}, {freq: NOTES.A2, dur: 1}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.G2, dur: 1}, {freq: NOTES.D3, dur: 1}, {freq: NOTES.G2, dur: 1}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.G2, dur: 1}, {freq: NOTES.D3, dur: 1}, {freq: NOTES.G2, dur: 1}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.F2, dur: 2}, {freq: NOTES.F2, dur: 2}, {freq: NOTES.A2, dur: 4},
          {freq: NOTES.E2, dur: 2}, {freq: NOTES.E2, dur: 2}, {freq: NOTES.G2, dur: 4},
          {freq: NOTES.A2, dur: 0.5}, {freq: NOTES.A2, dur: 0.5}, {freq: NOTES.A2, dur: 0.5}, {freq: NOTES.REST, dur: 0.5},
          {freq: NOTES.C3, dur: 0.5}, {freq: NOTES.C3, dur: 0.5}, {freq: NOTES.C3, dur: 0.5}, {freq: NOTES.REST, dur: 0.5},
          {freq: NOTES.E3, dur: 4}, {freq: NOTES.REST, dur: 4}
        ];
        break;

      case 'BATTLE':
        // Urgent Arpeggio (Square) - Optimized for variety (Key changes & Breaks)
        waveType = 'square';
        tempo = 0.11;
        sequence = [
          // Section A: C Minor Arp
          {freq: NOTES.C4, dur: 1}, {freq: NOTES.Ds4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.C5, dur: 1},
          {freq: NOTES.G4, dur: 1}, {freq: NOTES.Ds4, dur: 1}, {freq: NOTES.C4, dur: 1}, {freq: NOTES.G3, dur: 1},
          {freq: NOTES.C4, dur: 1}, {freq: NOTES.Ds4, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.C5, dur: 1},
          {freq: NOTES.Ds5, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.G4, dur: 1}, {freq: NOTES.Ds4, dur: 1},
          
          // Section B: F Minor Arp (Subdominant)
          {freq: NOTES.F4, dur: 1}, {freq: NOTES.Gs4, dur: 1}, {freq: NOTES.C5, dur: 1}, {freq: NOTES.F5, dur: 1},
          {freq: NOTES.C5, dur: 1}, {freq: NOTES.Gs4, dur: 1}, {freq: NOTES.F4, dur: 1}, {freq: NOTES.C4, dur: 1},
          
          // Section C: Diminished tension
          {freq: NOTES.B3, dur: 1}, {freq: NOTES.D4, dur: 1}, {freq: NOTES.F4, dur: 1}, {freq: NOTES.Gs4, dur: 1},
          {freq: NOTES.B4, dur: 1}, {freq: NOTES.D5, dur: 1}, {freq: NOTES.F5, dur: 1}, {freq: NOTES.Gs5, dur: 1},
          
          // Section D: Chromatic run down
          {freq: NOTES.G5, dur: 1}, {freq: NOTES.Fs5, dur: 1}, {freq: NOTES.F5, dur: 1}, {freq: NOTES.E5, dur: 1},
          {freq: NOTES.Ds5, dur: 1}, {freq: NOTES.D5, dur: 1}, {freq: NOTES.Cs5, dur: 1}, {freq: NOTES.C5, dur: 1},
          
          // Section E: Rhythmic hits
          {freq: NOTES.C4, dur: 0.5}, {freq: NOTES.C4, dur: 0.5}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.Ds4, dur: 0.5}, {freq: NOTES.Ds4, dur: 0.5}, {freq: NOTES.REST, dur: 1}, // Ds4 is Eb4
          {freq: NOTES.G4, dur: 0.5}, {freq: NOTES.G4, dur: 0.5}, {freq: NOTES.REST, dur: 1},
          {freq: NOTES.C5, dur: 2},
          
          {freq: NOTES.REST, dur: 4}
        ];
        break;
    }

    if (sequence.length === 0) return;

    const note = sequence[this.bgmNoteIndex % sequence.length];
    this.bgmNoteIndex++;

    if (note.freq !== NOTES.REST) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(note.freq, this.ctx.currentTime);
        
        // Envelope
        const startTime = this.ctx.currentTime;
        const endTime = startTime + (note.dur * tempo);
        
        // Smoother Attack/Release for BGM
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this.currentTheme === 'COMPANY' ? 0.1 : 0.15, startTime + 0.1);
        gain.gain.setValueAtTime(this.currentTheme === 'COMPANY' ? 0.1 : 0.15, endTime - 0.1);
        gain.gain.linearRampToValueAtTime(0, endTime);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        
        osc.start(startTime);
        osc.stop(endTime + 0.1);

        this.currentBgmOscillators.push(osc);
        this.currentBgmGainNodes.push(gain);

        // Cleanup old nodes
        osc.onended = () => {
            const idx = this.currentBgmOscillators.indexOf(osc);
            if (idx > -1) {
                this.currentBgmOscillators.splice(idx, 1);
                this.currentBgmGainNodes.splice(idx, 1);
            }
        };
    }

    // Schedule next loop
    this.bgmTimeout = setTimeout(() => {
        this.scheduleNextNote();
    }, (note.dur * tempo) * 1000);
  }

  // --- SFX SYNTHESIZER ---

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
    if (!this.ctx || !this.sfxGain) return;
    
    // Auto-resume if possible
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  // 1. Move
  public playStep() {
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 2. Select/Hover
  public playBlip() {
    this.playTone(800, 'square', 0.05);
  }

  // New: Correct Answer (Crisp, high pitch)
  public playCorrect() {
    this.playTone(880, 'sine', 0.1);
    this.playTone(1760, 'sine', 0.15, 0.08); // High harmonic
  }

  // New: Wrong Answer (Dull, low pitch)
  public playWrong() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.2); // Pitch slide down

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // 3. Confirm/Buy
  public playConfirm() {
    this.playTone(1200, 'square', 0.1);
    this.playTone(1600, 'square', 0.1, 0.1);
  }

  // 4. Coin/Loot
  public playCoin() {
    this.playTone(1500, 'sine', 0.1);
    this.playTone(2000, 'sine', 0.3, 0.05);
  }

  // 5. Battle Encounter (Alarm-like)
  public playEncounter() {
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // 6. Attack/Damage
  public playAttack() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // 7. Victory
  public playWin() {
    const now = 0;
    this.playTone(523.25, 'square', 0.1, now);       // C5
    this.playTone(659.25, 'square', 0.1, now + 0.1); // E5
    this.playTone(783.99, 'square', 0.1, now + 0.2); // G5
    this.playTone(1046.50, 'square', 0.4, now + 0.3);// C6
  }

  // 8. Lose
  public playLose() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }
}

export const audioManager = new AudioManager();
