
import React, { useState } from 'react';
import { ArrowLeft, Music, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FretboardDiagram } from '../../components/ui/FretboardDiagram';
import { CHORDS } from '../../data/chords';

export const ChordLibrary = ({ onClose }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-40 px-6 py-6 md:px-12 md:py-8 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 w-12 h-12">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                            Chord Library
                        </h1>
                    </div>
                </div>
            </div>

            {/* Grid of Chords */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-24 z-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {CHORDS.map((chord) => (
                        <div
                            key={chord.id}
                            className="group relative bg-slate-900/30 backdrop-blur-md rounded-3xl p-6 flex flex-col border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors">{chord.name}</h3>
                                <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wide backdrop-blur-sm ${chord.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'} `}>
                                    {chord.difficulty}
                                </span>
                            </div>

                            {/* Diagram Container */}
                            <div className="flex-1 min-h-[260px] relative pointer-events-none mb-6 p-4 bg-black/20 rounded-2xl border border-black/10 shadow-inner group-hover:bg-black/30 transition-colors">
                                <FretboardDiagram
                                    totalFrets={5}
                                    variant="compact"
                                    className="h-full"
                                    highlightNotes={chord.fingers.map(f => ({
                                        string: f.string,
                                        fret: f.fret,
                                        disp: f.finger
                                    }))}
                                />
                            </div>

                            <div className="mt-auto relative z-10">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-1 rounded text-slate-300 border border-white/5">
                                        {chord.type}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-300 transition-colors">
                                    {chord.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

