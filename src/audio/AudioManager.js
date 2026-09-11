/**
 * AudioManager handles all game audio using Web Audio API synthesis.
 * It provides kid-friendly, warm sounds without requiring external audio files.
 */
class AudioManager {
    constructor() {
        /** @type {AudioContext|null} */
        this.ctx = null;
        /** @type {boolean} */
        this._muted = false;
        /** @type {GainNode|null} */
        this.masterGain = null;
    }

    /**
     * Initializes the AudioContext.
     * Must be called during a user interaction (e.g., click) to comply with browser autoplay policies.
     */
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            // Initial volume setting
            this.masterGain.gain.value = this._muted ? 0 : 1;
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Toggles the mute state of the audio.
     * @returns {boolean} The new mute state.
     */
    toggleMute() {
        this._muted = !this._muted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this._muted ? 0 : 1, this.ctx.currentTime);
        }
        return this._muted;
    }

    /**
     * Gets the current mute state.
     * @returns {boolean}
     */
    get isMuted() {
        return this._muted;
    }

    /**
     * Helper to get a random variation for frequency.
     * @param {number} freq Base frequency
     * @param {number} variation Percentage variation (e.g., 0.03 for 3%)
     * @returns {number}
     */
    _varyPitch(freq, variation = 0.03) {
        const min = freq * (1 - variation);
        const max = freq * (1 + variation);
        return min + Math.random() * (max - min);
    }

    /**
     * Generates a short white noise buffer.
     * @param {number} duration Duration in seconds
     * @returns {AudioBuffer}
     */
    _createWhiteNoiseBuffer(duration) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /**
     * Plays a bouncy cartoon spring/boing sound.
     */
    playJump() {
        if (this._muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'triangle';
        const startFreq = this._varyPitch(160, 0.03);
        const endFreq = this._varyPitch(520, 0.03);

        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.25);

        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.25);
    }

    /**
     * Plays a soft air whoosh for ducking.
     */
    playDuck() {
        if (this._muted || !this.ctx) return;

        const noiseBuffer = this._createWhiteNoiseBuffer(0.28);
        if (!noiseBuffer) return;

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.5;
        
        const startFreq = this._varyPitch(800, 0.03);
        const endFreq = this._varyPitch(400, 0.03);

        filter.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.28);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        noiseSource.start(this.ctx.currentTime);
        noiseSource.stop(this.ctx.currentTime + 0.28);
    }

    /**
     * Plays a quick slide sound.
     */
    playSlide() {
        if (this._muted || !this.ctx) return;

        const noiseBuffer = this._createWhiteNoiseBuffer(0.18);
        if (!noiseBuffer) return;

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 2.0;

        const startFreq = this._varyPitch(1200, 0.03);
        const endFreq = this._varyPitch(600, 0.03);

        filter.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.18);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        noiseSource.start(this.ctx.currentTime);
        noiseSource.stop(this.ctx.currentTime + 0.18);
    }

    /**
     * Plays a gentle rubber bonk/bloop for collisions.
     */
    playCollision() {
        if (this._muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.22);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.22);

        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.22);
    }

    /**
     * Plays a countdown beep.
     * @param {number} step Countdown step (3, 2, 1, or 0 for GO)
     */
    playCountdownBeep(step) {
        if (this._muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        
        let freq = 523.25; // C5
        let duration = 0.15;
        let volume = 0.2;

        if (step === 0) {
            freq = 1046.50; // C6
            duration = 0.4;
            volume = 0.25;
        }

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.02);
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    /**
     * Plays a cheerful 4-note major arpeggio fanfare for high scores.
     */
    playHighScore() {
        if (this._muted || !this.ctx) return;

        const notes = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 659.25, time: 0.15 }, // E5
            { freq: 783.99, time: 0.3 },  // G5
            { freq: 1046.50, time: 0.45 } // C6
        ];

        const durationPerNote = 0.2;

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, this.ctx.currentTime + note.time);

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime + note.time);
            gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + note.time + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + note.time + durationPerNote);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(this.ctx.currentTime + note.time);
            osc.stop(this.ctx.currentTime + note.time + durationPerNote);
        });
    }

    /**
     * Plays a welcoming two-tone ascending chime when a player is detected.
     */
    playDetected() {
        if (this._muted || !this.ctx) return;

        const notes = [
            { freq: 392.00, time: 0 },    // G4
            { freq: 523.25, time: 0.15 }  // C5
        ];

        const durationPerNote = 0.3;

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, this.ctx.currentTime + note.time);

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime + note.time);
            gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + note.time + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + note.time + durationPerNote);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(this.ctx.currentTime + note.time);
            osc.stop(this.ctx.currentTime + note.time + durationPerNote);
        });
    }

    /**
     * Plays a positive 3-note ascending confirmation for calibration.
     */
    playCalibrationDone() {
        if (this._muted || !this.ctx) return;

        const notes = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 659.25, time: 0.1 },  // E5
            { freq: 783.99, time: 0.2 }   // G5
        ];

        const durationPerNote = 0.25;

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, this.ctx.currentTime + note.time);

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime + note.time);
            gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + note.time + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + note.time + durationPerNote);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(this.ctx.currentTime + note.time);
            osc.stop(this.ctx.currentTime + note.time + durationPerNote);
        });
    }
}

// Export a singleton instance
export const audioManager = new AudioManager();
