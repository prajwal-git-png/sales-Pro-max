import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import NewEntry from './components/NewEntry';
import CRM from './components/CRM';
import Settings from './components/Settings';
import { Tab, UserProfile, DailyReport } from './types';
import { getUser, logoutUser, getSalesWithoutImages, getTheme, saveTheme, } from './services/storageService';

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      return getUser();
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedEntryDate, setSelectedEntryDate] = useState<string | undefined>(undefined);
  const [salesData, setSalesData] = useState<DailyReport[]>([]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = getTheme();
      const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
      if (isDarkMode && typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
      }
      return isDarkMode;
    } catch {
      return false;
    }
  });

  const refreshData = async () => {
    try {
      const storedSales = await getSalesWithoutImages();
      setSalesData(storedSales);
    } catch (e) {
      console.warn("refreshData error", e);
    }
  };

  useEffect(() => {
    // 1. Initial load of sales data
    refreshData();

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

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      salesData={salesData}
      onUpdateUser={setUser}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          sales={salesData} 
          user={user} 
          onDataChange={refreshData} 
          onUpdateUser={setUser} 
          onNavigate={setActiveTab}
          onSelectDateForEntry={(date) => {
            setSelectedEntryDate(date);
            setActiveTab('entry');
          }}
        />
      )}
      {activeTab === 'entry' && (
        <NewEntry 
          user={user} 
          onEntryComplete={refreshData} 
          initialDate={selectedEntryDate}
          onBackToDashboard={() => setActiveTab('dashboard')}
        />
      )}
      {activeTab === 'crm' && <CRM user={user} />}
      {activeTab === 'settings' && <Settings user={user} onUpdateUser={setUser} onLogout={handleLogout} isDark={isDark} toggleTheme={toggleTheme} onDataChange={refreshData} />}
    </Layout>
  );
};

export default App;
