import { registerSW } from 'virtual:pwa-register';
import { writable } from 'svelte/store';

export const updateAvailable = writable(false);
export const offlineReady = writable(false);

export function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // With autoUpdate the SW already activated; reload to pick up new assets.
      updateAvailable.set(true);
    },
    onOfflineReady() {
      offlineReady.set(true);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      let lastCheckAt = 0;
      const MIN_GAP_MS = 30 * 1000;
      const PERIODIC_MS = 15 * 60 * 1000;

      const checkForUpdate = () => {
        if (!navigator.onLine) return;
        const now = Date.now();
        if (now - lastCheckAt < MIN_GAP_MS) return;
        lastCheckAt = now;
        registration.update().catch(() => {});
      };

      // Initial + delayed check to catch fresh deploys soon after startup.
      checkForUpdate();
      setTimeout(checkForUpdate, 5000);

      // Safari/iOS can pause long timers/background tasks; check again on resume/focus/online.
      window.addEventListener('pageshow', checkForUpdate);
      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('online', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });

      setInterval(checkForUpdate, PERIODIC_MS);
    }
  });
}

export function applyUpdate() {
  window.location.reload();
}
