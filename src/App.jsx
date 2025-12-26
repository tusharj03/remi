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
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
        {/* Gradient removed for pure black look */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-8 text-center animate-in fade-in duration-700">

            <h1 className="text-7xl font-black text-white mb-2 tracking-tighter" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>remi.</h1>
            <p className="text-2xl mb-6 font-medium tracking-wide" style={{ fontFamily: 'Comfortaa, cursive', color: '#6200FF' }}>
                duolingo. for guitar.
            </p>

            <Button
                onClick={onStart}
                className="w-auto h-auto transition-colors"
                style={{
                    backgroundColor: '#6200FF',
                    borderRadius: '10px',
                    padding: '12px 25px',
                    fontSize: '16px',
                    fontWeight: 'bold', // Visual check suggests bold despite computed 400
                    color: 'white',
                    fontFamily: '"Source Sans Pro", sans-serif',
                    boxShadow: 'none'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#781EFF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6200FF'}
                isLoading={loading}
            >
                {loading ? 'Loading...' : 'start learning'}
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
    const [unlockAll, setUnlockAll] = useState(() => {
        return localStorage.getItem('remi_unlockAll') === 'true';
    });

    // Persist unlockAll
    useEffect(() => {
        localStorage.setItem('remi_unlockAll', unlockAll);
    }, [unlockAll]);

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
                    unlockAll={unlockAll}
                    setUnlockAll={setUnlockAll}
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
                    unlockAll={unlockAll}
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
