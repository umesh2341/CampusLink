import React from 'react';
import { motion } from 'framer-motion';

/**
 * TerminalBootScreen Component
 * Full-screen loading overlay styled as a terminal / wayfinding kiosk.
 * Displays real-time prefetch progress for baseline datasets before fading out.
 */
export function TerminalBootScreen({ bootLogs = [], statusText = 'BOOTING SYSTEM...', isComplete = false }) {
  return (
    <motion.div
      key="boot-splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: 'easeOut' } }}
      className="fixed inset-0 z-[9999] bg-paper text-ink flex flex-col items-center justify-center p-4 sm:p-6 font-mono select-none overflow-hidden bg-grain"
    >
      <div className="w-full max-w-lg bg-paper border-2 border-ink shadow-hard-xl rounded-sm p-4 sm:p-6 flex flex-col space-y-4">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b-2 border-ink pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-signal rounded-full inline-block border border-ink" />
            <span className="w-3 h-3 bg-confirm rounded-full inline-block border border-ink" />
            <span className="w-3 h-3 bg-ink/30 rounded-full inline-block border border-ink" />
          </div>
          <span className="font-display text-sm tracking-wider uppercase font-bold text-ink/80">
            ITER CAMPUSLINK v1.0
          </span>
        </div>

        {/* Boot Logs */}
        <div className="font-display text-lg sm:text-xl space-y-1 text-ink/90 leading-snug">
          <div className="text-muted tracking-wider uppercase font-bold">
            [ SYSTEM BOOT : ITER CAMPUSLINK v1.0 ]
          </div>
          <div className="border-b border-dashed border-ink/40 my-2" />

          {bootLogs.map((log, index) => (
            <div key={log.id || index} className="flex justify-between items-center tracking-wide">
              <span>{log.label}</span>
              <span className="font-bold ml-2">
                {log.status === 'PENDING' && <span className="text-signal animate-pulse">[ LOADING ]</span>}
                {log.status === 'OK' && <span className="text-confirm">[ OK ]</span>}
                {log.status === 'FAIL' && <span className="text-signal">[ WARN ]</span>}
              </span>
            </div>
          ))}

          <div className="border-b border-dashed border-ink/40 my-2" />
          
          {/* Status Line */}
          <div className="pt-1 flex items-center justify-between">
            <span className="font-bold tracking-wider text-ink uppercase">
              STATUS: {statusText}
            </span>
            {isComplete && (
              <span className="inline-block w-2.5 h-4 bg-ink animate-pulse ml-1" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-paper border border-ink h-2.5 rounded-xs overflow-hidden mt-2 p-[1px]">
          <motion.div
            className="h-full bg-ink rounded-xs"
            initial={{ width: '5%' }}
            animate={{
              width: isComplete
                ? '100%'
                : `${Math.max(10, (bootLogs.filter((l) => l.status !== 'PENDING').length / Math.max(1, bootLogs.length)) * 90)}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default TerminalBootScreen;
