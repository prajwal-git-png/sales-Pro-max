import React, { useState, useEffect } from 'react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';
import { AlertCircle, RefreshCw, Smartphone, Download, ExternalLink } from 'lucide-react';
import { usePWAInstall, InstallModal } from './InstallPWA';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    phoneNumber: '',
    storeName: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    employeeId: '',
    phoneNumber: '',
    storeName: '',
  });

      
  const { isInstallable, isInstalled, isInIframe, triggerInstall } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);

  
  const validate = () => {
    let isValid = true;
    const newErrors = { name: '', employeeId: '', phoneNumber: '', storeName: '' };

    // Name Validation: Letters and spaces only, min 2 chars
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name.';
      isValid = false;
    }

    // Employee ID Validation: Alphanumeric only
    if (!formData.employeeId.trim() || !/^[a-zA-Z0-9-]+$/.test(formData.employeeId.trim())) {
      newErrors.employeeId = 'Valid Employee ID required (e.g. EMP001).';
      isValid = false;
    }

    // Phone Validation: 10 digits
    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid 10-digit mobile number.';
      isValid = false;
    }

    // Store Name Validation: Non-empty
    if (!formData.storeName.trim() || formData.storeName.trim().length < 2) {
      newErrors.storeName = 'Store name is required (e.g. Reliance Digital).';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const rawPhone = formData.phoneNumber.replace(/[\s-]/g, '');
    const cleanName = formData.name.trim().toUpperCase();
    const customId = `exec_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const user: UserProfile = {
      uid: customId,
      userId: customId,
      name: cleanName,
      employeeId: formData.employeeId.trim().toUpperCase(),
      phoneNumber: rawPhone,
      storeName: formData.storeName.trim().toUpperCase(),
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@salestrack.app`,
      monthlyTarget: 100000,
    };

    await saveUser(user);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 dark:bg-zinc-950 dark:bg-none transition-colors duration-500">
      {/* Background ambient lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-500/15 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Install App Quick Pill */}
      {!isInstalled && isInstallable && (
        <button
          onClick={() => {
            if (isInIframe) {
              setShowInstallModal(true);
            } else {
              triggerInstall(() => setShowInstallModal(true));
            }
          }}
          className="mb-4 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-10"
        >
          <Smartphone size={14} className="text-blue-500" />
          <span>Install SalesTrack App</span>
          {isInIframe ? <ExternalLink size={12} className="text-amber-500" /> : <Download size={12} className="text-zinc-400" />}
        </button>
      )}

      <GlassCard className="w-full max-w-md p-8 animate-in zoom-in-95 duration-500 rounded-3xl relative z-10 border border-white/60 dark:border-white/10 shadow-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-lg mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-7 h-7">
              <path d="M35 65 L50 35 L65 65" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#000000]">
            SalesTrack
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Welcome back, Executive.</p>
        </div>

        {/* Executive Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1">Full Name</label>
            <GlassInput
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`rounded-2xl py-3 px-4 text-sm ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1">Employee ID</label>
            <GlassInput
              placeholder="e.g. EMP123"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className={`rounded-2xl py-3 px-4 text-sm ${errors.employeeId ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {errors.employeeId && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.employeeId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1">Phone Number</label>
            <GlassInput
              type="tel"
              maxLength={10}
              placeholder="9876543210"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className={`rounded-2xl py-3 px-4 text-sm ${errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.phoneNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1">Store Name</label>
            <GlassInput
              placeholder="e.g. Reliance Digital, JPNagara"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className={`rounded-2xl py-3 px-4 text-sm ${errors.storeName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {errors.storeName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.storeName}
              </p>
            )}
          </div>

          <GlassButton type="submit" className="w-full mt-6 rounded-2xl py-3.5">
            Get Started
          </GlassButton>
        </form>
      </GlassCard>

      {/* Universal Installation Guide Modal */}
      <InstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
};

export default Auth;
