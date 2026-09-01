import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../shared/lib/supabaseClient.js';
import { createAffineTransformer } from './lib/redbullAffine.js';
import { createVehicleInterpolator } from './lib/redbullInterpolator.js';
import { createSemanticLocationResolver } from './lib/redbullSemantic.js';

const DEFAULT_COEFFICIENTS = {
  a: 219288.63099,
  b: -57261.336773,
  c: -17656337.4824,
  d: -380247.152371,
  e: -655855.147215,
  f: 45968556.9891
};

function RedBullMapMarker({
  onClick = null,
  onVehicleStateUpdate = null,
  coefficients = DEFAULT_COEFFICIENTS,
}) {
  const [vehicleState, setVehicleState] = useState(null);
  const transformerRef = useRef(createAffineTransformer(coefficients));
  const interpolatorRef = useRef(createVehicleInterpolator());
  const semanticResolverRef = useRef(createSemanticLocationResolver());
  const animFrameRef = useRef(null);

  useEffect(() => {
    transformerRef.current = createAffineTransformer(coefficients);
  }, [coefficients]);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    let pollTimer = null;

    async function fetchLatest() {
      try {
        const { data } = await supabase
          .from('redbull_car_live')
          .select('*')
          .eq('device_label', 'REDBULL_CAR_01')
          .maybeSingle();

        if (data && data.is_active && data.seconds_since_update < 45 && isMounted) {
          handleUpdate(data);
        } else if (isMounted && (!data || !data.is_active || data.seconds_since_update >= 45)) {
          setVehicleState(null);
          if (onVehicleStateUpdate) onVehicleStateUpdate(null);
        }
      } catch (e) {}
    }

    function handleUpdate(row) {
      if (!row || !isMounted) return;
      if (!row.is_active) {
        setVehicleState(null);
        if (onVehicleStateUpdate) onVehicleStateUpdate(null);
        return;
      }
      if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') return;

      const { x, y, accuracyRadiusPixels } = transformerRef.current.toMapCoordinates(
        row.latitude,
        row.longitude,
        row.accuracy
      );

      if (x === null || y === null) return;

      interpolatorRef.current.setTarget({
        x,
        y,
        heading: row.heading !== null && row.heading !== undefined ? Number(row.heading) : null,
        accuracyRadius: accuracyRadiusPixels,
        speed: row.speed !== null && row.speed !== undefined ? Number(row.speed) : 0,
        accuracy: row.accuracy !== null && row.accuracy !== undefined ? Number(row.accuracy) : null,
        updatedAt: row.updated_at || Date.now(),
      });
    }

    fetchLatest();
    pollTimer = setInterval(fetchLatest, 1500);

    const channel = supabase
      .channel('redbull-main-map-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redbull_car_telemetry',
          filter: 'device_label=eq.REDBULL_CAR_01',
        },
        (payload) => {
          if (payload.new && isMounted) {
            handleUpdate(payload.new);
          }
        }
      )
      .subscribe();

    function renderLoop() {
      const state = interpolatorRef.current.update();
      const isFresh = state && (Date.now() - state.updatedAt < 45000) && state.status === 'LIVE';

      if (isFresh && isMounted) {
        setVehicleState(state);
        if (onVehicleStateUpdate) {
          const semantic = semanticResolverRef.current.resolveLocation(state.x, state.y);
          onVehicleStateUpdate({
            ...state,
            semanticLocation: semantic.description,
            nearestLandmark: semantic.nearestLandmark,
          });
        }
      } else if (isMounted && (!isFresh || state?.status === 'OFFLINE')) {
        setVehicleState(null);
        if (onVehicleStateUpdate) onVehicleStateUpdate(null);
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    }

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      channel.unsubscribe();
    };
  }, [onVehicleStateUpdate]);

  if (!vehicleState || vehicleState.x === null || vehicleState.y === null) {
    return null;
  }

  const left = (vehicleState.x / 1580) * 100;
  const top = (vehicleState.y / 2891) * 100;
  const heading = vehicleState.heading || 0;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-36 pointer-events-auto select-none cursor-pointer group"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        willChange: 'left, top',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(vehicleState);
      }}
    >
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-300"
        style={{
          width: `${Math.max(28, vehicleState.accuracyRadius * 2)}px`,
          height: `${Math.max(28, vehicleState.accuracyRadius * 2)}px`,
          left: '50%',
          top: '50%',
          backgroundColor: 'rgba(225, 29, 72, 0.15)',
          border: '1.5px dashed rgba(225, 29, 72, 0.5)',
        }}
      />

      <span className="animate-ping absolute -inset-1 rounded-full bg-rose-500 opacity-60 pointer-events-none" />

      <div className="relative flex flex-col items-center">
        <div className="relative w-9 h-9 rounded-full bg-slate-950 border-2 border-yellow-400 shadow-[0_0_14px_rgba(225,29,72,0.85)] flex items-center justify-center transition-transform duration-100 group-hover:scale-110 active:scale-95">
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <div className="absolute -top-2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-bottom-[6px] border-b-yellow-400" />
          </div>

          <svg className="w-5 h-5 z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="32" fill="#FACC15" />
            <path d="M32 58 C24 50 20 44 22 36 C24 30 30 28 34 32 C38 36 40 42 46 48 L46 54 Z" fill="#E11D48" stroke="#881337" strokeWidth="2"/>
            <path d="M68 58 C76 50 80 44 78 36 C76 30 70 28 66 32 C62 36 60 42 54 48 L54 54 Z" fill="#E11D48" stroke="#881337" strokeWidth="2"/>
            <circle cx="50" cy="50" r="30" stroke="#E11D48" strokeWidth="3" />
          </svg>
        </div>

        <div className="mt-1 bg-slate-900/95 text-yellow-400 border border-yellow-400/80 px-2 py-0.5 rounded-sm font-mono text-[8.5px] font-extrabold uppercase tracking-wider shadow-lg whitespace-nowrap flex items-center gap-1.5 z-40 group-hover:border-rose-500">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>RED BULL CAR</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(RedBullMapMarker);
