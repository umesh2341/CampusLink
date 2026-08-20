import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Users, MapPin, ArrowUpRight, Ticket } from 'lucide-react';

const TAG_LABELS = {
  hackathon: 'HACKATHON',
  tech_event: 'TECH EVENT',
  workshop: 'WORKSHOP',
  cultural_event: 'CULTURAL EVENT',
  college_official: 'COLLEGE OFFICIAL',
};

const fmtDate = (t) => new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const getLocationString = (floor, roomNumber) => {
  const parts = [];
  if (floor?.trim()) { const f = floor.trim(); parts.push(/floor/i.test(f) ? f : `Floor: ${f}`); }
  if (roomNumber?.trim()) { const r = roomNumber.trim(); parts.push(/room|lab|hall/i.test(r) ? r : `Room: ${r}`); }
  return parts.length ? parts.join(', ') : null;
};

function EventDetailModal({ event, isOpen, onClose }) {
  const locationStr = event ? getLocationString(event.floor, event.room_number) : null;
  const venueStr = event?.building_name
    ? `${event.building_name}${locationStr ? ` (${locationStr})` : ''}`
    : (locationStr || 'Campus Grounds');

  return (
    <AnimatePresence>
      {isOpen && event && (
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

          {/* ── Ticket Stub Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-50 w-full max-w-md sm:max-w-lg bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* ── Top Bar (ticket header) ── */}
            <div className="bg-ink text-paper px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                <Ticket className="w-4 h-4 text-signal" />
                <span>[ EVENT PASS ]</span>
              </div>
              <button onClick={onClose} aria-label="Close"
                className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all active:translate-y-[1px] focus:outline-none">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Optional banner image */}
              {event.image_url && (
                <div className="h-36 sm:h-48 w-full overflow-hidden border-b-2 border-ink relative bg-paper">
                  <img src={event.image_url} alt={event.title} loading="lazy" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'; }} />
                  <span className="absolute top-2 right-2 bg-ink text-paper text-[9px] font-bold px-2 py-0.5 border border-paper uppercase">
                    VERIFIED
                  </span>
                </div>
              )}

              {/* Title & organizer */}
              <div className="px-4 pt-4 pb-2 space-y-1">
                <h3 className="text-3xl sm:text-4xl font-display text-ink uppercase tracking-tight leading-tight">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Users className="w-3.5 h-3.5 text-signal shrink-0" />
                  <span>ORGANIZER: <strong className="text-ink">{event.organizing_club}</strong></span>
                </div>

                {/* Tag Chips */}
                {Array.isArray(event.tags) && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[9px] font-bold uppercase tracking-wider bg-paper text-ink border-2 border-ink px-2 py-0.5 rounded-xs"
                      >
                        #{TAG_LABELS[tag] || tag.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Perforation tear line ── */}
              <div className="mx-4 my-3 ticket-perforation">
                <div className="ticket-notch-left" />
                <div className="ticket-notch-right" />
              </div>

              {/* ── Boarding-pass metadata table ── */}
              <div className="mx-4 mb-3 border-2 border-ink bg-paper rounded-xs p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-ink/10">
                  {/* Start */}
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-0.5">— STARTS</span>
                    <div className="flex items-center gap-1 text-ink">
                      <Calendar className="w-3 h-3 text-signal shrink-0" />
                      <span>{fmtDate(event.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-ink pl-4">
                      <Clock className="w-3 h-3 text-signal shrink-0" />
                      <span>{fmtTime(event.start_time)}</span>
                    </div>
                  </div>
                  {/* End */}
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-0.5">— ENDS</span>
                    <div className="flex items-center gap-1 text-ink">
                      <Calendar className="w-3 h-3 text-signal shrink-0" />
                      <span>{fmtDate(event.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-ink pl-4">
                      <Clock className="w-3 h-3 text-signal shrink-0" />
                      <span>{fmtTime(event.end_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-0.5">— VENUE</span>
                  <div className="flex items-center gap-1 text-ink font-bold">
                    <MapPin className="w-3 h-3 text-signal shrink-0" />
                    <span>{venueStr}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 pb-4 space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-muted">[ ABOUT ]</span>
                <p className="text-xs text-ink/90 leading-relaxed whitespace-pre-wrap bg-paper border border-ink/10 rounded-xs p-2.5">
                  {event.description}
                </p>
              </div>
            </div>

            {/* ── CTA Button (tactile press) ── */}
            {event.registration_url && (
              <div className="border-t-2 border-ink p-4 bg-paper shrink-0">
                <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-signal text-ink font-bold text-xs sm:text-sm uppercase tracking-wider py-3 px-4 rounded-xs border-2 border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                  <span>REGISTER FOR EVENT</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default EventDetailModal;
