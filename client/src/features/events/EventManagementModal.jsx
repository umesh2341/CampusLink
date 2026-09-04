import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, EyeOff, X } from 'lucide-react';
import { API_BASE } from '../../shared/lib/api';

function EventManagementModal({ isOpen, onClose, userId, isAdmin, onHidden }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hidingId, setHidingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/events/manage`, { headers: { 'x-user-id': userId } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load manageable events');
        return res.json();
      })
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, userId]);

  const handleHide = async (event) => {
    if (!window.confirm(`Hide "${event.title}" from everyone?`)) return;
    setHidingId(event.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/events/${event.id}/hide`, {
        method: 'PATCH',
        headers: { 'x-user-id': userId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to hide event');
      setEvents((current) => current.filter((item) => item.id !== event.id));
      onHidden?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setHidingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none">
        <motion.div
          key="manage-events-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
          onClick={onClose}
        />
        <motion.div
          key="manage-events-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-50 w-full max-w-md sm:max-w-xl bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col max-h-[90%] overflow-hidden"
        >
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <Calendar className="w-4 h-4 text-signal" />
              <span>[ {isAdmin ? 'MANAGE EVENTS' : 'MY EVENTS'} ]</span>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-grain p-4 space-y-2">
            {isLoading ? (
              <p className="p-8 text-center text-signal text-sm font-bold tracking-widest uppercase animate-pulse">[ LOADING EVENTS... ]</p>
            ) : error ? (
              <p className="p-6 text-center text-red-600 text-xs uppercase">{error}</p>
            ) : events.length === 0 ? (
              <div className="p-8 text-center bg-card border-2 border-ink rounded-xs">
                <p className="font-display text-xl uppercase text-ink">— NO ACTIVE EVENTS —</p>
              </div>
            ) : events.map((event) => (
              <div key={event.id} className="p-3 bg-card border-2 border-ink shadow-hard rounded-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-display text-lg uppercase text-ink truncate">{event.title}</h4>
                  <p className="text-[10px] text-muted uppercase truncate">{event.building_name} • {new Date(event.start_time).toLocaleString()}</p>
                  {isAdmin && <p className="text-[10px] text-muted uppercase mt-1">CREATOR: {event.created_by || 'UNKNOWN'}</p>}
                </div>
                <button
                  onClick={() => handleHide(event)}
                  disabled={hidingId === event.id}
                  title="Hide event"
                  className="shrink-0 flex items-center gap-1.5 border-2 border-ink bg-signal text-ink px-2 py-1.5 text-[10px] font-bold uppercase hover:bg-ink hover:text-paper disabled:opacity-50"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  {hidingId === event.id ? 'HIDING' : 'HIDE'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default EventManagementModal;
