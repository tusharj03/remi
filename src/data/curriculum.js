import { ReactNode } from 'react';

// Modules Data
export const MODULES = [
    { id: 'm_posture', title: 'Module 1: Posture & Form', color: 'from-pink-500 to-rose-400' },
    { id: 'm1', title: 'Module 2: Tuning & Basics', color: 'from-blue-500 to-cyan-400' },
    { id: 'm2', title: 'Module 3: Essential Chords', color: 'from-indigo-500 to-purple-500' },
    { id: 'm3', title: 'Module 4: Rock Riffs', color: 'from-rose-500 to-orange-400' },
    { id: 'm4', title: 'Module 5: Scales & Soloing', color: 'from-emerald-500 to-teal-400' },
    { id: 'm5', title: 'Module 6: Fingerstyle', color: 'from-amber-500 to-yellow-400' },
];

export const LESSONS = [
    // --- MODULE: POSTURE ---
    {
        id: 'posture_sitting',
        moduleId: 'm_posture',
        level: 1,
        title: 'Sitting Posture',
        description: 'The foundation of playing.',
        xp: 30,
        type: 'posture',
        ghost: 'default',
        briefing: "Sit on the edge of your chair. Hold the guitar comfortably.",
        prompts: ["Back straight.", "Shoulders relaxed."]
    },
    {
        id: 'tech_thumb',
        moduleId: 'm_posture',
        level: 2,
        title: 'Technique: The Claw',
        description: 'Proper left hand form.',
        xp: 50,
        type: 'posture',
        ghost: 'claw',
        briefing: "Curve your fingers. Use your thumb for support (it's okay if it's hidden behind the neck).",
        prompts: ["Fingers curved.", "Knuckles raised."],
    },

    // --- MODULE 1: TUNING ---
    {
        id: 'tune_e',
        moduleId: 'm1',
        level: 1,
        title: 'Tune: Low E',
        description: 'The thickest string (6th).',
        xp: 20,
        type: 'note',
        targetNote: 'E',
        targetOctave: 2,
        string: 6, // Low E
        fret: 0,
        ghost: 'default',
        briefing: "Let's tune the 6th string, the thickest one. It should be an E.",
        prompts: ["Pluck the thickest string.", "Tune until the needle is green."],
    },
    {
        id: 'tune_a',
        moduleId: 'm1',
        level: 2,
        title: 'Tune: A String',
        description: 'The 5th string.',
        xp: 20,
        type: 'note',
        targetNote: 'A',
        targetOctave: 2,
        string: 5, // A string
        fret: 0,
        ghost: 'default',
        briefing: "Next is the 5th string (A). It's the second thickest.",
        prompts: ["Pluck the 5th string."],
    },
    {
        id: 'tune_d',
        moduleId: 'm1',
        level: 3,
        title: 'Tune: D String',
        description: 'The 4th string.',
        xp: 20,
        type: 'note',
        targetNote: 'D',
        targetOctave: 3,
        string: 4, // D string
        fret: 0,
        briefing: "Moving down, tune the 4th string to D.",
        prompts: ["Pluck the 4th string."],
    },
    {
        id: 'tune_g',
        moduleId: 'm1',
        level: 4,
        title: 'Tune: G String',
        description: 'The 3rd string.',
        xp: 20,
        type: 'note',
        targetNote: 'G',
        targetOctave: 3,
        string: 3,
        fret: 0,
        briefing: "Tune the 3rd string to G.",
        prompts: ["Pluck the 3rd string."],
    },
    {
        id: 'tune_b',
        moduleId: 'm1',
        level: 5,
        title: 'Tune: B String',
        description: 'The 2nd string.',
        xp: 20,
        type: 'note',
        targetNote: 'B',
        targetOctave: 3,
        string: 2,
        fret: 0,
        briefing: "Tune the 2nd string (B). Almost there.",
        prompts: ["Pluck the 2nd string."],
    },
    {
        id: 'tune_e_high',
        moduleId: 'm1',
        level: 6,
        title: 'Tune: High E',
        description: 'The thinnest string (1st).',
        xp: 20,
        type: 'note',
        targetNote: 'E',
        targetOctave: 4,
        string: 1,
        fret: 0,
        briefing: "Finally, the thinnest string (High E).",
        prompts: ["Pluck the 1st string."],
    },



    // --- MODULE 3: CHORDS ---
    {
        id: 'chord_em',
        moduleId: 'm2',
        level: 1,
        title: 'The E Minor Chord',
        description: 'Dark and moody.',
        xp: 100,
        type: 'strum',
        requiredNotes: ['E', 'G', 'B'],
        ghost: 'chord_em',
        chordData: {
            name: 'Em',
            fingers: [
                { string: 5, fret: 2, finger: 2 },
                { string: 4, fret: 2, finger: 3 }
            ]
        },
        briefing: "Place your middle finger on A2 and ring finger on D2. Strum all 6 strings.",
        prompts: ["Ffingers on A2, D2.", "Strum everything."],
    },
    {
        id: 'chord_g',
        moduleId: 'm2',
        level: 2,
        title: 'G Major Chord',
        description: 'The big bright chord.',
        xp: 150,
        type: 'strum',
        requiredNotes: ['G', 'B', 'D'],
        ghost: 'chord_em', // Reuse for now or add G specific
        chordData: {
            name: 'G',
            fingers: [
                { string: 6, fret: 3, finger: 2 },
                { string: 5, fret: 2, finger: 1 },
                { string: 1, fret: 3, finger: 3 }
            ]
        },
        briefing: "This one uses the whole neck. Middle on Low E (3rd fret). Index on A (2nd fret). Ring on High E (3rd fret).",
        prompts: ["Stretch your fingers.", "Strum all 6."],
    },
    {
        id: 'chord_c',
        moduleId: 'm2',
        level: 3,
        title: 'C Major Chord',
        description: 'The people\'s chord.',
        xp: 150,
        type: 'strum',
        requiredNotes: ['C', 'E', 'G'],
        ghost: 'chord_em',
        chordData: {
            name: 'C',
            fingers: [
                { string: 5, fret: 3, finger: 3 },
                { string: 4, fret: 2, finger: 2 },
                { string: 2, fret: 1, finger: 1 }
            ]
        },
        briefing: "Standard C Major. Ring on A3, Middle on D2, Index on B1. Don't play the Low E.",
        prompts: ["Don't Play Low E", "Arch fingers."]
    },
    {
        id: 'chord_d',
        moduleId: 'm2',
        level: 4,
        title: 'D Major Chord',
        description: 'Bright and triangle shaped.',
        xp: 150,
        type: 'strum',
        requiredNotes: ['D', 'F#', 'A'],
        ghost: 'chord_em',
        chordData: {
            name: 'D',
            fingers: [
                { string: 3, fret: 2, finger: 1 },
                { string: 2, fret: 3, finger: 3 },
                { string: 1, fret: 2, finger: 2 }
            ]
        },
        briefing: "Make a triangle. Index G2, Ring B3, Middle E2. Strum bottom 4 strings.",
        prompts: ["Strum 4 strings only."]
    },
    {
        id: 'chord_am',
        moduleId: 'm2',
        level: 5,
        title: 'A Minor Chord',
        description: 'Sad but hopeful.',
        xp: 150,
        type: 'strum',
        requiredNotes: ['A', 'C', 'E'],
        ghost: 'chord_em',
        chordData: {
            name: 'Am',
            fingers: [
                { string: 4, fret: 2, finger: 2 },
                { string: 3, fret: 2, finger: 3 },
                { string: 2, fret: 1, finger: 1 }
            ]
        },
        briefing: "Like E Major, but moved down. Middle D2, Ring G2, Index B1.",
        prompts: ["Strum from A string."]
    },

    // --- MODULE 3: RIFFS ---
    {
        id: 'riff_smoke',
        moduleId: 'm3',
        level: 1,
        title: 'Smoke on the Water',
        description: 'The legendary riff.',
        xp: 200,
        bpm: 112,
        type: 'note',
        targetNote: 'G',
        targetOctave: 3,
        ghost: 'default',
        sequence: [
            { note: 'G', octave: 3, string: 6, fret: 3, disp: '3', duration: 1 }, // Dun
            { note: 'A#', octave: 3, string: 6, fret: 6, disp: '6', duration: 1 }, // Dun
            { note: 'C', octave: 4, string: 6, fret: 8, disp: '8', duration: 1.5 }, // Duuun
            { note: 'G', octave: 3, string: 6, fret: 3, disp: '3', duration: 1 }, // Dun
            { note: 'A#', octave: 3, string: 6, fret: 6, disp: '6', duration: 1 }, // Dun
            { note: 'C#', octave: 4, string: 6, fret: 9, disp: '9', duration: 0.5 }, // da
            { note: 'C', octave: 4, string: 6, fret: 8, disp: '8', duration: 2 }, // Duuuun
            { note: 'G', octave: 3, string: 6, fret: 3, disp: '3', duration: 1 }, // Dun
            { note: 'A#', octave: 3, string: 6, fret: 6, disp: '6', duration: 1 }, // Dun
            { note: 'C', octave: 4, string: 6, fret: 8, disp: '8', duration: 1.5 }, // Duuun
            { note: 'A#', octave: 3, string: 6, fret: 6, disp: '6', duration: 1 }, // Dun
            { note: 'G', octave: 3, string: 6, fret: 3, disp: '3', duration: 2 }, // Dun
        ],
        briefing: "0-3-5 on Low E. Rhythm: Dun-dun-dun... Dun-dun-DA-dun...",
        prompts: ["Follow the notes."]
    },
    {
        id: 'riff_seven',
        moduleId: 'm3',
        level: 2,
        title: 'Seven Nation Army',
        description: 'Powerful bass line.',
        xp: 200,
        bpm: 120,
        type: 'note',
        targetNote: 'E',
        targetOctave: 2,
        ghost: 'default',
        sequence: [
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 1.5 }, // Bum...
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 0.5 }, // bum
            { note: 'G', octave: 3, string: 5, fret: 10, disp: '10', duration: 1 }, // bum
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 1 }, // bum
            { note: 'D', octave: 3, string: 5, fret: 5, disp: '5', duration: 1 }, // bum
            { note: 'C', octave: 3, string: 5, fret: 3, disp: '3', duration: 2 }, // buuum...
            { note: 'B', octave: 2, string: 5, fret: 2, disp: '2', duration: 2 },  // buuum...

            // Part 2 (Variation)
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 1.5 }, // Bum...
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 0.5 }, // bum
            { note: 'G', octave: 3, string: 5, fret: 10, disp: '10', duration: 1 }, // bum
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 1 }, // bum
            { note: 'D', octave: 3, string: 5, fret: 5, disp: '5', duration: 1 }, // bum
            { note: 'C', octave: 3, string: 5, fret: 3, disp: '3', duration: 1 }, // bum (variation)
            { note: 'D', octave: 3, string: 5, fret: 5, disp: '5', duration: 1 }, // bum (variation)
            { note: 'C', octave: 3, string: 5, fret: 3, disp: '3', duration: 1 }, // bum (variation)
            { note: 'B', octave: 2, string: 5, fret: 2, disp: '2', duration: 2 }   // buuum...
        ],
        briefing: "Start on 7th fret. Rhythm: Bum... bum-bum-bum-bum... bum... bum...",
        prompts: ["Use the A string."]
    },

    // --- MODULE 5: SCALES ---
    {
        id: 'scale_c_major',
        moduleId: 'm4',
        level: 1,
        title: 'C Major Scale',
        description: 'Do Re Mi... basics of melody.',
        xp: 300,
        bpm: 100,
        type: 'note',
        targetNote: 'C',
        targetOctave: 3,
        ghost: 'default',
        sequence: [
            { note: 'C', octave: 3, string: 5, fret: 3, disp: 'C', duration: 1 },
            { note: 'D', octave: 3, string: 5, fret: 5, disp: 'D', duration: 1 },
            { note: 'E', octave: 3, string: 5, fret: 7, disp: 'E', duration: 1 },
            { note: 'F', octave: 3, string: 4, fret: 3, disp: 'F', duration: 1 },
            { note: 'G', octave: 3, string: 4, fret: 5, disp: 'G', duration: 1 },
            { note: 'A', octave: 3, string: 4, fret: 7, disp: 'A', duration: 1 },
            { note: 'B', octave: 3, string: 3, fret: 4, disp: 'B', duration: 1 },
            { note: 'C', octave: 4, string: 3, fret: 5, disp: 'C', duration: 1 }
        ],
        briefing: "Play the C Major scale ascending (C to C).",
        prompts: ["Use A, D, and G strings."]
    },
    {
        id: 'scale_g_major',
        moduleId: 'm4',
        level: 2,
        title: 'G Major Scale',
        description: 'The people\'s key.',
        xp: 300,
        type: 'note',
        targetNote: 'G',
        targetOctave: 2,
        ghost: 'default',
        sequence: [
            { note: 'G', octave: 2, string: 6, fret: 3, disp: 'G', duration: 1 },
            { note: 'A', octave: 2, string: 6, fret: 5, disp: 'A', duration: 1 },
            { note: 'B', octave: 2, string: 5, fret: 2, disp: 'B', duration: 1 },
            { note: 'C', octave: 3, string: 5, fret: 3, disp: 'C', duration: 1 },
            { note: 'D', octave: 3, string: 5, fret: 5, disp: 'D', duration: 1 },
            { note: 'E', octave: 3, string: 4, fret: 2, disp: 'E', duration: 1 },
            { note: 'F#', octave: 3, string: 4, fret: 4, disp: 'F#', duration: 1 },
            { note: 'G', octave: 3, string: 4, fret: 5, disp: 'G', duration: 1 }
        ],
        briefing: "G Major Scale, starting on Low E (3rd Fret).",
        prompts: ["Watch the stretch."]
    },
    {
        id: 'scale_pentatonic',
        moduleId: 'm4',
        level: 3,
        title: 'Minor Pentatonic',
        description: 'The soloist\'s secret weapon.',
        xp: 300,
        type: 'note',
        targetNote: 'A',
        targetOctave: 2,
        ghost: 'default',
        sequence: [
            { note: 'A', octave: 2, string: 6, fret: 5, disp: '5', duration: 1 },
            { note: 'C', octave: 3, string: 6, fret: 8, disp: '8', duration: 1 },
            { note: 'D', octave: 3, string: 5, fret: 5, disp: '5', duration: 1 },
            { note: 'E', octave: 3, string: 5, fret: 7, disp: '7', duration: 1 },
            { note: 'G', octave: 3, string: 4, fret: 5, disp: '5', duration: 1 },
            { note: 'A', octave: 3, string: 4, fret: 7, disp: '7', duration: 1 }
        ],
        briefing: "A Minor Pentatonic Box 1. Low E to G string.",
        prompts: ["Follow the pentatonic box."]
    },

    // --- MODULE 6: FINGERSTYLE ---
    {
        id: 'finger_pimam',
        moduleId: 'm5',
        level: 1,
        title: 'P-I-M-A Pattern',
        description: 'Thumb, Index, Middle, Ring.',
        xp: 400,
        type: 'posture',
        ghost: 'claw',
        briefing: "Fingerpicking needs a steady hand. Rest your thumb on the Low E.",
        prompts: ["Thumb on Low E."]
    }
];

export const getLessonById = (id) => LESSONS.find(l => l.id === id);
export const getLessonsByModule = (moduleId) => LESSONS.filter(l => l.moduleId === moduleId);
