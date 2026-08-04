import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import NewEntry from './components/NewEntry';
import EOD from './components/EOD';
import CRM from './components/CRM';
import Settings from './components/Settings';
import Performance from './components/Performance';
import { Tab, UserProfile, DailyReport } from './types';
import { getUser, logoutUser, getSalesWithoutImages, getTheme, saveTheme } from './services/storageService';

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<DailyReport[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      const savedTheme = getTheme();
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }

      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
        const storedSales = await getSalesWithoutImages();
        setSalesData(storedSales);
      }
      
      // Sophisticated splash timeout
      setTimeout(() => setIsLoading(false), 2600);
    };

    initApp();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveTheme(newMode ? 'dark' : 'light');
  };

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    refreshData();
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const refreshData = async () => {
    const storedSales = await getSalesWithoutImages();
    setSalesData(storedSales);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950 transition-colors duration-1000 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[110vw] h-[110vw] bg-zinc-500/10 rounded-2xl blur-[140px] animate-float opacity-40" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[90vw] h-[90vw] bg-zinc-500/10 rounded-2xl blur-[140px] animate-float opacity-40" style={{ animationDelay: '-3s' }} />

        <div className="relative z-10 flex flex-col items-center gap-12 animate-reveal">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 bg-black/10 dark:bg-white/10 blur-2xl scale-110 rounded-2xl" />
            <div className="relative h-full w-full bg-black dark:bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12 text-white dark:text-black">
                 <path d="M35 65 L50 35 L65 65" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-8">
            <h1 className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
              SalesTrack
            </h1>
            <div className="relative w-8 h-8">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute left-[14px] top-0 w-[4px] h-[10px] bg-zinc-400 dark:bg-zinc-600 rounded-full animate-ios-loader origin-[50%_16px]" 
                  style={{ 
                    transform: `rotate(${i * 30}deg)`,
                    animationDelay: `${(i - 12) * 0.1}s`
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-16 flex flex-col items-center gap-1">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-400">
            Powered by AI
          </p>
          <div className="w-12 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      user={user}
      salesData={salesData}
      onUpdateUser={setUser}
    >
      {activeTab === 'dashboard' && <Dashboard sales={salesData} user={user} onDataChange={refreshData} onUpdateUser={setUser} />}
      {activeTab === 'entry' && <NewEntry user={user} onEntryComplete={refreshData} />}
      {activeTab === 'eod' && <EOD user={user} onUpdateUser={setUser} />}
      {activeTab === 'crm' && <CRM user={user} />}
      {activeTab === 'performance' && <Performance sales={salesData} />}
      {activeTab === 'settings' && <Settings user={user} onUpdateUser={setUser} onLogout={handleLogout} isDark={isDark} toggleTheme={toggleTheme} />}
    </Layout>
  );
};

export default App;