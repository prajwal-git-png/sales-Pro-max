import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import NewEntry from './components/NewEntry';
import CRM from './components/CRM';
import Settings from './components/Settings';
import { Tab, UserProfile, DailyReport } from './types';
import { getUser, logoutUser, getSales, getTheme, saveTheme } from './services/storageService';

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<DailyReport[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize Theme
    const savedTheme = getTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Load User & Data
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
      setSalesData(getSales());
    }

    // Fake Splash Screen
    setTimeout(() => setIsLoading(false), 1500);
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
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const refreshData = () => {
    setSalesData(getSales());
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 animate-pulse mb-4 shadow-2xl shadow-blue-500/50"></div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">SalesTrack</h1>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      isDark={isDark}
      toggleTheme={toggleTheme}
      user={user}
      salesData={salesData}
    >
      {activeTab === 'dashboard' && <Dashboard sales={salesData} user={user} onDataChange={refreshData} />}
      {activeTab === 'entry' && <NewEntry user={user} onEntryComplete={refreshData} />}
      {activeTab === 'crm' && <CRM />}
      {activeTab === 'settings' && <Settings user={user} onUpdateUser={setUser} onLogout={handleLogout} />}
    </Layout>
  );
};

export default App;