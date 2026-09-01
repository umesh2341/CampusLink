import React from 'react';
import { Navigation, Clock, MapPin, X, AlertTriangle } from 'lucide-react';

/**
 * NavigationHUD
 *
 * Real-time floating navigation telemetry dock.
 * Displays destination name, route distance, ETA, transport mode selector, and stop button.
 */

const TRANSPORT_MODES = [
  { id: 'WALK', label: 'Walk', icon: '🚶' },
  { id: 'BIKE', label: 'Bike', icon: '🏍️' },
  { id: 'CAR',  label: 'Car',  icon: '🚗' },
];

const MODE_LABEL = { WALK: 'WALK', BIKE: 'BIKE', CAR: 'DRIVE' };

function NavigationHUD({
  activeRoute,
  destinationBuilding,
  navigationStatus,
  navigationError,
  transportMode = 'WALK',
  onStopNavigation,
  onSetTransportMode,
}) {
  if (navigationStatus === 'idle' && !navigationError) return null;

  const destName = destinationBuilding?.name || activeRoute?.destination?.name || 'DESTINATION';
  const distance = activeRoute?.distanceMeters != null ? `${activeRoute.distanceMeters} m` : '—';
  const eta = activeRoute?.estimatedMinutes != null ? `~${activeRoute.estimatedMinutes} min` : '—';
  const modeLabel = MODE_LABEL[transportMode] ?? 'WALK';

  return (
    <div className="absolute top-16 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-45 pointer-events-auto select-none font-mono">
      {/* ── Navigation Error / Unreachable Notice ── */}
      {navigationError && transportMode === 'CAR' ? (
        <div className="bg-paper border-2 border-amber-500 shadow-hard-xl p-3.5 rounded-xs space-y-2.5 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-ink/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🚗</span>
              <div>
                <div className="font-bold text-xs text-amber-600 uppercase">CAR ROUTE UNAVAILABLE</div>
                <div className="text-[9px] text-muted font-bold uppercase mt-0.5">TO {destName}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onStopNavigation}
              className="text-[10px] font-bold px-2 py-0.5 bg-paper border border-ink rounded-xs hover:bg-ink hover:text-paper transition-colors cursor-pointer"
            >
              DISMISS
            </button>
          </div>
          <p className="text-[11px] text-ink font-bold leading-tight">
            {navigationError}
          </p>
          {onSetTransportMode && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSetTransportMode('WALK')}
                className="w-full flex items-center justify-center gap-2 bg-signal hover:bg-signal/90 text-ink border-2 border-ink py-2 px-3 rounded-xs text-xs font-bold uppercase shadow-hard active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <span>🚶</span>
                <span>SWITCH TO WALKING</span>
              </button>
            </div>
          )}
        </div>
      ) : navigationError ? (
        <div className="bg-paper border-2 border-red-500 shadow-hard-xl p-3 rounded-xs mb-2 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-xs bg-red-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-red-500 uppercase">NAVIGATION NOTICE</div>
              <p className="text-[11px] text-ink font-bold leading-tight mt-0.5">{navigationError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStopNavigation}
            className="text-[10px] font-bold px-2 py-1 bg-paper border border-ink rounded-xs hover:bg-ink hover:text-paper transition-colors shrink-0 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      ) : null}

      {/* ── Active Route Telemetry Card ── */}
      {navigationStatus === 'active' && activeRoute && (
        <div className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b-2 border-ink/15 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-signal animate-ping shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-signal">
                {activeRoute.routeType === 'VEHICLE_PLUS_WALK' ? '[ 🚗 DRIVE + 🚶 WALK GUIDANCE ]' : '[ LIVE GUIDANCE ACTIVE ]'}
              </span>
            </div>

            <button
              type="button"
              onClick={onStopNavigation}
              title="Stop Navigation"
              className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase bg-paper hover:bg-ink hover:text-paper text-ink border-2 border-ink px-2 py-0.5 rounded-xs transition-all active:translate-y-[1px] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>STOP</span>
            </button>
          </div>

          {/* Multimodal Guidance Note */}
          {activeRoute.routeType === 'VEHICLE_PLUS_WALK' && (
            <div className="bg-paper border border-ink/30 px-2.5 py-1.5 rounded-xs text-[10px] text-ink font-bold leading-tight">
              🚗 Drive to drop-off point, then walk the final stretch to the building entrance.
            </div>
          )}

          {/* Body Row: Destination & Metrics */}
          <div className="flex items-center justify-between gap-3">
            {/* Destination Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xs bg-ink text-paper border border-paper flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-signal fill-signal rotate-45" />
              </div>
              <div className="min-w-0">
                <div className="text-[8.5px] font-bold text-muted uppercase leading-none">TO CAMPUS DESTINATION</div>
                <div className="text-sm sm:text-base font-display uppercase tracking-tight text-ink truncate leading-tight mt-0.5">
                  {destName}
                </div>
              </div>
            </div>

            {/* Metrics Telemetry Badge (Distance & ETA) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Distance Pill */}
              <div className="bg-paper border-2 border-ink px-2 py-1 rounded-xs text-right shadow-xs">
                <div className="flex items-center gap-1 text-[8px] text-muted font-bold uppercase">
                  <MapPin className="w-2.5 h-2.5 text-signal" />
                  <span>{activeRoute.routeType === 'VEHICLE_PLUS_WALK' ? 'TOTAL' : 'DIST'}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-ink leading-none mt-0.5">
                  {distance}
                </div>
              </div>

              {/* Time Pill — label reflects actual transport mode */}
              <div className="bg-signal text-ink border-2 border-ink px-2 py-1 rounded-xs text-right shadow-xs">
                <div className="flex items-center gap-1 text-[8px] text-ink/80 font-bold uppercase">
                  <Clock className="w-2.5 h-2.5 text-ink" />
                  <span>{activeRoute.routeType === 'VEHICLE_PLUS_WALK' ? 'EST. TIME' : modeLabel}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-ink leading-none mt-0.5">
                  {eta}
                </div>
              </div>
            </div>
          </div>

          {/* Multimodal Drive + Walk Split Cards */}
          {activeRoute.routeType === 'VEHICLE_PLUS_WALK' && (
            <>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-ink/10 text-[10px]">
                <div className="bg-paper border border-ink/20 p-1.5 rounded-xs">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>🚗 DRIVE</span>
                    <span>{activeRoute.driveDistanceMeters} m</span>
                  </div>
                  <div className="text-[8.5px] text-muted font-bold mt-0.5">~{activeRoute.driveEtaMinutes} min to Drop-off</div>
                </div>
                <div className="bg-paper border border-ink/20 p-1.5 rounded-xs">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>🚶 WALK</span>
                    <span>{activeRoute.walkDistanceMeters} m</span>
                  </div>
                  <div className="text-[8.5px] text-muted font-bold mt-0.5">~{activeRoute.walkEtaMinutes} min to Entrance</div>
                </div>
              </div>

              {activeRoute.transferPoint && (
                <div className="flex items-center gap-1 text-[8.5px] font-bold text-muted uppercase truncate">
                  <span>🅿️ DROP-OFF JUNCTION:</span>
                  <span className="text-ink truncate">{activeRoute.transferPoint.name}</span>
                </div>
              )}
            </>
          )}

          {/* Transport Mode Selector */}
          {onSetTransportMode && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-ink/10">
              <span className="text-[9px] font-bold text-muted uppercase tracking-widest shrink-0">MODE:</span>
              <div className="flex gap-1 flex-1">
                {TRANSPORT_MODES.map((mode) => {
                  const isActive = transportMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onSetTransportMode(mode.id)}
                      title={`Switch to ${mode.label} mode`}
                      className={[
                        'flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase py-1 px-1.5 rounded-xs border-2 transition-all duration-150 cursor-pointer active:translate-y-[1px]',
                        isActive
                          ? 'bg-ink text-paper border-ink shadow-hard'
                          : 'bg-paper text-ink border-ink/30 hover:border-ink hover:shadow-xs',
                      ].join(' ')}
                    >
                      <span className="text-[11px] leading-none">{mode.icon}</span>
                      <span className="hidden sm:inline">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Calculating State Spinner ── */}
      {navigationStatus === 'calculating' && !navigationError && (
        <div className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-3 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-signal border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-ink uppercase">CALCULATING SHORTEST CAMPUS PATH…</span>
          </div>
          <button
            type="button"
            onClick={onStopNavigation}
            className="text-[9px] font-bold px-2 py-0.5 bg-paper border border-ink rounded-xs hover:bg-ink hover:text-paper"
          >
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(NavigationHUD);
