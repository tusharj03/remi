
import React, { useState } from 'react';
import { ArrowLeft, Music, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FretboardDiagram } from '../../components/ui/FretboardDiagram';
import { CHORDS } from '../../data/chords';

export const ChordLibrary = ({ onClose }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 overflow-y-auto">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur z-40 py-4 border-b border-white/5">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-800">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white">Chord Library</h1>
                        <p className="text-slate-400 text-sm">Essential shapes & fingerings</p>
                    </div>
                </div>
            </div>

            {/* Grid of Chords (Max 3 cols as requested) */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {CHORDS.map((chord) => (
                    <div
                        key={chord.id}
                        className="bg-slate-900/40 rounded-xl p-5 flex flex-col hover:bg-slate-800 hover:scale-[1.02] transition-all group border border-transparent hover:border-indigo-500/30"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">{chord.name}</h3>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wide ${chord.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'} `}>
                                    {chord.difficulty}
                                </span>
                            </div>
                        </div>

                        {/* Diagram Container */}
                        <div className="flex-1 min-h-[180px] relative pointer-events-none mb-4">
                            <FretboardDiagram
                                totalFrets={5} // Revert to 5 per user request
                                variant="compact"
                                highlightNotes={chord.fingers.map(f => ({
                                    string: f.string,
                                    fret: f.fret,
                                    disp: f.finger
                                }))}
                            />
                        </div>

                        <div className="mt-auto">
                            <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2" title={chord.description}>
                                {chord.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
                                    {chord.type}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

