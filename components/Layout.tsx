import React, { useState, useRef, useEffect } from 'react';
import { Home, PlusCircle, Users, Settings, Send, ClipboardCheck, CalendarCheck, MessageSquare } from 'lucide-react';
import { Tab, UserProfile, DailyReport } from '../types';
import { sendCoachMessage, getOfflineResponse, ChatMessage } from '../services/aiService';
import { Modal } from './ui/GlassComponents';
import Attendance from './Attendance';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  user: UserProfile | null;
  salesData: DailyReport[];
  onUpdateUser: (user: UserProfile) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, user, salesData, onUpdateUser }) => {
  const [showCoach, setShowCoach] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Island State
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [quote, setQuote] = useState("Believe you can and you're halfway there.");
  const quotes = [
      "Believe you can and you're halfway there.",
      "Quality means doing it right when no one is looking.",
      "The only way to do great work is to love what you do.",
      "Success is not final, failure is not fatal.",
      "Your limitation—it's only your imagination."
  ];

  useEffect(() => {
    if (isIslandExpanded) {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [isIslandExpanded]);

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
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMsg('');
    setIsTyping(true);

    try {
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
    { id: 'attendance', icon: CalendarCheck, label: 'Attend' },
    { id: 'entry', icon: PlusCircle, label: 'Entry' },
    { id: 'eod', icon: ClipboardCheck, label: 'EOD' },
    { id: 'crm', icon: Users, label: 'CRM' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden font-sans bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 dark:bg-zinc-950 dark:bg-none text-zinc-800 dark:text-zinc-100 transition-colors duration-500">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Dynamic Island Header */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        {/* Backdrop for closing when expanded */}
        {isIslandExpanded && (
            <div 
                className="fixed inset-0 z-[-1] pointer-events-auto" 
                onClick={() => setIsIslandExpanded(false)} 
            />
        )}
        <div 
            className={`pointer-events-auto bg-black text-white rounded-[2rem] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isIslandExpanded ? 'w-[90vw] max-w-sm p-6' : 'w-auto h-12 px-4 py-2 flex items-center gap-3'}`}
            onClick={() => !isIslandExpanded && setIsIslandExpanded(true)}
        >
            {!isIslandExpanded ? (
                <div className="flex items-center gap-3">
                    {user.avatar ? (
                        <img src={user.avatar} className="w-6 h-6 rounded-full object-cover border border-white/20" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                            {user.name.charAt(0)}
                        </div>
                    )}
                    <span className="text-sm font-medium tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse-slow">{user.name.split(' ')[0]}</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                </div>
            ) : (
                <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-300 w-full">
                    <div className="flex items-center gap-3 w-full px-2">
                        {user.avatar ? (
                            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">
                                {user.name.charAt(0)}
                            </div>
                        )}
                        <div className="text-left flex-1">
                            <p className="text-sm font-bold">{user.name}</p>
                            <p className="text-[10px] text-zinc-400">{user.storeName}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    </div>
                    
                    <div className="w-full h-[1px] bg-zinc-800/50" />
                    
                    <p className="text-base font-serif italic text-zinc-300 px-2">"{quote}"</p>
                    
                    <div className="flex gap-3 w-full pt-2">
                        <button onClick={(e) => { e.stopPropagation(); setShowCoach(true); setIsIslandExpanded(false); }} className="flex-1 bg-zinc-800 py-3 rounded-3xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform hover:bg-zinc-700">
                            <MessageSquare size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <main className="flex-1 px-4 pt-24 pb-32 w-full max-w-3xl mx-auto z-10">
          {activeTab === 'attendance' ? (
              <Attendance user={user} onUpdateUser={onUpdateUser} />
          ) : (
              children
          )}
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-md rounded-3xl px-3 py-2 flex items-center gap-1 sm:gap-4 overflow-x-auto max-w-full no-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => onTabChange(item.id)} className={`relative flex flex-col items-center justify-center transition-all min-w-[50px] ${isActive ? 'text-zinc-900 dark:text-white scale-110' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>
                  <div className={`p-2 rounded-3xl ${isActive ? 'bg-zinc-200/50 dark:bg-white/10' : ''}`}><item.icon size={20} /></div>
                  {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-zinc-900 dark:bg-white rounded-full" />}
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{item.label}</span>
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
                        <div className={`max-w-[85%] p-3 rounded-3xl text-sm ${msg.role === 'user' ? 'bg-slate-800 dark:bg-zinc-100 text-white dark:text-black rounded-tr-none' : 'bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-white/50 dark:border-white/20 shadow-sm rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && <div className="flex justify-start animate-pulse"><div className="bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-white/40 dark:border-white/10 px-4 py-3 rounded-3xl rounded-tl-none text-xs text-slate-500 dark:text-slate-400">Coach is thinking...</div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="pt-3 border-t border-gray-200/50 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input 
                      value={inputMsg} 
                      onChange={e => setInputMsg(e.target.value)} 
                      placeholder="Ask your coach..." 
                      className="flex-1 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 rounded-3xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-zinc-400" 
                    />
                    <button 
                      type="submit" 
                      disabled={isTyping || !inputMsg.trim()}
                      className="p-2.5 bg-slate-800 dark:bg-zinc-100 text-white dark:text-black rounded-3xl shadow-sm border border-slate-700 dark:border-zinc-300 transition-transform active:scale-95 disabled:opacity-30"
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
