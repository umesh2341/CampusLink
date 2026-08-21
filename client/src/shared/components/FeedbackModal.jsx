import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, CheckCircle2, Star } from 'lucide-react';

function FeedbackModal({ isOpen, onClose }) {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <div key="feedback-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 font-mono select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-md bg-card border-2 border-ink shadow-hard-xl rounded-xs flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <MessageSquare className="w-4 h-4 text-signal" />
              <span>[ STUDENT FEEDBACK ]</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all active:translate-y-[1px] focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {isSubmitted ? (
            <div className="p-8 text-center space-y-3 bg-paper">
              <CheckCircle2 className="w-12 h-12 text-confirm mx-auto animate-bounce" />
              <h4 className="font-display text-2xl uppercase text-ink">
                [ TRANSMISSION RECEIVED ]
              </h4>
              <p className="text-xs text-muted">
                Thank you for helping us improve CampusLink for ITER students.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 bg-paper">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                  — FEEDBACK CATEGORY
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bug', label: 'BUG REPORT' },
                    { id: 'feature', label: 'SUGGESTION' },
                    { id: 'map', label: 'MAP CORRECTION' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFeedbackType(t.id)}
                      className={`text-[10px] font-bold py-1.5 px-2 rounded-xs border-2 uppercase transition-all ${
                        feedbackType === t.id
                          ? 'bg-signal text-ink border-ink shadow-hard'
                          : 'bg-card text-muted border-ink/40 hover:border-ink hover:text-ink'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                  — YOUR REMARKS
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue, incorrect room number, or feature idea..."
                  required
                  className="w-full text-xs p-2.5 bg-card border-2 border-ink rounded-xs outline-none text-ink placeholder:text-muted/60 focus:bg-paper transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-ink/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold border-2 border-ink px-3 py-1.5 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]"
                >
                  CANCEL
                </button>
                <motion.button
                  type="submit"
                  whileTap={{ y: 1 }}
                  className="flex items-center gap-1.5 text-xs font-bold border-2 border-ink px-4 py-1.5 rounded-xs bg-signal text-ink shadow-hard hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>TRANSMIT</span>
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}

export default FeedbackModal;
