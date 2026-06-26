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
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    }
  });
}

export function applyUpdate() {
  window.location.reload();
}
