import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const FUNNY_PHRASES = [
  "> Waking up the campus hamsters...",
  "> Finding the best route to the canteen...",
  "> Negotiating with the Wi-Fi router...",
  "> Locating hidden parking spots...",
  "> Warming up the caffeine machines...",
  "> Bribing the security guards...",
  "> Calibrating the attendance proxy...",
  "> Generating infinite loop of assignments..."
];

/**
 * TerminalBootScreen Component
 * Full-screen loading overlay styled as a terminal / wayfinding kiosk.
 * Displays real-time prefetch progress for baseline datasets before fading out.
 */
export function TerminalBootScreen({ bootLogs = [], statusText = 'BOOTING SYSTEM...', isComplete = false }) {
  const [text, setText] = useState('> ');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);

  useEffect(() => {
    let ticker = setTimeout(() => {
      handleTyping();
    }, typingSpeed);

    return () => clearTimeout(ticker);
  }, [text, isDeleting, isComplete]);

  const handleTyping = () => {
    if (isComplete) return; // Stop animating if done
    const i = loopNum % FUNNY_PHRASES.length;
    const fullText = FUNNY_PHRASES[i];

    setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1));
    setTypingSpeed(isDeleting ? 20 : 50);

    if (!isDeleting && text === fullText) {
      setTypingSpeed(1000); // Pause at end of phrase
      setIsDeleting(true);
    } else if (isDeleting && text === '> ') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setTypingSpeed(300); // Pause before typing next
    }
  };

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
            CAMPUSLINK
          </span>
        </div>

        {/* Boot Logs */}
        <div className="font-display text-lg sm:text-xl space-y-1 text-ink/90 leading-snug">

          {/* Typing Animation */}
          <div className="h-8 flex items-center tracking-wide">
            <span>{text}</span>
            <span className="inline-block w-2.5 h-5 bg-ink animate-pulse ml-1" />
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
