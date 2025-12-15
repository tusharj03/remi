import React, { useEffect, useState, useRef } from 'react';
import { XCircle, Mic } from 'lucide-react';
import { audioEngine } from '@/services/audioEngine';

export const Tuner = ({ onClose }) => {
    const [note, setNote] = useState('--');
    const [cents, setCents] = useState(0);
    const [freq, setFreq] = useState(0);
    const [stringName, setStringName] = useState(null);

    // Smoothing buffer
    const historyRef = useRef([]);

    useEffect(() => {
        const start = async () => {
            await audioEngine.init();
            return audioEngine.subscribe((data) => {
                if (data.pitch > 0) {
                    setNote(data.note);
                    setFreq(Math.round(data.pitch));
                    setStringName(data.likelyString);

                    // Smooth cents
                    historyRef.current.push(data.cents);
                    if (historyRef.current.length > 5) historyRef.current.shift();
                    const avgCents = historyRef.current.reduce((a, b) => a + b, 0) / historyRef.current.length;
                    setCents(avgCents);
                }
            });
        };
        const cleanupPromise = start();
        return () => {
            cleanupPromise.then(unsub => unsub && unsub());
            audioEngine.stop();
        };
    }, []);

    // Visual calculations
    // Map cents -50..50 to rotation -45..45
    const rotation = Math.max(-45, Math.min(45, cents));
    const isInTune = Math.abs(cents) < 5 && freq > 0;

    let message = 'Play a string';
    let colorClass = 'text-slate-500';

    if (freq > 0) {
        if (isInTune) {
            colorClass = 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]';
            message = 'Perfect!';
        } else if (cents > 0) {
            colorClass = 'text-yellow-400';
            message = 'Too High (Loosen)';
        } else {
            colorClass = 'text-yellow-400';
            message = 'Too Low (Tighten)';
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-[60] flex flex-col items-center justify-center animate-in slide-in-from-bottom duration-300">
            <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                <XCircle />
            </button>

            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-12 flex items-center">
                <Mic className="w-4 h-4 mr-2" /> Studio Tuner
            </h2>

            {/* Tuner Gauge */}
            <div className="relative w-80 h-80">
                {/* Background Dial */}
                <div className="absolute inset-0 rounded-full border-8 border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center relative overflow-hidden">

                    {/* Tick Marks (Cleaned) */}
                    <div className="absolute top-4 w-1 h-3 bg-green-500/50 z-10"></div>
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className={`absolute top-0 bottom-0 w-px bg-slate-700/30 transform pointer-events-none`} style={{ rotate: `${(i - 4) * 10}deg` }} />
                    ))}

                    {/* Active State Glow */}
                    {isInTune && <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>}

                    {/* Note Display */}
                    <div className="text-center z-20 relative">
                        <div className={`text-9xl font-black transition-all duration-200 ${colorClass}`}>
                            {note}
                        </div>
                        <div className="text-slate-500 font-mono text-xl mt-4 flex flex-col items-center">
                            <span>{freq > 0 ? `${freq} Hz` : '--'}</span>
                            {stringName && (
                                <span className="text-xs bg-slate-800 px-2 py-1 rounded mt-2 text-indigo-400 border border-slate-700">
                                    {stringName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Needle */}
                <div
                    className="absolute top-0 left-1/2 w-1 origin-bottom transition-transform duration-100 ease-linear z-30"
                    style={{
                        height: '50%',
                        transform: `translateX(-50%) rotate(${rotation}deg)`,
                        background: isInTune ? '#4ade80' : '#ef4444',
                        boxShadow: `0 0 10px ${isInTune ? '#4ade80' : '#ef4444'}`
                    }}
                >
                    <div className="w-4 h-4 rounded-full bg-white absolute -top-2 -left-1.5 shadow-lg border-2 border-slate-900"></div>
                </div>
            </div>

            <div className={`mt-16 text-3xl font-bold transition-all duration-300 ${colorClass}`}>
                {message}
            </div>

            <div className="absolute bottom-10 text-slate-600 text-sm">
                440Hz Reference
            </div>
        </div>
    )
}
