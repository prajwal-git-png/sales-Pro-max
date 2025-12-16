import React from 'react';
import { Home, PlusCircle, Users, Settings, Sun, Moon } from 'lucide-react';
import { Tab, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  user: UserProfile | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isDark, toggleTheme, user }) => {
  if (!user) return <>{children}</>;

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'entry', icon: PlusCircle, label: 'Entry' },
    { id: 'crm', icon: Users, label: 'CRM' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden font-sans bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:bg-black dark:bg-none text-slate-800 dark:text-slate-100 transition-colors duration-500">
      {/* Background Decor Items (Subtler for dark mode) */}
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
                <p className="text-sm font-bold leading-tight">{user.name.split(' ')[0]}</p>
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
    </div>
  );
};

export default Layout;