import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, MapPin } from 'lucide-react';

const categoryLabels = {
  academic: { label: 'Academic', dot: 'bg-category-academic-fill' },
  hostel_boys: { label: 'Boys Hostel', dot: 'bg-category-boys-hostel-fill' },
  hostel_girls: { label: 'Girls Hostel', dot: 'bg-category-girls-hostel-fill' },
  admin: { label: 'Admin/Research', dot: 'bg-category-admin-research-fill' },
  cafeteria: { label: 'Cafeteria/Food', dot: 'bg-category-cafeteria-food-fill' },
  sports: { label: 'Sports', dot: 'bg-category-sports-fill' },
  gardens: { label: 'Gardens', dot: 'bg-category-gardens-fill' },
  other: { label: 'Other/Misc', dot: 'bg-category-other-misc-fill' },
};

function SidePanel({ building, events = [], isOpen, onClose, onSelectEvent }) {
  if (!building) return null;

  const categoryInfo = categoryLabels[building.category] || { label: 'Unknown', dot: 'bg-gray-400' };

  const formatTime = (timeStr) => {
    const d = new Date(timeStr);
    return (
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' — ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    );
  };

  const getLocationString = (floor, roomNumber) => {
    const parts = [];
    if (floor?.trim()) {
      const f = floor.trim();
      parts.push(f.toLowerCase().includes('floor') ? f : `Floor: ${f}`);
    }
    if (roomNumber?.trim()) {
      const r = roomNumber.trim();
      parts.push(/room|lab|hall/i.test(r) ? r : `Room: ${r}`);
    }
    return parts.length ? parts.join(', ') : null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/30 backdrop-blur-xs z-40"
            onClick={onClose}
          />

          {/* Side Panel / Bottom Sheet */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
            className="fixed z-50 bg-paper flex flex-col font-mono
              inset-x-0 bottom-0 top-0
              sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md sm:border-l-2 sm:border-ink shadow-hard-xl"
          >
            {/* ── Header ── */}
            <div className="border-b-2 border-ink p-4 flex items-start justify-between bg-card shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 border border-ink/40 ${categoryInfo.dot}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                    [ {categoryInfo.label} ]
                  </span>
                </div>
                <h2 className="text-3xl font-display uppercase tracking-tight text-ink leading-tight">
                  {building.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="p-1.5 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper rounded-xs transition-all active:translate-y-[2px] focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-grain">
              {/* Section header */}
              <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-ink border-b-2 border-ink/20 pb-1.5">
                <span>[ Active Events ]</span>
                <span className="bg-ink text-paper text-[10px] px-1.5 py-0.5 rounded-xs">{events.length}</span>
              </div>

              {events.length === 0 ? (
                <div className="h-44 flex items-center justify-center border-2 border-dashed border-ink/30 rounded-xs bg-card">
                  <p className="font-mono text-xs text-muted uppercase">— No active events here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const locationStr = getLocationString(event.floor, event.room_number);
                    return (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className="group cursor-pointer border-2 border-ink p-3.5 rounded-xs bg-card shadow-hard
                                   hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none
                                   active:translate-y-[2px] transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xl font-display text-ink uppercase group-hover:text-signal transition-colors leading-tight">
                            {event.title}
                          </h4>
                          <span className="font-mono text-[9px] font-bold bg-signal text-ink border border-ink px-1 py-0.5 rounded-xs shrink-0">
                            VIEW
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-ink/10 space-y-1 font-mono text-xs">
                          <div className="flex items-center gap-2 text-ink">
                            <Calendar className="w-3.5 h-3.5 text-signal shrink-0" />
                            <span>{formatTime(event.start_time)}</span>
                          </div>
                          {locationStr && (
                            <div className="flex items-center gap-2 text-ink font-bold">
                              <MapPin className="w-3.5 h-3.5 text-signal shrink-0" />
                              <span>{locationStr}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted">
                            <Users className="w-3.5 h-3.5 text-ink shrink-0" />
                            <span>CLUB: <strong className="text-ink">{event.organizing_club}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default SidePanel;

