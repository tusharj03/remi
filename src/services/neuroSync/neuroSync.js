import { biomechanics } from './biomechanics';
import { spectral } from './spectral';
import { analyzeWithRork } from '../visionService';
import { audioEngine } from '../audioEngine';

/**
 * NeuroSync Engine (The "Brain")
 * 
 * Fuses 3 sensory inputs:
 * 1. Biomechanics (3D Skeletal Data) - 60fps
 * 2. Spectral Audio (FFT Stability) - 60fps
 * 3. Vision VLM (The "Judge") - On Demand
 * 
 * DECISION MATRIX:
 * - Silent? -> Idle / Listening HUD
 * - Playing + Bad Posture? -> INSTANT Local Correction ("Fix Wrist")
 * - Playing + Bad Audio? -> INSTANT Local Correction ("Buzzing")
 * - Playing + Good Posture + Good Audio? -> CALL THE JUDGE (Confirm Chord)
 */
class NeuroSyncEngine {
    constructor() {
        this.isRunning = false;
        this.subscribers = [];
        this.lastJudgeTime = 0;
        this.judgeCooldown = 3000; // Only bug the AI every 3s
    }

    async init(videoElement, config = {}) {
        await biomechanics.init(config);
        await audioEngine.init();

        this.isRunning = true;
        this.loop(videoElement, config.lesson);
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => this.subscribers = this.subscribers.filter(s => s !== callback);
    }

    broadcast(data) {
        this.subscribers.forEach(cb => cb(data));
    }

    async loop(videoElement, lesson) {
        if (!this.isRunning) return;

        // 1. Get Sensory Data
        const bioFrame = await biomechanics.processFrame(videoElement);
        const audioFrame = spectral.analyze(audioEngine.getLastFrame()); // Need to ensure audioEngine exposes this

        // 2. Synthesize State
        const state = {
            status: 'listening', // listening, correcting, judging, success
            feedback: null,
            bio: bioFrame,
            audio: audioFrame
        };

        // 3. Logic Cascade
        const now = performance.now();

        // A. Audio Gate
        if (audioFrame.status === 'silent') {
            state.status = 'listening';
        }
        // B. Biomechanics Gate (Local)
        else if (bioFrame && bioFrame.issues && bioFrame.issues.length > 0) {
            // Major biophysical error?
            // For now, let's treat "No Hand" as just listening
            if (bioFrame.issues.includes("No Hand")) {
                state.status = 'listening';
            }
            // Real posture error?
            else if (bioFrame.metrics && bioFrame.metrics.indexCurvature > 170) {
                state.status = 'correcting';
                state.feedback = "Curve your index finger!";
            }
        }
        // C. Spectral Gate (Local) - DISABLED (AI-Only Mode)
        /*
        else if (!audioFrame.isClean) {
            state.status = 'correcting';
            state.feedback = "Buzzing detected. Press harder.";
        }
        */
        // D. The Judge (Cloud)
        else if (now - this.lastJudgeTime > this.judgeCooldown) {
            // If we are here, Posture is decent AND Audio is decent.
            // Let's ask the Judge if it's actually the RIGHT chord.
            state.status = 'judging';
            this.broadcast(state); // Update UI to show "Thinking..."

            // Capture Image
            const cvs = document.createElement('canvas');
            cvs.width = videoElement.videoWidth;
            cvs.height = videoElement.videoHeight;
            cvs.getContext('2d').drawImage(videoElement, 0, 0);
            const base64 = cvs.toDataURL('image/jpeg', 0.8).split(',')[1];

            this.lastJudgeTime = now;

            // Call Rork
            analyzeWithRork(base64, lesson, { note: audioFrame.currentNote, stability: audioFrame.stability })
                .then(result => {
                    if (result && result.success) {
                        this.broadcast({ status: 'success', feedback: result.feedback });
                    } else if (result) {
                        this.broadcast({ status: 'correcting', feedback: result.feedback });
                    }
                });

            // Loop continues to keep UI responsive
        }

        this.broadcast(state);
        requestAnimationFrame(() => this.loop(videoElement, lesson));
    }

    stop() {
        this.isRunning = false;
        audioEngine.stop();
    }
}

export const neuroSync = new NeuroSyncEngine();
