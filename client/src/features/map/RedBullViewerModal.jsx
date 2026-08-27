import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, X, MapPin } from 'lucide-react';
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

  const semantic = vehicleState?.semanticLocation || 'Campus Area';

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
          transition={{ duration: 0.15 }}
          onClick={onClose}
        />

        <motion.div
          key="rb-card"
          className="relative z-50 w-full max-w-xs bg-[#111622] text-slate-100 rounded-2xl p-5 space-y-4 border border-white/10"
          style={{
            boxShadow: '16px 16px 36px rgba(0,0,0,0.7), -6px -6px 20px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md"
                style={{
                  boxShadow: '0 4px 12px rgba(225,29,72,0.4), inset 0 1px 1px rgba(255,255,255,0.4)'
                }}
              >
                RB
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
                  Red Bull Live Car
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                </h3>
                <p className="text-[11px] text-slate-400">Club Nexus (I7)</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#0d121c] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div 
            className="bg-[#0b0e17] rounded-xl p-3.5 border border-white/5 flex items-center gap-3"
            style={{
              boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Location</div>
              <div className="text-xs text-slate-100 font-bold mt-0.5 leading-snug">{semantic}</div>
            </div>
          </div>

          {routeInfo && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-200 text-xs flex justify-between items-center">
              <span>Distance: <strong>{routeInfo.distanceMeters}m</strong></span>
              <span>Walk: <strong>~{routeInfo.estimatedMinutes} min</strong></span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              onClick={handleNavigateClick}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Take Me To Car</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 text-xs font-semibold bg-[#182030] hover:bg-[#202b40] text-slate-300 rounded-xl border border-white/5 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
