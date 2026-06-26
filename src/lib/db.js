/**
 * IndexedDB wrapper for storing uploaded audio files as Blobs.
 * localStorage is too small for audio data, so we use IDB.
 */

const DB_NAME = 'vibe-music';
const DB_VERSION = 1;
const STORE = 'tracks';

import { uuid } from './uuid.js';

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} name
 * @property {number} size
 * @property {string} type
 * @property {number} addedAt
 * @property {Blob} blob
 */

/**
 * @typedef {Object} TrackMeta
 * @property {string} id
 * @property {string} name
 * @property {number} size
 * @property {string} type
 * @property {number} addedAt
 */

/**
 * @param {File} file
 * @returns {Promise<TrackMeta>}
 */
export async function addTrack(file) {
  const db = await openDb();
  /** @type {Track} */
  const track = {
    id: uuid(),
    name: file.name,
    size: file.size,
    type: file.type || 'audio/mpeg',
    addedAt: Date.now(),
    blob: file
  };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(track);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const { blob: _b, ...meta } = track;
  return meta;
}

/** @returns {Promise<TrackMeta[]>} */
export async function listTracks() {
  const db = await openDb();
  /** @type {Track[]} */
  const all = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all
    .map(({ blob: _b, ...meta }) => meta)
    .sort((a, b) => a.addedAt - b.addedAt);
}

/**
 * @param {string} id
 * @returns {Promise<Blob | null>}
 */
export async function getTrackBlob(id) {
  const db = await openDb();
  /** @type {Track | undefined} */
  const track = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return track ? track.blob : null;
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTrack(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
