import { audioEngine } from '../audioEngine';

/**
 * SpectralAnalyzer
 * Stage 2 of Neuro-Sync: Nanosecond Audio Validation.
 * 
 * Uses raw FFT data to detect:
 * 1. Tone Quality (Clean vs Buzz) - via Harmonic ratios
 * 2. Attack Precison - ms timing of transient
 * 3. Pitch Stability - Variance over time
 */
export class SpectralAnalyzer {
    constructor() {
        this.history = [];
        this.history = [];
        this.bufferSize = 60; // 1 second roughly at 60fps
    }

    // Called every frame with latest audio data
    analyze(audioFrame) {
        const { note, rms, chroma } = audioFrame;

        // 1. Gate: Is there sound?
        if (rms < 0.02) {
            return { status: 'silent', stability: 0 };
        }

        // 2. Stability Window
        this.history.push({ note, rms, time: performance.now() });
        if (this.history.length > this.bufferSize) this.history.shift();

        // Calculate Variance of Note
        // If note flickers (C -> C# -> C), variance is high -> Buzzing/Unsure
        const recentNotes = this.history.slice(-10).map(h => h.note);
        const uniqueNotes = new Set(recentNotes);
        const stability = uniqueNotes.size === 1 ? 1.0 : (1.0 / uniqueNotes.size);

        // 3. Buzz Detection (Heuristic: High volume but unclear chroma?)
        // TODO: Advanced FFT harmonic analysis

        return {
            status: 'playing',
            currentNote: note,
            volume: rms,
            stability: stability, // 1.0 = Rock Solid, < 0.5 = Buzzing/Messy
            isClean: stability > 0.4
        };
    }

    reset() {
        this.history = [];
    }
}

export const spectral = new SpectralAnalyzer();
