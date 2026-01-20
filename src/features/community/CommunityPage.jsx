import React, { useState, useEffect } from 'react';
import { WorldMap } from '@/components/ui/WorldMap';
import { communitySim } from '@/services/communitySim';
import { LeagueLeaderboard } from '../dashboard/LeagueLeaderboard'; // Reusing for now, will refactor map later
import { Users, Zap } from 'lucide-react';

export const CommunityPage = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        communitySim.start();
        const unsub = communitySim.subscribe((evt) => {
            setEvents(prev => [...prev.slice(-10), evt]);
        });
        return () => {
            unsub();
            communitySim.stop();
        };
    }, []);

    return (
        <div className="w-full min-h-full flex flex-col md:flex-row relative">

            {/* LAYER 1: The MAP (Background) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <WorldMap events={events} />
            </div>

            {/* LAYER 2: Content Overlay */}
            <div className="relative z-10 w-full p-8 flex flex-col md:flex-row gap-8 min-h-screen">

                {/* LEFT: Feed & Stats */}
                <div className="flex-1 flex flex-col gap-6">
                    <header>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 mb-2 tracking-tighter">
                            THE VERSE.
                        </h1>
                        <p className="text-xl text-indigo-300 font-light">
                            <span className="font-bold text-green-400 animate-pulse">● 1,242</span> Active Learners Online
                        </p>
                    </header>

                    {/* Live Ticker */}
                    <div className="glass-panel p-6 rounded-3xl border-t border-white/10 mt-auto md:mt-12 backdrop-blur-md max-w-xl">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap size={12} className="text-amber-400" /> Live Feed
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-hidden mask-gradient-b">
                            {events.slice().reverse().map((evt) => (
                                <div key={evt.id} className="flex items-center gap-4 animate-in slide-in-from-left fade-in duration-300">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl shadow-inner border border-white/5">
                                        {evt.icon}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">
                                            <span className="text-indigo-400 font-bold">{evt.user}</span> {evt.message}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">{evt.location.city}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: League Table */}
                <div className="w-full md:w-96 flex flex-col justify-end pb-8">
                    <LeagueLeaderboard />
                </div>

            </div>
        </div>
    );
};
