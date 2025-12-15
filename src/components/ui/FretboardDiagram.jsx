import React from 'react';

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
    variant = 'default' // 'default' | 'compact'
}) => {
    // Determine active string index (0=High E, 5=Low E)
    // Legacy support
    const stringMap = { 'E4': 0, 'B3': 1, 'G3': 2, 'D3': 3, 'A2': 4, 'E2': 5 };
    const targetStringIdx = activeString ? stringMap[activeString] : -1;

    // Number of frets to display
    const numFrets = totalFrets;

    // Array representing the strings for rendering (0=High E, 5=Low E)
    // Wait, let's verify GUITAR_STRINGS index mapping.
    // audioEngine::GUITAR_STRINGS[0] is Low E.
    // FretboardDiagram::Strings[5] is Low E if we start 0=High.
    // So StringIdx from AudioEngine (0=Low E) needs conversion if Fretboard uses 0=High E.
    // Here: stringsToRender = [0, 1, 2, 3, 4, 5]. Names: e, B, G... (High to Low).
    // So 0 is High E.
    // AudioEngine 0 is Low E.
    // Conversion: FretboardIdx = 5 - AudioIdx.

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

    const containerClass = variant === 'compact'
        ? "w-full max-w-4xl mx-auto select-none pl-6" // decreased padding, no border/shadow by default (handled by consumer)
        : "w-full max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-2xl relative select-none";

    return (
        <div className={containerClass}>
            {/* Scroll container for smaller screens if needed, though we aim for fit */}
            <div className="relative h-full min-h-[120px] w-full select-none">

                {/* Nut/Fret Labels Background */}
                {variant !== 'compact' && (
                    <div className="absolute inset-x-0 -top-6 flex justify-between text-xs text-slate-500 font-mono px-[2%]">
                        {[...Array(numFrets + 1)].map((_, i) => (
                            <span key={i} style={{ width: `${100 / numFrets}%`, textAlign: 'center' }}>
                                {i === 0 ? 'Nut' : i}
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

                {/* Strings and Notes Layer */}
                <div className={`absolute inset-0 flex flex-col justify-between pointer-events-none ${variant === 'compact' ? 'py-2' : 'py-4'}`}>
                    {stringsToRender.map((s, stringIdx) => {
                        // Determine if this string matches the played Audio String
                        // AudioIdx 0=Low .. 5=High.
                        // StringIdx 0=High .. 5=Low.
                        // Match check:
                        const isPlayedString = playedStringIdx !== null && (5 - playedStringIdx) === stringIdx;

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
                                    const currentNoteName = getNoteName(s, f);

                                    // Position Logic:
                                    // Nut is 0. Frets are 1..12.
                                    // We need to center the note within the fret space.
                                    // Nut is special (left-most line).
                                    // Fret 1 is center of first division.
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
                                            {/* Played Note Feedback (Blue) */}
                                            {isPlayedString && playedFret === f && (
                                                <div className="absolute w-6 h-6 rounded-full bg-indigo-500 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-30 animate-pulse pointer-events-none">
                                                </div>
                                            )}

                                            {/* Target Indicator (Green) */}
                                            {isTargetFret && (
                                                <div className={`
                                                    absolute rounded-full border-2 border-white/20 flex items-center justify-center animate-bounce z-20 transition-all duration-300
                                                    ${variant === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-8 h-8 text-xs'}
                                                    ${(isPlayedString && playedFret === f)
                                                        ? 'bg-green-500/40 shadow-[0_0_30px_rgba(34,197,94,1)] scale-125' // When played: transparent & glowier
                                                        : 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]'
                                                    }
                                                `}>
                                                    <span className="text-slate-950 font-black">
                                                        {activeMarkers[0].disp || ''}
                                                    </span>
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
