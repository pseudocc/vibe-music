# Vibe Music

An offline-first PWA MP3 player built with Svelte. Upload local audio files; they're stored in your browser (IndexedDB) so the app works fully offline after the first load.

## Features

- 🎵 Play MP3 / M4A / OGG / WAV / FLAC / AAC files locally
- 📂 Library + custom playlists, drag-and-drop management, drag-to-bin removal
- 💾 Files persisted in IndexedDB (large-file safe; localStorage holds settings)
- ⏱  Remembers last playlist, last track, and exact playback position
- 🎚  Per-decile vertical volume bar with continuous drag
- 🔁 Loop / Repeat-one / Shuffle modes
- ⌨️  Keyboard shortcuts (Space, ←/→ ±5s, ↑/↓ ±10% vol, PgUp/PgDn) and matching swipe gestures on phones
- 📴 Full offline support via service worker (Workbox)
- 🔄 Auto-updates on new builds
- 📱 Installable as a PWA on iOS / Android / desktop

## Develop

```sh
npm install
npm run icons   # one-off: generate PNG icons from public/favicon.svg
npm run dev     # HTTPS dev server (mkcert) on the LAN
```

## Build

```sh
npm run build
npm run preview   # HTTPS preview on the LAN
```

## Installing on your phone

1. Phone must be on the same network as the dev machine.
2. Run `npm run preview` and note the `Network:` URL (e.g. `https://192.168.x.x:4173`).
3. On first connect, the phone will warn about an unknown certificate (mkcert is only trusted on the dev machine). Accept it — service workers and storage need HTTPS, but the cert authority can still be self-signed.
4. **iOS**: open in Safari → Share → *Add to Home Screen*.
   **Android (Chrome)**: address-bar menu → *Install app*.

For a "trusted" cert on the phone, install the mkcert root CA on the device, or front the app with a reverse proxy that has a real Let's Encrypt cert. Any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages) also works — `dist/` is fully static.

## Architecture

- `src/lib/db.js` — IndexedDB wrapper for track Blobs
- `src/lib/store.js` — Svelte stores; settings & playlists in `localStorage`
- `src/lib/pwa.js` — Service worker registration + periodic update checks
- `src/lib/uuid.js` — Secure-context-safe UUID v4 (works over HTTP-only LAN too)
- `src/lib/drag.js` — Shared drag payload helpers
- `src/components/` — Player, Uploader, TrackList, PlaylistSidebar, TrashBin, Modal, UpdateBanner
- `scripts/generate-icons.js` — Generates the PWA PNG icons from `public/favicon.svg`

The service worker precaches the app shell with `navigateFallback: 'index.html'`, so the app loads when the server is unreachable. Update checks fail silently when offline.
