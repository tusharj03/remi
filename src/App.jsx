import React, { useState, useEffect } from 'react';
import { Loader, Play, Zap, Activity, Music } from 'lucide-react';
import { auth, signIn, subscribeToUserProgress, updateUserProgress, logoutUser } from '@/services/firebase';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { PracticeSession } from '@/features/lesson/PracticeSession';
import { Tuner } from '@/features/tuner/Tuner';
import { Button } from '@/components/ui/Button';
import { LESSONS } from '@/data/curriculum';
import { AuthOverlay } from '@/features/auth/AuthOverlay';
import { UserProfile } from '@/features/auth/UserProfile';
import { ChatWidget } from '@/features/chat/ChatWidget';
import { ChordLibrary } from '@/features/chords/ChordLibrary';

// --- Landing Page ---
const LandingPage = ({ onStart, loading }) => (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-8 text-center animate-in fade-in duration-700">
            <div className="mb-12 relative group cursor-default">
                <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse group-hover:bg-indigo-500/30 transition-all"></div>
                <div className="w-32 h-32 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-6 border border-white/10 group-hover:rotate-12 transition-transform duration-500 overflow-hidden">
                    <img src="/logo.png" alt="Remi Logo" className="w-full h-full object-cover" />
                </div>
            </div>
            <h1 className="text-7xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">Remi</h1>
            <p className="text-slate-400 text-xl mb-12 max-w-md leading-relaxed font-light">
                The AI Guitar Tutor that <span className="text-indigo-400 font-bold">listens</span> and <span className="text-purple-400 font-bold">watches</span> you play.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-16 w-full max-w-sm">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur hover:bg-slate-800/50 transition-colors">
                    <Zap className="w-6 h-6 text-yellow-400 mb-2 mx-auto" />
                    <div className="text-sm font-bold text-slate-300">Instant Feedback</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur hover:bg-slate-800/50 transition-colors">
                    <Activity className="w-6 h-6 text-green-400 mb-2 mx-auto" />
                    <div className="text-sm font-bold text-slate-300">Audio Lock™</div>
                </div>
            </div>

            <Button
                onClick={onStart}
                className="w-full max-w-xs h-16 text-xl rounded-2xl shadow-indigo-500/20"
                isLoading={loading}
            >
                {!loading && <Play className="mr-2 fill-slate-950" />}
                {loading ? 'Loading...' : 'Start Learning'}
            </Button>
        </div>
    </div>
);

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('landing'); // landing, dashboard, practice, tuner
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Auth Init
    useEffect(() => {
        const init = async () => {
            // Check if we have a persisted session via standard Firebase SDK
            // We don't necessarily need to auto-sign-in anonymous here if we want the splash screen to show "Start"
            // But let's keep the listener.
        };
        init();

        const unsubscribe = auth.onAuthStateChanged(u => {
            if (u) {
                setUser(u);
                // If we detect a user (e.g. from session persistence), we can auto-enter dashboard if not in specific 'landing' intent?
                // For now, let's let the user click "Start" unless they are already "in".
                // Actually, standard behavior: if logged in, go to dashboard.
                // But we want the landing page animation maybe?
                // Let's keep it simple: if user is loaded, updated state. View switching happens on action.
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Progress Sync
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToUserProgress(user.uid, (data) => {
            setProgress(data);
        });
        return () => unsub();
    }, [user]);

    const handleStartClick = () => {
        if (user) {
            setView('dashboard');
        } else {
            setShowAuth(true);
        }
    };

    const handleAuthSuccess = (u) => {
        setUser(u);
        setShowAuth(false);
        setView('dashboard');
    };

    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
        setProgress(null);
        setShowProfile(false);
        setView('landing');
    };

    const handleLessonSelect = (lesson) => {
        setSelectedLesson(lesson);
        setView('practice');
    };

    const handleLessonFinish = async (xpEarned, action = 'menu') => {
        console.log("handleLessonFinish called:", { xpEarned, action, selectedLesson: selectedLesson?.id });

        if (xpEarned > 0 && user && selectedLesson) {
            try {
                const newProgress = await updateUserProgress(user.uid, progress, selectedLesson.id, xpEarned);
                setProgress(newProgress);
            } catch (err) {
                console.error("Failed to update progress:", err);
            }
        }

        if (action === 'next') {
            const currentIndex = LESSONS.findIndex(l => l.id === selectedLesson.id);
            console.log("Current lesson index:", currentIndex, "Total lessons:", LESSONS.length);

            if (currentIndex >= 0 && currentIndex < LESSONS.length - 1) {
                const nextLesson = LESSONS[currentIndex + 1];
                console.log("Advancing to next lesson:", nextLesson.id);
                // Important: We must clear the current lesson first if we want to force a re-mount or
                // ensure the key changes. But React key on PracticeSession should handle it.
                // Let's verify if setView needs a toggle or if just changing selectedLesson is enough.
                setSelectedLesson(nextLesson);
                setView('practice');
            } else {
                console.log("No next lesson found or at end of curriculum.");
                setSelectedLesson(null);
                setView('dashboard');
            }
        } else {
            setSelectedLesson(null);
            setView('dashboard');
        }
    };

    if (loading && !user) return <div className="bg-slate-950 min-h-screen text-white flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-indigo-500" /></div>;

    return (
        <>

            {showAuth && (
                <AuthOverlay
                    onClose={() => setShowAuth(false)}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}

            {showProfile && user && (
                <UserProfile
                    user={user}
                    progress={progress}
                    onClose={() => setShowProfile(false)}
                    onLogout={handleLogout}
                    onLoginClick={() => {
                        setShowProfile(false);
                        setShowAuth(true);
                    }}
                />
            )}

            {view === 'landing' && <LandingPage onStart={handleStartClick} loading={loading && !progress && user} />}

            {/* Logic for views */}
            {view === 'dashboard' && (
                <Dashboard
                    user={user}
                    progress={progress}
                    onSelectLesson={handleLessonSelect}
                    onOpenTuner={() => setView('tuner')}
                    onOpenChords={() => setView('chords')}
                    onOpenProfile={() => setShowProfile(true)}
                />
            )}

            {view === 'practice' && selectedLesson && (
                <PracticeSession
                    key={selectedLesson.id}
                    lesson={selectedLesson}
                    onFinish={handleLessonFinish}
                />
            )}

            {view === 'tuner' && (
                <Tuner onClose={() => setView('dashboard')} />
            )}

            {view === 'chords' && (
                <ChordLibrary onClose={() => setView('dashboard')} />
            )}

            {/* Global Chat Widget (only show if logged in/in app) */}
            {view !== 'landing' && <ChatWidget />}
        </>
    );
}

export default App;
