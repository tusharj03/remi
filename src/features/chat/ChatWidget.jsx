import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { sendMessageToAI } from '@/services/chatService';
import { FretboardDiagram } from '@/components/ui/FretboardDiagram';
import { CHORDS } from '@/data/chords';

export const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'ai', text: "Hi! I'm Remi's AI assistant. Ask me anything about guitar!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const responseText = await sendMessageToAI(userMsg.text);
            const aiMsg = { id: Date.now() + 1, role: 'ai', text: responseText };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            const errorMsg = { id: Date.now() + 1, role: 'ai', text: "Sorry, I had trouble connecting. Try again?" };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessageContent = (text) => {
        // Parse [show_chord: id]
        const chordTagMatch = text.match(/\[show_chord:\s*([a-zA-Z0-9_]+)\]/);
        let chordData = null;
        let cleanText = text;

        if (chordTagMatch) {
            const chordId = chordTagMatch[1];
            cleanText = text.replace(chordTagMatch[0], '').trim();
            chordData = CHORDS.find(c => c.id === chordId || c.id === chordId.toLowerCase());
        }

        // Parse Bold
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);

        return (
            <div className="space-y-3">
                <p className="leading-relaxed">
                    {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="text-indigo-200">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                    })}
                </p>

                {chordData && (
                    <div className="mt-3 bg-slate-900 rounded-xl p-4 border border-slate-700 w-full min-w-[280px]">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Chord: {chordData.name}
                        </p>
                        <div className="relative w-full aspect-[2/1] pointer-events-none">
                            <FretboardDiagram
                                totalFrets={5}
                                variant="compact"
                                highlightNotes={chordData.fingers.map(f => ({
                                    string: f.string, fret: f.fret, disp: f.finger
                                }))}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="font-bold text-white">Remi Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600/90 text-white rounded-tr-sm backdrop-blur-sm'
                                        : 'bg-slate-800/90 text-slate-200 rounded-tl-sm border border-slate-700 backdrop-blur-sm'
                                        }`}
                                >
                                    {msg.role === 'ai' ? renderMessageContent(msg.text) : msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-700">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about chords..."
                            className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <Button type="submit" size="icon" className="w-10 h-10 shrink-0" disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            )}
        </>
    );
};
