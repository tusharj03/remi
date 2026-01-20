import React, { useState, useEffect } from 'react';
import { communitySim } from '@/services/communitySim';
import { Globe, Users, Zap } from 'lucide-react';

export const PulseDashboard = () => {
    const [events, setEvents] = useState([]);
    const [activeUsers, setActiveUsers] = useState(1240);

    useEffect(() => {
        communitySim.start();
        const unsub = communitySim.subscribe((event) => {
            setEvents(prev => [event, ...prev].slice(0, 5)); // Keep last 5
            setActiveUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1)); // Fluctuate
        });
        return () => {
            unsub();
            communitySim.stop();
        };
    }, []);

    return (
        <div className="w-full bg-slate-900/50 rounded-3xl border border-white/5 p-6 backdrop-blur-md relative overflow-hidden">
            {/* Background Map Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                {/* Abstract Dots for Map */}
                <div className="absolute top-[30%] left-[20%] w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                <div className="absolute top-[40%] left-[70%] w-2 h-2 bg-cyan-500 rounded-full animate-ping delay-700"></div>
                <div className="absolute top-[35%] left-[45%] w-2 h-2 bg-purple-500 rounded-full animate-ping delay-1000"></div>
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-full animate-pulse">
                            <Globe className="text-green-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Remi Verse</h3>
                            <div className="flex items-center text-xs text-green-400 font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                {activeUsers.toLocaleString()} Live Learners
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Feed */}
                <div className="space-y-3">
                    {events.length === 0 && <div className="text-slate-500 text-sm">Connecting to global feed...</div>}
                    {events.map((evt) => (
                        <div key={evt.id} className="flex items-center justify-between animate-in slide-in-from-right fade-in duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shadow-sm">
                                    {evt.icon}
                                </div>
                                <div>
                                    <p className="text-slate-300 text-sm">
                                        <span className="font-bold text-white">{evt.user}</span> {evt.message}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{evt.location.city}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-600">Just now</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
