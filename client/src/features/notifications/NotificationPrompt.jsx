import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';
import { subscribeUserToPush } from '../../shared/lib/pushNotifications';

const DISMISS_KEY = 'campuslink_push_prompt_dismissed';
const DISMISS_DAYS = 7;

function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    // Check if push notifications are supported and permission is pending
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    if (Notification.permission !== 'default') return;

    // Check localStorage dismissal flag
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysDiff = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysDiff < DISMISS_DAYS) return;
    }

    // Delay prompt by 4 seconds after meaningful visit
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      await subscribeUserToPush();
      setStatusMsg('SUBSCRIBED TO CAMPUS ALERTS!');
      setTimeout(() => setIsVisible(false), 2000);
    } catch (err) {
      console.error('Push Subscription Error:', err);
      if (err.message.includes('denied')) {
        setStatusMsg('NOTIFICATION PERMISSION DENIED IN BROWSER.');
      } else {
        setStatusMsg('SUBSCRIPTION FAILED. PLEASE TRY AGAIN.');
      }
      setTimeout(() => setStatusMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 font-mono animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border-2 border-ink shadow-hard-lg rounded-xs p-4 space-y-3 relative">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-ink/20 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
            <Bell className="w-4 h-4 text-signal shrink-0" />
            <span>[ CAMPUS NOTIFICATIONS ]</span>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss prompt"
            className="p-1 text-ink/60 hover:text-ink transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-ink/90 leading-relaxed">
          Enable push alerts for new campus events, hackathons, and announcements directly on your device.
        </p>

        {/* Status Feedback */}
        {statusMsg && (
          <div className="text-[11px] font-bold text-signal bg-signal/10 border border-ink p-2 rounded-xs">
            — {statusMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex-1 bg-signal text-ink font-bold text-xs uppercase tracking-wider py-2.5 px-3 border-2 border-ink shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? 'CONNECTING…' : 'ENABLE ALERTS'}
          </button>
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="bg-paper text-ink font-bold text-xs uppercase tracking-wider py-2.5 px-3 border-2 border-ink hover:bg-ink hover:text-paper transition-all"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPrompt;
