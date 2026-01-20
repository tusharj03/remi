export const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const GUITAR_STRINGS = [
    { note: 'E', octave: 2, freq: 82.41 },
    { note: 'A', octave: 2, freq: 110.00 },
    { note: 'D', octave: 3, freq: 146.83 },
    { note: 'G', octave: 3, freq: 196.00 },
    { note: 'B', octave: 3, freq: 246.94 },
    { note: 'E', octave: 4, freq: 329.63 }
];

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.analyser = null;
        this.stream = null;
        this.rafId = null;
        this.callbacks = new Set();
        this.config = {
            sampleRate: 44100,
            fftSize: 4096, // Increased for better Low E (82Hz) resolution
        };
    }

    async init() {
        if (this.ctx) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });

            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;

            // [NEW] Low-Pass Filter to remove overtone noise (improves tuning stability)
            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 1000; // Cutoff at 1kHz (guitar fundamentals are < 1kHz)

            const src = this.ctx.createMediaStreamSource(this.stream);
            // Connect: Source -> Filter -> Analyser -> Destination (optional)
            src.connect(this.filter);
            this.filter.connect(this.analyser);

            this.startLoop();
            return true;
        } catch (e) {
            console.error("Audio Engine Init Failed:", e);
            return false;
        }
    }

    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    startLoop() {
        const buf = new Uint8Array(this.analyser.frequencyBinCount);
        const floatBuf = new Float32Array(this.analyser.frequencyBinCount);

        const loop = () => {
            this.analyser.getByteFrequencyData(buf);
            this.analyser.getFloatTimeDomainData(floatBuf);

            const rms = this.calculateRMS(floatBuf);
            const pitch = this.autoCorrelate(floatBuf, this.ctx.sampleRate);
            const chroma = this.getChromaVector(buf, this.ctx.sampleRate);
            // [NEW] Median Smoothing
            this.pitchBuffer = this.pitchBuffer || [];
            if (pitch > 0) this.pitchBuffer.push(pitch);
            if (this.pitchBuffer.length > 5) this.pitchBuffer.shift();

            let smoothPitch = pitch;
            if (this.pitchBuffer.length > 0) {
                const sorted = [...this.pitchBuffer].sort((a, b) => a - b);
                smoothPitch = sorted[Math.floor(sorted.length / 2)];
            }

            const noteData = this.getNoteFromPitch(smoothPitch);
            const pos = this.guessPosition(smoothPitch); // [UPDATED]

            const data = {
                rms,
                pitch: smoothPitch,
                note: noteData.note,
                cents: noteData.cents,
                octave: noteData.octave, // Added octave
                chroma,
                likelyString: pos.string, // Keep backward compat name but usage changes
                likelyFret: pos.fret,
                likelyStringIdx: pos.stringIdx
            };

            this.lastData = data; // [NEW] Store for polling

            this.callbacks.forEach(cb => cb(data));
            this.rafId = requestAnimationFrame(loop);
        };
        loop();
    }

    getLastFrame() {
        return this.lastData || { rms: 0, pitch: -1, note: '--', stability: 0 };
    }

    stop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.ctx) this.ctx.close();
        this.ctx = null;
    }

    calculateRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        return Math.sqrt(sum / buffer.length);
    }

    autoCorrelate(buf, sampleRate) {
        let size = buf.length;
        let rms = this.calculateRMS(buf);
        if (rms < 0.01) return -1;

        let r1 = 0, r2 = size - 1, thres = 0.2;
        for (let i = 0; i < size / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < size / 2; i++) if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; }
        buf = buf.slice(r1, r2);
        size = buf.length;

        let c = new Array(size).fill(0);
        for (let i = 0; i < size; i++) for (let j = 0; j < size - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < size; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }

        let T0 = maxpos;

        // Parabolic Interpolation
        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        // [NEW] Octave Error Correction
        // Sometimes T0 is double (an octave lower) or half (an octave higher).
        // Since we know guitar range (80-1000Hz), we can constrain.
        // But autocorrelation usually finds the lowest T0 (highest freq) if we don't skip peaks.
        // Let's trust T0 but filter in smoothing.

        return sampleRate / T0;
    }

    getNoteFromPitch(frequency) {
        if (!frequency || frequency === -1) return { note: '--', cents: 0, octave: 0 };
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midi = Math.round(noteNum) + 69;
        const note = NOTE_STRINGS[midi % 12];
        const cents = Math.floor(100 * (noteNum - Math.round(noteNum)));
        const octave = Math.floor(midi / 12) - 1;
        return { note, cents, octave };
    }

    getChromaVector(byteFrequencyData, sampleRate) {
        const chroma = new Array(12).fill(0);
        const binSize = sampleRate / (byteFrequencyData.length * 2);

        for (let i = 0; i < byteFrequencyData.length; i++) {
            const freq = i * binSize;
            if (freq < 80 || freq > 1000) continue;

            const amp = byteFrequencyData[i];
            if (amp < 20) continue;

            const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
            const midi = Math.round(noteNum) + 69;
            const noteIndex = midi % 12;

            if (noteIndex >= 0) chroma[noteIndex] += amp;
        }

        const maxVal = Math.max(...chroma) || 1;
        return chroma.map(v => v / maxVal);
    }

    guessPosition(pitch) {
        if (!pitch || pitch === -1) return { string: null, fret: null };

        // For each string, calculate the fret that would produce this pitch
        // freq = base * 2^(fret/12)
        // fret = 12 * log2(freq / base)

        let candidates = [];

        GUITAR_STRINGS.forEach((s, idx) => {
            // idx 0 is string 6 (Low E) in our GUITAR_STRINGS array? 
            // Let's check definition at top of file.
            // GUITAR_STRINGS defines Low E first? 
            // "export const GUITAR_STRINGS = [ { note: 'E', octave: 2 ... } ]" -> Yes, that's Low E.
            // But usually we index 1=High E. 
            // In FretboardDiagram: 0=High E.
            // Let's map this carefully. 
            // GUITAR_STRINGS: [E2, A2, D3, G3, B3, E4] -> 0=Low E, 5=High E.
            // data.likelyString usually returns "E2".

            // Fret calc
            const fret = 12 * Math.log2(pitch / s.freq);
            const closeFret = Math.round(fret);

            // Fret must be valid (0 to ~20)
            if (closeFret >= 0 && closeFret <= 15) { // Limit to 15 for realism in beginner app
                // Check if pitch matches closely (within 0.3 semitone = ~30 cents)
                const expectedFreq = s.freq * Math.pow(2, closeFret / 12);
                const diff = Math.abs(pitch - expectedFreq);
                // 1 semitone at 82Hz is ~5Hz. 0.3 is ~1.5Hz.
                // 1 semitone at 330Hz is ~20Hz. 
                // Better to check ratio.
                if (Math.abs(12 * Math.log2(pitch / expectedFreq)) < 0.4) {
                    candidates.push({ stringIndex: idx, fret: closeFret, diff });
                }
            }
        });

        if (candidates.length === 0) return { string: null, fret: null };

        // Sort candidates
        // Priority 1: Lower fret (Open strings best)
        // Priority 2: Break ties? Maybe preferring thicker strings for same note? 
        // e.g. 5th fret Low E (A) vs Open A. Open A is fret 0. Wins.
        // e.g. 5th fret A vs Open D. Open D wins.
        candidates.sort((a, b) => a.fret - b.fret);

        const best = candidates[0];

        // Return normalized string identifier for UI
        // GUITAR_STRINGS[0] is Low E. 
        // FretboardDiagram expects something to map. 
        // Let's return explicit indices for the consumer to use easily.
        // We'll return { stringIdx: x, fret: y } where stringIdx 0=Low E usually in this file?
        // Wait, PracticeSession uses likelyString for... what?
        // In previous code `guessString` returned `E2`.
        // Let's return object.
        const s = GUITAR_STRINGS[best.stringIndex];
        return {
            string: `${s.note}${s.octave}`, // E2
            stringIdx: best.stringIndex, // 0 = Low E
            fret: best.fret
        };
    }
}

export const audioEngine = new AudioEngine();
