import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-signal text-ink border-2 border-ink shadow-hard rounded-xs p-3 font-mono flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest leading-tight">
                Update Available
              </p>
              <p className="text-[10px] uppercase font-bold opacity-80 mt-0.5">
                New features & fixes ready!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => updateServiceWorker(true)}
              className="text-[10px] font-bold bg-ink text-paper px-2 py-1.5 rounded-xs uppercase tracking-wider hover:bg-card hover:text-ink border-2 border-transparent hover:border-ink transition-colors active:translate-y-[1px]"
            >
              Refresh
            </button>
            <button
              onClick={close}
              className="p-1 hover:bg-ink/10 rounded-xs transition-colors active:translate-y-[1px]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
