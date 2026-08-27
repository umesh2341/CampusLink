import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Compass, Gauge, Radio, X, MapPin } from 'lucide-react';
import { calculateCampusRoute } from './lib/routingEngine.js';
import { buildingCoords } from '../../shared/lib/buildingCoords.js';

export default function RedBullViewerModal({
  isOpen,
  onClose,
  vehicleState,
  userLocation,
  onStartNavigation = null,
}) {
  const [routeInfo, setRouteInfo] = useState(null);

  if (!isOpen) return null;

  const status = vehicleState?.status || 'CONNECTING';
  const speed = vehicleState?.speed ? (vehicleState.speed * 3.6).toFixed(1) : '0.0';
  const heading = vehicleState?.heading ? Math.round(vehicleState.heading) : '--';
  const semantic = vehicleState?.semanticLocation || 'Tracking Campus Perimeter';

  function handleNavigateClick() {
    if (!vehicleState || typeof vehicleState.x !== 'number') return;
    const start = userLocation || { x: 437, y: 650 };
    
    try {
      const res = calculateCampusRoute({
        startLocation: { x: start.x, y: start.y },
        destinationBuilding: {
          id: 'redbull-vehicle',
          name: 'Red Bull Event Car',
          svg_element_id: null,
          directCoord: { x: vehicleState.x, y: vehicleState.y }
        },
        buildingCoordsMap: buildingCoords,
        transportMode: 'WALK'
      });

      if (res.status === 'active' && res.route) {
        setRouteInfo(res.route);
        if (onStartNavigation) {
          onStartNavigation(res.route);
        }
      }
    } catch (err) {
      console.warn('Route to Red Bull car error:', err);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
        <motion.div
          key="rb-backdrop"
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />

        <motion.div
          key="rb-card"
          className="bg-slate-900 border-2 border-yellow-400 shadow-[0_0_25px_rgba(225,29,72,0.4)] rounded-xs p-5 w-full max-w-md relative z-50 text-slate-100 space-y-4"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'tween', duration: 0.2 }}
        >
          <div className="flex justify-between items-start border-b-2 border-yellow-400 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-extrabold text-xs">
                RB
              </div>
              <div>
                <h3 className="text-xl font-display uppercase tracking-tight text-yellow-400 leading-none">
                  [ RED BULL RADAR ]
                </h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  LIVE TELEMETRY COCKPIT
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-xs font-bold border border-yellow-400/70 px-2 py-1 rounded-xs bg-slate-800 hover:bg-yellow-400 hover:text-slate-950 transition-all text-yellow-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xs">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
                <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                <span>STATUS</span>
              </div>
              <div className="text-xs font-bold text-yellow-400 uppercase tracking-wide">
                {status}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xs">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
                <Gauge className="w-3 h-3 text-yellow-400" />
                <span>SPEED</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">
                {speed} <span className="text-[9px] text-slate-400 font-normal">KM/H</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xs">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
                <Compass className="w-3 h-3 text-yellow-400" />
                <span>HEADING</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">
                {heading}°
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xs flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">CURRENT SECTOR</div>
              <div className="text-xs text-yellow-300 font-bold mt-0.5">{semantic}</div>
            </div>
          </div>

          {routeInfo && (
            <div className="bg-rose-950/40 border border-rose-600/50 p-2.5 rounded-xs text-rose-200 text-xs flex justify-between items-center">
              <span>Walking Distance: <strong>{routeInfo.distanceMeters}m</strong></span>
              <span>ETA: <strong>~{routeInfo.estimatedMinutes} min</strong></span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              onClick={handleNavigateClick}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs py-2.5 px-3 rounded-xs border-2 border-yellow-400 shadow-md transition-all active:translate-y-[1px]"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>TAKE ME TO CAR</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs border border-slate-700 transition-all"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
