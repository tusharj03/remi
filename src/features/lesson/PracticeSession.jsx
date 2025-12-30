import React, { useRef, useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertTriangle, Zap, Settings, Info, Play, Pause, XCircle, Lock, Unlock, Eye, Hand, Trophy, Flame, Activity } from 'lucide-react';
import { audioEngine } from '@/services/audioEngine';
import { analyzeWithRork } from '@/services/visionService';
import { initHandTracker } from '@/services/handTracker';
import { Button } from '@/components/ui/Button';
import remiSpeaking from '@/assets/remi/speaking.png';
import remiThinking from '@/assets/remi/thinking.png';
import remiHappy from '@/assets/remi/happy.png';
import remiSad from '@/assets/remi/sad.png';
import remiFlying from '@/assets/remi/flying.png';
import { FretboardDiagram } from '../../components/ui/FretboardDiagram';

// Helper for freq
const getFreq = (note, octave) => {
    if (!note || !octave) return 440;
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const semitones = notes.indexOf(note);
    if (semitones === -1) return 440;

    // A4 = 440Hz, A4 is index 9 in octave 4.
    // MIDI number calculation: (octave + 1) * 12 + semitones
    // A4 MIDI = 69
    const midi = (octave + 1) * 12 + semitones;
    return 440 * Math.pow(2, (midi - 69) / 12);
};

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
                    <div className="w-full max-w-lg mb-10 transform hover:scale-105 transition-transform duration-500 relative">
                        {/* MOBILE REMI (Sits on top of diagram) */}
                        {phase !== 'briefing' && phase !== 'complete' && (
                            <div className="md:hidden absolute -top-24 right-0 z-50 pointer-events-none">
                                <img
                                    src={getRemiState()}
                                    alt="Remi"
                                    className="w-32 h-32 object-contain animate-bounce-slow drop-shadow-lg"
                                />
                            </div>
                        )}
                        <div className="bg-slate-900/50 p-4 md:p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                            <FretboardDiagram highlightNotes={highlights} totalFrets={window.innerWidth < 768 ? 5 : 12} />
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

// Helper for random intros
const getIntroMessage = (lesson) => {
    const title = lesson.title;
    const intros = [
        `Hey! Grab your guitar. We're going to tackle ${title} today.`,
        `Take a deep breath. ${title} is all about rhythm. You ready?`,
        `I'm really excited for you to learn ${title}. It sounds harder than it is!`,
        `Don't worry about being perfect. Let's just have fun with ${title}.`,
        `${title} is a classic. You're going to love playing this one.`
    ];
    return intros[Math.floor(Math.random() * intros.length)];
};

