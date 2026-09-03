import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Search } from 'lucide-react';

// Alias map: maps natural language phrasings → canonical tag id
const TAG_ALIASES = {
  '1st_year':  ['1st year', 'first year', 'freshman', '1st'],
  '2nd_year':  ['2nd year', 'second year', 'sophomore', '2nd'],
  '3rd_year':  ['3rd year', 'third year', 'junior', '3rd'],
  '4th_year':  ['4th year', 'fourth year', 'senior', '4th', 'final year', 'final'],
  'general':   ['general', 'all', 'everyone'],
};

// Returns true if the search query matches any alias for any tag in the notice's tags array
function matchesByTagAlias(noticeTags, query) {
  if (!noticeTags || noticeTags.length === 0) return false;
  const q = query.toLowerCase().trim();
  for (const [tagId, aliases] of Object.entries(TAG_ALIASES)) {
    if (noticeTags.includes(tagId)) {
      if (aliases.some(alias => alias.includes(q) || q.includes(alias))) return true;
      if (tagId.replace('_', ' ').includes(q)) return true;
    }
  }
  return false;
}

function NoticeBoardModal({ isOpen, onClose, notices = [] }) {
  const [rawQuery, setRawQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef(null);

  // Debounce: update searchQuery 300ms after user stops typing
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(rawQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [rawQuery]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRawQuery('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Client-side filtering — all notices are already loaded
  const filteredNotices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return notices;
    return notices.filter(notice => {
      const inTitle    = notice.title?.toLowerCase().includes(q);
      const inBody     = notice.body?.toLowerCase().includes(q);
      const inCategory = notice.category?.toLowerCase().includes(q);
      const inTagAlias = matchesByTagAlias(notice.tags, q);
      // Also allow direct tag id match (e.g. typing "2nd_year")
      const inTagDirect = notice.tags?.some(tag => tag.toLowerCase().includes(q));
      return inTitle || inBody || inCategory || inTagAlias || inTagDirect;
    });
  }, [notices, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
        <motion.div
          key="noticeboard-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
          onClick={onClose}
        />
        <motion.div
          key="noticeboard-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border-2 border-ink shadow-hard-xl rounded-xs w-full max-w-lg h-full max-h-full relative z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <Bell className="w-4 h-4 text-signal" />
              <span>[ NOTICE BOARD ]</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Toolbar */}
          <div className="p-3 bg-paper border-b-2 border-ink shrink-0">
            <div className="bg-card border-2 border-ink shadow-hard flex items-center px-2.5 py-1.5 rounded-xs focus-within:bg-paper transition-colors">
              <Search className="w-3.5 h-3.5 text-muted mr-2 shrink-0" />
              <input
                type="text"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="SEARCH NOTICES, TAGS, CATEGORY..."
                className="w-full text-xs bg-transparent border-none outline-none text-ink placeholder:text-muted uppercase"
              />
              {rawQuery && (
                <button
                  onClick={() => setRawQuery('')}
                  className="p-0.5 text-muted hover:text-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-grain">
            {filteredNotices.length === 0 ? (
              <div className="p-8 text-center bg-card border-2 border-ink rounded-xs space-y-1">
                <p className="font-display text-xl uppercase text-ink">— NO NOTICES FOUND —</p>
                <p className="text-xs text-muted">
                  {searchQuery
                    ? `No notices match "${searchQuery}"`
                    : '— NO ACTIVE NOTICES —'}
                </p>
              </div>
            ) : (
              filteredNotices.map((notice) => {
                const hasDoc = !!notice.document_url;
                return (
                  <div
                    key={notice.id}
                    onClick={() => hasDoc && window.open(notice.document_url, '_blank')}
                    className={`p-4 bg-paper border-2 border-ink rounded-xs shadow-hard ${
                      hasDoc ? 'cursor-pointer hover:bg-card active:translate-y-[1px] transition-all' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-signal text-ink border border-ink px-1.5 py-0.5 rounded-xs shrink-0">
                        {notice.category}
                      </span>
                      {notice.tags && notice.tags.map(tag => (
                        <span key={tag} className="font-mono text-[9px] font-bold uppercase tracking-wider bg-paper text-ink border border-ink px-1.5 py-0.5 rounded-xs shrink-0 opacity-70">
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted font-bold uppercase truncate ml-auto">
                        {new Date(notice.published_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="font-display text-lg uppercase text-ink leading-tight mb-2 flex items-center justify-between">
                      <span>{notice.title}</span>
                      {hasDoc && (
                        <span className="text-[9px] font-mono tracking-widest text-signal border border-signal px-1 py-0.5 rounded-xs">
                          VIEW PDF
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-ink leading-relaxed">
                      {notice.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer CTA */}
          <div className="bg-paper border-t-2 border-ink p-3 shrink-0 flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
              {searchQuery
                ? `${filteredNotices.length} / ${notices.length} NOTICES`
                : 'OFFICIAL ANNOUNCEMENTS'}
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

export default NoticeBoardModal;
