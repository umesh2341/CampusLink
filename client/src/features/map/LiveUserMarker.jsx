import React from 'react';
import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

/**
 * LiveUserMarker — Dynamic real-time user location beacon on the SVG campus map.
 *
 * Designed in the CampusLink Terminal / Kiosk aesthetic:
 * - Sharp borders and high-visibility signal beacon
 * - Pulsing GPS accuracy zone
 * - Smooth spring physics on coordinate shifts
 */
function LiveUserMarker({
  x,
  y,
  accuracyRadius = 16,
  userName = 'YOU',
  heading = null,
  isInsideCampus = true,
}) {
  if (x === null || y === null) return null;

  const left = (x / 1580) * 100;
  const top = (y / 2891) * 100;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 280 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-none select-none"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {/* Accuracy Uncertainty Halo */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/15 border border-signal/40 animate-pulse pointer-events-none"
        style={{
          width: `${accuracyRadius * 2}px`,
          height: `${accuracyRadius * 2}px`,
          left: '50%',
          top: '50%',
        }}
      />

      {/* Pulsing Radar Ring */}
      <span className="animate-ping absolute -inset-1 rounded-full bg-signal opacity-75 pointer-events-none" />

      {/* Center Beacon Core */}
      <div className="relative flex flex-col items-center">
        <div className="w-5 h-5 rounded-full bg-signal border-2 border-ink shadow-hard flex items-center justify-center text-ink z-40">
          <Navigation
            className="w-3 h-3 transition-transform duration-300"
            style={{
              transform: heading !== null ? `rotate(${heading}deg)` : 'rotate(0deg)',
            }}
          />
        </div>

        {/* User Pill Label */}
        <div className="mt-1 bg-ink text-paper border border-paper px-1.5 py-0.5 rounded-xs font-mono text-[9px] font-bold uppercase tracking-wider shadow-hard whitespace-nowrap flex items-center gap-1 z-40">
          <span className="w-1.5 h-1.5 rounded-full bg-confirm animate-pulse" />
          <span>{userName.split(' ')[0]} (LIVE)</span>
        </div>

        {!isInsideCampus && (
          <span className="mt-0.5 bg-paper text-ink border border-ink text-[8px] font-bold px-1 rounded-xs uppercase">
            NEAR CAMPUS
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default React.memo(LiveUserMarker);