export const PracticeSession = ({ lesson, onFinish }) => {
    const videoRef = useRef(null);
    const debugCanvasRef = useRef(null);
    const [phase, setPhase] = useState('briefing'); // briefing, instruct, demo, countdown, playing_sequence, analyzing, result
    const [countdown, setCountdown] = useState(3);
    const [feedback, setFeedback] = useState(null);
    const [teacherMessage, setTeacherMessage] = useState(getIntroMessage(lesson));
    const [debugData, setDebugData] = useState({});
    const [settings, setSettings] = useState({ isLefty: false, showDebug: false });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Mobile Video Drag Logic
    const [videoPos, setVideoPos] = useState({ x: window.innerWidth - 180, y: 80 }); // Default top-rightish
    useEffect(() => {
        // Reset to reasonable default on load if needed, or just rely on CSS default + JS override
        if (window.innerWidth < 768) {
            setVideoPos({ x: window.innerWidth - 140, y: 100 });
        }
    }, []);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    };

    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        setVideoPos({
            x: touch.clientX - dragOffset.current.x,
            y: touch.clientY - dragOffset.current.y
        });
    };

    // Sequence Logic
    const [currentStep, setCurrentStep] = useState(0);
    const sequenceMatches = useRef(0);
    const lastNoteRef = useRef(null);
    const processingRef = useRef(false);
    const [hitEffect, setHitEffect] = useState(false);

    // Metronome Logic
    const [isMetronomeOn, setIsMetronomeOn] = useState(false);
    const [pulse, setPulse] = useState(false);
    const metronomeRef = useRef(null);

    useEffect(() => {
        if (!isMetronomeOn || !lesson.bpm || phase !== 'playing_sequence') {
            if (metronomeRef.current) clearInterval(metronomeRef.current);
            return;
        }

        const intervalMs = 60000 / lesson.bpm;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const playClick = (accent = false) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = accent ? 1000 : 800;
            osc.type = 'square';

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        };

        let beat = 0;
        const tick = () => {
            playClick(beat % 4 === 0);
            setPulse(true);
            setTimeout(() => setPulse(false), 100);
            beat++;
        };

        tick(); // First beat immediately
        metronomeRef.current = setInterval(tick, intervalMs);

        return () => {
            if (metronomeRef.current) clearInterval(metronomeRef.current);
            ctx.close();
        };
    }, [isMetronomeOn, lesson.bpm, phase]);

    // Rhythm Logic
    const lastFrameTime = useRef(0);
    const noteHeldTime = useRef(0);

    // Voice Helper
    const speak = (text) => {
        return; // Voice teacher disabled
        // if (!text) return;
        // const utterance = new SpeechSynthesisUtterance(text);
        // utterance.rate = 1.1;
        // utterance.pitch = 1.0;
        // window.speechSynthesis.cancel(); // Interrupt previous
        // window.speechSynthesis.speak(utterance);
    };

    // Step Ref to avoid stale closures in audio callback
    const stepRef = useRef(currentStep);
    useEffect(() => { stepRef.current = currentStep; }, [currentStep]);

    // If lesson has sequence, target is determined by step
    const currentTarget = lesson.sequence ? lesson.sequence[currentStep] : lesson;

    // Streak Logic
    const [streak, setStreak] = useState(0);
    const REQUIRED_STREAK = 1;

    // History buffers
    const historyRef = useRef({ notes: [], volumes: [], chromas: [], strings: [] });
    const maxAnalysisVolume = useRef(0);
    const isListeningRef = useRef(false);

    // Reset sequence on new lesson
    useEffect(() => {
        setCurrentStep(0);
        setPhase('briefing');
        setStreak(0);
        setFeedback(null);
        sequenceMatches.current = 0;
    }, [lesson.id]);

    // Initial Setup & MAIN LOOP
    useEffect(() => {
        if (phase === 'briefing') return;

        const start = async () => {
            try {
                // Video
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
                        stringIdx: 5 - data.likelyStringIdx,
                        fret: data.likelyFret
                    });

                    // --- DEMO PHASE LOGIC ---
                    // (Handled in separate useEffect for simple playback)

                    // --- CONTINUOUS SEQUENCE LOGIC ---
                    if (phase === 'playing_sequence') {
                        const now = performance.now();
                        const delta = now - (lastFrameTime.current || now);
                        lastFrameTime.current = now;

                        // Prevent re-entry if transitioning
                        if (processingRef.current) return;

                        isListeningRef.current = true;

                        // Current Target (Use Ref to avoid stale closure)
                        const sIdx = stepRef.current;
                        const target = lesson.sequence ? lesson.sequence[sIdx] : lesson; // Fallback for single note (tuning)
                        const targetNoteName = target.note || target.targetNote; // Handle Tuning vs Sequence structure

                        // Default duration to 1 second if not specified, 
                        // BUT for tuning lessons (no sequence), we just want "some stability" (e.g. 1s).
                        const targetDuration = (target.duration || 1.0) * 400; // Reduced from 1000 to 400ms for responsiveness

                        // Check match (Pitch & Volume threshold)
                        // Allow octave error for beginners? strict for now.
                        const isMatch = data.note === targetNoteName && data.rms > 0.02;

                        if (isMatch) {
                            noteHeldTime.current = Math.min(targetDuration, (noteHeldTime.current || 0) + delta);
                        } else {
                            // Decay: Fast decay so you don't lose all progress instantly on a glitch, 
                            // but can't "coast" through gaps.
                            noteHeldTime.current = Math.max(0, (noteHeldTime.current || 0) - delta * 0.5); // Slower decay (was 3)
                        }

                        // Update UI Ref for Progress Bar (0 to 1)
                        const progress = Math.min(1, (noteHeldTime.current || 0) / targetDuration);
                        setDebugData(prev => ({ ...prev, matchProgress: progress }));

                        if (noteHeldTime.current >= targetDuration) {
                            // SUCCESS!
                            noteHeldTime.current = 0;

                            // Visual: Instant clear & Hit effect
                            setDebugData(prev => ({ ...prev, matchProgress: 0 }));
                            setHitEffect(true);
                            setTimeout(() => setHitEffect(false), 300);

                            // Advance logic
                            const hasNextStep = lesson.sequence && sIdx < lesson.sequence.length - 1;

                            if (hasNextStep) {
                                processingRef.current = true;
                                setCurrentStep(s => s + 1);

                                // Praises logic...
                                // Only praise occasionally to avoid spam
                                if (Math.random() > 0.7) {
                                    const praises = ["Good!", "Nice!", "Keep going!", "Yes!", "Spot on!"];
                                    const praise = praises[Math.floor(Math.random() * praises.length)];
                                    setFeedback({ success: true, message: praise, xpEarned: 0 });
                                    speak(praise);
                                    setTimeout(() => setFeedback(null), 1000);
                                }

                                setTimeout(() => { processingRef.current = false; }, 100); // Short debounce

                            } else {
                                // Finished Sequence OR Single Note Success
                                setPhase('complete');
                                const finalPraise = "Lesson Complete! Awesome job.";
                                speak(finalPraise);
                                setFeedback({ success: true, message: finalPraise, xpEarned: lesson.xp });
                            }
                        }
                    }
                    // --- OLD BUFFER LOGIC (For single note/chord analysis) ---
                    else if (isListeningRef.current) {
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
    }, [phase, lesson.sequence]); // Removed currentStep dependency 
    // Actually, currentStep in useEffect dependency will re-subscribe. That's fine but expensive?
    // Better to use a Ref for currentStep if we want to avoid re-subscribing.
    // BUT, for now, re-subscribing is okay, or we just trust the closure? 
    // Wait, the closure `lesson.sequence[currentStep]` will be STALE if we don't update.
    // So we MUST depend on currentStep. Re-initing AudioEngine is bad.
    // FIX: Use a Ref for currentStep inside the callback.

    // ...Wait, I need to rewrite the useEffect above to NOT depend on Phase/Step for the subscription part.
    // But I can't easily change the whole file structure in one replace with limited context.
    // Let's use the `stepRef` pattern inside the existing `useEffect` which depends on `phase`.
    // If phase changes to 'playing_sequence', we mount it.
    // BUT `currentStep` changes while IN `playing_sequence`.
    // So we need `stepRef`.

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

        if (['instruct', 'analyzing', 'countdown', 'playing_sequence'].includes(phase)) {
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

    // Demo Phase Loop
    useEffect(() => {
        if (phase !== 'demo') return;

        let timeouts = [];
        const sequence = lesson.sequence || [];
        if (sequence.length === 0) {
            setPhase('playing_sequence'); // Skip if no sequence
            return;
        }

        setTeacherMessage("Okay, watch me play it first. Listen to the groove.");

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        let currentTime = 0;

        // Play sequence
        sequence.forEach((step, idx) => {
            const dur = (step.duration || 1) * 600; // slightly slower for demo

            // Visual highlight
            timeouts.push(setTimeout(() => {
                setCurrentStep(idx);
                // Audio
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = getFreq(step.note, step.octave);
                // osc.frequency.value = 440; // Simple beep or map to actual pitch
                osc.type = 'triangle';
                osc.start();
                osc.stop(ctx.currentTime + (dur / 1000) * 0.8);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur / 1000) * 0.8);
            }, currentTime));

            currentTime += dur;
        });

        // Finish
        timeouts.push(setTimeout(() => {
            setTeacherMessage("Your turn! Give it a try. Don't rush.");
            setPhase('instruct'); // Go to instruct/ready screen
            setCurrentStep(0);
        }, currentTime + 1000));

        return () => {
            timeouts.forEach(clearTimeout);
            ctx.close();
        };
    }, [phase, lesson]);

    // Listen Phase
    const handleStartAnalysis = () => {
        setFeedback(null);
        setCurrentStep(0);
        historyRef.current = { notes: [], volumes: [], chromas: [], strings: [] };

        setPhase('countdown');
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);

                    // Route to appropriate Continuous Phase
                    if (lesson.type === 'note' || lesson.sequence) {
                        // If we are coming from Briefing, maybe go to Demo first?
                        // Actually handleStartAnalysis is clicked from "Ready" button.
                        // So we assume user saw demo.
                        setPhase('playing_sequence');
                        setTeacherMessage("Feel the beat... jump in when you're ready!");
                    } else {
                        setPhase('playing_vision'); // Strum/Posture
                        setTeacherMessage("Show me your hand. Keep it relaxed.");
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // --- CONTINUOUS VISION LOOP (Strum / Posture) ---
    useEffect(() => {
        if (phase !== 'playing_vision') return;

        const interval = setInterval(async () => {
            if (!videoRef.current) return;

            // Capture
            const cvs = document.createElement('canvas');
            cvs.width = videoRef.current.videoWidth;
            cvs.height = videoRef.current.videoHeight;
            cvs.getContext('2d').drawImage(videoRef.current, 0, 0);
            const base64Image = cvs.toDataURL('image/jpeg', 0.8).split(',')[1];

            // Analyze
            isListeningRef.current = true;
            const aiResult = await analyzeWithRork(base64Image, lesson);
            isListeningRef.current = false;

            if (aiResult?.success) {
                // Success!
                const praise = "Nice! Great form.";
                speak(praise);
                setFeedback({ success: true, message: praise, xpEarned: lesson.xp });
                clearInterval(interval);

                setTimeout(() => {
                    setPhase('complete');
                }, 1500);

            } else {
                // Feedback
                const msg = aiResult?.feedback || "Adjust your hand...";
                setFeedback({ success: false, message: msg, xpEarned: 0 });
                speak(msg); // Teacher voice guidance
            }

        }, 3000); // Check every 3 seconds (Vision API is slower/cleanerpace)

        return () => clearInterval(interval);
    }, [phase, lesson]);


    // [Previous performAnalysis/finalize removed as they are legacy now]

    // --- RENDER HELPERS ---
    const getTeacherMessage = () => {
        if (phase === 'playing_sequence') {
            // "Hearing X"
            if (!debugData.note || debugData.note === '--' || debugData.vol < 0.02) return "Listening...";

            // Compare notes logic (Simple string comp for now due to lack of helpers)
            // But we can show what we hear.
            const sIdx = stepRef.current;
            const target = lesson.sequence ? lesson.sequence[sIdx] : lesson; // Fallback for single note
            const targetNote = target.targetNote || target.note;

            if (debugData.note === targetNote) return "Hold it...";
            return `Hearing: ${debugData.note}`;
        }
        return lesson.briefing;
    };

    if (phase === 'briefing') return <BriefingView lesson={lesson} onReady={() => setPhase(lesson.sequence ? 'demo' : 'instruct')} />;

    const getRemiState = () => {
        if (feedback?.success) return remiHappy;
        if (feedback && !feedback.success) return remiSad;
        if (phase === 'analyzing' || phase === 'demo') return remiThinking;
        if (phase === 'briefing' || phase === 'instruct') return remiSpeaking;
        return remiFlying;
    };

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
                <div className="absolute inset-0 opacity-10 pointer-events-none"></div>

                <div className="relative z-10 p-4 md:p-12 bg-slate-900/30 border border-white/5 rounded-[3rem] backdrop-blur-sm shadow-2xl transition-all duration-500 flex flex-col items-center w-full max-w-5xl">

                    {/* FEEDBACK OVERLAY (Mobile: Centered Modal, Desktop: Inline) */}
                    {feedback && (
                        <div
                            onClick={() => setFeedback(null)}
                            className={`
                            fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none md:p-0 md:z-auto md:block md:w-full md:max-w-lg md:mx-auto md:mb-6 cursor-pointer
                        `}>
                            <div className={`
                                py-6 px-10 rounded-3xl border shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                                flex flex-col items-center gap-4 text-center 
                                animate-in zoom-in-95 fade-in duration-300 
                                w-full max-w-sm md:max-w-full
                                ${feedback.success ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-100'}
                            `}>
                                <div className="flex items-center gap-3">
                                    {feedback.success ? <CheckCircle size={32} className="fill-green-500 text-slate-900" /> : <AlertTriangle size={32} className="fill-red-500 text-slate-900" />}
                                    <span className="font-bold text-2xl">{feedback.success ? "Nice!" : "Oops!"}</span>
                                </div>
                                <span className="text-xl font-medium leading-relaxed">{feedback.message}</span>

                                {/* Mobile-only dismiss tap target (optional, but good UX) */}
                                <div className="md:hidden text-xs opacity-50 mt-2 uppercase tracking-widest">Tap anywhere to close</div>
                            </div>
                        </div>
                    )}



                    {/* --- REMI CHARACTER & CHAT --- */}
                    {phase !== 'briefing' && phase !== 'complete' && (
                        <>
                            {/* DESKTOP REMI (with Chat) */}
                            <div className="hidden md:flex absolute -right-12 -top-32 flex-col items-center z-50 w-64 pointer-events-none transition-all duration-500">
                                <img
                                    src={getRemiState()}
                                    alt="Remi"
                                    className="w-40 h-40 object-contain animate-bounce-slow drop-shadow-2xl z-20"
                                />
                                <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-6 py-4 rounded-[2rem] rounded-tr-none shadow-xl animate-in slide-in-from-bottom-2 border-2 border-indigo-500/30 relative -mt-4 mr-12 w-auto min-w-[140px] text-center transform rotate-[-2deg]">
                                    <div className="text-lg font-bold leading-snug font-hand">
                                        {teacherMessage}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- TEACHER LIVE FEEDBACK (Playing Phase) --- */}
                    {phase === 'playing_sequence' && (
                        <div className="mb-6 flex flex-col items-center animate-in fade-in zoom-in w-full">

                            <div className="flex gap-4 mb-4">
                                {/* RHYTHM PREVIEW */}
                                {lesson.sequence && (lesson.id.includes('riff') || lesson.id.includes('scale')) && (
                                    <button
                                        onClick={() => {
                                            // Play Rhythm Demo
                                            const ctx = new (window.AudioContext || window.webkitAudioContext)();
                                            let time = ctx.currentTime;
                                            lesson.sequence.forEach(step => {
                                                const osc = ctx.createOscillator();
                                                const gain = ctx.createGain();
                                                osc.connect(gain);
                                                gain.connect(ctx.destination);

                                                // Simple pitch mapping (just for distinctness, not actual pitch if lazy)
                                                // Or use actual freq if we want? Let's use a standard beep.
                                                // Simple pitch mapping
                                                osc.frequency.value = getFreq(step.note, step.octave);
                                                // If we really want to be helpful, map note to freq roughly?
                                                // Let's stick to rhythm focus: a percussion sound.
                                                osc.type = 'triangle';

                                                const dur = (step.duration || 1) * 0.4; // scale for speed

                                                osc.start(time);
                                                osc.stop(time + dur * 0.8); // slight gap

                                                gain.gain.setValueAtTime(0.1, time);
                                                gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.8);

                                                time += dur;
                                            });
                                        }}
                                        className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-500/30"
                                    >
                                        <Play size={16} className="fill-indigo-300" /> Hear Rhythm
                                    </button>
                                )}

                                {/* METRONOME TOGGLE */}
                                {lesson.bpm && (
                                    <button
                                        onClick={() => setIsMetronomeOn(p => !p)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${isMetronomeOn
                                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'}`}
                                    >
                                        <Activity size={16} className={isMetronomeOn ? 'animate-pulse' : ''} />
                                        {isMetronomeOn ? `${lesson.bpm} BPM` : 'Metronome'}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-8 text-2xl font-black text-white">
                                <div className="flex flex-col items-center">
                                    <div className="text-xs text-slate-500 font-bold mb-2 tracking-widest">
                                        NOTE {currentStep + 1} / {lesson.sequence ? lesson.sequence.length : 1}
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-1">Target</span>
                                    <span className={`text-6xl text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)] ${hitEffect ? 'scale-150 text-green-400 drop-shadow-[0_0_60px_rgba(74,222,128,1)]' : ''} ${pulse ? 'scale-110 brightness-150' : ''} transition-all duration-200`}>
                                        {(lesson.sequence ? lesson.sequence[currentStep].note : lesson.targetNote)}
                                    </span>

                                    {/* Duration / Progress */}
                                    {lesson.sequence && (
                                        <div className="flex flex-col items-center mt-4 w-24">
                                            <span className="text-xs font-bold text-indigo-300 mb-1">
                                                Hold: {lesson.sequence[currentStep].duration || 1} Beats
                                            </span>
                                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-75 ease-linear"
                                                    style={{ width: `${(debugData.matchProgress || 0) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="w-px h-16 bg-slate-700"></div>
                                <div className="flex flex-col items-center relative">
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-1">Hearing</span>

                                    <div className="relative flex items-center justify-center">
                                        {/* Progress Ring */}


                                        <span className={`text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] z-10 ${debugData.note === (lesson.sequence ? lesson.sequence[currentStep].note : lesson.targetNote) ? 'text-green-400' : 'text-slate-200'}`}>
                                            {debugData.note || '--'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 text-indigo-300 font-medium text-lg">
                                {getTeacherMessage()}
                            </div>
                        </div>
                    )}

                    {/* --- TEACHER VISION FEEDBACK (Vision Phase) --- */}
                    {phase === 'playing_vision' && (
                        <div className="mb-6 flex flex-col items-center animate-in fade-in zoom-in w-full text-center">
                            <div className="flex items-center gap-2 mb-4 text-indigo-400 animate-pulse font-bold tracking-widest uppercase text-sm">
                                <Eye className="w-4 h-4" /> Watching Hand...
                            </div>
                            <div className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-2">
                                {lesson.title}
                            </div>
                            <div className="text-indigo-200 text-lg font-medium max-w-lg">
                                {feedback?.message || "Show me your hand position..."}
                            </div>
                        </div>
                    )}


                    <div className="mb-8 w-full max-w-4xl transform hover:scale-[1.02] transition-transform relative">
                        {/* MOBILE REMI (Sits on top - Main View) */}
                        {phase !== 'briefing' && phase !== 'complete' && (
                            <div className="md:hidden absolute -top-24 right-4 z-50 pointer-events-none">
                                <img
                                    src={getRemiState()}
                                    alt="Remi"
                                    className="w-32 h-32 object-contain animate-bounce-slow drop-shadow-lg"
                                />
                            </div>
                        )}
                        <FretboardDiagram
                            activeString={lesson.id.startsWith('tune') ? lesson.targetNote + lesson.targetOctave : null}
                            highlightFret={currentTarget.fret}
                            highlightNotes={
                                lesson.ghost === 'chord_em' && lesson.chordData
                                    ? lesson.chordData.fingers.map(f => ({ string: f.string, fret: f.fret, disp: f.finger }))
                                    : (lesson.sequence || lesson.type === 'note')
                                        ? [{ string: currentTarget.string, fret: currentTarget.fret, disp: currentTarget.disp || currentTarget.note }]
                                        : null
                            }
                            playedFret={debugData.fret}
                            playedStringIdx={debugData.stringIdx}
                            totalFrets={window.innerWidth < 768 ? 5 : 12}
                        />
                    </div>

                    <div className="text-center space-y-4 max-w-md">
                        {phase !== 'playing_sequence' && phase !== 'playing_vision' && (
                            <div className="text-slate-400 text-lg font-light leading-relaxed">
                                {lesson.briefing}
                            </div>
                        )}
                        {phase === 'analyzing' && (
                            <div className="inline-flex items-center gap-2 text-indigo-400 animate-pulse font-bold tracking-widest uppercase text-sm">
                                <Loader className="w-4 h-4 animate-spin" /> Analyzing Snapshot...
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTROLS (Bottom Center) */}
                <div className="relative mt-8 md:absolute md:bottom-12 md:mt-0 left-0 md:left-1/2 md:transform md:-translate-x-1/2 z-30 w-full max-w-sm px-6 md:px-0">
                    {phase !== 'analyzing' && phase !== 'countdown' && phase !== 'complete' && phase !== 'playing_sequence' && phase !== 'playing_vision' && (
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
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                style={videoPos ? { left: videoPos.x, top: videoPos.y, bottom: 'auto', right: 'auto' } : {}}
                className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-40 w-40 md:w-72 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl group transition-transform active:scale-105 hover:border-indigo-500/50 touch-none"
            >
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={debugCanvasRef} className={`absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none opacity-60`} width={640} height={480} />

                {/* Mini Status Layer */}
                <div className="absolute bg-gradient-to-t from-black/80 to-transparent bottom-0 left-0 right-0 p-2 flex justify-between items-end">
                    <div className="text-[8px] md:text-[10px] uppercase font-bold text-slate-400">Camera</div>
                    <button onClick={(e) => { e.stopPropagation(); setSettings(s => ({ ...s, isLefty: !s.isLefty })); }} className="text-[8px] md:text-[10px] bg-slate-800/80 px-2 py-1 rounded text-white hover:bg-indigo-600 transition-colors">
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
