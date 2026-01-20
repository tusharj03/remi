import React from 'react';
import { Hand } from 'lucide-react';

// --- Constants ---
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRING_TUNING = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E (Standard High to Low)

const getNoteName = (stringIdx, fret) => {
    // stringIdx 0 = High E (Tuning[0] = 4 'E')
    // Note index = (Base + Fret) % 12
    const base = STRING_TUNING[stringIdx];
    const index = (base + fret) % 12;
    return NOTES[index];
};

// [NEW] Helper to get Octave for a given string/fret
const getNoteOctave = (stringIdx, fret) => {
    const tuning = STRING_TUNING[stringIdx]; // Base note index (e.g. E is 4)
    // We need Octave Data.
    // Standard Tuning Octaves:
    // Low E (5): E2
    // A (4): A2
    // D (3): D3
    // G (2): G3
    // B (1): B3
    // High E (0): E4

    const stringBaseOctaves = [4, 3, 3, 3, 2, 2]; // High E -> Low E
    let octave = stringBaseOctaves[stringIdx];

    // Calculate semitone distance from open string
    // If wrapping around C (index 0), increment octave
    // E (4) -> F (5) ... B (11) -> C (0) [Octave++]

    let currentNoteIdx = tuning;
    for (let f = 1; f <= fret; f++) {
        currentNoteIdx++;
        if (currentNoteIdx === 12) {
            currentNoteIdx = 0;
            octave++;
        }
    }
    return octave;
};

