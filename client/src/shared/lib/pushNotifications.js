import { API_BASE } from './api';

/**
 * Helper to convert a Base64 VAPID key to a Uint8Array for PushManager
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register Service Worker and Subscribe to Push Notifications
 */
export async function subscribeUserToPush(userId = null) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push messaging is not supported in this browser.');
  }

  // Request native browser permission if not already granted
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied by user.');
  }

  // Wait for the service worker with a timeout so it doesn't hang forever
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker registration timed out. Ensure you are on a trusted origin (localhost or HTTPS).')), 5000))
  ]);

  // Fetch VAPID public key from backend
  const keyRes = await fetch(`${API_BASE}/api/push/vapid-public-key`);
  if (!keyRes.ok) {
    throw new Error('Failed to fetch VAPID public key from server.');
  }
  const { publicKey } = await keyRes.json();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  // Subscribe using PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const subJson = subscription.toJSON();

  // Post subscription payload to backend
  const res = await fetch(`${API_BASE}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      userId,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to save push subscription on server.');
  }

  return await res.json();
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const subJson = subscription.toJSON();
    await fetch(`${API_BASE}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subJson.endpoint }),
    });
    await subscription.unsubscribe();
  }
}
