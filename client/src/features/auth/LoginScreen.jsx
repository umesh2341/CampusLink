import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/context/AuthContext';
import { Compass, Sparkles, MapPin } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
    <div className="h-dvh max-h-dvh w-full bg-paper bg-grain text-ink font-mono flex flex-col justify-between overflow-hidden fixed inset-0 select-none">
      {/* ── Top Header / Branding Bar ── */}
      <header className="bg-card/90 backdrop-blur-xs border-b-2 border-ink px-4 py-2.5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-ink text-paper flex items-center justify-center font-display text-xl font-bold leading-none shadow-xs">
            CL
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display uppercase tracking-tight text-ink leading-none">
              CAMPUSLINK
            </h1>
            <p className="font-mono text-[9px] sm:text-[10px] font-bold text-muted tracking-wider uppercase leading-none mt-0.5">
              — ITER, SOA UNIVERSITY
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-paper px-2.5 py-1 border border-ink/40 rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-confirm animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-muted tracking-widest uppercase">
            EXPLORE / NAVIGATE / BELONG
          </span>
        </div>
      </header>

      {/* ── Ambient Campus Map / Upper Visual Section ── */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Subtle decorative corner tags */}
        <div className="absolute top-3 left-4 text-[9px] sm:text-[10px] font-bold text-muted/70 tracking-widest uppercase flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3 h-3 text-signal" />
          <span>A BRIGHTER CAMPUS LIFE</span>
        </div>
        <div className="absolute top-3 right-4 text-[9px] sm:text-[10px] font-bold text-muted/70 tracking-widest uppercase hidden xs:flex items-center gap-1.5 pointer-events-none">
          <span>PEOPLE / PLACES / POSSIBILITIES</span>
        </div>

        {/* Ambient Map Graphics & Coordinate Grid */}
        <div className="relative w-full max-w-lg aspect-4/3 sm:aspect-16/9 flex items-center justify-center">
          {/* Compass / Wayfinding aesthetic background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-35 text-ink pointer-events-none"
            viewBox="0 0 400 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid Lines */}
            <defs>
              <pattern id="campus-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#campus-grid)" />

            {/* Stylized Campus Road Network & Building Silhouettes */}
            <path
              d="M 20 180 Q 120 160 180 120 T 360 80"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <path
              d="M 180 120 L 220 220 M 180 120 L 150 20"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="180" cy="120" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="180" cy="120" r="75" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />

            {/* Wayfinding Geometry & Buildings */}
            <rect x="70" y="70" width="40" height="30" rx="3" fill="#5B7C99" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
            <text x="75" y="88" fill="currentColor" fontSize="7" fontFamily="monospace" fontWeight="bold">ADM-BLK</text>

            <rect x="240" y="60" width="55" height="38" rx="3" fill="#C97B5C" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
            <text x="246" y="82" fill="currentColor" fontSize="7" fontFamily="monospace" fontWeight="bold">HOSTEL-B</text>

            <rect x="140" y="150" width="65" height="42" rx="3" fill="#7A9B76" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
            <text x="148" y="174" fill="currentColor" fontSize="7" fontFamily="monospace" fontWeight="bold">ACADEMICS</text>
          </svg>

          {/* Central Animated Waypoint Pulse */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center justify-center text-center p-4"
          >
            <div className="relative mb-2">
              <span className="absolute -inset-2 rounded-full bg-signal/20 animate-ping" />
              <div className="relative w-12 h-12 rounded-full bg-card border-2 border-ink shadow-hard flex items-center justify-center text-signal">
                <Compass className="w-6 h-6 animate-[spin_20s_linear_infinite]" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1 bg-paper/90 border border-ink/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-ink shadow-xs">
              <MapPin className="w-3 h-3 text-signal" />
              <span>ITER CAMPUS • 20.2796° N, 85.8063° E</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom Login Card / Bottom Sheet ── */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md mx-auto z-20 shrink-0 pb-6 px-4"
      >
        <div className="bg-card border-2 border-ink rounded-2xl shadow-hard-xl p-6 sm:p-8 flex flex-col">
          {/* Card Handle Indicator */}
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4" />

          {/* Welcome Header */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink uppercase tracking-tight">
              Welcome Back
            </h2>
            <p className="font-mono text-xs sm:text-sm text-muted">
              Log in to continue your campus journey.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-2.5 bg-red-50 border border-red-500 rounded-xs text-red-700 text-xs font-mono"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Continue with Google Action */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              aria-label="Continue with Google"
              className="w-full py-3.5 px-4 rounded-xl border-2 border-ink bg-card hover:bg-paper active:translate-y-[1px] disabled:opacity-75 disabled:cursor-not-allowed shadow-hard transition-all font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-3 text-ink group cursor-pointer"
            >
              {isSigningIn ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  <span>CONNECTING TO GOOGLE...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
