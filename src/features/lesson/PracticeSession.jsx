import React, { useRef, useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertTriangle, Zap, Settings, Info, Play, Pause, XCircle, Lock, Unlock, Eye, Hand, Trophy, Flame } from 'lucide-react';
import { audioEngine } from '@/services/audioEngine';
import { analyzeWithRork } from '@/services/visionService';
import { initHandTracker } from '@/services/handTracker';
import { Button } from '@/components/ui/Button';
import { FretboardDiagram } from '../../components/ui/FretboardDiagram';

const BriefingView = ({ lesson, onReady }) => {
    // Heuristic or Explicit visualization data
    const getVisuals = () => {
        if (lesson.id === 'tune_e') return [{ string: 6, fret: 0, disp: 'E' }];
        if (lesson.id === 'tune_a') return [{ string: 5, fret: 0, disp: 'A' }];
        if (lesson.id === 'tune_d') return [{ string: 4, fret: 0, disp: 'D' }];
        if (lesson.id === 'riff_smoke') return [
            { string: 6, fret: 0, disp: '0' },
            { string: 6, fret: 3, disp: '3' },
            { string: 6, fret: 5, disp: '5' }
        ];
        if (lesson.chordData) {
            return lesson.chordData.fingers.map(f => ({
                string: f.string, fret: f.fret, disp: f.finger
            }));
        }
        return [];
    };

    const highlights = getVisuals();

    return (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
            <div className="max-w-2xl w-full flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <Info className="w-10 h-10 text-indigo-400" />
                </div>

                <h2 className="text-5xl font-black text-white mb-4 tracking-tight">{lesson.title}</h2>
                <div className="text-xl text-slate-400 mb-8 font-light max-w-lg">{lesson.briefing}</div>

                {lesson.type !== 'posture' && (
                    <div className="w-full max-w-lg mb-10 transform hover:scale-105 transition-transform duration-500">
                        <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                            <FretboardDiagram highlightNotes={highlights} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8">
                    {lesson.prompts.map((p, i) => (
                        <div key={i} className="flex items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                            <span className="text-slate-300 text-sm font-medium">{p}</span>
                        </div>
                    ))}
                </div>

                <Button onClick={onReady} size="xl" className="w-full max-w-xs shadow-indigo-500/20 shadow-lg text-lg h-14">
                    Let's Play
                </Button>
            </div>
        </div>
    );
};

export const PracticeSession = ({ lesson, onFinish }) => {
    const videoRef = useRef(null);
    const debugCanvasRef = useRef(null);
    const [phase, setPhase] = useState('briefing'); // briefing, instruct, countdown, analyzing, result
    const [countdown, setCountdown] = useState(3);
    const [feedback, setFeedback] = useState(null);
    const [debugData, setDebugData] = useState({});
    const [settings, setSettings] = useState({ isLefty: false, showDebug: false });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Streak Logic
    const [streak, setStreak] = useState(0);
    const REQUIRED_STREAK = 1; // [CHANGED] Reduced from 3 for better flow

    // History buffers
    const historyRef = useRef({ notes: [], volumes: [], chromas: [], strings: [] });
    const maxAnalysisVolume = useRef(0);
    const isListeningRef = useRef(false);

    // Initial Setup
    useEffect(() => {
        if (phase === 'briefing') return;

        const start = async () => {
            try {
                // Video - Requesting optimal resolution for vision
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                    audio: false
                });
                if (videoRef.current) videoRef.current.srcObject = stream;

                // Audio
                await audioEngine.init();
                const unsub = audioEngine.subscribe((data) => {
                    setDebugData({
                        note: data.note,
                        octave: data.octave,
                        vol: data.rms.toFixed(3),
                        chroma: data.chroma,
                        // [UPDATED] Use new precise data
                        stringIdx: data.likelyStringIdx,
                        fret: data.likelyFret
                    });

                    if (isListeningRef.current) {
                        if (data.rms > maxAnalysisVolume.current) maxAnalysisVolume.current = data.rms;
                        historyRef.current.notes.push(data.note);
                        historyRef.current.chromas.push(data.chroma);
                        historyRef.current.strings.push(data.likelyString);
                    }
                });

                return () => {
                    unsub();
                    if (videoRef.current?.srcObject) {
                        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                    }
                    audioEngine.stop();
                };
            } catch (err) {
                console.error("Media Error:", err);
            }
        };

        const cleanupPromise = start();
        return () => { cleanupPromise.then(c => c && c()); };
    }, [phase]);

    // Hand Tracker Loop
    useEffect(() => {
        let tracker = null;
        let animationFrameId = null;

        const startTracking = async () => {
            if (!videoRef.current || phase === 'briefing') return;

            tracker = await initHandTracker((result) => {
                if (settings.showDebug && result.landmarks && debugCanvasRef.current) {
                    drawSkeleton(debugCanvasRef.current, result.landmarks);
                } else if (debugCanvasRef.current) {
                    const ctx = debugCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, debugCanvasRef.current.width, debugCanvasRef.current.height);
                }
            }, { isLefty: settings.isLefty });

            const loop = async () => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    await tracker.send(videoRef.current);
                }
                animationFrameId = requestAnimationFrame(loop);
            };
            loop();
        };

        if (['instruct', 'analyzing', 'countdown'].includes(phase)) {
            startTracking();
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [phase, settings]);

    const drawSkeleton = (canvas, landmarks) => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        landmarks.forEach(hand => {
            ctx.fillStyle = '#00ffff';
            hand.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        });
    };

    // Listen Phase
    const handleStartAnalysis = () => {
        setFeedback(null);
        historyRef.current = { notes: [], volumes: [], chromas: [], strings: [] };
        setPhase('countdown');
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    performAnalysis();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const performAnalysis = () => {
        setPhase('analyzing');
        maxAnalysisVolume.current = 0;
        isListeningRef.current = true;

        let base64Image = null;
        if (videoRef.current) {
            const cvs = document.createElement('canvas');
            cvs.width = videoRef.current.videoWidth;
            cvs.height = videoRef.current.videoHeight;
            cvs.getContext('2d').drawImage(videoRef.current, 0, 0);
            base64Image = cvs.toDataURL('image/jpeg', 0.8).split(',')[1];
        }

        // Logic: if it's a chord/posture, we rely heavily on Vision. If it's a note, mostly Audio.
        // But for Chords we now also check Audio Chroma.
        const useVision = ['posture', 'strum'].includes(lesson.type);
        const aiPromise = useVision ? analyzeWithRork(base64Image, lesson) : Promise.resolve(null);

        // Analysis window duration
        setTimeout(async () => {
            isListeningRef.current = false;
            const aiResult = await aiPromise;
            finalize(aiResult);
        }, 2500);
    };

    const finalize = (aiResult) => {
        const avgChroma = new Array(12).fill(0);
        const historyCount = historyRef.current.chromas.length;
        if (historyCount > 0) {
            for (let i = 0; i < historyCount; i++) {
                for (let j = 0; j < 12; j++) avgChroma[j] += historyRef.current.chromas[i][j];
            }
            for (let j = 0; j < 12; j++) avgChroma[j] /= historyCount;
        }

        let success = false;
        let msg = "Try again.";

        // --- NOTE LOGIC ---
        if (lesson.type === 'note') {
            const noteCounts = {};
            historyRef.current.notes.forEach(n => { if (n !== '--') noteCounts[n] = (noteCounts[n] || 0) + 1; });
            const dominantNote = Object.keys(noteCounts).reduce((a, b) => noteCounts[a] > noteCounts[b] ? a : b, null);

            if (dominantNote === lesson.targetNote) {
                // String check (simple heuristic)
                if (lesson.id.startsWith('tune_')) {
                    const expectedStringLetter = lesson.id.split('_')[1].toUpperCase();
                    // Just trust the pitch mostly for tuning, unless we have explicit string detection
                    success = true; msg = "Perfect Pitch!";
                } else {
                    success = true; msg = "Good note!";
                }
            } else {
                msg = `I heard ${dominantNote || 'nothing'}. Aim for ${lesson.targetNote}.`;
            }
        }
        // --- CHORD / POSTURE LOGIC ---
        else {
            const visionSuccess = aiResult?.success;
            const audioEnergy = maxAnalysisVolume.current > 0.02;

            if (lesson.type === 'posture') {
                success = visionSuccess;
                msg = aiResult?.feedback || "Check your hand shape.";
            } else if (lesson.type === 'strum') {
                // Chord Logic: Vision AND Audio
                if (!audioEnergy) {
                    success = false; msg = "Strum louder! I can't hear you.";
                } else {
                    // Check Chroma presence for required notes
                    if (lesson.requiredNotes) {
                        const noteIndices = lesson.requiredNotes.map(n => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].indexOf(n));
                        const missingNotes = noteIndices.filter(idx => avgChroma[idx] < 0.1); // threshold

                        if (missingNotes.length > 0 && Math.max(...avgChroma) > 0.3) {
                            // If we have sound but missing specific chord tones
                            // actually, chroma is tricky with overtones. Let's be lenient if Vision is confident.
                            if (visionSuccess) {
                                success = true; msg = "Great hand shape and sound!";
                            } else {
                                success = false; msg = aiResult?.feedback || "Hand shape looks wrong.";
                            }
                        } else {
                            // Good sound composition
                            if (visionSuccess) {
                                success = true; msg = "Excellent!";
                            } else {
                                success = false; msg = aiResult?.feedback || "Sound is okay, but fix your fingers.";
                            }
                        }
                    } else {
                        // Fallback
                        success = visionSuccess;
                        msg = aiResult?.feedback || (success ? "Nice!" : "Adjust your grip.");
                    }
                }
            }
        }

        // Streak Management
        if (success) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            setFeedback({ success: true, message: msg, xpEarned: lesson.xp });

            // Auto finish logic -> [CHANGED] Manual Finish
            if (newStreak >= REQUIRED_STREAK) {
                // Show celebration modal, do not auto-exit
                setPhase('complete'); // New phase
            } else {
                // Auto-retry for streak
                setPhase('instruct');
            }
        } else {
            setStreak(0);
            setFeedback({ success: false, message: msg, xpEarned: 0 });
            setPhase('result');
        }
    };

    if (phase === 'briefing') return <BriefingView lesson={lesson} onReady={() => setPhase('instruct')} />;

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col overflow-hidden font-sans">

            {/* --- TOP BAR --- */}
            <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <h2 className="text-3xl font-black text-white drops-shadow-md">{lesson.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full text-indigo-400 font-bold text-sm border border-indigo-500/30">
                            Streak: {streak} / {REQUIRED_STREAK} <Flame className={`inline w-4 h-4 ml-1 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-600'}`} />
                        </div>
                    </div>
                </div>

                <button onClick={() => onFinish(null)} className="pointer-events-auto p-3 bg-slate-900/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all border border-slate-700/50 backdrop-blur">
                    <XCircle size={24} />
                </button>
            </div>

            {/* --- MAIN CONTENT CENTER --- */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
                {/* Visualizer Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"></div>

                {/* Primary Interaction Area */}
                <div className="relative z-10 p-12 bg-slate-900/30 border border-white/5 rounded-[3rem] backdrop-blur-sm shadow-2xl transition-all duration-500 flex flex-col items-center w-full max-w-5xl">

                    {/* FEEDBACK OVERLAY (Moved to top of card to prevent overlap) */}
                    {feedback && (
                        <div className={`mb-6 py-4 px-8 rounded-3xl border shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2 text-center animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-lg ${feedback.success ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-100'}`}>
                            <div className="flex items-center gap-2">
                                {feedback.success ? <CheckCircle size={24} className="fill-green-500 text-slate-900" /> : <AlertTriangle size={24} className="fill-red-500 text-slate-900" />}
                                <span className="font-bold text-xl">{feedback.success ? "Nice!" : "Oops!"}</span>
                            </div>
                            <span className="text-lg font-medium leading-relaxed">{feedback.message}</span>
                        </div>
                    )}

                    <div className="mb-8 w-full max-w-4xl transform hover:scale-[1.02] transition-transform">
                        {/* Fretboard takes full width of container now */}
                        <FretboardDiagram
                            activeString={lesson.activeString}
                            highlightFret={lesson.fret}
                            highlightNotes={lesson.ghost === 'chord_em' && lesson.chordData ? lesson.chordData.fingers.map(f => ({ string: f.string, fret: f.fret, disp: f.finger })) : null}
                            // Using new debug fields for ghost
                            playedFret={debugData.fret}
                            playedStringIdx={debugData.stringIdx}
                        />
                    </div>

                    <div className="text-center space-y-4 max-w-md">
                        <div className="text-slate-400 text-lg font-light leading-relaxed">
                            {lesson.briefing}
                        </div>
                        {phase === 'analyzing' && (
                            <div className="inline-flex items-center gap-2 text-indigo-400 animate-pulse font-bold tracking-widest uppercase text-sm">
                                <Loader className="w-4 h-4 animate-spin" /> Listening & Watching...
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTROLS (Bottom Center) */}
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-sm">
                    {phase !== 'analyzing' && phase !== 'countdown' && phase !== 'complete' && (
                        <Button
                            onClick={handleStartAnalysis}
                            size="xl"
                            className="w-full text-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] transition-shadow"
                            variant="primary"
                        >
                            {feedback && !feedback.success ? 'Try Again' : 'Ready'}
                        </Button>
                    )}
                </div>
            </div>


            {/* --- PIP VIDEO (Bottom Right) --- */}
            <div className="absolute bottom-8 right-8 z-40 w-72 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl group transition-all hover:scale-105 hover:border-indigo-500/50">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={debugCanvasRef} className={`absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none opacity-60`} width={640} height={480} />

                {/* Mini Status Layer */}
                <div className="absolute bg-gradient-to-t from-black/80 to-transparent bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Camera Feed</div>
                    <button onClick={() => setSettings(s => ({ ...s, isLefty: !s.isLefty }))} className="text-[10px] bg-slate-800/80 px-2 py-1 rounded text-white hover:bg-indigo-600 transition-colors">
                        {settings.isLefty ? 'Lefty' : 'Righty'}
                    </button>
                </div>

                {/* Tracking Status Indicator */}
                <div className="absolute top-3 left-3 flex gap-1">
                    <span className={`w-2 h-2 rounded-full ${isListeningRef.current ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-slate-500'}`}></span>
                </div>
            </div>

            {/* COUNTDOWN OVERLAY */}
            {phase === 'countdown' && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="text-[15rem] font-black text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-bounce">
                        {countdown}
                    </div>
                </div>
            )}

            {/* SUCCESS / LEVEL COMPLETE MODAL */}
            {(phase === 'complete' || (streak >= REQUIRED_STREAK && phase !== 'instruct')) && (
                <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500 p-6">
                    <div className="max-w-md w-full text-center">
                        <Trophy className="w-32 h-32 text-yellow-400 mb-6 drop-shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-bounce mx-auto" />
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Level Complete!</h2>
                        <p className="text-indigo-300 text-xl mb-12">You nailed it. +{lesson.xp} XP</p>

                        <div className="space-y-4">
                            <Button
                                onClick={() => onFinish(lesson.xp, 'next')}
                                size="xl"
                                className="w-full text-lg shadow-indigo-500/20"
                            >
                                <Play className="w-5 h-5 mr-2 fill-slate-950" /> Next Lesson
                            </Button>
                            <Button
                                onClick={() => onFinish(lesson.xp, 'menu')}
                                variant="secondary"
                                size="xl"
                                className="w-full text-lg"
                            >
                                Back to Menu
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
