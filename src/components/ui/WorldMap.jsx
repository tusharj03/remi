import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Simplified World Map SVG Path (Mercator)
const WORLD_PATH = "M157.6,189.6l-0.6,2.1 ..."; // Placeholder for actual huge path? 
// No, I'll use a cleaner simplified geometry or just dots for now to avoid huge file size 
// or I can use a standard dotted world map pattern if I generate it programmatically.
// Let's use a programmatic "Dotted" map for that futuristic look.

export const WorldMap = ({ events }) => {

    // Generate static map dots (GRID)
    const dots = useMemo(() => {
        const d = [];
        for (let y = 0; y < 100; y += 4) {
            for (let x = 0; x < 200; x += 4) {
                // Simple mask to approximate continents (very rough heuristic)
                // Just random for "aesthetic" if I don't have geojson? 
                // Let's just do a grid.
                // Actually, let's use a backdrop image if possible, or just a nice grid.

                // Better: Creating a few "Continent" blobs with SVG paths is better than random dots.
                // I will use a simple stylized set of paths for continents.
            }
        }
        return d;
    }, []);

    return (
        <div className="w-full h-full relative flex items-center justify-center p-8 opacity-60 hover:opacity-100 transition-opacity duration-700">
            {/* Simple SVG Map */}
            <svg viewBox="0 0 800 400" className="w-full h-full drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <defs>
                    <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3730a3" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#3730a3" stopOpacity="0.4" />
                    </linearGradient>
                </defs>

                {/* Stylized Continents (Approximate) */}
                {/* North America */}
                <path d="M50,60 Q100,50 150,80 T200,150 T100,120 Z" fill="url(#mapGrad)" className="animate-pulse-slow" />
                {/* South America */}
                <path d="M160,180 Q200,180 220,250 T180,350 T140,250 Z" fill="url(#mapGrad)" className="animate-pulse-slow" style={{ animationDelay: '1s' }} />
                {/* Europe/Asia */}
                <path d="M320,60 Q450,40 600,60 T700,150 T500,180 T350,150 Z" fill="url(#mapGrad)" className="animate-pulse-slow" style={{ animationDelay: '2s' }} />
                {/* Africa */}
                <path d="M380,180 Q450,180 480,250 T420,350 T360,250 Z" fill="url(#mapGrad)" className="animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
                {/* Australia */}
                <path d="M620,280 Q680,280 700,320 T620,320 Z" fill="url(#mapGrad)" />

                {/* Grid Lines */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#6366f1" opacity="0.3" />
                </pattern>
                <rect width="800" height="400" fill="url(#grid)" opacity="0.5" />

                {/* LIVE PINGS */}
                {events.map((evt) => (
                    <circle
                        key={evt.id}
                        cx={evt.location.x * 8} // Scale 100 -> 800
                        cy={evt.location.y * 5} // Scale ~80 -> 400
                        r="3"
                        fill="#fff"
                        className="animate-ping"
                    />
                ))}
                {events.map((evt) => (
                    <circle
                        key={`c-${evt.id}`}
                        cx={evt.location.x * 8}
                        cy={evt.location.y * 5}
                        r="3"
                        fill="#4ade80"
                    />
                ))}
            </svg>
        </div>
    );
};
