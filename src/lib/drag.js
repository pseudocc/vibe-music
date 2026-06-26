/**
 * Drag payload shape used across the app.
 * @typedef {Object} DragPayload
 * @property {'track'} kind
 * @property {string} trackId
 * @property {string | null} sourcePlaylistId  null = library
 */

const MIME = 'application/x-vibe-track';

/**
 * @param {DataTransfer} dt
 * @param {DragPayload} payload
 */
export function setDragPayload(dt, payload) {
  dt.setData(MIME, JSON.stringify(payload));
  dt.setData('text/plain', payload.trackId);
  dt.effectAllowed = 'copyMove';
}

/**
 * @param {DataTransfer} dt
 * @returns {DragPayload | null}
 */
export function getDragPayload(dt) {
  const raw = dt.getData(MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {DataTransfer | null} dt */
export function hasTrackPayload(dt) {
  if (!dt) return false;
  return Array.from(dt.types).includes(MIME);
}
