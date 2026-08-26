import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Compass, Gauge, Radio, X, MapPin } from 'lucide-react';
import { calculateRouteToCar } from '../lib/routingBridge.js';

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
    const res = calculateRouteToCar(start, { x: vehicleState.x, y: vehicleState.y });

    if (res.status === 'active' && res.route) {
      setRouteInfo(res.route);
      if (onStartNavigation) {
        onStartNavigation(res.route);
      }
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-bold text-base tracking-wide text-white uppercase">
                Red Bull Radar
              </h3>
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                LIVE KIOSK
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Current Sector</span>
            </div>
            <div className="text-lg font-extrabold text-white">
              {semantic}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase mb-1">
                <Gauge className="w-3.5 h-3.5 text-yellow-400" />
                <span>Speed</span>
              </div>
              <div className="text-base font-mono font-bold text-white">
                {speed} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase mb-1">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span>Heading</span>
              </div>
              <div className="text-base font-mono font-bold text-white">
                {heading}°
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase mb-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Signal</span>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase mt-0.5">
                {status}
              </div>
            </div>
          </div>

          {routeInfo && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs font-mono text-rose-200 flex justify-between items-center">
              <span>Walking Distance: <strong>{routeInfo.distanceMeters}m</strong></span>
              <span>ETA: <strong>~{routeInfo.estimatedMinutes} min</strong></span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleNavigateClick}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-[0.98]"
            >
              <Navigation className="w-4 h-4" />
              <span>Take Me To Car</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
