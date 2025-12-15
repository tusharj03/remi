import React from 'react';
import { Trophy, Flame, Music, Settings, ArrowRight, Lock, CheckCircle, Play, BookOpen, User } from 'lucide-react';
import { MODULES, LESSONS } from '../../data/curriculum';
import { Button } from '@/components/ui/Button';

export const Dashboard = ({ user, progress, onSelectLesson, onOpenTuner, onOpenChords, onOpenProfile }) => {
    const totalXP = progress?.xp || 0;
    const completedIds = progress?.completedLessons || [];

    const isLessonLocked = (lesson) => {
        const index = LESSONS.findIndex(l => l.id === lesson.id);
        if (index === 0) return false;
        return !completedIds.includes(LESSONS[index - 1].id);
    };

    const isLessonCompleted = (lesson) => completedIds.includes(lesson.id);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                        <Flame size={20} className="text-orange-500 fill-orange-500/20" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Streak</div>
                        <div className="font-bold text-white leading-none">{progress?.streak || 1} Days</div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-slate-900/50 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
                        <Trophy size={16} className="text-yellow-400 mr-2" />
                        <span className="font-mono font-bold text-sm bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
                            {totalXP.toLocaleString()} XP
                        </span>
                    </div>
                    <button
                        onClick={onOpenProfile}
                        className="w-10 h-10 rounded-full bg-slate-900/50 border border-white/10 flex items-center justify-center hover:bg-slate-800 transition-colors"
                    >
                        <User size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Modules */}
            <div className="max-w-md mx-auto p-6 space-y-12 relative z-10">
                {MODULES.map((mod) => (
                    <div key={mod.id} className="space-y-6">
                        <div className={`text-transparent bg-clip-text bg-gradient-to-r ${mod.color} font-black text-2xl uppercase tracking-tighter drop-shadow-sm`}>
                            {mod.title}
                        </div>
                        <div className="space-y-4">
                            {LESSONS.filter(l => l.moduleId === mod.id).map(lesson => {
                                const locked = isLessonLocked(lesson);
                                const completed = isLessonCompleted(lesson);

                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => !locked && onSelectLesson(lesson)}
                                        disabled={locked}
                                        className={`
                                            relative w-full p-1 rounded-3xl text-left transition-all duration-300 group
                                            ${locked
                                                ? 'opacity-60 cursor-not-allowed'
                                                : 'hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            absolute inset-0 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                            ${completed ? 'from-green-500/20 to-emerald-500/20' : 'from-indigo-500/20 to-purple-500/20'}
                                        `} />

                                        <div className={`
                                            relative bg-slate-900/50 backdrop-blur-md border p-5 rounded-[22px] flex items-center justify-between
                                            ${locked ? 'border-slate-800' : completed ? 'border-green-900/50' : 'border-indigo-500/30'}
                                        `}>
                                            <div className="flex items-center space-x-5">
                                                <div className={`
                                                    w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner transition-transform group-hover:scale-110 duration-300
                                                    ${locked
                                                        ? 'bg-slate-800 text-slate-600'
                                                        : completed
                                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-900/20'
                                                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-900/20'
                                                    }
                                                `}>
                                                    {locked ? <Lock size={20} /> : completed ? <CheckCircle size={24} /> : <Play size={24} fill="currentColor" />}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-lg mb-0.5 ${locked ? 'text-slate-500' : 'text-white'}`}>{lesson.title}</h3>
                                                    <p className="text-xs text-slate-400 font-medium">{lesson.description}</p>
                                                </div>
                                            </div>
                                            {!locked && !completed && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <div className="bg-indigo-500/20 p-2 rounded-full">
                                                        <ArrowRight className="text-indigo-400 w-5 h-5" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Bar */}
            <div className="fixed bottom-0 w-full bg-slate-950/80 backdrop-blur-xl border-t border-white/5 p-2 flex justify-around safe-area-bottom z-50">
                <button className="flex flex-col items-center justify-center w-16 h-16 text-indigo-400 transition-transform active:scale-90">
                    <Music size={24} className="mb-1.5" />
                    <span className="text-[10px] font-bold tracking-wide">Learn</span>
                </button>
                <button onClick={onOpenChords} className="flex flex-col items-center justify-center w-16 h-16 text-slate-500 hover:text-white transition-all active:scale-90">
                    <BookOpen size={24} className="mb-1.5" />
                    <span className="text-[10px] font-bold tracking-wide">Chords</span>
                </button>
                <button onClick={onOpenTuner} className="flex flex-col items-center justify-center w-16 h-16 text-slate-500 hover:text-white transition-all active:scale-90">
                    <Settings size={24} className="mb-1.5" />
                    <span className="text-[10px] font-bold tracking-wide">Tuner</span>
                </button>
            </div>
        </div>
    );
};
