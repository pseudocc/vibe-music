<script>
  import {
    playlists,
    activePlaylistId,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    tracks
  } from '../lib/store.js';
  import { getDragPayload, hasTrackPayload } from '../lib/drag.js';
  import Modal from './Modal.svelte';

  /** @type {string | null} */
  let dragOverId = $state(null);

  let showCreate = $state(false);
  /** @type {{ id: string, name: string } | null} */
  let renameTarget = $state(null);
  /** @type {{ id: string, name: string } | null} */
  let deleteTarget = $state(null);

  let createName = $state('');
  let renameName = $state('');

  /** @type {HTMLInputElement | undefined} */
  let createInput = $state();
  /** @type {HTMLInputElement | undefined} */
  let renameInput = $state();

  function openCreate() {
    createName = '';
    showCreate = true;
    queueMicrotask(() => createInput?.focus());
  }

  function confirmCreate() {
    const name = createName.trim();
    if (!name) return;
    const pl = createPlaylist(name);
    activePlaylistId.set(pl.id);
    showCreate = false;
  }

  /** @param {string} id */
  function openRename(id) {
    const pl = $playlists.find((p) => p.id === id);
    if (!pl) return;
    renameTarget = { id: pl.id, name: pl.name };
    renameName = pl.name;
    queueMicrotask(() => renameInput?.select());
  }

  function confirmRename() {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (name) renamePlaylist(renameTarget.id, name);
    renameTarget = null;
  }

  /** @param {string} id */
  function openDelete(id) {
    const pl = $playlists.find((p) => p.id === id);
    if (!pl) return;
    deleteTarget = { id: pl.id, name: pl.name };
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deletePlaylist(deleteTarget.id);
    deleteTarget = null;
  }

  /**
   * @param {DragEvent} e
   * @param {string} id
   */
  function onDragOver(e, id) {
    if (!hasTrackPayload(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    dragOverId = id;
  }

  function onDragLeave() {
    dragOverId = null;
  }

  /**
   * @param {DragEvent} e
   * @param {string} playlistId
   */
  function onDrop(e, playlistId) {
    e.preventDefault();
    dragOverId = null;
    if (!e.dataTransfer) return;
    const payload = getDragPayload(e.dataTransfer);
    if (!payload) return;
    addToPlaylist(playlistId, payload.trackId);
  }

  /** @param {string | null} id */
  function selectPlaylist(id) {
    activePlaylistId.set(id);
  }
</script>

<aside class="sidebar">
  <div class="header">
    <h2>Playlists</h2>
    <button class="new" onclick={openCreate} title="New playlist">+</button>
  </div>

  <ul class="list">
    <li>
      <div class="entry-wrap" class:active={$activePlaylistId === null}>
        <button class="entry" onclick={() => selectPlaylist(null)}>
          <span class="icon">📚</span>
          <span class="name">Library</span>
          <span class="count">{$tracks.length}</span>
        </button>
        <span class="del placeholder" aria-hidden="true"></span>
      </div>
    </li>
    {#each $playlists as pl (pl.id)}
      <li>
        <div
          class="entry-wrap"
          class:active={$activePlaylistId === pl.id}
          class:drag-over={dragOverId === pl.id}
          ondragover={(e) => onDragOver(e, pl.id)}
          ondragleave={onDragLeave}
          ondrop={(e) => onDrop(e, pl.id)}
          role="presentation"
        >
          <button
            class="entry"
            onclick={() => selectPlaylist(pl.id)}
            ondblclick={() => openRename(pl.id)}
            title="Double-click to rename"
          >
            <span class="icon">🎶</span>
            <span class="name">{pl.name}</span>
            <span class="count">{pl.trackIds.length}</span>
          </button>
          <button class="del" onclick={() => openDelete(pl.id)} aria-label="Delete playlist">✕</button>
        </div>
      </li>
    {/each}
  </ul>

  {#if $playlists.length === 0}
    <p class="hint">Create a playlist, then drag tracks from the library onto it.</p>
  {/if}
</aside>

<Modal open={showCreate} title="New playlist" onClose={() => (showCreate = false)}>
  {#snippet children()}
    <input
      bind:this={createInput}
      bind:value={createName}
      class="text-input"
      placeholder="e.g. Late Night Coding"
      onkeydown={(e) => e.key === 'Enter' && confirmCreate()}
    />
  {/snippet}
  {#snippet footer()}
    <button class="btn ghost" onclick={() => (showCreate = false)}>Cancel</button>
    <button class="btn primary" onclick={confirmCreate} disabled={!createName.trim()}>Create</button>
  {/snippet}
</Modal>

<Modal open={renameTarget !== null} title="Rename playlist" onClose={() => (renameTarget = null)}>
  {#snippet children()}
    <input
      bind:this={renameInput}
      bind:value={renameName}
      class="text-input"
      onkeydown={(e) => e.key === 'Enter' && confirmRename()}
    />
  {/snippet}
  {#snippet footer()}
    <button class="btn ghost" onclick={() => (renameTarget = null)}>Cancel</button>
    <button class="btn primary" onclick={confirmRename} disabled={!renameName.trim()}>Rename</button>
  {/snippet}
</Modal>

<Modal open={deleteTarget !== null} title="Delete playlist" onClose={() => (deleteTarget = null)}>
  {#snippet children()}
    <p class="prompt">
      Delete <strong>{deleteTarget?.name}</strong>?
      <br />
      <span class="muted">Tracks remain in your library.</span>
    </p>
  {/snippet}
  {#snippet footer()}
    <button class="btn ghost" onclick={() => (deleteTarget = null)}>Cancel</button>
    <button class="btn danger" onclick={confirmDelete}>Delete</button>
  {/snippet}
</Modal>

<style>
  .sidebar {
    background: linear-gradient(180deg, var(--surface), var(--overlay));
    border: 1px solid var(--hl-med);
    border-radius: 12px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header h2 {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--subtle);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .new {
    background: var(--hl-med);
    color: var(--text);
    border: none;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
  }
  .new:hover {
    background: var(--hl-high);
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .entry-wrap {
    display: flex;
    align-items: stretch;
    width: 100%;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    transition: background 0.15s, border-color 0.15s;
  }
  .entry-wrap:hover {
    background: var(--hl-low);
  }
  .entry-wrap.active {
    background:
      linear-gradient(var(--surface), var(--surface)) padding-box,
      linear-gradient(135deg, var(--iris), var(--rose), var(--gold)) border-box;
  }
  .entry-wrap.drag-over {
    border-color: var(--foam);
    background: rgba(156, 207, 216, 0.12);
  }
  .entry {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    background: transparent;
    border: none;
    color: var(--text);
    font: inherit;
    text-align: left;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
  }
  .icon {
    font-size: 1rem;
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    font-size: 0.75rem;
    color: var(--muted);
    padding: 0.1rem 0.45rem;
    background: var(--hl-low);
    border-radius: 999px;
  }
  .del {
    flex: 0 0 auto;
    width: 2rem;
    background: transparent;
    border: none;
    color: var(--muted);
    cursor: pointer;
    border-radius: 0 8px 8px 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .del:hover {
    color: var(--love);
    background: rgba(235, 111, 146, 0.12);
  }
  .del.placeholder {
    cursor: default;
    pointer-events: none;
  }
  .hint {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.4;
  }
  .text-input {
    width: 100%;
    padding: 0.55rem 0.7rem;
    background: var(--base);
    border: 1px solid var(--hl-med);
    border-radius: 8px;
    color: var(--text);
    font: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .text-input:focus {
    border-color: var(--iris);
    box-shadow: 0 0 0 3px rgba(196, 167, 231, 0.2);
  }
  .prompt {
    margin: 0;
    line-height: 1.5;
  }
  .prompt .muted {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .btn {
    padding: 0.5rem 0.95rem;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    font: inherit;
    transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn.ghost {
    background: transparent;
    color: var(--subtle);
    border-color: var(--hl-med);
  }
  .btn.ghost:hover:not(:disabled) {
    background: var(--hl-low);
    color: var(--text);
  }
  .btn.primary {
    background: linear-gradient(135deg, var(--iris), var(--love));
    color: var(--base);
    font-weight: 600;
  }
  .btn.primary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--iris), var(--rose));
  }
  .btn.danger {
    background: var(--love);
    color: var(--base);
    font-weight: 600;
  }
  .btn.danger:hover {
    background: #d8567d;
  }
</style>
