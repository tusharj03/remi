import { Hands } from '@mediapipe/hands';

let hands = null;
let camera = null;

export const initHandTracker = async (onResults, options = {}) => {
    const { isLefty = false } = options;

    if (!hands) {
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const neckData = processNeckFromHands(results.multiHandLandmarks, isLefty);
                // [NEW] Pass raw landmarks for Debug Skeleton
                onResults({ ...neckData, landmarks: results.multiHandLandmarks });
            } else {
                onResults({ found: false });
            }
        });

        await hands.initialize(); // Ensure fully loaded
    }

    return {
        send: async (videoElement) => {
            if (hands) await hands.send({ image: videoElement });
        }
    };
};

const processNeckFromHands = (landmarksArray, isLefty = false) => {
    // We assume:
    // One hand is "Strumming" (Body) -> Wrist
    // One hand is "Fretting" (Neck) -> Index Finger MCP (Knuckle)

    if (landmarksArray.length < 2) {
        return { found: false, reason: 'Need 2 hands' };
    }

    // Sort by X coordinate of wrist (landmark 0)
    // 0 = Left side of screen, 1 = Right side of screen
    const sortedHands = landmarksArray.map(l => l).sort((a, b) => a[0].x - b[0].x);

    // Lefty Mode:
    // Neck is held by RIGHT Hand -> Appears on RIGHT side (Mirror) -> Large X
    // Strum is held by LEFT Hand -> Appears on LEFT side (Mirror) -> Small X
    // Righty Mode (Standard):
    // Neck is held by LEFT Hand -> Appears on LEFT side (Mirror) -> Small X
    // Strum is held by RIGHT Hand -> Appears on RIGHT side (Mirror) -> Large X
    const frettingHand = sortedHands[isLefty ? 1 : 0]; // Neck
    const strummingHand = sortedHands[isLefty ? 0 : 1]; // Body

    // [MODIFIED] Validation: Enforce Spatial Logic
    // Lefty: Neck (Right Hand) should be on RIGHT (Large X) relative to Body.
    // Righty: Neck (Left Hand) should be on LEFT (Small X) relative to Body.
    // If sortedHands is accurate, this is tautological, BUT sortedHands might just be "two hands".
    // We trust sortedHands[0] is Left-Screen, sortedHands[1] is Right-Screen.

    // Lefty: Neck=sortedHands[1] (Right), Body=sortedHands[0] (Left).
    // So Neck.x > Body.x.
    // The sort() guarantees this.

    // BUT: If user crosses hands? (e.g. playing weirdly or noise).
    // We already check distance.

    // [MODIFIED] Consistent Wrist-to-Wrist Tracking
    // We use Wrists (Landmark 0) for both hands to ensure the vector is consistent.
    const start = frettingHand[0]; // Nut (Wrist)
    const end = strummingHand[0];  // Body (Wrist)
    
    // Safety: Check Orientation Consistency
    if (isLefty && start.x < end.x) {
         return { found: false, reason: 'Crossed Hands' };
    }
    if (!isLefty && start.x > end.x) {
         return { found: false, reason: 'Crossed Hands' };
    }

    // Safety: Check Distance
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 0.2) {
        return { found: false, reason: 'Hands too close' };
    }

    // Offset: Shift UP significantly because Wrists are below the neck.
    const Y_OFFSET = -0.15; 

    const raw = {
        found: true,
        start_x: start.x * 100,
        start_y: (start.y + Y_OFFSET) * 100,
        end_x: end.x * 100,
        end_y: (end.y + Y_OFFSET) * 100,
        start_width: 12, 
        end_width: 18
    };

// [NEW] Smoothing (Simple LERP)
    return applySmoothing(raw);
};

// Simple EMA Smoothing
let lastResult = null;
const SMOOTH_FACTOR = 0.15; // Moderate smoothing for all axes

const applySmoothing = (newResult) => {
    if (!lastResult) {
        lastResult = newResult;
        return newResult;
    }

    const smooth = (curr, prev) => prev + (curr - prev) * SMOOTH_FACTOR;

    const smoothed = {
        found: true,
        start_x: smooth(newResult.start_x, lastResult.start_x),
        start_y: smooth(newResult.start_y, lastResult.start_y),
        end_x: smooth(newResult.end_x, lastResult.end_x),
        end_y: smooth(newResult.end_y, lastResult.end_y),
        
        start_width: 12,
        end_width: 18
    };

    lastResult = smoothed;
    return smoothed;
};
