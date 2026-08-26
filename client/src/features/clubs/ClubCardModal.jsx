import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar, Instagram, ShieldCheck, Linkedin } from 'lucide-react';

function ClubCardModal({ club, isOpen, onClose, activeEvents = [], onSelectEvent }) {
  if (!isOpen || !club) return null;

  // Filter events organized by this club (by club_id, falling back to name match for old events)
  const clubEvents = activeEvents.filter(
    (e) => e.club_id === club.id || (e.organizing_club && e.organizing_club.toLowerCase().includes(club.name.toLowerCase()))
  );

  // Consolidate social handles
  const rawSocials = typeof club.social_handles === 'string' ? JSON.parse(club.social_handles) : (club.social_handles || {});
  const socialLinks = [];

  const instagramHandle = rawSocials.instagram || club.instagram;
  if (instagramHandle) {
    socialLinks.push({
      type: 'instagram',
      label: `@${instagramHandle}`,
      url: `https://instagram.com/${instagramHandle}`,
      icon: Instagram,
      iconClass: 'text-signal'
    });
  }

  const linkedinHandle = rawSocials.linkedin;
  if (linkedinHandle) {
    socialLinks.push({
      type: 'linkedin',
      label: `@${linkedinHandle}`,
      url: `https://linkedin.com/company/${linkedinHandle}`,
      icon: Linkedin,
      iconClass: 'text-[#0A66C2]'
    });
  }

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
          className="relative z-50 w-full max-w-md sm:max-w-lg bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Kiosk Header */}
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <Users className="w-4 h-4 text-signal" />
              <span>[ CLUB PROFILE ]</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all active:translate-y-[1px] focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Banner Image */}
            <div className="h-32 sm:h-40 w-full overflow-hidden border-b-2 border-ink relative bg-paper">
              <img
                src={club.banner_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'}
                alt={club.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800';
                }}
              />
              <span className="absolute top-2 right-2 bg-ink text-paper text-[9px] font-bold px-2 py-0.5 border border-paper uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-confirm" />
                OFFICIAL CLUB
              </span>
            </div>

            {/* Club Identity Header */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-start gap-3">
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="w-14 h-14 rounded-full border-2 border-ink bg-paper object-cover shrink-0 shadow-hard -mt-10 relative z-10"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl sm:text-3xl font-display text-ink uppercase tracking-tight leading-none">
                      {club.name}
                    </h3>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-signal text-ink border border-ink px-1.5 py-0.2 rounded-xs shrink-0">
                      {club.category || 'COMMUNITY'}
                    </span>
                  </div>
                  {club.lead_name && (
                    <p className="text-[11px] text-muted mt-1 uppercase font-bold">
                      COORDINATOR: <span className="text-ink">{club.lead_name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Perforation */}
            <div className="mx-4 my-2 ticket-perforation">
              <div className="ticket-notch-left" />
              <div className="ticket-notch-right" />
            </div>

            {/* About Section */}
            <div className="px-4 py-2 space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">
                [ ABOUT THE CLUB ]
              </span>
              <p className="text-xs text-ink leading-relaxed bg-paper border border-ink/15 rounded-xs p-3">
                {club.description}
              </p>
            </div>

            {/* Social & Connect Strip */}
            <div className="px-4 py-2 space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">
                [ OFFICIAL CHANNELS ]
              </span>
              <div className="grid grid-cols-2 gap-2">
                {socialLinks.length > 0 ? (
                  socialLinks.map((link) => (
                    <a
                      key={link.type}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2 bg-paper border-2 border-ink rounded-xs text-xs font-bold text-ink hover:bg-ink hover:text-paper active:translate-y-[1px] transition-all"
                    >
                      <link.icon className={`w-3.5 h-3.5 ${link.iconClass}`} />
                      <span className="truncate">{link.label}</span>
                    </a>
                  ))
                ) : (
                  <div className="col-span-2 flex items-center justify-center gap-1 p-2 bg-paper/50 border border-ink/20 rounded-xs text-[11px] text-muted">
                    <span>CAMPUS ONLY (NO SOCIALS)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Events by this Club */}
            <div className="px-4 pt-2 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  [ ACTIVE EVENTS ({clubEvents.length}) ]
                </span>
              </div>

              {clubEvents.length === 0 ? (
                <div className="p-4 text-center bg-paper/50 border border-dashed border-ink/30 rounded-xs">
                  <p className="text-xs text-muted font-bold uppercase">— No active events hosted right now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clubEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => {
                        onClose();
                        if (onSelectEvent) onSelectEvent(evt);
                      }}
                      className="p-3 bg-card border-2 border-ink shadow-hard rounded-xs hover:bg-paper cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="font-display text-lg uppercase text-ink group-hover:text-signal transition-colors truncate">
                          {evt.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                          <Calendar className="w-3 h-3 text-signal shrink-0" />
                          <span>
                            {new Date(evt.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="truncate">{evt.building_name || 'Campus'}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold bg-signal text-ink border border-ink px-1.5 py-0.5 rounded-xs shrink-0 uppercase">
                        VIEW PASS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-paper border-t-2 border-ink p-3 shrink-0 flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
              CAMPUS DIRECTORY • ITER
            </span>
            <button
              onClick={onClose}
              className="text-xs font-bold border-2 border-ink px-3 py-1 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ClubCardModal;
