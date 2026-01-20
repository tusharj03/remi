import React, { useState } from 'react';
import remiFlying from '@/assets/remi/flying.png';
import remiHappy from '@/assets/remi/happy.png';
import remiThinking from '@/assets/remi/thinking.png';

const QUOTES = [
    "You're doing great!",
    "Ready to shred?",
    "Don't forget to tune!",
    "I believe in you!",
    "Practice makes perfect."
];

export const RemiCompanion = () => {
    const [state, setState] = useState('flying'); // flying, happy, thinking
    const [message, setMessage] = useState(null);

    const handleInteraction = () => {
        setState('happy');
        setMessage(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        setTimeout(() => {
            setState('flying');
            setMessage(null);
        }, 3000);
    };

    const getImage = () => {
        if (state === 'happy') return remiHappy;
        if (state === 'thinking') return remiThinking;
        return remiFlying;
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Bubble */}
            {message && (
                <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl rounded-br-none shadow-xl mb-2 mr-12 animate-in slide-in-from-bottom-2 duration-300 font-bold transform rotate-[-2deg] border-2 border-indigo-500/20">
                    {message}
                </div>
            )}

            {/* Bird */}
            <div
                className="w-32 h-32 cursor-pointer pointer-events-auto transform hover:scale-110 transition-transform duration-300 drop-shadow-2xl animate-bounce-slow"
                onClick={handleInteraction}
                onMouseEnter={() => setState('thinking')}
                onMouseLeave={() => state !== 'happy' && setState('flying')}
            >
                <img src={getImage()} alt="Remi" className="w-full h-full object-contain" />
            </div>
        </div>
    );
};
