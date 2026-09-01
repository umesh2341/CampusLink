import React, { useMemo } from 'react';
import { Target, Flag } from 'lucide-react';

/**
 * NavigationRouteLayer
 *
 * Renders the calculated directional navigation path and destination marker
 * directly onto the SVG campus coordinate canvas (1580 x 2891).
 *
 * Features:
 *  - Progressive route-drawing animation from live start location -> destination (800ms - 1600ms)
 *  - Multi-stage sequence for multimodal CAR mode (Drive segment -> Drop-off pin -> Walk segment -> Destination)
 *  - Waypoint turn nodes and terminal pins staggered pop-in
 *  - Continuous directional dash flow upon draw completion
 *  - Full alignment with SVG transforms during zoom, pan, and double-tap gestures
 *  - Automatic fallback when prefers-reduced-motion is active
 */
function NavigationRouteLayer({
  route,
  userLocation,
  destinationBuilding,
}) {
  if (!route || !route.svgPathD) return null;

  const {
    coordinates,
    destination,
    routeType,
    driveSvgPathD,
    walkSvgPathD,
    transferPoint,
    distanceMeters = 200,
    driveDistanceMeters = 0,
    timestamp,
    transportMode,
  } = route;

  const isMultimodal = routeType === 'VEHICLE_PLUS_WALK';

  // Destination and Drop-off coordinates in % for absolute positioning inside the canvas
  const destX = destination?.x ?? coordinates[coordinates.length - 1]?.x;
  const destY = destination?.y ?? coordinates[coordinates.length - 1]?.y;
  const destLeft = (destX / 1580) * 100;
  const destTop  = (destY / 2891) * 100;

  const dropOffLeft = transferPoint ? (transferPoint.x / 1580) * 100 : null;
  const dropOffTop  = transferPoint ? (transferPoint.y / 2891) * 100 : null;

  // Compute adaptive animation durations based on route distance
  const { totalDurationMs, driveDurationMs, walkDurationMs, prefersReducedMotion } = useMemo(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      return { totalDurationMs: 0, driveDurationMs: 0, walkDurationMs: 0, prefersReducedMotion: true };
    }

    const total = Math.min(1600, Math.max(800, Math.round(700 + distanceMeters * 1.5)));

    if (isMultimodal && distanceMeters > 0) {
      const driveRatio = Math.max(0.2, Math.min(0.85, driveDistanceMeters / distanceMeters));
      const driveDur = Math.round(total * driveRatio);
      const walkDur = total - driveDur;
      return { totalDurationMs: total, driveDurationMs: driveDur, walkDurationMs: walkDur, prefersReducedMotion: false };
    }

    return { totalDurationMs: total, driveDurationMs: total, walkDurationMs: 0, prefersReducedMotion: false };
  }, [distanceMeters, driveDistanceMeters, isMultimodal]);

  // Unique animation key ensures animation resets and replays on destination or mode change
  const animationKey = `route-anim-${destination?.id || 'dest'}-${transportMode}-${timestamp}`;

  return (
    <div key={animationKey} className="absolute inset-0 pointer-events-none select-none z-25">
      {/* ── Vector SVG Route Layer ── */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 1580 2891"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Animated Directional Flow Gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3FA66B" />
            <stop offset="100%" stopColor="#FF7A33" />
          </linearGradient>

          {/* Destination Pulsing Filter */}
          <filter id="destGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {isMultimodal ? (
          <>
            {/* ── MULTIMODAL DRIVE SEGMENT (Orange - draws 0 -> driveDurationMs) ── */}
            {driveSvgPathD && (
              <g className="drive-segment">
                {/* Outer Glow */}
                <path
                  d={driveSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#FF7A33"
                  strokeWidth="16"
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                    animation: prefersReducedMotion ? 'none' : `progressiveDraw ${driveDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  }}
                />

                {/* Dark Casing */}
                <path
                  d={driveSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#1A1817"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                    animation: prefersReducedMotion ? 'none' : `progressiveDraw ${driveDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  }}
                />

                {/* White Core */}
                <path
                  d={driveSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                    animation: prefersReducedMotion ? 'none' : `progressiveDraw ${driveDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  }}
                />

                {/* Flowing Car Dashes */}
                <path
                  d={driveSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#FF7A33"
                  strokeWidth="5"
                  strokeDasharray="14 10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    animation: prefersReducedMotion ? 'none' : 'routeDashFlow 1.2s linear infinite',
                  }}
                />
              </g>
            )}

            {/* ── MULTIMODAL WALK SEGMENT (Emerald Green - draws driveDurationMs -> totalDurationMs) ── */}
            {walkSvgPathD && (
              <g className="walk-segment">
                {/* Outer Glow */}
                <path
                  d={walkSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#3FA66B"
                  strokeWidth="14"
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                    animation: prefersReducedMotion ? 'none' : `progressiveDraw ${walkDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${driveDurationMs}ms forwards`,
                  }}
                />

                {/* Dark Casing */}
                <path
                  d={walkSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#1A1817"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                    animation: prefersReducedMotion ? 'none' : `progressiveDraw ${walkDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${driveDurationMs}ms forwards`,
                  }}
                />

                {/* White Core */}
                <path
                  d={walkSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                    animation: prefersReducedMotion ? 'none' : `progressiveDraw ${walkDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${driveDurationMs}ms forwards`,
                  }}
                />

                {/* Flowing Walk Dots */}
                <path
                  d={walkSvgPathD}
                  pathLength="1000"
                  fill="none"
                  stroke="#3FA66B"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    animation: prefersReducedMotion ? 'none' : 'routeDashFlow 1.0s linear infinite',
                  }}
                />
              </g>
            )}

            {/* Drop-off Ground Pulse */}
            {transferPoint && (
              <circle
                cx={transferPoint.x}
                cy={transferPoint.y}
                r="12"
                fill="#3FA66B"
                fillOpacity="0.2"
                stroke="#3FA66B"
                strokeWidth="2.5"
                style={{
                  animation: prefersReducedMotion ? 'none' : `popInNode 350ms cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.max(0, driveDurationMs - 80)}ms both`,
                }}
              />
            )}
          </>
        ) : (
          <>
            {/* ── STANDARD SINGLE-MODE PATH (Progressive Draw from Start -> Destination) ── */}
            {/* 1. Outer Glow Aura */}
            <path
              d={route.svgPathD}
              pathLength="1000"
              fill="none"
              stroke="#FF7A33"
              strokeWidth="16"
              strokeOpacity="0.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                animation: prefersReducedMotion ? 'none' : `progressiveDraw ${totalDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              }}
            />

            {/* 2. Dark Casing Border */}
            <path
              d={route.svgPathD}
              pathLength="1000"
              fill="none"
              stroke="#1A1817"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                animation: prefersReducedMotion ? 'none' : `progressiveDraw ${totalDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              }}
            />

            {/* 3. Core Route Path Line */}
            <path
              d={route.svgPathD}
              pathLength="1000"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: prefersReducedMotion ? 0 : 1000,
                animation: prefersReducedMotion ? 'none' : `progressiveDraw ${totalDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              }}
            />

            {/* 4. Directional Animated Dash Flow */}
            <path
              d={route.svgPathD}
              pathLength="1000"
              fill="none"
              stroke="#FF7A33"
              strokeWidth="5"
              strokeDasharray="14 10"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: prefersReducedMotion ? 'none' : 'routeDashFlow 1.2s linear infinite',
              }}
            />
          </>
        )}

        {/* 5. Waypoint Turn Dots (Staggered pop-in along path) */}
        {coordinates.slice(1, -1).map((pt, idx) => {
          const delayMs = prefersReducedMotion
            ? 0
            : Math.round(((idx + 1) / Math.max(1, coordinates.length)) * totalDurationMs);

          return (
            <circle
              key={`waypoint-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="#1A1817"
              stroke={isMultimodal ? '#3FA66B' : '#FF7A33'}
              strokeWidth="2"
              style={{
                animation: prefersReducedMotion
                  ? 'none'
                  : `popInNode 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delayMs}ms both`,
              }}
            />
          );
        })}

        {/* 6. Destination Ground Ring */}
        <circle
          cx={destX}
          cy={destY}
          r="14"
          fill="#FF7A33"
          fillOpacity="0.2"
          stroke="#FF7A33"
          strokeWidth="2.5"
          className="animate-ping"
          style={{
            transformOrigin: `${destX}px ${destY}px`,
            animationDelay: `${Math.max(0, totalDurationMs - 150)}ms`,
          }}
        />
      </svg>

      {/* ── CSS Keyframe Animations ── */}
      <style>{`
        @keyframes progressiveDraw {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes routeDashFlow {
          from {
            stroke-dashoffset: 48;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes popInNode {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.35);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes popInBadge {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          75% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* ── Drop-off Transfer Point Badge (for Multimodal routes) ── */}
      {isMultimodal && transferPoint && (
        <div
          className="absolute z-34 pointer-events-none select-none flex flex-col items-center"
          style={{
            left: `${dropOffLeft}%`,
            top: `${dropOffTop}%`,
            transform: 'translate(-50%, -50%)',
            animation: prefersReducedMotion
              ? 'none'
              : `popInBadge 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.max(0, driveDurationMs - 50)}ms both`,
          }}
        >
          <div className="bg-paper text-ink border-2 border-ink px-2 py-0.5 rounded-xs font-mono text-[9px] font-bold uppercase tracking-wider shadow-hard whitespace-nowrap flex items-center gap-1">
            <span>🅿️ DROP-OFF</span>
          </div>
        </div>
      )}

      {/* ── Destination Terminal Badge Marker (🎯) ── */}
      <div
        className="absolute z-35 pointer-events-none select-none flex flex-col items-center"
        style={{
          left: `${destLeft}%`,
          top: `${destTop}%`,
          transform: 'translate(-50%, -50%)',
          animation: prefersReducedMotion
            ? 'none'
            : `popInBadge 450ms cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.max(0, totalDurationMs - 120)}ms both`,
        }}
      >
        {/* Destination Target Icon Chip */}
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-signal text-ink border-2 border-ink shadow-hard-xl flex items-center justify-center animate-bounce">
            <Target className="w-5 h-5 text-ink stroke-[2.5]" />
          </div>
        </div>

        {/* Destination Info Pill */}
        <div className="mt-1 bg-ink text-paper border-2 border-paper px-2 py-0.5 rounded-xs font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-hard whitespace-nowrap flex items-center gap-1.5">
          <Flag className="w-3 h-3 text-signal fill-signal" />
          <span>{destination?.name || destinationBuilding?.name || 'DESTINATION'}</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(NavigationRouteLayer);
