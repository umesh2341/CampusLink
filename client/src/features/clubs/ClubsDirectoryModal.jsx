import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, ChevronRight, Sparkles, Filter } from 'lucide-react';

const CATEGORIES = ['ALL', 'TECHNICAL', 'CULTURAL', 'SPORTS', 'LITERARY', 'OFFICIAL'];

function ClubsDirectoryModal({ isOpen, onClose, clubs = [], activeEvents = [], onSelectClub, isLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Compute active event counts per club (by id preferred, fallback to name match)
  const clubEventCounts = useMemo(() => {
    const countById = {};
    const countByName = {};
    activeEvents.forEach((evt) => {
      if (evt.club_id) {
        countById[evt.club_id] = (countById[evt.club_id] || 0) + 1;
      } else if (evt.organizing_club) {
        const key = evt.organizing_club.toLowerCase();
        countByName[key] = (countByName[key] || 0) + 1;
      }
    });
    return { byId: countById, byName: countByName };
  }, [activeEvents]);

  // Filter clubs by category and search text
  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        (c.category && c.category.toUpperCase() === selectedCategory.toUpperCase());
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [clubs, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-md sm:max-w-xl bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col h-full max-h-full overflow-hidden"
        >
          {/* Kiosk Header */}
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <Users className="w-4 h-4 text-signal" />
              <span>[ CAMPUS CLUBS DIRECTORY ]</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all active:translate-y-[1px] focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3 bg-paper border-b-2 border-ink space-y-2.5 shrink-0">
            {/* Search Input */}
            <div className="bg-card border-2 border-ink shadow-hard flex items-center px-2.5 py-1.5 rounded-xs focus-within:bg-paper transition-colors">
              <Search className="w-3.5 h-3.5 text-muted mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH CLUBS OR ACTIVITIES..."
                className="w-full text-xs bg-transparent border-none outline-none text-ink placeholder:text-muted uppercase"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-muted hover:text-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-xs border-2 uppercase transition-all whitespace-nowrap active:translate-y-[1px] ${
                      isActive
                        ? 'bg-signal text-ink border-ink shadow-hard'
                        : 'bg-card text-muted border-ink/40 hover:border-ink hover:text-ink'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Body / Grid */}
          <div className="flex-1 overflow-y-auto bg-grain p-4 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-signal">
                <span className="font-mono text-sm font-bold tracking-widest uppercase animate-pulse">
                  [ LOADING CLUBS... ]
                </span>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="p-8 text-center bg-card border-2 border-ink rounded-xs space-y-1">
                <p className="font-display text-xl uppercase text-ink">— NO CLUBS FOUND —</p>
                <p className="text-xs text-muted">
                  No clubs match "{searchQuery}" in {selectedCategory}.
                </p>
              </div>
            ) : (
              filteredClubs.map((club) => {
                const activeCount =
                  (clubEventCounts.byId[club.id] || 0) +
                  (clubEventCounts.byName[club.name.toLowerCase()] || 0);

                return (
                  <motion.div
                    key={club.id || club.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectClub(club)}
                    className="p-3 bg-card border-2 border-ink shadow-hard hover:shadow-hard-lg rounded-xs cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <img
                        src={club.logo_url}
                        alt={club.name}
                        className="w-11 h-11 rounded-xs border-2 border-ink bg-paper object-cover shrink-0"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display text-lg uppercase text-ink group-hover:text-signal transition-colors truncate leading-tight">
                            {club.name}
                          </h4>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-paper text-muted border border-ink/40 rounded-xs">
                            {club.category || 'COMMUNITY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                          {club.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      {activeCount > 0 && (
                        <span className="text-[9px] font-bold bg-signal text-ink border border-ink px-1.5 py-0.5 rounded-xs animate-pulse">
                          {activeCount} EVENT{activeCount !== 1 ? 'S' : ''}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Info Strip */}
          <div className="bg-paper border-t-2 border-ink px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
              TOTAL CLUBS: {clubs.length}
            </span>
            <button
              onClick={onClose}
              className="text-xs font-bold border-2 border-ink px-3 py-1 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]"
            >
              DONE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ClubsDirectoryModal;
