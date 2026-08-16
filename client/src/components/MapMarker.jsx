import React from 'react';

// x: viewBox X coordinate (0 to 1580)
// y: viewBox Y coordinate (0 to 2891)
// badgeCount: number of active events
// category: building category
// active: whether the building is currently clicked/selected
// isUnseen: whether there are new/unseen events for this building
function MapMarker({ x, y, badgeCount = 0, isUnseen = true, active = false, onClick }) {
  // If no active events, do not render a marker at all
  if (badgeCount <= 0) return null;

  // Convert absolute coordinates (1580 x 2891) to percentage positioning
  const left = (x / 1580) * 100;
  const top = (y / 2891) * 100;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 select-none pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%` }}
      onClick={(e) => {
        e.stopPropagation(); // prevent map container click handler
        onClick();
      }}
    >
      {/* Visual Indicator */}
      <div className="relative flex items-center justify-center">
        {/* Pinging ring ONLY if event is unseen */}
        {isUnseen && (
          <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-accent-gold opacity-75"></span>
        )}

        {/* Outer badge container */}
        <div
          className={`flex items-center justify-center rounded-full transition-all duration-200 ${
            active
              ? 'w-9 h-9 border-2 border-accent-gold bg-text-primary text-accent-gold shadow-lg scale-110 z-20'
              : isUnseen
              ? 'w-7 h-7 bg-accent-gold text-text-primary border-2 border-text-primary shadow-md z-15 hover:scale-105'
              : 'w-7 h-7 bg-[#7C766A] text-white border-2 border-white/60 shadow-sm z-15 hover:scale-105'
          }`}
        >
          {/* Active Event Count Badge */}
          <span className="font-display text-base font-bold select-none leading-none">
            {badgeCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MapMarker;
