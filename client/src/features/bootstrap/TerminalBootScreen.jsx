import React from 'react';
import { motion } from 'framer-motion';

/**
 * TerminalBootScreen Component
 * Full-screen loading overlay styled as a terminal / wayfinding kiosk.
 * Displays real-time telemetry prefetch progress for campus baseline datasets.
 */
export function TerminalBootScreen({ bootLogs = [], statusText = 'BOOTING KIOSK...', isComplete = false }) {
  const completedCount = bootLogs.filter((l) => l.status === 'OK').length;
  const progressPercent = isComplete
    ? 100
    : Math.max(15, Math.round((completedCount / Math.max(1, bootLogs.length)) * 100));

  return (
    <motion.div
      key="boot-splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: 'easeOut' } }}
      className="fixed inset-0 z-[9999] bg-paper text-ink flex flex-col items-center justify-center p-4 sm:p-6 font-mono select-none overflow-hidden bg-grain"
    >
      <div className="w-full max-w-xl bg-paper border-2 border-ink shadow-hard-xl rounded-sm p-4 sm:p-6 flex flex-col space-y-3 font-mono">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-signal rounded-full inline-block border border-ink" />
            <span className="w-3 h-3 bg-confirm rounded-full inline-block border border-ink" />
            <span className="w-3 h-3 bg-ink/30 rounded-full inline-block border border-ink" />
          </div>
          <span className="font-mono text-xs sm:text-sm tracking-wider uppercase font-bold text-ink">
            [ INITIALIZING ITER CAMPUSLINK TERMINAL v1.0 ]
          </span>
        </div>

        {/* Divider */}
        <div className="text-ink/40 text-xs sm:text-sm tracking-tighter leading-none select-none font-mono">
          ------------------------------------------------
        </div>

        {/* Telemetry Logs */}
        <div className="space-y-1.5 py-1 font-mono text-xs sm:text-sm text-ink leading-tight">
          {bootLogs.map((log) => {
            const isOk = log.status === 'OK';
            const isFail = log.status === 'FAIL';
            const statusTag = isOk ? '[ OK ]' : isFail ? '[ FAIL ]' : '[ ... ]';
            const statusColor = isOk
              ? 'text-confirm font-bold'
              : isFail
              ? 'text-red-600 font-bold'
              : 'text-amber-600 animate-pulse';

            return (
              <div key={log.id} className="flex items-center justify-between tracking-tight">
                <span className="truncate pr-2">{log.label}</span>
                <span className={`shrink-0 ${statusColor}`}>{statusTag}</span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="text-ink/40 text-xs sm:text-sm tracking-tighter leading-none select-none font-mono">
          ------------------------------------------------
        </div>

        {/* Status Line */}
        <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink flex items-center justify-between pt-0.5">
          <span className="truncate">
            STATUS: {isComplete || completedCount === bootLogs.length ? 'ALL SYSTEMS NOMINAL. LAUNCHING KIOSK...' : statusText}
          </span>
          <span className="inline-block w-2 h-4 bg-ink animate-pulse ml-2 shrink-0" />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-paper border-2 border-ink h-3 rounded-xs overflow-hidden mt-1 p-[1px]">
          <motion.div
            className="h-full bg-ink rounded-xs"
            initial={{ width: '15%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default TerminalBootScreen;
