import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

function NoticeBoardModal({ isOpen, onClose, notices = [] }) {
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-grain">
            {notices.length === 0 ? (
              <p className="text-xs text-muted text-center py-8 font-bold uppercase">
                — NO ACTIVE NOTICES —
              </p>
            ) : (
              notices.map((notice) => {
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
              OFFICIAL ANNOUNCEMENTS
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
