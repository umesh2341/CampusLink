import React, { useEffect, useState } from 'react';

/**
 * MapMarker — rectangular chip badge rendered over the SVG map.
 * signal (#FF7A33)  = unseen events
 * confirm (#3FA66B) = seen events
 * No soft circular bubbles; sharp 2px-border chips only.
 */
function MapMarker({ x, y, badgeCount = 0, isUnseen = true, active = false, onClick }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  if (badgeCount <= 0) return null;

  const left = (x / 1580) * 100;
  const top  = (y / 2891) * 100;

  const chipBase =
    'relative flex items-center justify-center px-3.5 py-2 sm:px-4 sm:py-2.5 border-2 border-ink rounded-xs font-mono text-base sm:text-lg font-bold leading-none tracking-tight shadow-hard transition-all duration-200 select-none cursor-pointer';

  const chipColor = active
    ? 'bg-signal text-ink ring-2 ring-ink z-30'
    : isUnseen
    ? 'bg-signal text-ink z-20'
    : 'bg-confirm text-white z-20';

  const scaleClass = !mounted ? 'scale-0 opacity-0' : (active ? 'scale-110 opacity-100' : 'scale-100 opacity-100');

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto transition-all duration-300 ease-out hover:scale-110 active:scale-95 ${scaleClass}`}
      style={{ left: `${left}%`, top: `${top}%`, willChange: 'transform, opacity' }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Pulsing ring for unseen */}
      {isUnseen && !active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-xs bg-signal opacity-60 pointer-events-none" />
      )}

      <div className={`${chipBase} ${chipColor}`}>
        {badgeCount}&nbsp;EVT{badgeCount > 1 ? 'S' : ''}
      </div>
    </div>
  );
}

// Custom memo compare to ignore onClick reference changes and prevent re-renders on map pan
export default React.memo(MapMarker, (prev, next) => {
  return prev.x === next.x &&
         prev.y === next.y &&
         prev.badgeCount === next.badgeCount &&
         prev.isUnseen === next.isUnseen &&
         prev.active === next.active;
});
