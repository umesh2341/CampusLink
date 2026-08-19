import React from 'react';

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
    'relative flex items-center justify-center px-1.5 py-0.5 border-2 border-ink rounded-xs font-mono text-[10px] font-bold leading-none tracking-tight shadow-hard transition-all duration-150 select-none cursor-pointer';

  const chipColor = active
    ? 'bg-signal text-ink scale-110 ring-2 ring-ink z-30'
    : isUnseen
    ? 'bg-signal text-ink z-20 hover:scale-105'
    : 'bg-confirm text-white z-20 hover:scale-105';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%` }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Pulsing ring for unseen */}
      {isUnseen && !active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-xs bg-signal opacity-60" />
      )}

      <div className={`${chipBase} ${chipColor}`}>
        {badgeCount}&nbsp;EVT{badgeCount > 1 ? 'S' : ''}
      </div>
    </div>
  );
}

export default React.memo(MapMarker);
