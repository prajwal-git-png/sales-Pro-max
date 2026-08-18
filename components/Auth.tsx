import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { loginWithGooglePopup, loginWithGoogleRedirect, checkRedirectResult, auth } from '../services/firebase';
import { ensureUserProfileFromGoogle, saveUser } from '../services/storageService';
import { ShieldCheck, Sparkles, AlertCircle, RefreshCw, ArrowRight, UserCheck, ExternalLink, Building2, User, Phone, CheckCircle2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [showDirectRedirect, setShowDirectRedirect] = useState(false);
  const [showCustomLogin, setShowCustomLogin] = useState(false);

  // Quick Sign In form states
  const [execName, setExecName] = useState('');
  const [storeName, setStoreName] = useState('RELIANCE DIGITAL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState(100000);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    let isMounted = true;

    // Check if returning from redirect sign-in
    checkRedirectResult()
      .then(async (result) => {
        if (result && result.user && isMounted) {
          setLoading(true);
          setStatusMessage('Setting up your workspace profile...');
          const profile = await ensureUserProfileFromGoogle(result.user);
          if (isMounted) onLogin(profile);
        }
      })
      .catch((err) => {
        console.warn("Redirect result notice:", err?.message || err);
        if (err?.code === 'auth/unauthorized-domain') {
          setIsUnauthorizedDomain(true);
        }
      });

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && isMounted) {
        setLoading(true);
        setStatusMessage('Syncing with Google account...');
        const profile = await ensureUserProfileFromGoogle(firebaseUser);
        if (isMounted) {
          onLogin(profile);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsUnauthorizedDomain(false);
    setLoading(true);
    setStatusMessage('Opening Google Sign-In...');

    try {
      const result = await loginWithGooglePopup();
      if (result && result.user) {
        setStatusMessage('Securing workspace session...');
        const profile = await ensureUserProfileFromGoogle(result.user);
        onLogin(profile);
      }
    } catch (err: any) {
      const code = err?.code || '';

      // User closed or cancelled the popup
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        setLoading(false);
        setStatusMessage('');
        setShowDirectRedirect(true);
        return;
      }

      // Unauthorized domain on hosting platforms like Vercel
      if (code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setErrorMessage(`The domain "${currentDomain || 'sales-pro-max.vercel.app'}" needs to be authorized in Firebase Console.`);
        setShowCustomLogin(true);
        setLoading(false);
        return;
      }

      // Popup blocked by browser or iframe policy
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        setStatusMessage('Redirecting to Google secure login...');
        try {
          await loginWithGoogleRedirect();
          return;
        } catch (redirectErr: any) {
          if (redirectErr?.code === 'auth/unauthorized-domain') {
            setIsUnauthorizedDomain(true);
            setErrorMessage(`The domain "${currentDomain}" needs to be authorized in Firebase Console.`);
            setShowCustomLogin(true);
          } else {
            setErrorMessage('Popup was blocked by your browser. Please try the Full-Page Redirect below.');
            setShowDirectRedirect(true);
          }
          setLoading(false);
        }
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('Network connection interrupted. Please verify your internet connection.');
        setLoading(false);
      } else {
        setErrorMessage(err?.message || 'Google Sign-in was not completed. Please retry.');
        setShowDirectRedirect(true);
        setLoading(false);
      }
    }
  };

  const handleForceRedirect = async () => {
    setErrorMessage('');
    setIsUnauthorizedDomain(false);
    setLoading(true);
    setStatusMessage('Redirecting to Google login page...');
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setErrorMessage(`The domain "${currentDomain}" needs to be authorized in Firebase Console.`);
        setShowCustomLogin(true);
      } else {
        setErrorMessage(err?.message || 'Redirect failed. Please check internet connection.');
      }
      setLoading(false);
    }
  };

  const handleExecutiveQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = execName.trim() || 'SALES EXECUTIVE';
    setLoading(true);
    setStatusMessage('Creating your executive profile...');

    const customId = `exec_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const newProfile: UserProfile = {
      uid: customId,
      userId: customId,
      name: cleanName.toUpperCase(),
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      phoneNumber: phoneNumber || '+91 98765 43210',
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@salestrack.app`,
      storeName: storeName.trim() || 'RELIANCE DIGITAL',
      monthlyTarget: Number(monthlyTarget) || 100000,
    };

    await saveUser(newProfile);
    onLogin(newProfile);
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setStatusMessage('Initializing executive workspace...');
    const demoProfile: UserProfile = {
      uid: 'demo_user_field_exec',
      userId: 'demo_user_field_exec',
      name: 'FIELD EXECUTIVE (DEMO)',
      employeeId: 'EMP-7788',
      phoneNumber: '+91 98765 43210',
      email: 'executive.demo@salestrack.app',
      storeName: 'RELIANCE DIGITAL - FLAGSHIP',
      monthlyTarget: 150000,
    };
    await saveUser(demoProfile);
    onLogin(demoProfile);
  };

  return (
    <div id="auth_container" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div id="auth_card" className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center">
          {/* Logo Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 mb-6 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">SALESTRACK PRO</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Enterprise Field Sales &amp; Target Intelligence</p>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

          {/* Unauthorized Domain Guide Callout */}
          {isUnauthorizedDomain && (
            <div id="unauthorized_domain_guide" className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Authorize Vercel Domain</h4>
                  <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                    To enable Google OAuth on <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">{currentDomain || 'sales-pro-max.vercel.app'}</code>:
                  </p>
                  <ol className="text-xs text-amber-200/80 mt-2 space-y-1 list-decimal list-inside">
                    <li>Go to <strong>Firebase Console &gt; Authentication &gt; Settings</strong></li>
                    <li>Click <strong>Authorized Domains &gt; Add Domain</strong></li>
                    <li>Paste <code className="text-amber-300 font-mono font-bold">{currentDomain || 'sales-pro-max.vercel.app'}</code> and save</li>
                  </ol>
                  <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-amber-300/80">In the meantime, you can sign in below:</span>
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0662492374/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1"
                    >
                      Open Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMessage && !isUnauthorizedDomain && (
            <div id="auth_error_alert" className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-left flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-rose-300">Sign-in Notice</p>
                <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">{errorMessage}</p>
                <button
                  onClick={handleForceRedirect}
                  className="mt-2 text-xs font-semibold text-rose-400 hover:text-rose-300 underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry via full-page redirect
                </button>
              </div>
            </div>
          )}

          {/* If custom login form is toggled or domain unauthorized */}
          {showCustomLogin ? (
            <form onSubmit={handleExecutiveQuickLogin} className="space-y-4 text-left">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
                <p className="text-xs text-blue-200 font-medium text-center">
                  Instant Executive Sign In (Synced to Cloud &amp; Local)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Executive Full Name
                </label>
                <input
                  id="exec_name_input"
                  type="text"
                  required
                  value={execName}
                  onChange={(e) => setExecName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> Store / Branch Name
                </label>
                <input
                  id="exec_store_input"
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Reliance Digital - Flagship"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" /> Phone (Optional)
                  </label>
                  <input
                    id="exec_phone_input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Monthly Target (₹)
                  </label>
                  <input
                    id="exec_target_input"
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                id="submit_quick_login_button"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sign In &amp; Launch Sales Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCustomLogin(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2"
              >
                Back to Google Login
              </button>
            </form>
          ) : (
            /* Primary Login Options */
            <div className="space-y-3">
              <button
                id="google_signin_button"
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3.5 shadow-lg ${
                  loading
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10 active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span>{statusMessage || 'Signing in with Google...'}</span>
                  </>
                ) : (
                  <>
                    {/* Google G Logo */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Direct Redirect fallback option */}
              {showDirectRedirect && (
                <button
                  id="google_redirect_button"
                  type="button"
                  disabled={loading}
                  onClick={handleForceRedirect}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Use Full-Page Redirect Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {/* Instant Executive Profile Login */}
              <button
                id="toggle_custom_login_button"
                type="button"
                disabled={loading}
                onClick={() => setShowCustomLogin(true)}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-blue-300 hover:text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Executive / Store Direct Sign In</span>
              </button>

              {/* Quick Demo Workspace Access */}
              <button
                id="demo_signin_button"
                type="button"
                disabled={loading}
                onClick={handleDemoSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Explore with Demo Executive Profile</span>
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure Cloud Firestore Synchronized</span>
          </div>
        </div>

        {/* Security footer notice */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Protected by Google Firebase Authentication &amp; Firestore Encrypted Security Rules
        </p>
      </div>
    </div>
  );
};

export default Auth;
