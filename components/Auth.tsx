import React, { useState } from 'react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';
import { AlertCircle } from 'lucide-react';

const Auth = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
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
      <GlassCard className="w-full max-w-md p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">SalesTrack</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, Executive.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
            <GlassInput 
                placeholder="Enter your name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Employee ID</label>
             <GlassInput 
                placeholder="EMP123" 
                value={formData.employeeId} 
                onChange={e => setFormData({...formData, employeeId: e.target.value})}
                className={errors.employeeId ? 'border-red-500 ring-1 ring-red-500' : ''}
             />
             {errors.employeeId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.employeeId}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Phone Number</label>
             <GlassInput 
                type="tel" 
                maxLength={10}
                placeholder="9876543210" 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className={errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500' : ''}
             />
             {errors.phoneNumber && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.phoneNumber}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Store Name</label>
             <GlassInput 
                placeholder="Reliance Digital, JPNagara" 
                value={formData.storeName} 
                onChange={e => setFormData({...formData, storeName: e.target.value})}
                className={errors.storeName ? 'border-red-500 ring-1 ring-red-500' : ''}
             />
             {errors.storeName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.storeName}</p>}
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