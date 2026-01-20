import React from 'react';
import { Home, Globe, Music, Mic2, User } from 'lucide-react';
import remiFlying from '@/assets/remi/flying.png';

export const Shell = ({ children, currentView, onViewChange, user, onAuth }) => {

    // Nav Items
    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Home' },
        { id: 'community', icon: Globe, label: 'Verse' },
        { id: 'chords', icon: Music, label: 'Chords' },
        { id: 'tuner', icon: Mic2, label: 'Tuner' },
    ];

    return (
        <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden font-sans">

            {/* --- GLASS SIDEBAR (Desktop) --- */}
            <nav className="hidden md:flex flex-col w-24 h-full glass-panel border-r border-white/5 items-center py-8 z-50">
                {/* Logo */}
                <div className="w-12 h-12 mb-12 drop-shadow-glow">
                    <img src="/icon-white.png" alt="R" className="w-full h-full object-contain opacity-80" />
                </div>

                {/* Icons */}
                <div className="flex-1 flex flex-col gap-8 w-full items-center">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`
                                    relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110'
                                        : 'text-slate-500 hover:bg-white/5 hover:text-indigo-400'
                                    }
                                `}
                            >
                                <item.icon size={24} strokeWidth={isActive ? 3 : 2} />

                                {/* Tooltip */}
                                <span className="absolute left-14 bg-slate-900 border border-white/10 px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Profile Avatar or Login */}
                <button
                    onClick={() => user ? onViewChange('profile') : onAuth && onAuth()}
                    className={`
                        w-10 h-10 rounded-full p-[2px] mt-auto hover:scale-110 transition-transform
                        ${user ? 'bg-gradient-to-tr from-indigo-500 to-purple-500' : 'bg-slate-800 border-2 border-dashed border-slate-600'}
                    `}
                >
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" />
                        ) : (
                            <User size={20} className={user ? "text-slate-400" : "text-indigo-400"} />
                        )}
                    </div>
                </button>
            </nav>

            {/* --- BOTTOM BAR (Mobile) --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 glass-panel border-t border-white/10 flex items-center justify-around px-6 z-50 pb-2">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20' : ''}`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* --- MAIN STAGE --- */}
            <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
                {/* Global Ambient Light */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

                {/* Content Container */}
                <div className="w-full h-full overflow-y-auto no-scrollbar relative z-10">
                    {children}
                </div>
            </main>

        </div>
    );
};
