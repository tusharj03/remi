/**
 * Community Simulator
 * Generates fake "Live" events to make the platform feel alive.
 */

const NAMES = [
    "Alex M.", "Sarah K.", "Mike R.", "Jessica T.", "David L.", "Emily W.", "Chris P.", "Emma S.", "Daniel H.", "Olivia B.",
    "Ryan G.", "Sophia C.", "Lucas F.", "Mia V.", "Ethan D.", "Isabella N.", "Aiden J.", "Ava M.", "Logan K.", "Charlotte P."
];

const ACTIONS = [
    { text: "just started E Minor", icon: "🎸" },
    { text: "mastered the G Chord!", icon: "🔥" },
    { text: "hit a 7-day streak", icon: "⚡" },
    { text: "is tuning their guitar", icon: "🎵" },
    { text: "completed Module 1", icon: "🏆" },
    { text: "earned the 'Shredder' badge", icon: "🏅" },
    { text: "played 'Smoke on the Water' perfectly", icon: "🤘" },
    { text: "is practicing fingerstyle", icon: "🖐️" },
    { text: "joined the Diamond League", icon: "💎" },
    { text: "shared a recording", icon: "🎤" }
];

const LOCATIONS = [
    { x: 20, y: 30, city: "New York" },
    { x: 45, y: 35, city: "London" },
    { x: 70, y: 40, city: "Tokyo" },
    { x: 15, y: 45, city: "Los Angeles" },
    { x: 55, y: 25, city: "Berlin" },
    { x: 80, y: 60, city: "Sydney" },
    { x: 30, y: 70, city: "Rio" },
    { x: 60, y: 30, city: "Moscow" },
    { x: 75, y: 50, city: "Singapore" },
    { x: 35, y: 20, city: "Toronto" }
];

class CommunitySim {
    constructor() {
        this.listeners = new Set();
        this.interval = null;
    }

    start() {
        if (this.interval) return;

        // Populate initial buffer
        for (let i = 0; i < 8; i++) {
            this.emitRandomEvent();
        }

        // High frequency updates for "Live" feel
        this.interval = setInterval(() => {
            if (Math.random() > 0.2) this.emitRandomEvent();
        }, 600);
    }

    subscribe(cb) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    emitRandomEvent() {
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

        // Randomize location slightly to avoid stacking
        const fuzzyLoc = {
            ...loc,
            x: loc.x + (Math.random() * 4 - 2),
            y: loc.y + (Math.random() * 4 - 2)
        };

        const event = {
            id: Date.now() + Math.random(),
            user: name,
            message: action.text,
            icon: action.icon,
            location: fuzzyLoc,
            timestamp: new Date()
        };

        this.listeners.forEach(cb => cb(event));
    }

    stop() {
        clearInterval(this.interval);
        this.interval = null;
    }
}

export const communitySim = new CommunitySim();