export const FretboardDiagram = ({
    activeString, // e.g., 'E4' (High E), 'E2' (Low E)
    highlightFret, // e.g., 3
    highlightNotes, // [NEW] e.g. [{ string: 6, fret: 3, disp: 'G' }]
    playedFret = null, // [NEW] e.g. 5
    playedStringIdx = null, // [NEW] e.g. 0 (Low E)
    totalFrets = 12, // [NEW] prop to control length
    variant = 'default', // 'default' | 'compact'
    showFretLabels = false, // [NEW] Force show labels even in compact mode
    className = "" // [NEW] Allow overrides
}) => {
    // Determine active string index (0=High E, 5=Low E)
    // Legacy support
    const stringMap = { 'E4': 0, 'B3': 1, 'G3': 2, 'D3': 3, 'A2': 4, 'E2': 5 };
    const targetStringIdx = activeString ? stringMap[activeString] : -1;

    // Number of frets to display
    const numFrets = totalFrets;

    const stringsToRender = [0, 1, 2, 3, 4, 5];

    // [NEW] Normalized Assignments
    let markers = [];
    if (highlightNotes) {
        markers = highlightNotes;
    } else if (activeString) {
        // Legacy convert
        const stringMap = { 'E4': 0, 'B3': 1, 'G3': 2, 'D3': 3, 'A2': 4, 'E2': 5 };
        markers = [{ string: stringMap[activeString] !== undefined ? stringMap[activeString] + 1 : 6, fret: highlightFret, disp: activeString }];
    }

    const getIndex = (sNum) => sNum - 1;

    // Detect if we have a mismatch to draw the arrow
    let mismatchDetail = null;
    if (playedStringIdx !== null && playedFret !== null && markers.length > 0) {
        // Find if played note matches any target
        // Note: markers use 1-based string index (1=High E, 6=Low E)
        // playedStringIdx uses 0=High, 5=Low (from component logic below? Wait, let's normalize)

        // Let's assume input playedStringIdx is 0 (High E) to 5 (Low E), SAME as stringsToRender map below.
        // Marker.string is 1-based.

        const playedString0Based = playedStringIdx; // 5 = Low E
        const playedString1Based = playedStringIdx + 1; // 6 = Low E

        const match = markers.find(m => m.string === playedString1Based && m.fret === playedFret);

        if (!match) {
            // MISMATCH!
            // We want to point from Played -> Target.
            // Assumption: Single Note target for now (take first marker)
            const target = markers[0];

            // Calculate relative coordinates for SVG arrow
            // X: Fret position. Fret 0 is 0%. Fret 12 is 100%.
            // Y: String position. String 0 (High E) is Top. String 5 (Low E) is Bottom.

            const pFret = playedFret;
            const tFret = target.fret;
            const pStr = playedStringIdx; // 0-5
            const tStr = target.string - 1; // 0-5

            mismatchDetail = { pFret, pStr, tFret, tStr };
        }
    }

    const baseClass = variant === 'compact'
        ? "w-full max-w-4xl mx-auto select-none pl-6"
        : "w-full max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-2xl relative select-none";

    const containerClass = `${baseClass} ${className}`;

    return (
        <div className={containerClass}>
            {/* Scroll container for smaller screens if needed, though we aim for fit */}
            <div className="relative h-full w-full select-none flex flex-col justify-between">

                {/* Nut/Fret Labels Background */}
                {(variant !== 'compact' || showFretLabels) && (
                    <div className="absolute inset-x-0 -top-6 flex justify-between text-xs text-slate-500 font-mono px-[2%]">
                        {[...Array(numFrets + 1)].map((_, i) => (
                            <span key={i} style={{ width: `${100 / numFrets}%`, textAlign: 'center' }}>
                                {i + 1}
                            </span>
                        ))}
                    </div>
                )}

                {/* Frets Vertical Lines relative to container */}
                <div className="absolute inset-0 flex border-l-4 border-slate-600">
                    {[...Array(numFrets)].map((_, i) => (
                        <div key={i} className="flex-1 border-r border-slate-700/30 relative">
                            {/* Fret wire visual */}
                            <div className={`absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-slate-600 to-slate-800 shadow-sm ${variant === 'compact' ? 'opacity-30' : 'opacity-100'}`}></div>
                            {/* Inlay Dots */}
                            {[3, 5, 7, 9].includes(i + 1) && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 shadow-inner"></div>
                            )}
                            {(i + 1) === 12 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
                                    <div className="w-4 h-4 rounded-full bg-slate-800 shadow-inner"></div>
                                    <div className="w-4 h-4 rounded-full bg-slate-800 shadow-inner"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ARROW OVERLAY REMOVED */}


                {/* Strings and Notes Layer */}
                <div className={`absolute inset-0 flex flex-col justify-between pointer-events-none ${variant === 'compact' ? 'py-2 px-1' : 'py-6'}`}>
                    {stringsToRender.map((s, stringIdx) => {
                        // Determine if this string matches the played Audio String
                        // stringIdx here is 0..5 (High..Low) (Wait, map says s is 0..5)
                        // playedStringIdx passed is 0..High, 5..Low (assumed from PracticeSession)

                        const isPlayedString = playedStringIdx !== null && playedStringIdx === s;

                        return (
                            <div key={s} className="relative w-full h-px group">
                                {/* String Line (variable thickness) */}
                                <div
                                    className="absolute inset-x-0 bg-slate-200 shadow-[0_0_4px_rgba(255,255,255,0.2)]"
                                    style={{
                                        // [UPDATED] Thickness: s=0(High E) -> Thin, s=5(Low E) -> Thick
                                        height: `${1 + (s * 0.6)}px`,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.6 + (s / 10) // Opacity also increases with thickness? Or maybe better constant.
                                    }}
                                />

                                {/* String Name Label (Left Side) - Adjusted for compact mode */}
                                <span className={`absolute top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold w-4 text-center ${variant === 'compact' ? '-left-5 text-[10px]' : '-left-8'}`}>
                                    {['e', 'B', 'G', 'D', 'A', 'E'][s]}
                                </span>

                                {/* Fret Markers/Notes */}
                                {[...Array(numFrets + 1)].map((_, f) => {
                                    const activeMarkers = markers.filter(m => getIndex(m.string) === stringIdx && m.fret === f);
                                    const isTargetFret = activeMarkers.length > 0;

                                    // Error Logic: It is this note IF it's the played string AND played Fret
                                    // AND it is NOT a target fret.
                                    const isErrorNote = isPlayedString && playedFret === f && !isTargetFret;
                                    const isCorrectNote = isPlayedString && playedFret === f && isTargetFret;

                                    // Position Logic:
                                    const percentagePerFret = 100 / numFrets;
                                    const leftPos = f === 0
                                        ? '0%' // On the Nut
                                        : `${(f - 0.5) * percentagePerFret}%`; // Center of fret box

                                    return (
                                        <div
                                            key={`${s}-${f}`}
                                            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
                                            style={{ left: leftPos, width: 0, height: 0 }}
                                        >
                                            {/* WRONG / PLAYED NOTE (Blue/Purple) */}
                                            {isErrorNote && (
                                                <div className="absolute w-5 h-5 rounded-full bg-indigo-500 border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] z-30 animate-pulse pointer-events-none flex items-center justify-center px-1">
                                                    {/* No text, just a dot for "here is where you are" */}
                                                </div>
                                            )}

                                            {/* CORRECTLY PLAYED (Blue/Green overlay) */}
                                            {isCorrectNote && (
                                                <div className="absolute w-8 h-8 rounded-full bg-indigo-500 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-30 animate-pulse pointer-events-none"></div>
                                            )}

                                            {/* Target Indicator (Green) */}
                                            {isTargetFret && (
                                                <div className="relative">
                                                    {/* The Note Dot */}
                                                    <div className={`
                                                        absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20 flex items-center justify-center z-20 transition-all duration-300
                                                        ${variant === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
                                                        ${isCorrectNote
                                                            ? 'bg-green-500/80 shadow-[0_0_20px_rgba(34,197,94,0.8)] scale-110 animate-pulse'
                                                            : 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                                        }
                                                    `}>
                                                        <span className="text-white font-black">
                                                            {activeMarkers[0].disp || ''}
                                                        </span>
                                                    </div>


                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
