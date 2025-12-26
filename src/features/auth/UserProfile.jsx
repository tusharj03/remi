import React from 'react';
import { User, LogOut, X, Shield, Star, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const UserProfile = ({ user, progress, onClose, onLogout, onLoginClick, unlockAll, setUnlockAll }) => {
    const isGuest = user?.isAnonymous;
    const email = user?.email || 'Guest User';
    const streak = progress?.streak || 0;
    const xp = progress?.xp || 0;
    const joinDate = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Just now';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header Pattern */}
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Avatar & Info */}
                <div className="px-8 pb-8 -mt-12 relative flex-1 flex flex-col">
                    <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-xl mb-4 self-center">
                        <User size={40} className="text-slate-400" />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-1">{isGuest ? 'Guest Musician' : 'Musician'}</h2>
                        <p className="text-slate-400 text-sm font-medium">{email}</p>
                        {isGuest && (
                            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wide">
                                <Shield size={12} className="mr-1.5" />
                                Not Saved
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase mb-1">Total XP</span>
                            <div className="text-2xl font-black text-white flex items-center">
                                <Star size={20} className="text-yellow-400 mr-2 fill-yellow-400" />
                                {xp.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase mb-1">Streak</span>
                            <div className="text-2xl font-black text-white">
                                {streak} Days
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="bg-slate-800/30 rounded-xl p-4 mb-8 border border-slate-800">
                        <h3 className="text-slate-500 text-xs font-bold uppercase mb-3 px-1">Settings</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm">Unlock All Lessons</span>
                                <span className="text-slate-400 text-xs">Skip progression requirements</span>
                            </div>
                            <button
                                onClick={() => setUnlockAll(!unlockAll)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${unlockAll ? 'bg-indigo-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${unlockAll ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto space-y-3">
                        {isGuest ? (
                            <Button
                                onClick={onLoginClick}
                                className="w-full h-12 text-lg shadow-lg shadow-indigo-500/20"
                            >
                                <LogIn className="mr-2" size={20} />
                                Sign Up to Save Progress
                            </Button>
                        ) : (
                            <button
                                onClick={onLogout}
                                className="w-full py-4 rounded-xl border border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-bold flex items-center justify-center"
                            >
                                <LogOut className="mr-2" size={20} />
                                Log Out
                            </button>
                        )}

                        <div className="text-center mt-4">
                            <p className="text-xs text-slate-600">Joined {joinDate}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
