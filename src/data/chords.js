export const CHORDS = [
    {
        id: 'c_major',
        name: 'C Major',
        type: 'Open',
        difficulty: 'Easy',
        description: 'One of the first chords you learn. Bright and happy.',
        fingers: [
            { string: 5, fret: 3, finger: 3 }, // Ring on A3
            { string: 4, fret: 2, finger: 2 }, // Middle on D2
            { string: 2, fret: 1, finger: 1 }, // Index on B1
        ],
        muted: [6] // Mute Low E
    },
    {
        id: 'a_major',
        name: 'A Major',
        type: 'Open',
        difficulty: 'Easy',
        description: 'Three fingers in a row. Very useful for rock and pop.',
        fingers: [
            { string: 4, fret: 2, finger: 1 },
            { string: 3, fret: 2, finger: 2 },
            { string: 2, fret: 2, finger: 3 },
        ],
        muted: [6]
    },
    {
        id: 'g_major',
        name: 'G Major',
        type: 'Open',
        difficulty: 'Easy',
        description: 'The big chord. Uses all 6 strings.',
        fingers: [
            { string: 6, fret: 3, finger: 2 },
            { string: 5, fret: 2, finger: 1 },
            { string: 1, fret: 3, finger: 3 },
        ],
        muted: []
    },
    {
        id: 'e_major',
        name: 'E Major',
        type: 'Open',
        difficulty: 'Easy',
        description: 'Powerful and full sounding.',
        fingers: [
            { string: 5, fret: 2, finger: 2 },
            { string: 4, fret: 2, finger: 3 },
            { string: 3, fret: 1, finger: 1 },
        ],
        muted: []
    },
    {
        id: 'd_major',
        name: 'D Major',
        type: 'Open',
        difficulty: 'Medium',
        description: 'Bright and triangle shaped.',
        fingers: [
            { string: 3, fret: 2, finger: 1 },
            { string: 1, fret: 2, finger: 2 },
            { string: 2, fret: 3, finger: 3 },
        ],
        muted: [6, 5]
    },
    {
        id: 'em',
        name: 'E Minor',
        type: 'Open',
        difficulty: 'Easy',
        description: 'Sad and simple. Only two fingers.',
        fingers: [
            { string: 5, fret: 2, finger: 2 },
            { string: 4, fret: 2, finger: 3 },
        ],
        muted: []
    },
    {
        id: 'am',
        name: 'A Minor',
        type: 'Open',
        difficulty: 'Easy',
        description: 'Sad version of A Major.',
        fingers: [
            { string: 4, fret: 2, finger: 2 },
            { string: 3, fret: 2, finger: 3 },
            { string: 2, fret: 1, finger: 1 },
        ],
        muted: [6]
    },
    {
        id: 'f_maj',
        name: 'F Major (Barre)',
        type: 'Barre',
        difficulty: 'Hard',
        description: 'The hurdle. Requires a barre across the 1st fret.',
        fingers: [
            { string: 6, fret: 1, finger: 1, barre: true }, // Barre
            { string: 5, fret: 3, finger: 3 },
            { string: 4, fret: 3, finger: 4 },
            { string: 3, fret: 2, finger: 2 },
        ],
        muted: []
    }
];
