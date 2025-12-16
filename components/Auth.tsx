import React, { useState } from 'react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';

const Auth = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    phoneNumber: '',
    storeName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.employeeId || !formData.storeName) return;
    
    const user: UserProfile = {
      ...formData,
      monthlyTarget: 100000, // Default target
    };
    saveUser(user);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">SalesTrack</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, Executive.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
            <GlassInput required placeholder="Enter your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Employee ID</label>
             <GlassInput required placeholder="EMP123" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Phone Number</label>
             <GlassInput required type="tel" placeholder="9876543210" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Store Name</label>
             <GlassInput required placeholder="Reliance Digital, JPNagara" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
          </div>
          
          <GlassButton type="submit" className="w-full mt-6">
            Get Started
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
};

export default Auth;
