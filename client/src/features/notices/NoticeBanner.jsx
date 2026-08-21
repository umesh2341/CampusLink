import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

function NoticeBanner({ notices, onOpenNotices, onClose }) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!notices || notices.length === 0) return;

    if (isHovered) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notices, isHovered, onClose]);

  if (!notices || notices.length === 0) return null;

  const notice = notices[0];

  const handleClick = () => {
    if (notice.document_url) {
      window.open(notice.document_url, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="notice-banner"
        className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 font-mono pointer-events-auto cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="bg-card border-2 border-ink shadow-hard-lg rounded-xs p-4 space-y-3 relative hover:bg-paper transition-colors">
          
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-ink/20 pb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 text-signal shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink truncate">
                {notice.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {notices.length > 1 && (
                <span className="font-mono text-[9px] font-bold bg-signal text-ink px-1.5 py-0.5 rounded-xs border border-ink">
                  1 OF {notices.length}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Dismiss Notice"
                className="p-1 text-ink/60 hover:text-ink transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-ink/90 leading-relaxed line-clamp-2">
            {notice.body}
          </p>

          {notice.document_url && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-signal tracking-widest uppercase">
                [ CLICK TO VIEW PDF ]
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NoticeBanner;
