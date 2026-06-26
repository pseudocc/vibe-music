<script>
  import { isDragging, removeFromLibrary, removeFromPlaylist, activePlaylistId } from '../lib/store.js';
  import { getDragPayload, hasTrackPayload } from '../lib/drag.js';

  let over = $state(false);

  /** @param {DragEvent} e */
  function onDragOver(e) {
    if (!hasTrackPayload(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    over = true;
  }

  function onDragLeave() {
    over = false;
  }

  /** @param {DragEvent} e */
  async function onDrop(e) {
    e.preventDefault();
    over = false;
    if (!e.dataTransfer) return;
    const payload = getDragPayload(e.dataTransfer);
    if (!payload) return;

    if (payload.sourcePlaylistId === null) {
      await removeFromLibrary(payload.trackId);
    } else {
      removeFromPlaylist(payload.sourcePlaylistId, payload.trackId);
    }
    isDragging.set(false);
  }
</script>

{#if $isDragging}
  <div
    class="bin"
    class:over
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    ondrop={onDrop}
    role="region"
    aria-label="Drop to remove"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3a1 1 0 0 0-1 1v1H4.5a1 1 0 0 0 0 2H5l1.1 12.1A2 2 0 0 0 8.1 21h7.8a2 2 0 0 0 2-1.9L19 7h.5a1 1 0 0 0 0-2H16V4a1 1 0 0 0-1-1H9Zm1 2h4v1h-4V5Zm-.5 5a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm5 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"/>
    </svg>
    <span>
      {#if $activePlaylistId === null}
        Drop to delete
      {:else}
        Drop to remove from playlist
      {/if}
    </span>
  </div>
{/if}

<style>
  .bin {
    position: fixed;
    left: 50%;
    bottom: 1.5rem;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1.25rem;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(235, 111, 146, 0.25), rgba(234, 154, 151, 0.2));
    border: 2px dashed rgba(235, 111, 146, 0.6);
    color: var(--love);
    font-weight: 500;
    box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.6);
    z-index: 100;
    pointer-events: auto;
    transition: transform 0.15s, background 0.15s, border-color 0.15s;
    animation: rise 0.15s ease-out;
  }
  .bin.over {
    transform: translateX(-50%) scale(1.08);
    background: linear-gradient(135deg, rgba(235, 111, 146, 0.45), rgba(234, 154, 151, 0.4));
    border-color: var(--love);
    color: var(--text);
  }
  .bin svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
  @keyframes rise {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
  }
</style>
