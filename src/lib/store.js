import { writable, derived, get } from 'svelte/store';
import { addTrack, deleteTrack, getTrackBlob, listTracks } from './db.js';
import { uuid } from './uuid.js';

/** @typedef {import('./db.js').TrackMeta} TrackMeta */

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} name
 * @property {string[]} trackIds
 */

/** @type {import('svelte/store').Writable<TrackMeta[]>} */
export const tracks = writable([]);

/** @type {import('svelte/store').Writable<string | null>} */
export const currentId = writable(null);

/** @type {import('svelte/store').Writable<boolean>} */
export const playing = writable(false);

/** Active playlist id; null === library (all tracks). */
/** @type {import('svelte/store').Writable<string | null>} */
export const activePlaylistId = writable(null);

/** Whether a track is currently being dragged (controls bin visibility). */
/** @type {import('svelte/store').Writable<boolean>} */
export const isDragging = writable(false);

/** @typedef {'loop' | 'loop-one' | 'shuffle'} PlayMode */

/** @type {import('svelte/store').Writable<PlayMode>} */
export const playMode = writable(/** @type {PlayMode} */ ('loop'));

const SETTINGS_KEY = 'vibe-music:settings';
const PLAYLISTS_KEY = 'vibe-music:playlists';

/**
 * @returns {{ lastId: string | null, volume: number, activePlaylistId: string | null, playMode: PlayMode, lastProgress: { id: string, time: number } | null }}
 */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { lastId: null, volume: 1, activePlaylistId: null, playMode: 'loop', lastProgress: null, ...JSON.parse(raw) };
  } catch {}
  return { lastId: null, volume: 1, activePlaylistId: null, playMode: 'loop', lastProgress: null };
}

/** @param {ReturnType<typeof loadSettings>} s */
function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

/** @returns {Playlist[]} */
function loadPlaylists() {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/** @param {Playlist[]} pls */
function savePlaylists(pls) {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(pls));
  } catch {}
}

export const volume = writable(loadSettings().volume);
/** @type {import('svelte/store').Writable<Playlist[]>} */
export const playlists = writable(loadPlaylists());

playMode.set(loadSettings().playMode);

volume.subscribe((v) => saveSettings({ ...loadSettings(), volume: v }));
currentId.subscribe((id) => saveSettings({ ...loadSettings(), lastId: id }));
activePlaylistId.subscribe((id) => saveSettings({ ...loadSettings(), activePlaylistId: id }));
playMode.subscribe((m) => saveSettings({ ...loadSettings(), playMode: m }));
playlists.subscribe((pls) => savePlaylists(pls));

/** Tracks visible in the current view (library or selected playlist). */
export const visibleTracks = derived(
  [tracks, playlists, activePlaylistId],
  ([$tracks, $playlists, $apId]) => {
    if ($apId === null) return $tracks;
    const pl = $playlists.find((p) => p.id === $apId);
    if (!pl) return [];
    const byId = new Map($tracks.map((t) => [t.id, t]));
    return pl.trackIds.map((id) => byId.get(id)).filter(/** @returns {t is TrackMeta} */ (t) => Boolean(t));
  }
);

export const currentTrack = derived(
  [tracks, currentId],
  ([$tracks, $currentId]) => $tracks.find((t) => t.id === $currentId) || null
);

export async function refreshTracks() {
  const list = await listTracks();
  tracks.set(list);
  return list;
}

/**
 * @param {FileList | File[]} files
 * @param {{ filter?: boolean }} [opts]  When true (default), only audio-looking files are kept.
 *                                       When false, every file is added (use after the user
 *                                       explicitly picks them from a file input — iOS often
 *                                       reports an empty MIME type).
 */
export async function uploadFiles(files, opts = {}) {
  const { filter = true } = opts;
  const arr = filter
    ? Array.from(files).filter(
        (f) =>
          f.type.startsWith('audio/') ||
          /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac)$/i.test(f.name)
      )
    : Array.from(files);
  for (const f of arr) await addTrack(f);
  await refreshTracks();
}

/**
 * Remove a track from the library entirely (also removes from all playlists).
 * @param {string} id
 */
export async function removeFromLibrary(id) {
  await deleteTrack(id);
  playlists.update((pls) =>
    pls.map((p) => ({ ...p, trackIds: p.trackIds.filter((t) => t !== id) }))
  );
  if (get(currentId) === id) {
    currentId.set(null);
    playing.set(false);
  }
  await refreshTracks();
}

/**
 * Remove a track from a specific playlist (does not delete from library).
 * @param {string} playlistId
 * @param {string} trackId
 */
export function removeFromPlaylist(playlistId, trackId) {
  playlists.update((pls) =>
    pls.map((p) => (p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId) } : p))
  );
}

/**
 * Add a track to a playlist (no-op if already present).
 * @param {string} playlistId
 * @param {string} trackId
 */
export function addToPlaylist(playlistId, trackId) {
  playlists.update((pls) =>
    pls.map((p) =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p
    )
  );
}

/**
 * @param {string} name
 * @returns {Playlist}
 */
export function createPlaylist(name) {
  /** @type {Playlist} */
  const pl = { id: uuid(), name, trackIds: [] };
  playlists.update((pls) => [...pls, pl]);
  return pl;
}

/** @param {string} id */
export function deletePlaylist(id) {
  playlists.update((pls) => pls.filter((p) => p.id !== id));
  if (get(activePlaylistId) === id) activePlaylistId.set(null);
}

/**
 * @param {string} id
 * @param {string} name
 */
export function renamePlaylist(id, name) {
  playlists.update((pls) => pls.map((p) => (p.id === id ? { ...p, name } : p)));
}

/** @param {string} id */
export async function loadAudioUrl(id) {
  const blob = await getTrackBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Persist the current track's playback time. Called throttled by the player.
 * @param {string} id
 * @param {number} time
 */
export function saveProgress(id, time) {
  saveSettings({ ...loadSettings(), lastProgress: { id, time } });
}

/** @returns {{ id: string, time: number } | null} */
export function getSavedProgress() {
  return loadSettings().lastProgress;
}

export function restoreLast() {
  const s = loadSettings();
  if (s.activePlaylistId) activePlaylistId.set(s.activePlaylistId);
  if (s.lastId) currentId.set(s.lastId);
}
