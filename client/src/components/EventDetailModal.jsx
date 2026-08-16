import React from 'react';
import { X, Calendar, Clock, Users, MapPin, ArrowUpRight } from 'lucide-react';

function EventDetailModal({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  // Format date/time
  const formatDateTime = (timeStr) => {
    const d = new Date(timeStr);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const locationStr = getLocationString(event.floor, event.room_number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-text-primary/10 relative z-50 flex flex-col max-h-[90vh]">
        
        {/* Close Button on top of Image */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 bg-white/80 hover:bg-white text-text-primary p-1.5 rounded-full shadow-md backdrop-blur-xs transition-all focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Event Image */}
        <div className="h-48 sm:h-56 w-full relative bg-canvas/30 overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'; // fallback
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-landmark-teal/10">
              <span className="font-display text-2xl text-landmark-teal uppercase tracking-wider">
                CAMPUS LINK EVENT
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Title & Club & Room Location */}
          <div className="space-y-1">
            <h3 className="text-3xl font-display text-text-primary uppercase tracking-tight leading-tight">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 font-mono text-sm text-text-primary/60">
              <Users className="w-4 h-4 text-landmark-teal" />
              <span>Organized by {event.organizing_club}</span>
            </div>
            {locationStr && (
              <div className="flex items-center gap-2 font-mono text-xs text-text-primary/80 font-semibold pt-1">
                <MapPin className="w-4 h-4 text-landmark-teal" />
                <span>{locationStr}</span>
              </div>
            )}
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-text-primary/10 py-4 bg-canvas/20 rounded-md px-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-primary/40 block">
                Starts
              </span>
              <div className="flex items-center gap-2 font-mono text-xs text-text-primary/80">
                <Calendar className="w-3.5 h-3.5 text-landmark-teal" />
                <span>{formatDateTime(event.start_time)}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-text-primary/80 pl-5.5">
                <Clock className="w-3.5 h-3.5 text-landmark-teal" />
                <span>{formatTime(event.start_time)}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-primary/40 block">
                Ends
              </span>
              <div className="flex items-center gap-2 font-mono text-xs text-text-primary/80">
                <Calendar className="w-3.5 h-3.5 text-landmark-teal" />
                <span>{formatDateTime(event.end_time)}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-text-primary/80 pl-5.5">
                <Clock className="w-3.5 h-3.5 text-landmark-teal" />
                <span>{formatTime(event.end_time)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-primary/40 block">
              About Event
            </span>
            <p className="font-mono text-sm text-text-primary/80 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        </div>

        {/* Action Bar (Register) */}
        {event.registration_url && (
          <div className="border-t border-text-primary/10 p-5 bg-canvas/30">
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-text-primary font-mono text-sm font-bold uppercase tracking-wider py-3.5 px-4 rounded border border-text-primary shadow-xs hover:shadow-md active:translate-y-0.5 transition-all"
            >
              <span>Register for Event</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetailModal;
