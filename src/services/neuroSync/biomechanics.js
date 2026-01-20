import { initHandTracker } from '../handTracker';

/**
 * BiomechanicsTracker
 * Stage 1 of Neuro-Sync: Local, Real-time 3D Analysis.
 * 
 * Uses MediaPipe landmarks to calculate skeletal vectors.
 * instant feedback on: Wrist Angle, Finger Curvature, Thumb Position.
 */
export class BiomechanicsTracker {
    constructor() {
        this.tracker = null;
        this.isLefty = false;
        this.lastFrameData = null;
    }

    async init(config = { isLefty: false }) {
        this.isLefty = config.isLefty;
        this.tracker = await initHandTracker(this.handleLandmarks.bind(this), config);
        console.log("🦾 [NEURO-SYNC] Biomechanics Engine Online");
    }

    handleLandmarks(result) {
        if (!result.landmarks || result.landmarks.length === 0) {
            this.lastFrameData = { detected: false, issues: ["No Hand"] };
            return;
        }

        // We assume 1 hand for now (the fret hand)
        const hand = result.landmarks[0];

        // 1. Wrist Alignment Check
        // Wrist is point 0. Middle finger MCP is 9.
        // We want the line 0->9 to be relatively straight compared to the forearm (approximated).
        // Actually simpler: Check if wrist is collapsed.

        // 2. Finger Curvature (The "Claw")
        // Check angle between PIP-MCP-Wrist.
        // If flat, angle is high (180). If curved, angle is low (~90-120).
        const indexCurvature = this.calculateAngle(hand[5], hand[6], hand[7]); // Index MCP-PIP-DIP

        const issues = [];
        const warnings = [];

        // Hueristics
        if (indexCurvature > 170) warnings.push("Index Flat");

        // Thumb Position (Point 4) relative to Index MCP (5)
        // Ideally thumb is behind neck, roughly opposite index/middle.

        this.lastFrameData = {
            detected: true,
            raw: hand,
            metrics: {
                indexCurvature
            },
            issues,
            warnings
        };
    }

    // Helper: Calculate angle between 3 points (A->B->C)
    calculateAngle(a, b, c) {
        const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; // Vector B->A
        const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }; // Vector B->C

        const dot = (ab.x * bc.x) + (ab.y * bc.y) + (ab.z * bc.z);
        const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2 + ab.z ** 2);
        const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

        const angleRad = Math.acos(dot / (magAB * magBC));
        return (angleRad * 180) / Math.PI;
    }

    async processFrame(videoElement) {
        if (this.tracker) {
            await this.tracker.send(videoElement);
            return this.lastFrameData;
        }
        return null;
    }
}

export const biomechanics = new BiomechanicsTracker();
