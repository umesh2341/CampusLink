import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Check, Loader2, ShieldCheck } from 'lucide-react';
import { subscribeUserToPush } from '../../shared/lib/pushNotifications';
import { API_BASE } from '../../shared/lib/api';
import { useAuth } from '../../shared/context/AuthContext';

const ALL_TAGS = [
  { id: 'hackathon', label: 'Hackathon' },
  { id: 'tech_event', label: 'Tech Event' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'cultural_event', label: 'Cultural Event' },
  { id: 'college_official', label: 'College Official' },
];

function NotificationPreferencesModal({ isOpen, onClose }) {
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [enabledTags, setEnabledTags] = useState(['hackathon', 'tech_event', 'workshop', 'cultural_event', 'college_official']);
  const [mutedClubIds, setMutedClubIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    checkSubscriptionAndLoad();
  }, [isOpen]);

  const checkSubscriptionAndLoad = async () => {
    setLoadingSub(true);
    try {
      // Fetch clubs list first
      const clubsRes = await fetch(`${API_BASE}/api/clubs`);
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        setClubs(clubsData);
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window) || Notification.permission !== 'granted') {
        setSubscription(null);
        setLoadingSub(false);
        return;
      }

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 5000))
      ]).catch(() => null);

      if (!registration) {
        setSubscription(null);
        setLoadingSub(false);
        return;
      }
      
      const sub = await registration.pushManager.getSubscription();

      if (!sub) {
        setSubscription(null);
        setLoadingSub(false);
        return;
      }

      setSubscription(sub);

      // Fetch saved preferences from backend
      const prefRes = await fetch(`${API_BASE}/api/push/preferences?endpoint=${encodeURIComponent(sub.endpoint)}`);
      if (prefRes.ok) {
        const prefData = await prefRes.json();
        if (Array.isArray(prefData.enabled_tags)) setEnabledTags(prefData.enabled_tags);
        if (Array.isArray(prefData.muted_club_ids)) setMutedClubIds(prefData.muted_club_ids);
      }
    } catch (err) {
      console.error('Error loading push preferences:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleEnablePush = async () => {
    setSubscribing(true);
    try {
      await subscribeUserToPush(user?.id);
      await checkSubscriptionAndLoad();
    } catch (err) {
      console.error('Enable Push Error:', err);
      alert('Could not enable notifications. Please check browser permission settings.');
    } finally {
      setSubscribing(false);
    }
  };

  const toggleTag = (tagId) => {
    const next = enabledTags.includes(tagId)
      ? enabledTags.filter(t => t !== tagId)
      : [...enabledTags, tagId];
    setEnabledTags(next);
    savePreferences(next, mutedClubIds);
  };

  const toggleClub = (clubId) => {
    const nextMuted = mutedClubIds.includes(clubId)
      ? mutedClubIds.filter(id => id !== clubId)
      : [...mutedClubIds, clubId];
    setMutedClubIds(nextMuted);
    savePreferences(enabledTags, nextMuted);
  };

  const savePreferences = async (tags, mutedClubs) => {
    if (!subscription) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/push/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          enabled_tags: tags,
          muted_club_ids: mutedClubs,
        }),
      });

      if (res.ok) {
        setSaveMessage('SAVED!');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          {/* Backdrop */}
          <motion.div
            key="np-backdrop"
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal Dialog */}
          <motion.div
            key="np-modal"
            className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-5 w-full max-w-md relative z-50 space-y-4 max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'tween', duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-ink pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-signal" />
            <h3 className="text-2xl font-display uppercase tracking-tight text-ink">[ NOTIFICATIONS ]</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-xs border-2 border-ink bg-paper text-ink hover:bg-ink hover:text-paper transition-all active:translate-y-[1px] focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">

          {loadingSub ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-2 text-xs text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-signal" />
              <span>READING PREFERENCES…</span>
            </div>
          ) : !subscription ? (
            /* State: Push Notifications Disabled */
            <div className="p-6 border-2 border-dashed border-ink/30 rounded-xs bg-paper text-center space-y-4">
              <div className="w-12 h-12 bg-signal/20 border-2 border-ink flex items-center justify-center rounded-xs mx-auto">
                <BellOff className="w-6 h-6 text-signal" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink uppercase tracking-tight">[ ALERTS DISABLED ]</h4>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Enable push notifications to customize event tags and club subscription preferences.
                </p>
              </div>
              <button
                onClick={handleEnablePush}
                disabled={subscribing}
                className="w-full bg-signal text-ink font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xs border-2 border-ink shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
              >
                {subscribing ? 'CONNECTING…' : 'ENABLE NOTIFICATIONS'}
              </button>
            </div>
          ) : (
            /* State: Push Notifications Enabled & Configurable */
            <>
              {/* Status Header */}
              <div className="bg-paper border-2 border-ink p-2.5 rounded-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-ink uppercase">
                  <ShieldCheck className="w-4 h-4 text-confirm" />
                  <span>ALERTS ACTIVE</span>
                </div>
                {saveMessage ? (
                  <span className="font-bold text-signal text-[10px] uppercase animate-pulse">{saveMessage}</span>
                ) : saving ? (
                  <span className="text-[10px] text-muted uppercase">SAVING…</span>
                ) : (
                  <span className="text-[10px] text-muted uppercase">AUTO-SAVED</span>
                )}
              </div>

              {/* Section 1: Event Types (Tags) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-muted border-b border-ink/20 pb-1">
                  <span>[ Event Types ]</span>
                  <span>{enabledTags.length}/{ALL_TAGS.length} ENABLED</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {ALL_TAGS.map(tag => {
                    const isChecked = enabledTags.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`p-2.5 rounded-xs border-2 border-ink flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'bg-card' : 'bg-paper opacity-60'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase text-ink">{tag.label}</span>
                        <div
                          className={`w-5 h-5 border-2 border-ink rounded-xs flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-signal text-ink' : 'bg-paper'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Campus Clubs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-muted border-b border-ink/20 pb-1">
                  <span>[ Subscribed Clubs ]</span>
                  <span>{clubs.length - mutedClubIds.length}/{clubs.length} ACTIVE</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {clubs.map(club => {
                    const isSubscribed = !mutedClubIds.includes(club.id);
                    return (
                      <div
                        key={club.id}
                        onClick={() => toggleClub(club.id)}
                        className={`p-2.5 rounded-xs border-2 border-ink flex items-center justify-between cursor-pointer transition-all ${
                          isSubscribed ? 'bg-card' : 'bg-paper opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {club.logo_url ? (
                            <img
                              src={club.logo_url}
                              alt={club.name}
                              className="w-7 h-7 rounded-full border border-ink object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full border border-ink bg-ink text-paper flex items-center justify-center font-display text-xs font-bold">
                              {club.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-bold uppercase text-ink">{club.name}</span>
                        </div>

                        <div
                          className={`w-5 h-5 border-2 border-ink rounded-xs flex items-center justify-center transition-colors ${
                            isSubscribed ? 'bg-signal text-ink' : 'bg-paper'
                          }`}
                        >
                          {isSubscribed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="border-t-2 border-ink pt-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-paper text-ink font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xs border-2 border-ink hover:bg-ink hover:text-paper transition-all focus:outline-none"
          >
            CLOSE PREFERENCES
          </button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}

export default NotificationPreferencesModal;
