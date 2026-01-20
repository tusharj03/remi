import React, { useRef, useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertTriangle, Zap, Settings, Info, Play, Pause, XCircle, Lock, Unlock, Eye, Hand, Trophy, Flame, Activity } from 'lucide-react';
import { audioEngine } from '@/services/audioEngine';
import { analyzeWithRork } from '@/services/visionService';
import { initHandTracker } from '@/services/handTracker';
import { neuroSync } from '@/services/neuroSync/neuroSync';
import { VideoIntervention } from '@/components/ui/VideoIntervention';
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
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
            <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-12">

                {/* Visual Side */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.3)] border border-indigo-500/30">
                        <Info className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-6 tracking-tighter text-center">{lesson.title}</h2>
                    <p className="text-xl text-slate-400 font-light text-center max-w-md">{lesson.briefing}</p>
                </div>

                {/* Interactive Side */}
                <div className="flex-1 w-full bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center">
                    {lesson.type !== 'posture' && (
                        /* Added h-48 to force height for the FretboardDiagram */
                        <div className="w-full h-48 mb-8 relative">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
                            <FretboardDiagram highlightNotes={highlights} totalFrets={5} className="w-full h-full" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 w-full mb-8">
                        {lesson.prompts.map((p, i) => (
                            <div key={i} className="flex items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                <CheckCircle className="w-5 h-5 text-green-400 mr-4 shrink-0" />
                                <span className="text-slate-200 font-medium">{p}</span>
                            </div>
                        ))}
                    </div>

                    <Button onClick={onReady} size="xl" className="w-full text-lg h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/50 border-t border-white/10">
                        <Play fill="currentColor" className="mr-2" /> Start Lesson
                    </Button>
                </div>
            </div>
        </div >
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
    const [warning, setWarning] = useState(null); // Non-blocking HUD warning
    const [teacherMessage, setTeacherMessage] = useState(getIntroMessage(lesson));
    const [debugData, setDebugData] = useState({});
    const [settings, setSettings] = useState({ isLefty: false, showDebug: false });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Mobile Video Drag Logic
    const [videoPos, setVideoPos] = useState(null); // Allow CSS to control default (bottom-right)

    // We can rely entirely on CSS for initial position, only setting state on Drag.
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
                setWarning(`Error: ${err.message || 'Could not access camera/microphone'}. Please check permissions.`);
                setFeedback({ success: false, message: "Media Setup Failed. Refresh to try again." });
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
            setTeacherMessage("Your turn! Get ready...");
            // Auto-advance to countdown to remove friction (User "Let's Play" click is enough intent)
            handleStartAnalysis();
        }, currentTime + 1000));

        return () => {
            timeouts.forEach(clearTimeout);
            ctx.close();
        };
    }, [phase, lesson]);

    // Listen Phase
    const handleStartAnalysis = () => {
        if (phase === 'countdown') return; // Prevent double-trigger
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

    // --- NEURO-SYNC INTEGRATION TIE-IN ---
    const [videoPopup, setVideoPopup] = useState(null);
    useEffect(() => {
        if (phase !== 'playing_vision') return;
        if (videoPopup) return; // Paused for video

        // 1. Init NeuroSync
        neuroSync.init(videoRef.current, { lesson }).then(() => {
            console.log("🧠 [NEURO-SYNC] Connected to Practice Session");
        });

        // 2. Subscribe to Brain
        const unsub = neuroSync.subscribe((state) => {
            // Update HUD Data
            if (state.audio) {
                setDebugData(prev => ({
                    ...prev,
                    vol: (state.audio?.volume || 0).toFixed(3),
                    note: state.audio.currentNote || '--',
                    stability: state.audio.stability
                }));
            }

            // Handle Decisions
            if (state.status === 'listening') {
                // Only clear if enough time passed since last warning
                if (warning && performance.now() - lastWarningTime.current > 3000) {
                    setWarning(null);
                }
            }
            else if (state.status === 'correcting') {
                setWarning(state.feedback); // Show HUD Warning ("Buzzing", "Wrist")
                lastWarningTime.current = performance.now();
                speak(state.feedback); // Optional voice

                // --- INSTANT MASTERY INTERVENTION ---
                // If specific keyword detected, trigger video
                if (lesson.videoGuide && !videoPopup) {
                    const guide = lesson.videoGuide;
                    // Simple Keyword Match
                    const keywords = Object.keys(guide.triggers || {});
                    const match = keywords.find(k => state.feedback.includes(k));

                    if (match) {
                        setVideoPopup({
                            videoId: guide.id,
                            timestamp: guide.triggers[match],
                            reason: state.feedback
                        });
                        neuroSync.stop(); // Pause engine
                    }
                    // Or just generic "Structure" failure after 5s? 
                    // For now, keyword driven.
                }
            }
            else if (state.status === 'judging') {
                setWarning("Analyzing...");
            }
            else if (state.status === 'success') {
                setFeedback({ success: true, message: state.feedback, xpEarned: lesson.xp });
                speak("Perfect!");
                neuroSync.stop();
                setPhase('complete');
            }
        });

        return () => {
            unsub();
            neuroSync.stop();
        };
    }, [phase, lesson, videoPopup]);

    // Resume when video closes
    const handleCloseVideo = () => {
        setVideoPopup(null);
        // Effect will re-run and re-init NeuroSync
    };


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
        // Show sad face for warnings (unless it's just processing)
        if (warning && !warning.includes('Analyzing')) return remiSad;

        if (phase === 'analyzing' || phase === 'demo') return remiThinking;
        if (phase === 'briefing' || phase === 'instruct') return remiSpeaking;
        return remiFlying;
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans overflow-hidden">

            {/* --- LAYOUT: HEADER (Top Bar) --- */}
            <div className="flex-none h-20 px-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-40 relative">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30">
                        <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{lesson.title}</h2>
                        <div className="flex items-center text-xs text-slate-400 font-medium uppercase tracking-widest gap-2">
                            <Flame className={`w-3 h-3 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-600'}`} />
                            Streak: {streak}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Metronome Toggle (Compact) */}
                    {lesson.bpm && (
                        <button
                            onClick={() => setIsMetronomeOn(prev => !prev)}
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isMetronomeOn ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            <Activity size={18} className={isMetronomeOn ? 'animate-pulse' : ''} />
                        </button>
                    )}

                    <button onClick={() => onFinish(null)} className="h-10 w-10 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/5">
                        <XCircle size={20} />
                    </button>
                </div>
            </div>

            {/* --- LAYOUT: HERO SECTION (Middle) --- */}
            <div className="flex-1 relative flex flex-col items-center justify-start pt-4 md:pt-12 p-4">
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 -z-10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                {/* --- 1. STATUS & INSTRUCTION ZONEZone (Top Center) --- */}
                <div className="w-full flex flex-col items-center z-30 pointer-events-none mb-4 shrink-0 relative">

                    {/* APPZ: Remi removed from here to be placed next to fretboard */}


                    {/* FEEDBACK PILL */}
                    {(feedback || warning) && (
                        <div className={`
                            mb-6 px-6 py-2 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto
                            ${feedback?.success
                                ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.2)]'
                                : warning
                                    ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                                    : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                            }
                        `}>
                            {feedback?.success ? <CheckCircle size={18} className="fill-current" /> : <AlertTriangle size={18} className="fill-current" />}
                            <span className="font-bold text-base tracking-wide">
                                {feedback?.message || warning}
                            </span>
                        </div>
                    )}

                    {/* MAIN INSTRUCTION TEXT - CLEAN STYLE */}
                    {phase === 'playing_vision' ? (
                        <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg text-center max-w-4xl mx-auto px-6 leading-tight break-words py-2 font-display tracking-tight">
                            {lesson.title}
                        </h1>
                    ) : (
                        <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg text-center max-w-4xl mx-auto px-6 leading-tight break-words py-2 font-display tracking-tight">
                            {getTeacherMessage()}
                        </h1>
                    )}

                    {/* Sub-instruction */}
                    {phase === 'playing_vision' && (
                        <p className="mt-2 text-lg text-indigo-200 font-medium tracking-wide animate-pulse px-4 text-center">
                            Show me your hand...
                        </p>
                    )}
                </div>


                {/* --- 2. HERO VISUALIZER (Center) --- */}
                {/* Fixed height control to prevent "Huge" look */}
                <div className="relative w-full max-w-6xl min-h-[22rem] md:h-80 flex items-center justify-center p-4">

                    {/* APPZ: Remi placed to the RIGHT of the fretboard */}
                    <div className="absolute -right-4 md:-right-24 top-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 animate-bounce-slow pointer-events-auto z-50 hidden md:block opacity-90 hover:opacity-100 transition-opacity">
                        <img
                            src={getRemiState()}
                            alt="Remi"
                            className="w-full h-full object-contain drop-shadow-xl"
                        />
                    </div>

                    {/* Count Down Overlay */}
                    {phase === 'countdown' && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className="text-[12rem] font-black text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.5)] animate-in zoom-in duration-300">
                                {countdown}
                            </div>
                        </div>
                    )}

                    {/* Fretboard Container */}
                    <div className={`
                        w-full h-full flex flex-col transition-all duration-500
                        ${phase === 'countdown' ? 'opacity-20 scale-90 blur-sm' : 'opacity-100 scale-100'}
                        ${feedback?.success ? 'scale-105 brightness-110 drop-shadow-[0_0_50px_rgba(74,222,128,0.3)]' : ''}
                    `}>
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden group w-full h-full flex flex-col justify-center">
                            {/* Glass Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                            <div className="flex-1 w-full relative">
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
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Audio Waveform / Visualizer Bar below Fretboard */}
                        {phase === 'playing_sequence' && (
                            <div className="mt-8 flex flex-col items-center">
                                {/* Note Indicator */}
                                <div className="text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
                                    {debugData.note || '--'}
                                </div>
                                <div className="text-xs text-indigo-400 font-bold tracking-[0.3em] uppercase mb-4">Hearing</div>

                                {/* Volume Bar */}
                                <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-75"
                                        style={{ width: `${Math.min(100, (parseFloat(debugData.vol) || 0) * 800)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 3. ACTION ZONE (Bottom Center - Floating) --- */}
                {/* Only for manual prompts like "I'm Ready" */}
                {(phase === 'instruct' || (phase === 'demo' && !lesson.sequence)) && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center px-4">
                        <Button
                            onClick={handleStartAnalysis}
                            size="xl"
                            className="bg-white text-slate-950 hover:bg-indigo-50 shadow-[0_0_40px_rgba(255,255,255,0.3)] border-none text-xl px-12 py-6 rounded-full w-full max-w-sm"
                        >
                            <Play className="w-6 h-6 mr-2 fill-slate-950" /> I'm Ready
                        </Button>
                    </div>
                )}
            </div>

            {/* --- PIP VIDEO (Bottom Right - Unchanged) --- */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                style={videoPos ? { left: videoPos.x, top: videoPos.y, bottom: 'auto', right: 'auto' } : {}}
                className="absolute bottom-6 right-6 z-50 w-48 md:w-80 aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl ring-1 ring-black/50 group hover:scale-[1.02] transition-transform"
            >
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1] opacity-80 group-hover:opacity-100 transition-opacity" />
                <canvas ref={debugCanvasRef} className="absolute inset-0 w-full h-full scale-x-[-1] opacity-60 pointer-events-none" width={640} height={480} />

                {/* PIP Overlay Information */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isListeningRef.current ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Cam</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setSettings(s => ({ ...s, isLefty: !s.isLefty })); }}
                        className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded backdrop-blur-md transition-colors"
                    >
                        {settings.isLefty ? 'LEFTY' : 'RIGHTY'}
                    </button>
                </div>
            </div>

            {/* --- SUCCESS MODAL (Full Screen Overlay) --- */}
            {(phase === 'complete' || (streak >= REQUIRED_STREAK && phase !== 'instruct')) && (
                <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-20 rounded-full"></div>
                        <Trophy className="w-40 h-40 text-yellow-400 drop-shadow-[0_0_60px_rgba(250,204,21,0.6)] animate-bounce relative z-10" />
                    </div>

                    <h1 className="text-6xl font-black text-white mt-8 mb-2 tracking-tighter">Level Complete</h1>
                    <p className="text-2xl text-indigo-300 font-medium mb-12">Total Mastery achieved.</p>

                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <Button onClick={() => onFinish(lesson.xp, 'next')} size="xl" className="w-full bg-white text-slate-950 hover:bg-slate-200 shadow-xl">
                            Next Lesson
                        </Button>
                        <Button onClick={() => onFinish(lesson.xp, 'menu')} variant="ghost" size="xl" className="w-full text-slate-400 hover:text-white">
                            Back to Menu
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
};
