import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../client/src/shared/lib/supabaseClient.js';
import { createAffineTransformer } from '../lib/affineTransform.js';
import { createVehicleInterpolator } from '../lib/interpolator.js';
import { createSemanticLocationResolver } from '../lib/semanticLocation.js';

const DEFAULT_COEFFICIENTS = {
  a: 478863.683905,
  b: -19596.875341,
  c: -40689501.705,
  d: 3693.35968,
  e: -499077.146284,
  f: 9789781.4823,
};

export default function RedBullMapLayer({
  coefficients = DEFAULT_COEFFICIENTS,
  onVehicleStateChange = null,
  isVisible = true,
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

    async function fetchInitial() {
      try {
        const { data, error } = await supabase
          .from('redbull_car_live')
          .select('*')
          .eq('device_label', 'REDBULL_CAR_01')
          .maybeSingle();

        if (error) {
          const fallback = await supabase
            .from('redbull_car_telemetry')
            .select('latitude, longitude, accuracy, altitude, heading, speed, updated_at')
            .eq('device_label', 'REDBULL_CAR_01')
            .maybeSingle();

          if (fallback.data && isMounted) {
            handleNewTelemetry(fallback.data);
          }
          return;
        }

        if (data && isMounted) {
          handleNewTelemetry(data);
        }
      } catch (err) {
        console.error('Error loading initial Red Bull telemetry:', err);
      }
    }

    function handleNewTelemetry(row) {
      if (!row || typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
        return;
      }

      const { x, y, accuracyRadiusPixels } = transformerRef.current.toMapCoordinates(
        row.latitude,
        row.longitude,
        row.accuracy
      );

      if (x === null || y === null) return;

      interpolatorRef.current.setTarget({
        x: x,
        y: y,
        heading: row.heading !== null && row.heading !== undefined ? Number(row.heading) : null,
        accuracyRadius: accuracyRadiusPixels,
        speed: row.speed !== null && row.speed !== undefined ? Number(row.speed) : 0,
        accuracy: row.accuracy !== null && row.accuracy !== undefined ? Number(row.accuracy) : null,
        updatedAt: row.updated_at || Date.now(),
      });
    }

    fetchInitial();

    const channel = supabase
      .channel('redbull-realtime-layer')
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
            handleNewTelemetry(payload.new);
          }
        }
      )
      .subscribe();

    function render() {
      const state = interpolatorRef.current.update();
      if (state && isMounted) {
        setVehicleState(state);
        if (onVehicleStateChange) {
          const semantic = semanticResolverRef.current.resolveLocation(state.x, state.y);
          onVehicleStateChange({
            ...state,
            semanticLocation: semantic.description,
            nearestLandmark: semantic.nearestLandmark,
          });
        }
      }
      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      channel.unsubscribe();
    };
  }, [onVehicleStateChange]);

  if (!isVisible || !vehicleState) {
    return null;
  }

  const { x, y, heading, accuracyRadius, status } = vehicleState;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1580,
        height: 2891,
        pointerEvents: 'none',
        zIndex: 35,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <circle
          cx={x}
          cy={y}
          r={Math.max(12, accuracyRadius)}
          fill="rgba(225, 29, 72, 0.12)"
          stroke={status === 'WEAK_GPS' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(225, 29, 72, 0.45)'}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          transform: `translate(${x}px, ${y}px)`,
          left: 0,
          top: 0,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(225, 29, 72, 0.25)',
              animation: 'redbullPulse 2s infinite ease-out',
            }}
          />

          <div
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              background: '#0f172a',
              border: '2px solid #facc15',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(225, 29, 72, 0.85)',
              transform: `rotate(${heading}deg)`,
              transition: 'transform 0.08s linear',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -7,
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '8px solid #facc15',
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.7 2 12.2V16c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: -18,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #1e293b',
              color: '#facc15',
              fontSize: '9px',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}
          >
            RED BULL
          </div>
        </div>
      </div>
    </div>
  );
}
