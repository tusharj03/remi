import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { auth, logoutUser, subscribeToUserProgress, updateUserProgress, loginAsGuest } from '@/services/firebase';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { PracticeSession } from '@/features/lesson/PracticeSession';
import { JamSession } from '@/features/jam/JamSession'; // [NEW]
import { Tuner } from '@/features/tuner/Tuner';
import { Button } from '@/components/ui/Button';
import { LESSONS } from '@/data/curriculum';
import { AuthOverlay } from '@/features/auth/AuthOverlay';
import { UserProfile } from '@/features/auth/UserProfile';
import { ChatWidget } from '@/features/chat/ChatWidget';
import { ChordLibrary } from '@/features/chords/ChordLibrary';
import { Shell } from '@/components/layout/Shell';
import { CommunityPage } from '@/features/community/CommunityPage';

// --- Landing Page ---
const LandingPage = ({ onStart, loading }) => (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
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
                    fontSize: '18px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(98, 0, 255, 0.4)'
                }}
            >
                Start Learning
            </Button>
        </div>
    </div>
);

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('dashboard'); // Default to dashboard directly
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [unlockAll, setUnlockAll] = useState(() => {
        return localStorage.getItem('remi_unlockAll') === 'true';
    });

    // Persist unlockAll
    useEffect(() => {
        localStorage.setItem('remi_unlockAll', unlockAll);
    }, [unlockAll]);

    // Auth Init
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(u => {
            if (u) {
                setUser(u);
            } else {
                // Auto-login as guest if no user found
                console.log("No user found, logging in as guest...");
                loginAsGuest().then(guest => {
                    if (guest && guest.uid === 'offline_user') {
                        setUser(guest);
                    }
                });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Progress Sync
    useEffect(() => {
        // If no user, maybe load from localStorage for "Guest" persistence?
        // Or just rely on Firebase if they login.
        if (!user) {
            // Optional: Local guest progress could go here.
            return;
        }
        const unsub = subscribeToUserProgress(user.uid, (data) => {
            setProgress(data);
        });
        return () => unsub();
    }, [user]);

    // Removed handleStartClick since Landing is gone.

    const handleAuthSuccess = (u) => {
        setUser(u);
        setShowAuth(false);
        setView('dashboard');
    };

    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
        setProgress(null);
        setView('dashboard'); // Stay on dashboard (Guest mode)
    };

    const handleLessonSelect = (lesson) => {
        setSelectedLesson(lesson);
        setView('practice');
    };

    const handleLessonFinish = async (xpEarned, action = 'menu') => {
        if (xpEarned > 0 && user && selectedLesson) {
            try {
                const newProgress = await updateUserProgress(user.uid, progress, selectedLesson.id, xpEarned);
                console.log("Lesson Complete. Saving Progress:", newProgress);
                setProgress(newProgress);
            } catch (err) {
                console.error("Failed to update progress:", err);
            }
        }

        if (action === 'next') {
            const currentIndex = LESSONS.findIndex(l => l.id === selectedLesson.id);
            if (currentIndex >= 0 && currentIndex < LESSONS.length - 1) {
                const nextLesson = LESSONS[currentIndex + 1];
                setSelectedLesson(nextLesson);
                setView('practice');
            } else {
                setSelectedLesson(null);
                setView('dashboard');
            }
        } else {
            setSelectedLesson(null);
            setView('dashboard');
        }
    };

    // Helper to wrap content in Shell
    const renderContent = () => {
        switch (view) {
            case 'dashboard':
                return (
                    <Dashboard
                        user={user}
                        progress={progress}
                        onSelectLesson={handleLessonSelect}
                        onOpenTuner={() => setView('tuner')}
                        onOpenChords={() => setView('chords')}
                        onOpenProfile={() => setView('profile')}
                        onOpenJam={() => setView('jam')} // [NEW]
                        unlockAll={unlockAll}
                        onAuth={() => setShowAuth(true)}
                    />
                );
            case 'community':
                return <CommunityPage />;
            case 'tuner':
                return <Tuner onClose={() => setView('dashboard')} />;
            case 'chords':
                return <ChordLibrary onClose={() => setView('dashboard')} />;
            case 'profile':
                return (
                    <UserProfile
                        user={user}
                        progress={progress}
                        onClose={() => setView('dashboard')}
                        onLogout={handleLogout}
                        unlockAll={unlockAll}
                        setUnlockAll={setUnlockAll}
                        onLoginClick={() => setShowAuth(true)}
                    />
                );
            default:
                return null;
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

            {/* FULL SCREEN MODES */}
            {/* Landing Page Removed */}

            {view === 'practice' && selectedLesson && (
                <PracticeSession
                    key={selectedLesson.id}
                    lesson={selectedLesson}
                    onFinish={handleLessonFinish}
                />
            )}

            {/* Jam Session (Full Screen) */}
            {view === 'jam' && (
                <JamSession onBack={() => setView('dashboard')} />
            )}

            {/* SHELL VIEWS */}
            {['dashboard', 'community', 'tuner', 'chords', 'profile'].includes(view) && (
                <Shell currentView={view} onViewChange={setView} user={user} onAuth={() => setShowAuth(true)}>
                    {renderContent()}
                </Shell>
            )}

            {/* Global Chat */}
            {['dashboard', 'community'].includes(view) && <ChatWidget />}
        </>
    );
}

export default App;
