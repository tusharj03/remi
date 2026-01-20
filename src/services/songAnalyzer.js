
// Service to handle uploaded song analysis and playback
// This runs separate from the AudioEngine (which handles Microphone input)

class SongAnalyzer {
    constructor() {
        this.ctx = null;
        this.source = null;
        this.analyser = null;
        this.audioBuffer = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this.isPlaying = false;
        this.gainNode = null;
        this.onEnded = null;
    }

    async init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        return true;
    }

    async loadFile(file) {
        await this.init();
        const arrayBuffer = await file.arrayBuffer();
        try {
            this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            return {
                duration: this.audioBuffer.duration,
                sampleRate: this.audioBuffer.sampleRate
            };
        } catch (e) {
            console.error("Error decoding audio:", e);
            throw new Error("Could not decode audio file");
        }
    }

    play(offset = 0) {
        if (!this.audioBuffer || !this.ctx) return;
        this.stop(); // Stop previous if any

        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.audioBuffer;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;

        this.gainNode = this.ctx.createGain();

        // Connect: Source -> Analyser -> Gain -> Destination
        this.source.connect(this.analyser);
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        this.startTime = this.ctx.currentTime - offset;
        this.pauseTime = 0;
        this.source.start(0, offset);
        this.isPlaying = true;

        this.source.onended = () => {
            this.isPlaying = false;
            if (this.onEnded) this.onEnded();
        };
    }

    pause() {
        if (!this.isPlaying || !this.source) return;
        const elapsed = this.ctx.currentTime - this.startTime;
        this.stop();
        this.pauseTime = elapsed;
        this.isPlaying = false;
        return elapsed;
    }

    resume() {
        if (this.isPlaying || !this.audioBuffer) return;
        this.play(this.pauseTime);
    }

    stop() {
        if (this.source) {
            try {
                this.source.stop();
                this.source.disconnect();
            } catch (e) { /* ignore */ }
            this.source = null;
        }
        this.isPlaying = false;
    }

    seek(time) {
        if (this.isPlaying) {
            this.play(time);
        } else {
            this.pauseTime = time;
        }
    }

    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }

    // Get real-time data for visualization
    getAnalysis() {
        if (!this.analyser) return null;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate RMS (volume)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Detect Dominant Frequency (Simple Peak)
        // Note: usage of 44100 is standard, but we should use ctx.sampleRate
        let maxVal = -1;
        let maxIndex = -1;
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxVal) {
                maxVal = dataArray[i];
                maxIndex = i;
            }
        }

        const nyquist = this.ctx.sampleRate / 2;
        const freq = maxIndex * (nyquist / bufferLength);

        return {
            volume: average / 255, // Normalized 0-1
            frequency: freq,
            raw: dataArray
        };
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.pauseTime;
        return Math.min(this.ctx.currentTime - this.startTime, this.audioBuffer?.duration || 0);
    }

    getDuration() {
        return this.audioBuffer?.duration || 0;
    }

    // [NEW] Get Pitch at a specific time (Transcription Logic)
    getPitchAtTime(time) {
        if (!this.audioBuffer) return null;

        const sampleRate = this.audioBuffer.sampleRate;
        const bufferSize = 4096; // Good resolution
        const startSample = Math.floor(time * sampleRate);

        if (startSample >= this.audioBuffer.length) return null;

        // Get channel data (only using left channel for now)
        const channelData = this.audioBuffer.getChannelData(0);

        // Slice a window
        const slice = channelData.slice(startSample, startSample + bufferSize);
        if (slice.length < bufferSize) return null; // End of song

        // Use same autoCorrelate as AudioEngine
        const pitch = this.autoCorrelate(slice, sampleRate);
        const noteData = this.getNoteFromPitch(pitch);
        const pos = this.guessPosition(pitch);

        return {
            pitch,
            note: noteData.note,
            octave: noteData.octave,
            cents: noteData.cents,
            stringIdx: pos.stringIdx,
            fret: pos.fret
        };
    }

    // --- COPIED HELPERS FROM AUDIOENGINE (Decoupled) ---

    calculateRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        return Math.sqrt(sum / buffer.length);
    }

    autoCorrelate(buf, sampleRate) {
        let size = buf.length;
        let rms = this.calculateRMS(buf);
        if (rms < 0.001) return -1;

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

        return sampleRate / T0;
    }

    getNoteFromPitch(frequency) {
        const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        if (!frequency || frequency === -1) return { note: '--', cents: 0, octave: 0 };
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midi = Math.round(noteNum) + 69;
        const note = NOTE_STRINGS[midi % 12];
        const cents = Math.floor(100 * (noteNum - Math.round(noteNum)));
        const octave = Math.floor(midi / 12) - 1;
        return { note, cents, octave };
    }

    guessPosition(pitch) {
        if (!pitch || pitch === -1) return { string: null, fret: null };
        const GUITAR_STRINGS = [
            { note: 'E', octave: 2, freq: 82.41 },
            { note: 'A', octave: 2, freq: 110.00 },
            { note: 'D', octave: 3, freq: 146.83 },
            { note: 'G', octave: 3, freq: 196.00 },
            { note: 'B', octave: 3, freq: 246.94 },
            { note: 'E', octave: 4, freq: 329.63 }
        ];

        let candidates = [];
        GUITAR_STRINGS.forEach((s, idx) => {
            const fret = 12 * Math.log2(pitch / s.freq);
            const closeFret = Math.round(fret);

            if (closeFret >= 0 && closeFret <= 15) {
                // [UPDATED] Removed strict tolerance check (was < 0.4) to allow snapping to grid
                // Real music audio is often slightly detuned or polyphonic
                candidates.push({ stringIndex: idx, fret: closeFret });
            }
        });

        if (candidates.length === 0) return { string: null, fret: null };
        candidates.sort((a, b) => a.fret - b.fret);
        const best = candidates[0];

        const s = GUITAR_STRINGS[best.stringIndex];
        return {
            string: `${s.note}${s.octave}`,
            stringIdx: best.stringIndex,
            fret: best.fret
        };
    }
}

export const songAnalyzer = new SongAnalyzer();
