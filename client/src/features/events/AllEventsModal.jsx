import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';

function AllEventsModal({ isOpen, onClose, allActiveEvents, isEventsLoading, onSelectEvent }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none">
        {/* Backdrop */}
        <motion.div
          key="events-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
          onClick={onClose}
        />
        
        {/* Modal Sheet */}
        <motion.div
          key="events-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-md sm:max-w-xl bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col h-full max-h-full overflow-hidden"
        >
          {/* Kiosk Header */}
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <Calendar className="w-4 h-4 text-signal" />
              <span>[ ALL EVENTS ]</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all active:translate-y-[1px] focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-grain p-4 space-y-2">
            {isEventsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-signal">
                <span className="font-mono text-sm font-bold tracking-widest uppercase animate-pulse">
                  [ LOADING EVENTS... ]
                </span>
              </div>
            ) : allActiveEvents.length === 0 ? (
              <div className="p-8 text-center bg-card border-2 border-ink rounded-xs space-y-1 mt-4">
                <p className="font-display text-xl uppercase text-ink">— NO EVENTS ACTIVE —</p>
                <p className="text-xs text-muted">Check back later for new events.</p>
              </div>
            ) : (
              allActiveEvents.map(event => (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { onClose(); onSelectEvent(event); }}
                  className="p-3 bg-card border-2 border-ink shadow-hard hover:shadow-hard-lg rounded-xs cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-lg uppercase text-ink group-hover:text-signal transition-colors truncate leading-tight">
                        {event.title}
                      </h4>
                      <span className="text-[9px] font-bold bg-signal text-ink border border-ink px-1.5 py-0.5 rounded-xs shrink-0 whitespace-nowrap">
                        PASS
                      </span>
                    </div>
                    <span className="text-[10px] text-muted block mt-1 uppercase">
                      CLUB: <strong className="text-ink">{event.organizing_club}</strong>
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AllEventsModal;
