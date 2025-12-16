import React, { useState, useRef, useEffect } from 'react';
import { Home, PlusCircle, Users, Settings, Sun, Moon, Sparkles, Send, X, MessageCircle } from 'lucide-react';
import { Tab, UserProfile, DailyReport } from '../types';
import { createSalesCoachChat } from '../services/aiService';
import { Modal } from './ui/GlassComponents';
import { Chat } from '@google/genai';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  user: UserProfile | null;
  salesData: DailyReport[]; // Added for Global AI Context
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isDark, toggleTheme, user, salesData }) => {
  
  // --- Global AI Chat State ---
  const [showCoach, setShowCoach] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Draggable FAB State ---
  const [fabPosition, setFabPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(false); // Assume click initially
      dragStartPos.current = { x: e.clientX - fabPosition.x, y: e.clientY - fabPosition.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (e.buttons !== 1) return;
      setIsDragging(true); // It's a drag
      e.preventDefault();
      
      const newX = Math.min(Math.max(0, e.clientX - dragStartPos.current.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.clientY - dragStartPos.current.y), window.innerHeight - 60);
      setFabPosition({ x: newX, y: newY });
  };

  const handleFabClick = () => {
      if (!isDragging) setShowCoach(true);
  };

  // Chat Initialization
  useEffect(() => {
    if (showCoach && !chatSession && user) {
        const chat = createSalesCoachChat(user, salesData);
        setChatSession(chat);
        setIsTyping(true);
        
        chat.sendMessage({ message: "Generate a short, friendly greeting and a one-sentence summary of my current month's performance. Ask me what product I want to know about." })
            .then(res => {
                if (res.text) setMessages([{ role: 'model', text: res.text }]);
            })
            .catch(() => setMessages([{ role: 'model', text: "Hi! I'm ready to help with your sales and product questions." }]))
            .finally(() => setIsTyping(false));
    }
  }, [showCoach, user, salesData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMsg.trim() || !chatSession) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMsg('');
    setIsTyping(true);

    try {
        const result = await chatSession.sendMessage({ message: userText });
        if (result.text) setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (err) {
        setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
    } finally {
        setIsTyping(false);
    }
  };


  if (!user) return <>{children}</>;

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'entry', icon: PlusCircle, label: 'Entry' },
    { id: 'crm', icon: Users, label: 'CRM' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden font-sans bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:bg-black dark:bg-none text-slate-800 dark:text-slate-100 transition-colors duration-500">
      {/* Background Decor Items */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Dynamic Island (Header) */}
      <div className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4">
        <header className="bg-black text-white rounded-full px-5 py-2.5 flex justify-between items-center shadow-2xl border border-zinc-800 w-full max-w-[95%] sm:max-w-sm transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-center gap-3">
            {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0)}
                </div>
            )}
            <div>
                <p className="text-[10px] text-zinc-400 font-medium leading-none">Hello,</p>
                {/* Shiny Text Effect for Name */}
                <p className="text-sm font-bold leading-tight bg-gradient-to-r from-zinc-400 via-white to-zinc-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">
                  {user.name.split(' ')[0]}
                </p>
            </div>
            </div>
            
            <button 
            onClick={toggleTheme} 
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors text-yellow-400"
            >
            {isDark ? <Sun size={16} /> : <Moon size={16} className="text-zinc-300" />}
            </button>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-24 pb-32 w-full max-w-3xl mx-auto z-10">
        {children}
      </main>

      {/* Draggable AI Coach FAB */}
      <div 
        className="fixed z-[60] touch-none cursor-grab active:cursor-grabbing"
        style={{ left: fabPosition.x, top: fabPosition.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleFabClick}
      >
        <div className="relative group">
            <div className="absolute inset-0 bg-white dark:bg-white rounded-full blur opacity-40 animate-pulse-slow group-hover:opacity-60 transition-opacity"></div>
            <button className="relative w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center border border-white/20 dark:border-black/10 transition-transform hover:scale-110 active:scale-95 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-y-full group-hover:translate-y-[-100%] transition-transform duration-700"></div>
                <Sparkles size={24} className="animate-[spin_4s_linear_infinite]" />
            </button>
            {/* Tooltip */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                AI Coach
            </span>
        </div>
      </div>

      {/* Bottom Dynamic Island (Navigation) */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-black/90 dark:bg-black/95 backdrop-blur-xl border border-white/10 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] px-6 py-3 flex items-center gap-8 transition-all duration-300 ease-in-out hover:scale-[1.02]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive ? 'text-white scale-110 -translate-y-1' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-white/20' : ''}`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {isActive && (
                    <span className="absolute -bottom-2 w-1 h-1 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Global AI Coach Modal */}
      <Modal 
        isOpen={showCoach} 
        onClose={() => setShowCoach(false)} 
        title="Sales Coach AI"
      >
        <div className="flex flex-col h-[60vh] sm:h-[500px]">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 custom-scrollbar">
                {messages.map((msg, i) => (
                    <div 
                        key={i} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div 
                            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-zinc-900 text-white rounded-tr-sm' 
                                    : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border border-gray-100 dark:border-white/10 rounded-tl-sm'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-gray-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm -mx-2 px-2 pb-1">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input 
                        value={inputMsg}
                        onChange={e => setInputMsg(e.target.value)}
                        placeholder="Ask about sales tips..."
                        className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 shadow-sm transition-all"
                        disabled={isTyping}
                    />
                    <button 
                        type="submit" 
                        disabled={!inputMsg.trim() || isTyping}
                        className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default Layout;