import React from 'react';
import { AlertCircle, X } from 'lucide-react';

function NoticeBanner({ notices, onOpenNotices, onClose }) {
  if (!notices || notices.length === 0) return null;

  const notice = notices[0];

  return (
    <div className="bg-signal text-ink border-b-2 border-ink px-4 py-2 flex items-center justify-between cursor-pointer select-none">
      <div 
        className="flex items-center gap-2 flex-1 min-w-0" 
        onClick={onOpenNotices}
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="font-mono text-[10px] font-bold uppercase truncate">
          {notice.title}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {notices.length > 1 && (
          <span className="font-mono text-[9px] font-bold bg-ink text-paper px-1.5 py-0.5 rounded-xs" onClick={onOpenNotices}>
            1 OF {notices.length}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Dismiss Notice"
          className="p-1 rounded-xs hover:bg-ink hover:text-paper transition-all focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default NoticeBanner;
