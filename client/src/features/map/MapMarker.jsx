import React from 'react';
import { motion } from 'framer-motion';

/**
 * MapMarker — rectangular chip badge rendered over the SVG map.
 * signal (#FF7A33)  = unseen events
 * confirm (#3FA66B) = seen events
 * No soft circular bubbles; sharp 2px-border chips only.
 */
function MapMarker({ x, y, badgeCount = 0, isUnseen = true, active = false, onClick }) {
  if (badgeCount <= 0) return null;

  const left = (x / 1580) * 100;
  const top  = (y / 2891) * 100;

  const chipBase =
    'relative flex items-center justify-center px-3.5 py-2 sm:px-4 sm:py-2.5 border-2 border-ink rounded-xs font-mono text-base sm:text-lg font-bold leading-none tracking-tight shadow-hard transition-all duration-150 select-none cursor-pointer';

  const chipColor = active
    ? 'bg-signal text-ink ring-2 ring-ink z-30'
    : isUnseen
    ? 'bg-signal text-ink z-20'
    : 'bg-confirm text-white z-20';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: active ? 1.15 : 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', damping: 15, stiffness: 350 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%` }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Pulsing ring for unseen */}
      {isUnseen && !active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-xs bg-signal opacity-60 pointer-events-none" />
      )}

      <div className={`${chipBase} ${chipColor}`}>
        {badgeCount}&nbsp;EVT{badgeCount > 1 ? 'S' : ''}
      </div>
    </motion.div>
  );
}

export default React.memo(MapMarker);

