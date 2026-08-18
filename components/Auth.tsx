import React, { useState, useEffect } from 'react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser, getFromStore, getUser } from '../services/storageService';
import { auth, loginWithGoogle, loginWithGooglePopup } from '../services/firebase';
import { getRedirectResult, onAuthStateChanged, User } from 'firebase/auth';
import { AlertCircle, Smartphone, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'direct'>('google');
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    phoneNumber: '',
    storeName: '',
    tlName: '',
    storeCode: '',
    monthlyTarget: '100000',
  });

  const [errors, setErrors] = useState({
    name: '',
    employeeId: '',
    phoneNumber: '',
    storeName: '',
  });

  useEffect(() => {
    let mounted = true;

    // Check if there's already a stored local user
    const existing = getUser();
    if (existing && existing.name && existing.employeeId) {
      onLogin(existing);
      return;
    }

    const checkRedirect = async () => {
      try {
        const result = await Promise.race([
          getRedirectResult(auth),
          new Promise((resolve) => setTimeout(() => resolve(null), 3500))
        ]).catch(() => null) as any;

        const user = result?.user || auth.currentUser;
        if (user && mounted) {
          setGoogleUser(user);
          const profile = await getFromStore<UserProfile>('users', user.uid);
          if (profile) {
            onLogin({ ...profile, uid: user.uid });
          } else {
            setFormData(prev => ({
              ...prev,
              name: user.displayName || prev.name,
              phoneNumber: user.phoneNumber || prev.phoneNumber,
            }));
            setAuthMode('direct');
          }
        }
      } catch (err: any) {
        console.warn("Redirect check error:", err);
      } finally {
        if (mounted) setIsCheckingProfile(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && mounted) {
        setGoogleUser(firebaseUser);
        const profile = await getFromStore<UserProfile>('users', firebaseUser.uid);
        if (profile) {
          onLogin({ ...profile, uid: firebaseUser.uid });
        } else {
          setFormData(prev => ({
            ...prev,
            name: firebaseUser.displayName || prev.name,
            phoneNumber: firebaseUser.phoneNumber || prev.phoneNumber,
          }));
          setAuthMode('direct');
        }
      }
    });

    checkRedirect();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [onLogin]);

  const handleGoogleSignInRedirect = async () => {
    try {
      setIsCheckingProfile(true);
      setAuthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Google Redirect Sign-in failed", error);
      setIsCheckingProfile(false);
      handleAuthError(error);
    }
  };

  const handleGoogleSignInPopup = async () => {
    try {
      setIsCheckingProfile(true);
      setAuthError(null);
      const result = await loginWithGooglePopup();
      const user = result?.user;
      if (user) {
        setGoogleUser(user);
        const profile = await getFromStore<UserProfile>('users', user.uid);
        if (profile) {
          onLogin({ ...profile, uid: user.uid });
        } else {
          setFormData(prev => ({
            ...prev,
            name: user.displayName || '',
            phoneNumber: user.phoneNumber || '',
          }));
          setAuthMode('direct');
          setIsCheckingProfile(false);
        }
      }
    } catch (error: any) {
      console.error("Google Popup Sign-in failed", error);
      setIsCheckingProfile(false);
      handleAuthError(error);
    }
  };

  const handleAuthError = (error: any) => {
    const code = error?.code || '';
    if (code.includes('unauthorized-domain')) {
      setAuthError("This domain is waiting for OAuth authorization in Firebase. Please use Direct / Phone Sign-in below to enter without restrictions.");
      setAuthMode('direct');
    } else if (code.includes('popup-blocked')) {
      setAuthError("Popups were blocked by your mobile browser. Switching to Direct / Phone Sign-in.");
      setAuthMode('direct');
    } else if (code.includes('cancelled-popup-request') || code.includes('popup-closed-by-user')) {
      setAuthError("Google account selection was closed. You can try again or use Direct Sign-in.");
    } else {
      setAuthError(error?.message || "Google Sign-in encountered an issue. You can sign in directly below.");
      setAuthMode('direct');
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { name: '', employeeId: '', phoneNumber: '', storeName: '' };

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Please enter your full name.';
      isValid = false;
    }

    if (!formData.employeeId.trim() || formData.employeeId.length < 2) {
      newErrors.employeeId = 'Valid Employee ID required (e.g. EMP001).';
      isValid = false;
    }

    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number.';
      isValid = false;
    }

    if (!formData.storeName.trim() || formData.storeName.length < 2) {
      newErrors.storeName = 'Store name is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedTarget = parseInt(formData.monthlyTarget) || 100000;
    const uid = googleUser?.uid || `emp_${formData.employeeId.trim().toLowerCase()}_${Date.now()}`;

    const user: UserProfile = {
      uid: uid,
      userId: uid,
      name: formData.name.trim().toUpperCase(),
      employeeId: formData.employeeId.trim().toUpperCase(),
      phoneNumber: formData.phoneNumber.trim(),
      storeName: formData.storeName.trim().toUpperCase(),
      storeCode: formData.storeCode.trim().toUpperCase() || undefined,
      tlName: formData.tlName.trim().toUpperCase() || undefined,
      email: googleUser?.email || `${formData.employeeId.trim().toLowerCase()}@salestrack.local`,
      monthlyTarget: parsedTarget,
    };

    saveUser(user);
    onLogin(user);
  };

  const handleQuickDemo = () => {
    const demoUser: UserProfile = {
      uid: 'emp_demo_field',
      userId: 'emp_demo_field',
      name: 'PRADEEP R',
      employeeId: 'EMP-7890',
      phoneNumber: '9876543210',
      storeName: 'RELIANCE DIGITAL - INDIRANAGAR',
      storeCode: 'RD-IND-01',
      tlName: 'SURESH KUMAR',
      email: 'pradeep@salestrack.local',
      monthlyTarget: 150000,
    };
    saveUser(demoUser);
    onLogin(demoUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      <div className="w-full max-w-md">
        <GlassCard className="p-7 sm:p-8 animate-in zoom-in-95 duration-500 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl mb-3 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M35 65 L50 35 L65 65" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              SalesTrack
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Field Sales Executive & Store Management
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl mb-6 border border-zinc-200/50 dark:border-white/5">
            <button
              type="button"
              onClick={() => { setAuthMode('google'); setAuthError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'google'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('direct')}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'direct'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <UserCheck size={14} />
              Direct / Phone Login
            </button>
          </div>

          {/* Auth Error Notification Banner */}
          {authError && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 leading-relaxed">
                {authError}
              </div>
            </div>
          )}

          {authMode === 'google' && !googleUser ? (
            <div className="space-y-3.5">
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mb-2">
                Sign in securely with your Google account to sync all reports and CRM data.
              </p>

              {/* Primary Mobile/Redirect Button */}
              <GlassButton
                type="button"
                onClick={handleGoogleSignInRedirect}
                disabled={isCheckingProfile}
                className="w-full rounded-2xl py-3.5 text-sm flex items-center justify-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isCheckingProfile ? "Connecting..." : "Sign in with Google"}
              </GlassButton>

              {/* Popup Option for Desktop/Browsers */}
              <button
                type="button"
                onClick={handleGoogleSignInPopup}
                disabled={isCheckingProfile}
                className="w-full py-2.5 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/70 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-white/5 transition-colors text-center"
              >
                Having trouble? Try Google Popup Login
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold absolute">
                  or
                </span>
              </div>

              {/* Instant Direct Login Button */}
              <button
                type="button"
                onClick={() => setAuthMode('direct')}
                className="w-full py-3 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-750 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Smartphone size={15} />
                Sign in with Phone & Employee ID
              </button>

              {/* 1-Click Demo Executive */}
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full text-center text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center justify-center gap-1 pt-1"
              >
                <Sparkles size={12} className="text-amber-500" />
                Quick Demo Login (Pradeep R - Indiranagar)
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {googleUser && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <UserCheck size={14} className="shrink-0" />
                  <span>Authenticated as <strong>{googleUser.email || googleUser.displayName}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <GlassInput
                  placeholder="e.g. Pradeep R"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-red-500 ring-1 ring-red-500 rounded-2xl py-3 text-sm' : 'rounded-2xl py-3 text-sm'}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <GlassInput
                    placeholder="EMP001"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className={errors.employeeId ? 'border-red-500 ring-1 ring-red-500 rounded-2xl py-3 text-sm' : 'rounded-2xl py-3 text-sm'}
                  />
                  {errors.employeeId && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile No. <span className="text-red-500">*</span>
                  </label>
                  <GlassInput
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500 rounded-2xl py-3 text-sm' : 'rounded-2xl py-3 text-sm'}
                  />
                  {errors.phoneNumber && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <GlassInput
                  placeholder="e.g. Reliance Digital - Indiranagar"
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  className={errors.storeName ? 'border-red-500 ring-1 ring-red-500 rounded-2xl py-3 text-sm' : 'rounded-2xl py-3 text-sm'}
                />
                {errors.storeName && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.storeName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Team Leader Name
                  </label>
                  <GlassInput
                    placeholder="TL Name"
                    value={formData.tlName}
                    onChange={e => setFormData({ ...formData, tlName: e.target.value })}
                    className="rounded-2xl py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Monthly Target (₹)
                  </label>
                  <GlassInput
                    type="number"
                    placeholder="100000"
                    value={formData.monthlyTarget}
                    onChange={e => setFormData({ ...formData, monthlyTarget: e.target.value })}
                    className="rounded-2xl py-3 text-sm"
                  />
                </div>
              </div>

              <GlassButton type="submit" className="w-full mt-4 rounded-2xl py-3.5 text-sm">
                Enter SalesTrack
              </GlassButton>

              <button
                type="button"
                onClick={() => setAuthMode('google')}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mt-2"
              >
                ← Back to Google Login
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Auth;
