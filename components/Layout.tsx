import React, { useState, useEffect } from 'react';
import { Home, Users, Settings, ClipboardCheck, CalendarCheck, BarChart2, Sparkles } from 'lucide-react';
import { Tab, UserProfile, DailyReport } from '../types';
import Attendance from './Attendance';
import { InstallBanner } from './InstallPWA';
import { AIChatModal } from './AIChatModal';

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

  // Dynamic Island State
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [quote, setQuote] = useState("Believe you can and you're halfway there.");
  const quotes = [
      "Believe you can and you're halfway there.",
      "Quality means doing it right when no one is looking.",
      "The only way to do great work is to love what you do.",
      "Success is not final, failure is not fatal.",
      "Your limitation—it's only your imagination.",
      "Every demonstration brings you closer to a sale.",
      "Focus on customer needs, and success follows."
  ];

  useEffect(() => {
    if (isIslandExpanded) {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [isIslandExpanded]);

  if (!user) return <>{children}</>;

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'attendance', icon: CalendarCheck, label: 'Attend' },
    { id: 'performance', icon: BarChart2, label: 'Stats' },
    { id: 'crm', icon: Users, label: 'CRM' },
    { id: 'eod', icon: ClipboardCheck, label: 'EOD' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-x-hidden selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      <InstallBanner />
      
      {/* Background ambient blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-400/10 dark:bg-zinc-800/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-300/10 dark:bg-zinc-800/20 blur-[120px] pointer-events-none" />

      {/* Dynamic Island Header */}
      <div className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <div 
          onClick={() => setIsIslandExpanded(!isIslandExpanded)}
          className={`pointer-events-auto bg-black text-white rounded-3xl transition-all duration-300 ease-out shadow-2xl flex flex-col items-center border border-zinc-800 overflow-hidden cursor-pointer ${
            isIslandExpanded 
              ? 'w-full max-w-sm p-5 h-auto' 
              : 'h-10 px-4 flex-row gap-3 py-1.5'
          }`}
        >
            {!isIslandExpanded ? (
                <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold tracking-wide truncate max-w-[200px]">
                      {user.storeName || "SalesTrack"}
                    </span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowCoach(true); 
                      }} 
                      title="Open Gemini AI Coach"
                      className="ml-auto pl-2 flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Sparkles size={12} className="animate-spin text-emerald-400" />
                      AI Coach
                    </button>
                </>
            ) : (
                <div className="w-full space-y-4 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{user.name}</span>
                        </div>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full font-mono">{user.storeCode || "RRL"}</span>
                    </div>
                    
                    <div className="w-full h-[1px] bg-zinc-800/50" />
                    
                    <p className="text-sm font-serif italic text-zinc-300 px-2 text-center">"{quote}"</p>
                    
                    <div className="flex gap-2 w-full pt-1">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setShowCoach(true); 
                            setIsIslandExpanded(false); 
                          }} 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all text-white shadow-lg shadow-emerald-900/30"
                        >
                            <Sparkles size={15} />
                            Launch AI Sales Coach
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

      {/* Floating AI Coach Action Button */}
      <button
        onClick={() => setShowCoach(true)}
        title="Open Gemini AI Sales Coach"
        className="fixed bottom-22 right-4 sm:right-8 z-40 bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-500 text-white backdrop-blur-xl border border-white/20 shadow-2xl rounded-full p-3.5 flex items-center gap-2 group transition-all duration-300 active:scale-95 cursor-pointer ring-4 ring-black/5 dark:ring-white/10"
      >
        <Sparkles size={19} className="text-emerald-400 dark:text-emerald-200 animate-pulse" />
        <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">AI Coach</span>
      </button>

      {/* Bottom Nav Bar */}
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

      {/* Dedicated Multi-turn Gemini AI Chat Modal */}
      <AIChatModal 
        isOpen={showCoach} 
        onClose={() => setShowCoach(false)} 
        user={user} 
        salesData={salesData} 
      />
    </div>
  );
};

export default Layout;
