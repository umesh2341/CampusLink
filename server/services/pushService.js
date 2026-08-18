import webpush from 'web-push';
import pool from '../db/pool.js';

// Safely initialize webpush to prevent startup crashes if keys are malformed
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@campuslink.iter.ac.in',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (error) {
    console.error('Failed to initialize web-push VAPID details:', error.message);
  }
}

export const dispatchEventPushNotification = async (event) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Skipping push notification dispatch.');
    return;
  }

  try {
    // 1. Get organizing club info
    let clubLogo = null;
    let clubName = event.organizing_club || 'Campus Club';
    
    // Fix: organizing_club in events table stores the club NAME (text), not the ID (uuid)
    if (event.organizing_club) {
      const { rows: clubRows } = await pool.query('SELECT logo_url FROM clubs WHERE name = $1', [event.organizing_club]);
      if (clubRows.length > 0) clubLogo = clubRows[0].logo_url;
    }

    // 2. Query subscriptions joined with preferences
    const subsQuery = `
      SELECT ps.id AS sub_id, ps.endpoint, ps.p256dh_key, ps.auth_key, 
             sp.muted_club_ids, sp.enabled_tags
      FROM push_subscriptions ps
      LEFT JOIN subscription_preferences sp ON ps.id = sp.subscription_id;
    `;
    const { rows: subscriptions } = await pool.query(subsQuery);

    const eventTags = Array.isArray(event.tags) ? event.tags : [];

    // 3. Filter subscriptions
    const matchingSubs = subscriptions.filter((sub) => {
      // If there are no preferences, send it
      if (!sub.muted_club_ids && !sub.enabled_tags) return true;

      const isMuted = Array.isArray(sub.muted_club_ids) && sub.muted_club_ids.includes(event.organizing_club);
      if (isMuted) return false;

      // If user enabled any of the event's tags, send it
      if (Array.isArray(sub.enabled_tags) && sub.enabled_tags.length > 0) {
        if (eventTags.length === 0) return true; // Event has no tags, allow by default if club not muted
        const hasMatchingTag = eventTags.some(tag => sub.enabled_tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    if (matchingSubs.length === 0) return;

    // 4. Construct payload
    const formattedTagsText = eventTags.length > 0 
      ? eventTags.map(t => t.replace('_', ' ').toUpperCase()).join(' | ') 
      : '';

    const payload = JSON.stringify({
      title: event.title,
      body: `Organized by ${clubName}${formattedTagsText ? ` • ${formattedTagsText}` : ''}`,
      icon: clubLogo || '/icon-192x192.png',
      data: {
        url: `/?event_id=${event.id}`
      }
    });

    // 5. Send push notifications concurrently & clean up expired endpoints
    const pushPromises = matchingSubs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Cleaning up expired push endpoint: ${sub.endpoint}`);
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        } else {
          console.error(`Push notification failed for endpoint ${sub.endpoint}:`, err.message);
        }
      }
    });

    await Promise.allSettled(pushPromises);
  } catch (error) {
    console.error('Error dispatching push notifications:', error);
  }
};
