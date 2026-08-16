import React from 'react';
import { X, Calendar, Users, MapPin } from 'lucide-react';

const categoryLabels = {
  academic: { label: 'Academic', dot: 'bg-category-academic-fill' },
  hostel_boys: { label: 'Boys Hostel', dot: 'bg-category-boys-hostel-fill' },
  hostel_girls: { label: 'Girls Hostel', dot: 'bg-category-girls-hostel-fill' },
  admin: { label: 'Admin/Research', dot: 'bg-category-admin-research-fill' },
  cafeteria: { label: 'Cafeteria/Food', dot: 'bg-category-cafeteria-food-fill' },
  sports: { label: 'Sports', dot: 'bg-category-sports-fill' },
  gardens: { label: 'Gardens', dot: 'bg-category-gardens-fill' },
  other: { label: 'Other/Misc', dot: 'bg-category-other-misc-fill' }
};

function SidePanel({ building, events, isOpen, onClose, onSelectEvent }) {
  if (!building) return null;

  const categoryInfo = categoryLabels[building.category] || { label: 'Unknown', dot: 'bg-gray-400' };

  // Format date/time
  const formatTime = (timeStr) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLocationString = (floor, roomNumber) => {
    const parts = [];
    if (floor && floor.trim()) {
      const f = floor.trim();
      parts.push(f.toLowerCase().includes('floor') ? f : `Floor: ${f}`);
    }
    if (roomNumber && roomNumber.trim()) {
      const r = roomNumber.trim();
      parts.push(r.toLowerCase().includes('room') || r.toLowerCase().includes('lab') || r.toLowerCase().includes('hall') ? r : `Room: ${r}`);
    }
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <>
      {/* Backdrop for closing */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-text-primary/20 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Side Panel / Bottom Sheet Container */}
      <aside
        className={`fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col
          inset-x-0 bottom-0 top-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md
          ${isOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}
      >
        {/* Header */}
        <div className="border-b border-text-primary/10 p-5 flex items-start justify-between bg-canvas/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${categoryInfo.dot}`} />
              <span className="font-mono text-xs uppercase tracking-wider text-text-primary/60">
                {categoryInfo.label}
              </span>
            </div>
            <h2 className="text-3xl font-display uppercase tracking-tight text-text-primary leading-tight">
              {building.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-text-primary/5 rounded-full transition-colors focus:outline-none"
            aria-label="Close panel"
          >
            <X className="w-6 h-6 text-text-primary" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-text-primary/40 border-b border-text-primary/5 pb-2">
            Active Events ({events.length})
          </h3>

          {events.length === 0 ? (
            // Empty State
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-text-primary/10 rounded-lg bg-canvas/10">
              <p className="font-mono text-sm text-text-primary/50">
                No events happening here right now.
              </p>
            </div>
          ) : (
            // Events list
            <div className="space-y-3">
              {events.map((event) => {
                const locationStr = getLocationString(event.floor, event.room_number);
                return (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="group cursor-pointer border border-text-primary/10 hover:border-accent-gold p-4 rounded bg-white shadow-xs hover:shadow-md transition-all duration-200"
                  >
                    <h4 className="text-xl font-display text-text-primary uppercase group-hover:text-accent-gold transition-colors">
                      {event.title}
                    </h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-xs text-text-primary/75">
                        <Calendar className="w-3.5 h-3.5 text-landmark-teal" />
                        <span>{formatTime(event.start_time)}</span>
                      </div>
                      {locationStr && (
                        <div className="flex items-center gap-2 font-mono text-xs text-text-primary/90 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-landmark-teal" />
                          <span>{locationStr}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-mono text-xs text-text-primary/75">
                        <Users className="w-3.5 h-3.5 text-landmark-teal" />
                        <span>{event.organizing_club}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default SidePanel;
