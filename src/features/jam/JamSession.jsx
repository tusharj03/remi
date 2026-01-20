import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Upload, Music, Volume2, ArrowLeft, Mic } from 'lucide-react';
import { songAnalyzer } from '../../services/songAnalyzer'; // Adjusted import path
import { audioEngine } from '../../services/audioEngine'; // Adjusted import path
import { FretboardDiagram } from '../../components/ui/FretboardDiagram'; // Adjusted import path
import { Button } from '@/components/ui/Button';

export const JamSession = ({ onBack }) => {
    const [file, setFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [analysis, setAnalysis] = useState({ freq: 0, note: '--' });
    const [userAudio, setUserAudio] = useState({ note: '--', stringIdx: null, fret: null });
    const [error, setError] = useState(null);

    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const stickyCounter = useRef(0); // [NEW] For holding note display

    // Initial Setup
    useEffect(() => {
        const initMic = async () => {
            try {
                await audioEngine.init();
                const unsub = audioEngine.subscribe((data) => {
                    if (data.rms > 0.01) {
                        setUserAudio({
                            note: data.note,
                            stringIdx: 5 - data.likelyStringIdx, // Invert if needed to match Fretboard
                            fret: data.likelyFret,
                            octave: data.octave
                        });
                    }
                });
                return unsub;
            } catch (e) {
                console.error("Mic init error", e);
            }
        };
        const cleanupPromise = initMic();
        return () => {
            cleanupPromise.then(unsub => unsub && unsub());
            audioEngine.stop();
            songAnalyzer.stop();
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const handleFileSelect = async (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        // Basic validation
        if (!selected.type.startsWith('audio/')) {
            setError("Please upload an audio file (MP3, WAV)");
            return;
        }

        try {
            setError(null);
            const meta = await songAnalyzer.loadFile(selected);
            setFile(selected);
            setDuration(meta.duration);
            startVisualizer();
        } catch (err) {
            setError("Failed to load audio file.");
            console.error(err);
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            songAnalyzer.pause();
        } else {
            songAnalyzer.play(currentTime);
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        songAnalyzer.seek(time);
    };

    const startVisualizer = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const loop = () => {
            // Get Data (Moved up for fallback access)
            const data = songAnalyzer.getAnalysis();

            // Checks the REAL service state, avoiding React closure staleness
            // The component state 'isPlaying' might be stale in this closure
            if (songAnalyzer.isPlaying) {
                const t = songAnalyzer.getCurrentTime();
                setCurrentTime(t);

                let targetNote = null;

                // 1. Try Precise Time-Domain Pitch (Autocorrelation)
                const timeDomainPitch = songAnalyzer.getPitchAtTime(t);
                if (timeDomainPitch && timeDomainPitch.note !== '--') {
                    targetNote = timeDomainPitch;
                }
                // 2. Fallback to FFT Frequency (Spectral Peak)
                // WIDENED RANGE: 60Hz (Low B) to 3000Hz (Very High)
                else if (data && data.frequency > 60 && data.frequency < 3000) {
                    const noteInfo = songAnalyzer.getNoteFromPitch(data.frequency);
                    const pos = songAnalyzer.guessPosition(data.frequency);
                    if (pos.stringIdx !== undefined) {
                        targetNote = {
                            note: noteInfo.note,
                            stringIdx: pos.stringIdx,
                            fret: pos.fret
                        };
                    }
                }

                if (targetNote) {
                    // Start Sticky Timer
                    stickyCounter.current = 15; // Hold for ~250ms (15 frames @ 60fps)

                    setAnalysis(prev => ({
                        ...prev,
                        note: targetNote.note,
                        stringIdx: 5 - targetNote.stringIdx, // Invert for Fretboard (0=High E in UI)
                        fret: targetNote.fret
                    }));
                } else {
                    // Sticky Check: Only clear if counter runs out
                    if (stickyCounter.current > 0) {
                        stickyCounter.current--;
                    } else {
                        setAnalysis(prev => ({
                            ...prev,
                            stringIdx: undefined,
                            fret: undefined
                        }));
                    }
                }
            }

            // Draw Spectrum
            if (data && canvasRef.current) {
                drawSpectrum(data.raw);
                setAnalysis(prev => ({ ...prev, volume: data.volume }));
            }

            animationRef.current = requestAnimationFrame(loop);
        };
        loop();
    };

    const drawSpectrum = (dataArray) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'; // Indigo with opacity

        const barWidth = (width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i] / 2; // Scale down

            // Gradient based on height
            if (barHeight > 50) ctx.fillStyle = `rgb(100, 100, 255)`;
            else ctx.fillStyle = `rgb(99, 102, 241)`;

            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col overflow-hidden text-white">

            {/* Header */}
            <div className="flex-none h-20 px-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Jam Session</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                            {file ? file.name : 'Upload Your Music'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-y-auto">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10" />

                {!file ? (
                    // Upload View
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-full max-w-md p-12 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group cursor-pointer relative">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Upload a Song</h3>
                            <p className="text-slate-400">Drag & drop or click to select an MP3/WAV file.</p>
                            {error && <p className="mt-4 text-red-400 text-sm font-bold bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
                        </div>
                    </div>
                ) : (
                    // Jam View
                    <div className="flex-1 flex flex-col items-center p-4 md:p-8 gap-8">

                        {/* 1. Visualizer Area (Hero) */}
                        <div className="w-full max-w-5xl h-64 md:h-80 relative rounded-3xl overflow-hidden bg-slate-900/50 border border-white/5 shadow-2xl flex items-end justify-center">
                            {/* Spectrum Canvas */}
                            <canvas ref={canvasRef} width={800} height={300} className="w-full h-full absolute inset-0 opacity-80" />

                            {/* Overlay Text */}
                            <div className="absolute top-8 left-8 z-10">
                                <div className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">Now Playing</div>
                                <h1 className="text-3xl md:text-4xl font-black text-white line-clamp-2 max-w-lg leading-tight">{file.name}</h1>
                            </div>

                            {/* Playback Controls Overlay (Center) */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                <button
                                    onClick={togglePlay}
                                    className="w-20 h-20 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
                                >
                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                                </button>
                            </div>
                        </div>

                        {/* 2. Controls Bar */}
                        <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur px-8 py-4 rounded-2xl border border-white/5 flex items-center gap-6 shadow-xl">
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                </button>
                                <div className="text-sm font-mono text-slate-400 min-w-[50px]">{formatTime(currentTime)}</div>
                            </div>

                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />

                            <div className="hidden md:flex items-center gap-4 text-sm font-mono text-slate-400">
                                {formatTime(duration)}
                                <div className="w-px h-6 bg-white/10 mx-2"></div>
                                <Volume2 size={20} />
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={volume}
                                    onChange={(e) => {
                                        setVolume(e.target.value);
                                        songAnalyzer.setVolume(e.target.value);
                                    }}
                                    className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>

                        {/* 3. User Feedback (The "Jam" Part) */}
                        <div className="w-full max-w-5xl flex-1 min-h-[380px] flex flex-col md:flex-row gap-8">

                            {/* Fretboard Side */}
                            <div className="flex-1 bg-slate-900/40 rounded-3xl border border-white/5 p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <Music className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Your Fretboard</h3>
                                    </div>

                                    {/* LEGEND */}
                                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider bg-slate-950/50 px-4 py-2 rounded-full border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                            <span className="text-purple-300">Target Note</span>
                                        </div>
                                        <div className="w-px h-4 bg-white/10"></div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                            <span className="text-blue-300">You</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 relative">
                                    <FretboardDiagram
                                        className="w-full h-full"
                                        totalFrets={12}
                                        playedStringIdx={userAudio.stringIdx}
                                        playedFret={userAudio.fret}
                                        // Highlight detected note from user AND Song
                                        highlightNotes={[
                                            ...(userAudio.stringIdx !== null ? [{ string: userAudio.stringIdx + 1, fret: userAudio.fret, disp: userAudio.note, color: 'user' }] : []),
                                            ...(analysis.stringIdx !== undefined ? [{ string: analysis.stringIdx + 1, fret: analysis.fret, disp: analysis.note, ghost: true }] : [])
                                        ]}
                                    />


                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};
