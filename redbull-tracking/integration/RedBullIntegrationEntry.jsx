import React, { useState } from 'react';
import RedBullMapLayer from '../viewer/RedBullMapLayer.jsx';
import RedBullViewerModal from '../viewer/RedBullViewerModal.jsx';

export default function RedBullIntegrationEntry({
  userLocation = null,
  onStartNavigation = null,
  coefficients = undefined,
}) {
  const [vehicleState, setVehicleState] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <RedBullMapLayer
        coefficients={coefficients}
        onVehicleStateChange={setVehicleState}
        isVisible={true}
      />

      {vehicleState && (
        <div className="absolute top-20 right-4 z-40">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white shadow-xl hover:bg-slate-800 transition active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold font-mono text-yellow-400">RED BULL</span>
            <span className="text-[11px] font-mono text-slate-300">
              {vehicleState.speed ? `${(vehicleState.speed * 3.6).toFixed(0)} km/h` : 'LIVE'}
            </span>
          </button>
        </div>
      )}

      <RedBullViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicleState={vehicleState}
        userLocation={userLocation}
        onStartNavigation={(route) => {
          setIsModalOpen(false);
          if (onStartNavigation) {
            onStartNavigation(route);
          }
        }}
      />
    </>
  );
}
