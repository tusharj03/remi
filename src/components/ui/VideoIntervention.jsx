import React, { useState, useEffect } from 'react';
import { X, Play, Youtube } from 'lucide-react';

export const VideoIntervention = ({ videoId, timestamp, reason, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-indigo-500/30 shadow-2xl">

                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/10 bg-indigo-900/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg animate-pulse">
                            <Youtube className="text-white fill-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-wide">Instant Mastery</h3>
                            <p className="text-indigo-300 font-medium">Use this technique to fix: <span className="text-white font-bold">"{reason}"</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-white" size={28} />
                    </button>
                </div>

                {/* Video Embed */}
                <div className="aspect-video w-full bg-black">
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?start=${timestamp}&autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-950 flex justify-between items-center">
                    <p className="text-slate-400 text-sm">Watch closely. The pro uses a slight arch to clear the strings.</p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                    >
                        I'm Ready to Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};
