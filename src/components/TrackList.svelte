<script>
  import {
    visibleTracks,
    currentId,
    activePlaylistId,
    isDragging
  } from '../lib/store.js';
  import { setDragPayload } from '../lib/drag.js';

  /** @param {number} bytes */
  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  /** @param {string} id */
  function play(id) {
    currentId.set(id);
  }

  /**
   * @param {DragEvent} e
   * @param {string} trackId
   */
  function onDragStart(e, trackId) {
    if (!e.dataTransfer) return;
    setDragPayload(e.dataTransfer, {
      kind: 'track',
      trackId,
      sourcePlaylistId: $activePlaylistId
    });
    isDragging.set(true);
  }

  function onDragEnd() {
    isDragging.set(false);
  }
</script>

<ul class="list">
  {#if $visibleTracks.length === 0}
    <li class="empty">
      {#if $activePlaylistId === null}
        No tracks yet. Upload some audio files to get started.
      {:else}
        This playlist is empty. Drag tracks here from your library.
      {/if}
    </li>
  {:else}
    {#each $visibleTracks as track (track.id)}
      <li
        class="item"
        class:active={track.id === $currentId}
        draggable="true"
        ondragstart={(e) => onDragStart(e, track.id)}
        ondragend={onDragEnd}
      >
        <button type="button" class="row" onclick={() => play(track.id)}>
          <span class="grip" aria-hidden="true">⋮⋮</span>
          <div class="meta">
            <div class="name" title={track.name}>{track.name}</div>
            <div class="sub">{fmtSize(track.size)}</div>
          </div>
        </button>
      </li>
    {/each}
  {/if}
</ul>

<style>
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: min(52vh, 30rem);
    overflow-y: scroll;
    overscroll-behavior: contain;
    padding-right: 0.2rem;
    scrollbar-gutter: stable both-edges;
  }
  .list::-webkit-scrollbar {
    width: 8px;
  }
  .list::-webkit-scrollbar-track {
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    border-radius: 999px;
  }
  .list::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, var(--iris), var(--rose) 60%, var(--gold));
    border-radius: 999px;
  }
  .empty {
    padding: 1.5rem;
    text-align: center;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .item {
    display: flex;
    flex: 0 0 auto;
    align-items: stretch;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s, opacity 0.15s;
    overflow: hidden;
    cursor: grab;
  }
  .item:active {
    cursor: grabbing;
  }
  .item:hover {
    background: var(--overlay);
  }
  .item.active {
    background:
      linear-gradient(var(--overlay), var(--overlay)) padding-box,
      linear-gradient(135deg, var(--iris), var(--rose), var(--gold)) border-box;
    border: 1px solid transparent;
  }
  .row {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    background: transparent;
    border: none;
    color: inherit;
    text-align: left;
    font: inherit;
    cursor: inherit;
  }
  .grip {
    color: var(--muted);
    font-size: 0.9rem;
    letter-spacing: -2px;
    user-select: none;
  }
  .meta {
    flex: 1;
    min-width: 0;
  }
  .name {
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
