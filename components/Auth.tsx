import React, { useState } from 'react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser, getFromStore } from '../services/storageService';
import { loginWithGoogle } from '../services/firebase';
import { AlertCircle } from 'lucide-react';

const Auth = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
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

  
  const handleGoogleSignIn = async () => {
    try {
      setIsCheckingProfile(true);
      const result = await loginWithGoogle();
      const user = result.user;
      setGoogleUser(user);
      
      // Check if profile exists
      const profile = await getFromStore<UserProfile>('users', user.uid);
      if (profile) {
        onLogin({ ...profile, uid: user.uid });
      } else {
        setFormData(prev => ({ ...prev, name: user.displayName || '' }));
        setIsCheckingProfile(false);
      }
    } catch (error) {
      console.error("Google Sign-in failed", error);
      setIsCheckingProfile(false);
    }
  };

  const validate = () => {
      let isValid = true;
      const newErrors = { name: '', employeeId: '', phoneNumber: '', storeName: '' };

      // Name Validation: Letters and spaces only, min 3 chars
      if (!formData.name.trim() || formData.name.length < 3 || !/^[a-zA-Z\s]+$/.test(formData.name)) {
          newErrors.name = 'Please enter a valid full name (letters only).';
          isValid = false;
      }

      // Employee ID Validation: Alphanumeric only, no special chars
      if (!formData.employeeId.trim() || !/^[a-zA-Z0-9-]+$/.test(formData.employeeId)) {
          newErrors.employeeId = 'Valid Employee ID required (e.g., EMP001).';
          isValid = false;
      }

      // Phone Validation: Strictly 10 digits
      if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber)) {
          newErrors.phoneNumber = 'Enter a valid 10-digit mobile number.';
          isValid = false;
      }

      // Store Name Validation: Non-empty
      if (!formData.storeName.trim() || formData.storeName.length < 3) {
          newErrors.storeName = 'Store name is required.';
          isValid = false;
      }

      setErrors(newErrors);
      return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Sanitize data before saving
    const user: UserProfile = {
      uid: googleUser?.uid || '',
      name: formData.name.trim().toUpperCase(),
      employeeId: formData.employeeId.trim().toUpperCase(),
      phoneNumber: formData.phoneNumber.trim(),
      storeName: formData.storeName.trim().toUpperCase(),
      monthlyTarget: 100000, // Default target
    };
    saveUser(user);
    onLogin(user);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 animate-in zoom-in-95 duration-500 rounded-3xl border border-white/50 dark:border-white/20 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400 mb-2">SalesTrack</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, Executive.</p>
        </div>

        {!googleUser ? (
          <div className="flex flex-col gap-4">
            <GlassButton onClick={handleGoogleSignIn} disabled={isCheckingProfile} className="w-full rounded-3xl py-4 flex items-center justify-center gap-2 bg-white dark:bg-white/10 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-white/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isCheckingProfile ? "Checking..." : "Sign in with Google"}
            </GlassButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-center text-zinc-500 mb-4">Complete your profile to continue.</p>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Full Name</label>
            <GlassInput 
                placeholder="Enter your name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={errors.name ? 'border-red-500 ring-1 ring-red-500 rounded-3xl' : 'rounded-3xl'}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Employee ID</label>
             <GlassInput 
                placeholder="EMP123" 
                value={formData.employeeId} 
                onChange={e => setFormData({...formData, employeeId: e.target.value})}
                className={errors.employeeId ? 'border-red-500 ring-1 ring-red-500 rounded-3xl' : 'rounded-3xl'}
             />
             {errors.employeeId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.employeeId}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Phone Number</label>
             <GlassInput 
                type="tel" 
                maxLength={10}
                placeholder="9876543210" 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className={errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500 rounded-3xl' : 'rounded-3xl'}
             />
             {errors.phoneNumber && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.phoneNumber}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Store Name</label>
             <GlassInput 
                placeholder="Reliance Digital, JPNagara" 
                value={formData.storeName} 
                onChange={e => setFormData({...formData, storeName: e.target.value})}
                className={errors.storeName ? 'border-red-500 ring-1 ring-red-500 rounded-3xl' : 'rounded-3xl'}
             />
             {errors.storeName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.storeName}</p>}
          </div>
          
          <GlassButton type="submit" className="w-full mt-6 rounded-3xl">
            Get Started
          </GlassButton>
        </form>
        )}
      </GlassCard>
    </div>
  );
};

export default Auth;