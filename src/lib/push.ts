// Branded push notifications (mock). Shows a real system notification with the APEX icon when the
// browser allows it, plus an in-app branded banner. Phase 1 swaps this for Firebase Cloud Messaging.
import { BRAND } from '@/config/brand';

type Banner = { id: number; title: string; body: string };
const listeners = new Set<(b: Banner) => void>();

export function onPush(l: (b: Banner) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function notifyPush(title: string, body: string) {
  listeners.forEach((l) => l({ id: Date.now() + Math.random(), title, body }));
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
      new Notification(`${BRAND.appName}: ${title}`, { body, icon: BRAND.icon, badge: BRAND.icon });
    }
  } catch {
    /* not supported */
  }
}

export async function askPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}
