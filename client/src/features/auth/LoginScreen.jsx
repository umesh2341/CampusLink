import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/context/AuthContext';
import campusMap from '../../../../1000139929.png';
import collegeIcon from '../../../../college-svgrepo-com (1).svg';

export default function LoginScreen({ onLoginSuccess }) {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const resetLoadingState = () => {
      setIsSigningIn(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetLoadingState();
      }
    };

    // Handles Back/Forward navigation cache restoration (bfcache)
    window.addEventListener('pageshow', resetLoadingState);

    // Handles tab/window refocus if opened or returned to
    window.addEventListener('focus', resetLoadingState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', resetLoadingState);
      window.removeEventListener('focus', resetLoadingState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);
      await signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Google Sign In Failed:', err);
      setErrorMessage(err.message || 'Failed to connect to Google authentication.');
      setIsSigningIn(false);
    }
  };

  return (
    <main className="fixed inset-0 flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#e8e2d6] text-ink font-mono select-none">
      <section className="relative isolate h-full w-full overflow-hidden bg-paper sm:h-[min(94dvh,900px)] sm:w-[min(94vw,620px)] sm:rounded-[18px] sm:border-2 sm:border-ink sm:shadow-[8px_8px_0_#1C1A17]">
        <img
          src={campusMap}
          alt="Illustrated map of the ITER campus"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-top"
        />

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-0 z-10 w-full shrink-0"
        >
        <div className="flex min-h-[38dvh] w-full flex-col rounded-[50%_50%_0_0/12%_12%_0_0] border-2 border-b-0 border-ink bg-paper px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 shadow-hard-xl sm:min-h-0 sm:rounded-[50%_50%_0_0/10%_10%_0_0] sm:border-b-2 sm:px-8 sm:pb-8 sm:pt-12">
          <div className="mx-auto mb-4 h-1 w-10 bg-ink/30" />

          <div className="mb-4 space-y-1 text-center">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.24em] text-signal">[ CAMPUS ACCESS ]</p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
              Welcome Back
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Log in to continue your campus journey.
            </p>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 border-2 border-red-500 bg-red-50 p-2.5 text-xs font-bold text-red-700 shadow-hard"
            >
              {errorMessage}
            </motion.div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            aria-label="Continue with Google"
            className="flex w-full items-center justify-between rounded-xs border-2 border-ink bg-card px-4 py-3 text-xs font-bold uppercase text-ink shadow-hard transition-all hover:bg-signal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-75 sm:text-sm"
          >
            <span className="flex items-center gap-3">
              {isSigningIn ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                </svg>
              )}
              <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </span>
            <span className="text-lg leading-none" aria-hidden="true">→</span>
          </button>

          <p className="mt-2 text-center text-[9px] text-muted">Use your SOA Google account</p>

          <div className="mt-auto pt-4 text-center text-muted">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-px flex-1 bg-ink/35" />
              <img src={collegeIcon} alt="" className="h-10 w-10 shrink-0 object-contain opacity-60 grayscale" />
              <span className="h-px flex-1 bg-ink/35" />
            </div>
            <p className="mt-2 text-[7px] font-bold uppercase tracking-[0.28em]">A brighter campus life together</p>
          </div>
        </div>
        </motion.div>
      </section>
    </main>
  );
}
