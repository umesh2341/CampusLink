import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';

function LocationConsentModal({ isOpen, onClose, onConfirm, error = null }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 font-mono select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-md bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <Navigation className="w-4 h-4 text-signal" />
              <span>[ LIVE LOCATION ACCESS ]</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all active:translate-y-[1px] focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-paper">
            {error ? (
              <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xs space-y-1 text-red-900">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>LOCATION ACCESS NOTICE</span>
                </div>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 bg-card border-2 border-ink p-3 rounded-xs shadow-hard">
                  <div className="w-9 h-9 rounded-xs bg-signal/20 border border-ink flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-signal" />
                  </div>
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-ink uppercase">Campus Wayfinding Beacon</h4>
                    <p className="text-muted text-[11px] leading-relaxed">
                      Enable live tracking to display your real-time position on the ITER campus map as you walk between blocks, hostels, and event venues.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-card border border-ink/20 rounded-xs space-y-1.5 text-[11px] text-muted">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <ShieldCheck className="w-3.5 h-3.5 text-confirm" />
                    <span>PRIVACY &amp; SECURITY GUARANTEE</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    <li>Location is only accessed while tracking is toggled ON.</li>
                    <li>No permanent historical GPS path is retained.</li>
                    <li>You can pause or stop location sharing at any time.</li>
                  </ul>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-ink/10">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold border-2 border-ink px-3 py-1.5 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex items-center gap-1.5 text-xs font-bold border-2 border-ink px-4 py-1.5 rounded-xs bg-signal text-ink shadow-hard hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all active:translate-y-[2px]"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>ALLOW &amp; START TRACKING</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default LocationConsentModal;
