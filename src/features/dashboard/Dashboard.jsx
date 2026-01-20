import React from 'react';
import { Trophy, Flame, Music, Settings, ArrowRight, Lock, CheckCircle, Play, BookOpen, User } from 'lucide-react';
import { MODULES, LESSONS } from '../../data/curriculum';
import { Button } from '@/components/ui/Button';
import { RemiCompanion } from '@/components/ui/RemiCompanion';

export const Dashboard = ({ user, progress, onSelectLesson, onOpenTuner, onOpenChords, onOpenProfile, unlockAll, onAuth }) => {
    const totalXP = progress?.xp || 0;
    const completedIds = progress?.completedLessons || [];
    const isActiveUser = user && !user.isAnonymous;

    const isLessonLocked = (lesson) => {
        if (unlockAll) return false;
        const index = LESSONS.findIndex(l => l.id === lesson.id);
        if (index === 0) return false;
        const prevId = LESSONS[index - 1].id;
        return !completedIds.includes(prevId);
    };

    const isLessonCompleted = (lesson) => completedIds.includes(lesson.id);

    // Find current active module
    const nextLesson = LESSONS.find(l => !completedIds.includes(l.id)) || LESSONS[0];
    const activeModuleId = nextLesson.moduleId;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 to-slate-950 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* --- MAIN CURRICULUM (Left Col) --- */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Learning Path</h1>
                        <p className="text-slate-400">Master the guitar, one step at a time.</p>
                    </div>

                    {/* Modules Vertical List */}
                    <div className="flex flex-col gap-6 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-8 top-8 bottom-8 w-1 bg-slate-800/50 rounded-full hidden md:block"></div>

                        {MODULES.map((mod, modIdx) => {
                            const modLessons = LESSONS.filter(l => l.moduleId === mod.id);
                            const isCurrentModule = mod.id === activeModuleId;
                            const isLockedModule = !isCurrentModule && modLessons.every(l => isLessonLocked(l)) && !completedIds.includes(modLessons[0].id); // Simplified module lock

                            return (
                                <div key={mod.id} className={`relative pl-0 md:pl-20 transition-opacity duration-500 ${isLockedModule ? 'opacity-50 grayscale' : 'opacity-100'}`}>

                                    {/* Timeline Node (Desktop) */}
                                    <div className={`hidden md:flex absolute left-4 w-9 h-9 -ml-px items-center justify-center rounded-full border-4 z-10 
                                        ${isCurrentModule
                                            ? 'bg-indigo-500 border-slate-950 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                                            : isLockedModule ? 'bg-slate-800 border-slate-950' : 'bg-slate-900 border-indigo-500/30'
                                        }
                                    `}>
                                        {isCurrentModule && <div className="w-3 h-3 bg-white rounded-full animate-pulse" />}
                                    </div>

                                    {/* Module Card */}
                                    <div className="bg-slate-900/50 glass-panel border border-white/5 rounded-3xl overflow-hidden">
                                        {/* Module Header */}
                                        <div className={`p-6 bg-gradient-to-r ${mod.color.replace('from-', 'from-white/5 ').replace('to-', 'to-transparent ')}/10 border-b border-white/5`}>
                                            <h3 className="text-xl font-bold text-white mb-1">{mod.title}</h3>
                                            <p className="text-sm text-slate-400">{modLessons.length} Lessons</p>
                                        </div>

                                        {/* Lessons List */}
                                        <div className="divide-y divide-white/5">
                                            {modLessons.map((lesson, idx) => {
                                                const locked = isLessonLocked(lesson);
                                                const completed = isLessonCompleted(lesson);
                                                const isNext = lesson.id === nextLesson.id;

                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        disabled={locked}
                                                        onClick={() => onSelectLesson(lesson)}
                                                        className={`w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-white/5
                                                            ${isNext ? 'bg-indigo-500/10' : ''}
                                                            ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                                                        `}
                                                    >
                                                        {/* Status Icon */}
                                                        <div className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                                            ${completed ? 'bg-green-500 text-slate-900' :
                                                                isNext ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' :
                                                                    'bg-slate-800 text-slate-500'}
                                                        `}>
                                                            {completed ? <CheckCircle size={20} /> :
                                                                locked ? <Lock size={16} /> :
                                                                    <Play size={18} fill="currentColor" className="ml-0.5" />}
                                                        </div>

                                                        <div className="flex-1">
                                                            <h4 className={`font-bold ${completed || isNext ? 'text-white' : 'text-slate-400'}`}>
                                                                {lesson.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 line-clamp-1">{lesson.description}</p>
                                                        </div>

                                                        {isNext && (
                                                            <div className="px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-lg animate-pulse-slow">
                                                                START
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- RIGHT SIDEBAR (Widgets) --- */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* User Profile Card */}
                    <div className="bg-slate-900/50 glass-panel border border-white/5 rounded-3xl p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button onClick={onOpenProfile} className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] transition-transform hover:scale-105">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                        {user?.photoURL ? <img src={user.photoURL} alt="User" /> : <User size={24} className="text-white" />}
                                    </div>
                                </button>
                                <div>
                                    <div className="font-bold text-white text-lg leading-tight flex items-center gap-2">
                                        {user?.isAnonymous ? 'Guest' : (user?.displayName || 'Musician')}
                                        {user?.isAnonymous && (
                                            <button onClick={onAuth} className="text-xs text-indigo-400 font-bold hover:underline">
                                                (Sign In)
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">Level 1 Rookie</div>
                                </div>
                            </div>
                            <button onClick={onOpenProfile} className="text-slate-400 hover:text-white transition-colors">
                                <Settings size={20} />
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                <Flame size={24} className="text-orange-500 mb-2" />
                                <div className="text-2xl font-black text-white">{progress?.streak || 1}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Day Streak</div>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                <Trophy size={24} className="text-yellow-400 mb-2" />
                                <div className="text-2xl font-black text-white">{totalXP.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total XP</div>
                            </div>
                        </div>

                        {/* Next Up (Mini) */}
                        <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-900/20 relative overflow-hidden group cursor-pointer" onClick={() => onSelectLesson(nextLesson)}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h4 className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Up Next</h4>
                            <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{nextLesson.title}</h3>
                            <div className="flex items-center text-indigo-100 text-sm font-medium">
                                <Play size={16} fill="currentColor" className="mr-2" />
                                Continue Path
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RemiCompanion />
        </div>
    );
};
