import { ReactNode } from 'react';

// Modules Data
export const MODULES = [
    { id: 'm1', title: 'Module 1: Tuning & Basics', color: 'from-blue-500 to-cyan-400' },
    { id: 'm2', title: 'Module 2: Essential Chords', color: 'from-indigo-500 to-purple-500' },
    { id: 'm3', title: 'Module 3: Rock Riffs', color: 'from-rose-500 to-orange-400' },
    { id: 'm4', title: 'Module 4: Scales & Soloing', color: 'from-emerald-500 to-teal-400' },
    { id: 'm5', title: 'Module 5: Fingerstyle', color: 'from-amber-500 to-yellow-400' },
];

export const LESSONS = [
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
        ghost: 'default',
        briefing: "Moving down, tune the 4th string to D.",
        prompts: ["Pluck the 4th string."],
    },
    {
        id: 'tech_thumb',
        moduleId: 'm1',
        level: 4,
        title: 'Technique: The Claw',
        description: 'Proper left hand form.',
        xp: 50,
        type: 'posture',
        ghost: 'claw',
        briefing: "Good technique prevents pain. Keep your thumb behind the neck, like a claw.",
        prompts: ["Thumb behind the neck.", "Fingers arched."],
    },

    // --- MODULE 2: CHORDS ---
    {
        id: 'chord_em',
        moduleId: 'm2',
        level: 5,
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
        level: 6,
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

    // --- MODULE 3: RIFFS ---
    {
        id: 'riff_smoke',
        moduleId: 'm3',
        level: 7,
        title: 'Smoke on the Water',
        description: 'The legendary riff.',
        xp: 200,
        type: 'note',
        targetNote: 'G',
        targetOctave: 3,
        ghost: 'default',
        briefing: "0-3-5! Play the open G string, then 3rd fret, then 5th fret. Let's verify you can hit that G note on the 3rd fret Low E.",
        prompts: ["Play Low E, 3rd Fret (G)."],
    },
    {
        id: 'riff_seven',
        moduleId: 'm3',
        level: 8,
        title: 'Seven Nation Army',
        description: 'Powerful bass line.',
        xp: 200,
        type: 'note',
        targetNote: 'E',
        targetOctave: 2,
        ghost: 'default',
        briefing: "Start on the 7th fret of the A string (E). Da-da-da-da-da...",
        prompts: ["Play A string, 7th Fret."]
    },

    // --- MODULE 4: SCALES ---
    {
        id: 'scale_c_major',
        moduleId: 'm4',
        level: 9,
        title: 'C Major Scale',
        description: 'Do Re Mi... basics of melody.',
        xp: 300,
        type: 'note',
        targetNote: 'C',
        targetOctave: 3,
        ghost: 'default',
        briefing: "Let's play the C Major scale. Start on C (A string, 3rd fret).",
        prompts: ["Play C (A string, 3rd fret)."]
    },
    {
        id: 'scale_pentatonic',
        moduleId: 'm4',
        level: 10,
        title: 'Minor Pentatonic',
        description: 'The soloist\'s secret weapon.',
        xp: 300,
        type: 'note',
        targetNote: 'A',
        targetOctave: 2,
        ghost: 'default',
        briefing: "Pattern 1 starts on Low E, 5th fret (A).",
        prompts: ["Play A (Low E, 5th Fret)."]
    },

    // --- MODULE 5: FINGERSTYLE ---
    {
        id: 'finger_pimam',
        moduleId: 'm5',
        level: 11,
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
