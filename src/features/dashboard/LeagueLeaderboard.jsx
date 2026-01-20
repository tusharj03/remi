import React from 'react';
import { Trophy, ChevronUp, ChevronDown, Minus } from 'lucide-react';

const MOCK_LEAGUE = [
    { rank: 1, name: "GuitarHero99", xp: 2450, trend: 'up' },
    { rank: 2, name: "SarahJ", xp: 2320, trend: 'up' },
    { rank: 3, name: "MikeRocks", xp: 2100, trend: 'same' },
    { rank: 4, name: "YOU", xp: 1950, trend: 'up', isUser: true },
    { rank: 5, name: "Dave_B", xp: 1800, trend: 'down' },
    { rank: 6, name: "Jess_Music", xp: 1650, trend: 'down' },
];

export const LeagueLeaderboard = () => {
    return (
        <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 p-2 rounded-full">
                        <Trophy className="text-amber-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Bronze League</h3>
                        <p className="text-xs text-slate-400">Top 3 promote to Silver</p>
                    </div>
                </div>
                <div className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    2 Days Left
                </div>
            </div>

            <div className="space-y-3">
                {MOCK_LEAGUE.map((user) => (
                    <div
                        key={user.rank}
                        className={`
                            flex items-center justify-between p-3 rounded-xl border transition-all
                            ${user.isUser
                                ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                : 'bg-slate-800/50 border-white/5'
                            }
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                                font-black text-lg w-6 text-center
                                ${user.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}
                            `}>
                                {user.rank}
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm ${user.isUser ? 'text-white' : 'text-slate-300'}`}>
                                    {user.name}
                                </span>
                                {user.rank <= 3 && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Promotion Zone</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="font-bold text-indigo-300 text-sm">{user.xp} XP</span>
                            {user.trend === 'up' && <ChevronUp size={16} className="text-green-500" />}
                            {user.trend === 'down' && <ChevronDown size={16} className="text-red-500" />}
                            {user.trend === 'same' && <Minus size={16} className="text-slate-500" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
