import React from 'react';
import { Trophy, Flame, Music, Settings, ArrowRight, Lock, CheckCircle, Play, BookOpen, User } from 'lucide-react';
import { MODULES, LESSONS } from '../../data/curriculum';
import { Button } from '@/components/ui/Button';
import { RemiCompanion } from '@/components/ui/RemiCompanion';

export const Dashboard = ({ user, progress, onSelectLesson, onOpenTuner, onOpenChords, onOpenProfile, unlockAll, onAuth }) => {
    const totalXP = progress?.xp || 0;
    const completedIds = progress?.completedLessons || [];

    const isLessonLocked = (lesson) => {
        if (unlockAll) return false;
        const index = LESSONS.findIndex(l => l.id === lesson.id);
        if (index === 0) return false;
        const prevId = LESSONS[index - 1].id;
        const isUnlocked = completedIds.includes(prevId);
        // console.log(`Lesson ${lesson.id}: Index ${index}, Prev ${prevId}, Unlocked? ${isUnlocked}, CompletedIds:`, completedIds);
        return !isUnlocked;
    };

    const isLessonCompleted = (lesson) => completedIds.includes(lesson.id);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
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

            {/* --- HERO SECTION --- */}
            <div
                onClick={() => {
                    const nextLesson = LESSONS.find(l => !completedIds.includes(l.id)) || LESSONS[0];
                    onSelectLesson(nextLesson);
                }}
                className="relative h-64 mx-6 mt-6 rounded-3xl overflow-hidden shadow-2xl group cursor-pointer transition-transform hover:scale-[1.02] duration-500"
            >
                <img src="/hero-guitar.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                    <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold inline-block mb-2 backdrop-blur-md border border-indigo-500/30">
                        CONTINUE LEARNING
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1">Module 1: Foundations</h2>
                    <p className="text-slate-300 text-sm">You are 80% of the way to the next level.</p>
                </div>
                <div className="absolute right-6 bottom-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-slate-900">
                    <Play fill="currentColor" size={20} className="ml-1" />
                </div>
            </div>

            {/* --- MODULES (Horizontal Scroll) --- */}
            <div className="mt-8 pl-6 pb-12">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-400" /> Your Path
                </h3>

                <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar pr-6">
                    {MODULES.map((mod) => (
                        <div
                            key={mod.id}
                            className="snap-center relative flex-shrink-0 w-80 h-96 rounded-3xl overflow-hidden glass-panel border border-white/5 group hover:border-indigo-500/50 transition-all duration-500"
                        >
                            {/* Background Image / Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${mod.locked ? 'from-slate-800 to-slate-900' : 'from-indigo-900/40 to-slate-900'} transition-colors duration-500`}></div>

                            <div className="relative p-6 h-full flex flex-col z-10">
                                {/* Removed ID span as requested */}
                                <h4 className={`text-2xl font-bold mb-2 min-h-[4rem] flex items-center ${mod.locked ? 'text-slate-600' : 'text-white'}`}>{mod.title}</h4>
                                <p className="text-sm text-slate-400 mb-6 line-clamp-2">{mod.description}</p>

                                {/* Lessons List */}
                                <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar mask-gradient-b">
                                    {LESSONS.filter(l => l.moduleId === mod.id).map((lesson, idx) => {
                                        const isLocked = isLessonLocked(lesson);
                                        const isCompleted = progress?.completed?.includes(lesson.id);

                                        return (
                                            <button
                                                key={lesson.id}
                                                disabled={isLocked}
                                                onClick={() => onSelectLesson(lesson)}
                                                className={`
                                                    w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all border
                                                    ${isCompleted
                                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                        : isLocked
                                                            ? 'bg-slate-800/30 border-transparent text-slate-600'
                                                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                    ${isCompleted ? 'bg-green-500 text-slate-900' : 'bg-slate-800'}
                                                `}>
                                                    {isCompleted ? <CheckCircle size={14} /> : isLocked ? <Lock size={12} /> : (idx + 1)}
                                                </div>
                                                <span className="font-bold text-sm truncate">{lesson.title}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <RemiCompanion />
        </div>
    );
};
