import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { loginWithGooglePopup, loginWithGoogleRedirect, checkRedirectResult, auth } from '../services/firebase';
import { ensureUserProfileFromGoogle } from '../services/storageService';
import { ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if we just completed a redirect login
    let isMounted = true;
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
        console.warn("Redirect result error:", err);
      });

    // Also listen to any active Firebase Auth changes
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
    setLoading(true);
    setStatusMessage('Opening Google Sign-In...');

    try {
      // Call popup synchronously inside user touch/click gesture
      const result = await loginWithGooglePopup();
      if (result && result.user) {
        setStatusMessage('Securing workspace session...');
        const profile = await ensureUserProfileFromGoogle(result.user);
        onLogin(profile);
      }
    } catch (err: any) {
      console.error("Google popup sign-in error:", err);
      const code = err?.code || '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false);
        setStatusMessage('');
        return;
      }

      // If popup was blocked by mobile browser, automatically try redirect method
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        setStatusMessage('Redirecting to Google secure login...');
        try {
          await loginWithGoogleRedirect();
          return;
        } catch (redirectErr: any) {
          console.error("Redirect sign-in error:", redirectErr);
          setErrorMessage(redirectErr?.message || 'Unable to open Google login. Please retry.');
          setLoading(false);
        }
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is being authenticated. Please retry in a few seconds or refresh.');
        setLoading(false);
      } else {
        setErrorMessage(err?.message || 'Failed to authenticate with Google. Please retry.');
        setLoading(false);
      }
    }
  };

  const handleForceRedirect = async () => {
    setErrorMessage('');
    setLoading(true);
    setStatusMessage('Redirecting to Google Authentication...');
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Redirect failed. Please check internet connection.');
      setLoading(false);
    }
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
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Enterprise Field Sales & Target Intelligence</p>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

          {errorMessage && (
            <div id="auth_error_alert" className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-left flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-rose-300">Sign-in Notice</p>
                <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">{errorMessage}</p>
                <button
                  onClick={handleForceRedirect}
                  className="mt-2 text-xs font-semibold text-rose-400 hover:text-rose-300 underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry via direct redirect
                </button>
              </div>
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="space-y-4">
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
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
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
