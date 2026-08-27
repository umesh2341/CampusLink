import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Compass, Radio, X, MapPin } from 'lucide-react';
import { calculateCampusRoute } from '../../client/src/features/map/lib/routingEngine.js';
import { buildingCoords } from '../../client/src/shared/lib/buildingCoords.js';

export default function RedBullViewerModal({
  isOpen,
  onClose,
  vehicleState,
  userLocation,
  onStartNavigation = null,
}) {
  const [routeInfo, setRouteInfo] = useState(null);

  if (!isOpen) return null;

  const status = vehicleState?.status || 'LIVE';
  const heading = vehicleState?.heading ? Math.round(vehicleState.heading) : '--';
  const semantic = vehicleState?.semanticLocation || 'Campus Grounds';

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
    } catch (err) {}
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        <motion.div
          key="rb-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        />

        <motion.div
          key="rb-card"
          className="relative z-50 w-full max-w-sm bg-[#131926] text-slate-100 rounded-2xl p-5 space-y-4 border border-white/10"
          style={{
            boxShadow: '12px 12px 30px rgba(0,0,0,0.65), -6px -6px 20px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        >
          <div className="flex justify-between items-center pb-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md"
                style={{
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 12px rgba(225,29,72,0.4)'
                }}
              >
                RB
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Red Bull Tracker
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">CampusLink Live Radar</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#0d121c] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              style={{
                boxShadow: '3px 3px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.03)'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div 
              className="bg-[#0c1017] rounded-xl p-3 border border-white/5"
              style={{
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02)'
              }}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Status</span>
              </div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                {status}
              </div>
            </div>

            <div 
              className="bg-[#0c1017] rounded-xl p-3 border border-white/5"
              style={{
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02)'
              }}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Bearing</span>
              </div>
              <div className="text-xs font-bold text-slate-200">
                {heading !== '--' ? `${heading}°` : 'Heading North'}
              </div>
            </div>
          </div>

          <div 
            className="bg-[#0c1017] rounded-xl p-3.5 border border-white/5 flex items-start gap-3"
            style={{
              boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5 text-rose-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Current Sector</div>
              <div className="text-sm text-slate-100 font-bold mt-0.5 leading-snug">{semantic}</div>
            </div>
          </div>

          {routeInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 text-xs flex justify-between items-center"
            >
              <span>Walk distance: <strong>{routeInfo.distanceMeters}m</strong></span>
              <span>ETA: <strong>~{routeInfo.estimatedMinutes} min</strong></span>
            </motion.div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              onClick={handleNavigateClick}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg transition-all"
              style={{
                boxShadow: '0 4px 16px rgba(225,29,72,0.4), inset 0 1px 1px rgba(255,255,255,0.3)'
              }}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Take Me To Car</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 text-xs font-semibold bg-[#1a2233] hover:bg-[#222d44] text-slate-300 rounded-xl border border-white/5 active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
