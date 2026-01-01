import React, { useState, useRef, useEffect } from 'react';
import { Home, PlusCircle, Users, Settings, Sun, Moon, Sparkles, Send, X, ClipboardCheck } from 'lucide-react';
import { Tab, UserProfile, DailyReport } from '../types';
import { sendCoachMessage, getOfflineResponse, ChatMessage } from '../services/aiService';
import { Modal } from './ui/GlassComponents';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  user: UserProfile | null;
  salesData: DailyReport[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isDark, toggleTheme, user, salesData }) => {
  const [showCoach, setShowCoach] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [fabPosition, setFabPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 180 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(false);
      dragStartPos.current = { x: e.clientX - fabPosition.x, y: e.clientY - fabPosition.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (e.buttons !== 1) return;
      setIsDragging(true);
      e.preventDefault();
      const newX = Math.min(Math.max(0, e.clientX - dragStartPos.current.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.clientY - dragStartPos.current.y), window.innerHeight - 60);
      setFabPosition({ x: newX, y: newY });
  };

  const handleFabClick = () => {
      if (!isDragging) setShowCoach(true);
  };

  useEffect(() => {
    if (showCoach && messages.length === 0 && user) {
        setMessages([{ role: 'model', text: `Hi ${user.name.split(' ')[0]}! I'm your Bajaj Sales Coach. How's the market today? 🚀` }]);
    }
  }, [showCoach, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMsg.trim() || !user || isTyping) return;
    
    const userText = inputMsg;
    // Update UI immediately
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMsg('');
    setIsTyping(true);

    try {
        // Send previous history (excluding the one we just added to UI to avoid state lag issues)
        const reply = await sendCoachMessage(user, salesData, messages, userText);
        setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err: any) {
        console.error("AI Coach Error:", err);
        let errorMsg = "I'm having a connection hiccup. Using my offline brain... 🧠";
        
        if (err.message === "RATE_LIMIT") {
            errorMsg = "Whoa! Too many questions. Let's take a 1-minute breather! ⏱️";
        } else if (err.message === "API_KEY_MISSING") {
            errorMsg = "Sales Coach configuration is missing. Please contact support. 🛠️";
        }

        setTimeout(() => {
            const fallback = getOfflineResponse(userText, user);
            setMessages(prev => [...prev, { role: 'model', text: `${errorMsg}\n\nCoach Tip: ${fallback}` }]);
        }, 600);
    } finally {
        setIsTyping(false);
    }
  };

  if (!user) return <>{children}</>;

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'entry', icon: PlusCircle, label: 'Entry' },
    { id: 'eod', icon: ClipboardCheck, label: 'EOD' },
    { id: 'crm', icon: Users, label: 'CRM' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden font-sans bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:bg-black dark:bg-none text-slate-800 dark:text-slate-100 transition-colors duration-500">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4">
        <header className="bg-black text-white rounded-full px-5 py-2.5 flex justify-between items-center shadow-2xl border border-zinc-800 w-full max-w-[95%] sm:max-w-sm">
            <div className="flex items-center gap-3">
            {user.avatar ? (
                <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0)}
                </div>
            )}
            <p className="text-sm font-bold bg-gradient-to-r from-zinc-400 via-white to-zinc-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">
              {user.name.split(' ')[0]}
            </p>
            </div>
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-yellow-400">
            {isDark ? <Sun size={16} /> : <Moon size={16} className="text-zinc-300" />}
            </button>
        </header>
      </div>

      <main className="flex-1 px-4 pt-24 pb-32 w-full max-w-3xl mx-auto z-10">{children}</main>

      <div className="fixed z-[60] touch-none cursor-grab active:cursor-grabbing" style={{ left: fabPosition.x, top: fabPosition.y }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onClick={handleFabClick}>
        <div className="relative group">
            <div className="absolute inset-0 bg-white rounded-full blur opacity-40 animate-pulse-slow"></div>
            <button className="relative w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center border border-white/20 transition-transform hover:scale-110 active:scale-95">
                <Sparkles size={24} className="animate-[spin_4s_linear_infinite]" />
            </button>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-black/90 dark:bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] px-5 py-3 flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => onTabChange(item.id)} className={`relative flex flex-col items-center justify-center transition-all ${isActive ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className={`p-2 rounded-full ${isActive ? 'bg-white/20' : ''}`}><item.icon size={22} /></div>
                  {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
                </button>
              );
            })}
        </div>
      </div>

      <Modal isOpen={showCoach} onClose={() => setShowCoach(false)} title="Sales Coach AI">
        <div className="flex flex-col h-[60vh] sm:h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border border-gray-100 dark:border-white/10 rounded-tl-sm shadow-sm'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && <div className="flex justify-start animate-pulse"><div className="bg-gray-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl text-xs text-slate-400">Coach is thinking...</div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="pt-3 border-t border-gray-100 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input 
                      value={inputMsg} 
                      onChange={e => setInputMsg(e.target.value)} 
                      placeholder="Ask your coach..." 
                      className="flex-1 bg-white dark:bg-zinc-800 border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10" 
                    />
                    <button 
                      type="submit" 
                      disabled={isTyping || !inputMsg.trim()}
                      className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg transition-transform active:scale-90 disabled:opacity-30"
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