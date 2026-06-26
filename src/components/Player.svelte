<script>
  import { onMount } from 'svelte';
  import {
    currentTrack,
    currentId,
    visibleTracks,
    playing,
    volume,
    playMode,
    loadAudioUrl,
    saveProgress,
    getSavedProgress
  } from '../lib/store.js';

  /** @type {HTMLAudioElement | undefined} */
  let audio = $state();
  let src = $state('');
  let duration = $state(0);
  let currentTime = $state(0);
  /** @type {string | null} */
  let lastUrl = null;
  /** @type {string | null} Track id whose saved progress should be applied on next loadedmetadata */
  let pendingResumeFor = null;
  let lastSavedAt = 0;

  $effect(() => {
    const track = $currentTrack;
    if (!track) {
      src = '';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = null;
      return;
    }
    const saved = getSavedProgress();
    pendingResumeFor = saved && saved.id === track.id ? track.id : null;
    loadAudioUrl(track.id).then((url) => {
      if (!url) return;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = url;
      src = url;
    });
  });

  $effect(() => {
    if (audio) audio.volume = $volume;
  });

  function togglePlay() {
    if (!audio || !src) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  /**
   * @param {{ fromEnded?: boolean }} [opts]
   */
  function nextTrack(opts = {}) {
    const fromEnded = opts.fromEnded === true;
    const list = $visibleTracks;
    if (!list.length) return;
    if ($playMode === 'shuffle') {
      if (list.length === 1) {
        if (fromEnded && audio) {
          audio.currentTime = 0;
          audio.play();
        }
        return;
      }
      let next;
      do {
        next = list[Math.floor(Math.random() * list.length)];
      } while (next.id === $currentId);
      currentId.set(next.id);
      return;
    }
    const idx = list.findIndex((t) => t.id === $currentId);
    const next = list[(idx + 1) % list.length];
    currentId.set(next.id);
  }

  function prevTrack() {
    const list = $visibleTracks;
    if (!list.length) return;
    const idx = list.findIndex((t) => t.id === $currentId);
    const prev = list[(idx - 1 + list.length) % list.length];
    currentId.set(prev.id);
  }

  function onEnded() {
    const list = $visibleTracks;
    if (!list.length) return;
    if ($playMode === 'loop-one') {
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }
    setTimeout(() => {
      const list2 = $visibleTracks;
      if (!list2.length) return;
      nextTrack({ fromEnded: true });
    }, 1000);
  }

  function cycleMode() {
    /** @type {import('../lib/store.js').PlayMode[]} */
    const order = ['loop', 'loop-one', 'shuffle'];
    const idx = order.indexOf($playMode);
    playMode.set(order[(idx + 1) % order.length]);
  }

  const modeLabel = $derived.by(() => {
    if ($playMode === 'loop') return 'Loop all';
    if ($playMode === 'loop-one') return 'Repeat one';
    return 'Shuffle';
  });

  /** @param {number} t */
  function fmtTime(t) {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  let seeking = $state(false);
  let resumeAfterSeek = false;

  /** @param {Event} e */
  function onSeek(e) {
    if (!audio) return;
    const v = Number(/** @type {HTMLInputElement} */ (e.target).value);
    if (seeking) {
      // Reflect scrub position visually without moving playback head yet.
      currentTime = v;
    } else {
      audio.currentTime = v;
    }
  }

  function onSeekStart() {
    if (!audio || !src) return;
    seeking = true;
    resumeAfterSeek = !audio.paused;
    audio.pause();
  }

  function onSeekEnd() {
    if (!audio || !seeking) return;
    audio.currentTime = currentTime;
    seeking = false;
    if (resumeAfterSeek) audio.play();
    resumeAfterSeek = false;
  }

  function onLoadedMetadata() {
    if (!audio) return;
    duration = audio.duration;
    if (pendingResumeFor && $currentTrack && pendingResumeFor === $currentTrack.id) {
      const saved = getSavedProgress();
      if (saved && saved.id === pendingResumeFor && isFinite(saved.time) && saved.time < audio.duration - 1) {
        audio.currentTime = saved.time;
        currentTime = saved.time;
      }
      pendingResumeFor = null;
    }
  }

  function onTimeUpdate() {
    if (!audio || seeking) return;
    currentTime = audio.currentTime;
    const now = performance.now();
    if (now - lastSavedAt > 2000 && $currentTrack) {
      lastSavedAt = now;
      saveProgress($currentTrack.id, audio.currentTime);
    }
  }

  function persistProgressNow() {
    if (audio && $currentTrack) saveProgress($currentTrack.id, audio.currentTime);
  }

  function seekBy(/** @type {number} */ delta) {
    if (!audio || !src) return;
    const max = (duration || audio.duration) || 0;
    audio.currentTime = Math.max(0, Math.min(max, audio.currentTime + delta));
    currentTime = audio.currentTime;
    persistProgressNow();
  }

  function bumpVolume(/** @type {number} */ delta) {
    volume.update((v) => Math.max(0, Math.min(1, Math.round((v + delta) * 100) / 100)));
  }

  /** @param {KeyboardEvent} e */
  function onShortcut(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = /** @type {HTMLElement | null} */ (e.target);
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (document.querySelector('[role="dialog"]')) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        seekBy(5);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seekBy(-5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        bumpVolume(0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        bumpVolume(-0.1);
        break;
      case 'PageUp':
        e.preventDefault();
        prevTrack();
        break;
      case 'PageDown':
        e.preventDefault();
        nextTrack();
        break;
    }
  }

  // ---- Touch gestures on the player card ----
  /** @type {{ x: number, y: number, t: number, target: EventTarget | null } | null} */
  let touchStart = null;
  const SWIPE_MIN = 40;
  const SWIPE_MAX_TIME = 600;

  /** @param {TouchEvent} e */
  function onTouchStart(e) {
    if (e.touches.length !== 1) {
      touchStart = null;
      return;
    }
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, t: Date.now(), target: e.target };
  }

  /** @param {TouchEvent} e */
  function onTouchEnd(e) {
    if (!touchStart) return;
    const start = touchStart;
    touchStart = null;

    // Ignore if the gesture started on an interactive control — let the control handle it.
    const el = /** @type {HTMLElement | null} */ (start.target);
    if (el && el.closest('input, button, a, [role="dialog"]')) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    if (dt > SWIPE_MAX_TIME) return;

    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (Math.max(adx, ady) < SWIPE_MIN) return;
    // Require dominant direction to avoid accidental diagonals.
    if (adx > ady * 1.4) {
      if (dx > 0) seekBy(5);
      else seekBy(-5);
    } else if (ady > adx * 1.4) {
      if (dy < 0) bumpVolume(0.1);
      else bumpVolume(-0.1);
    }
  }

  // ---- Volume bar drag ----
  /** @type {HTMLDivElement | undefined} */
  let volumeEl = $state();
  let volDragging = $state(false);

  /** @param {PointerEvent} e */
  function setVolumeFromPointer(e) {
    if (!volumeEl) return;
    const rect = volumeEl.getBoundingClientRect();
    const ratio = 1 - (e.clientY - rect.top) / rect.height;
    const level = Math.max(0, Math.min(10, Math.round(ratio * 10)));
    volume.set(level / 10);
  }

  /** @param {PointerEvent} e */
  function onVolPointerDown(e) {
    if (!volumeEl) return;
    volDragging = true;
    volumeEl.setPointerCapture(e.pointerId);
    setVolumeFromPointer(e);
  }

  /** @param {PointerEvent} e */
  function onVolPointerMove(e) {
    if (!volDragging) return;
    setVolumeFromPointer(e);
  }

  /** @param {PointerEvent} e */
  function onVolPointerUp(e) {
    if (!volumeEl) return;
    volDragging = false;
    if (volumeEl.hasPointerCapture(e.pointerId)) volumeEl.releasePointerCapture(e.pointerId);
  }

  onMount(() => {
    const handler = () => persistProgressNow();
    window.addEventListener('pagehide', handler);
    window.addEventListener('beforeunload', handler);
    window.addEventListener('keydown', onShortcut);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persistProgressNow();
    });
    return () => {
      window.removeEventListener('pagehide', handler);
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('keydown', onShortcut);
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      persistProgressNow();
    };
  });
</script>

<div role="presentation" class="player" ontouchstart={onTouchStart} ontouchend={onTouchEnd} ontouchcancel={() => (touchStart = null)}>
  <div class="player-main">
  <audio
    bind:this={audio}
    {src}
    onplay={() => playing.set(true)}
    onpause={() => { playing.set(false); persistProgressNow(); }}
    onended={onEnded}
    onloadedmetadata={onLoadedMetadata}
    ontimeupdate={onTimeUpdate}
    autoplay
  ></audio>

  <div class="title">
    {#if $currentTrack}
      {$currentTrack.name}
    {:else}
      <span class="muted">No track loaded</span>
    {/if}
  </div>

  <div class="seek">
    <span class="time">{fmtTime(currentTime)}</span>
    <input
      type="range"
      min="0"
      max={duration || 0}
      step="0.1"
      value={currentTime}
      oninput={onSeek}
      onpointerdown={onSeekStart}
      onpointerup={onSeekEnd}
      onpointercancel={onSeekEnd}
      onkeydown={onSeekStart}
      onkeyup={onSeekEnd}
      disabled={!src}
    />
    <span class="time">{fmtTime(duration)}</span>
  </div>

  <div class="controls">
    <button class="mode" onclick={cycleMode} aria-label={modeLabel} title={modeLabel}>
      {#if $playMode === 'loop'}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v2.5L21 6l-4-3.5V5H5v6h2V7Zm10 10H7v-2.5L3 18l4 3.5V20h12v-6h-2v3Z"/></svg>
      {:else if $playMode === 'loop-one'}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v2.5L21 6l-4-3.5V5H5v6h2V7Zm10 10H7v-2.5L3 18l4 3.5V20h12v-6h-2v3Z"/><text x="12" y="14" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor">1</text></svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4h5v5h-2V7.4l-4.3 4.3-1.4-1.4L17.6 6H16V4Zm-9.3.7L11 9l-1.4 1.4L5.3 6.1 6.7 4.7ZM19 15h2v5h-5v-2h1.6l-4.3-4.3 1.4-1.4L19 16.6V15ZM5.3 19.3l5-5 1.4 1.4-5 5-1.4-1.4Z"/></svg>
      {/if}
    </button>
    <button onclick={prevTrack} disabled={!$visibleTracks.length} aria-label="Previous">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5.5v13a1 1 0 0 1-1.5.87l-9-5.5a1 1 0 0 1 0-1.74l9-5.5A1 1 0 0 1 18 5.5Z"/><rect x="4.5" y="5" width="2.5" height="14" rx="1"/></svg>
    </button>
    <button class="play" onclick={togglePlay} disabled={!src} aria-label="Play/Pause">
      {#if $playing}
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z"/></svg>
      {/if}
    </button>
    <button onclick={nextTrack} disabled={!$visibleTracks.length} aria-label="Next">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5.5v13a1 1 0 0 0 1.5.87l9-5.5a1 1 0 0 0 0-1.74l-9-5.5A1 1 0 0 0 6 5.5Z"/><rect x="17" y="5" width="2.5" height="14" rx="1"/></svg>
    </button>
  </div>
  </div>

  <div
    class="volume-bars"
    bind:this={volumeEl}
    role="slider"
    aria-label="Volume"
    aria-valuemin="0"
    aria-valuemax="10"
    aria-valuenow={Math.round($volume * 10)}
    tabindex="0"
    onpointerdown={onVolPointerDown}
    onpointermove={onVolPointerMove}
    onpointerup={onVolPointerUp}
    onpointercancel={onVolPointerUp}
  >
    {#each Array(10) as _, i}
      {@const level = 10 - i}
      {@const lit = $volume * 10 >= level - 0.001}
      <div class="bar" class:lit style="--bar-level: {level}"></div>
    {/each}
  </div>
</div>

<style>
  .player {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 1rem;
    padding: 1.1rem;
    background:
      linear-gradient(135deg, rgba(196, 167, 231, 0.18), rgba(235, 111, 146, 0.10) 60%, rgba(246, 193, 119, 0.08)),
      linear-gradient(180deg, var(--surface), var(--overlay));
    border: 1px solid var(--hl-med);
    border-radius: 14px;
    box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.5);
  }
  .player-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .title {
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .muted {
    color: var(--muted);
    font-weight: 400;
  }
  .seek {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .seek input[type='range'] {
    flex: 1;
  }
  .time {
    font-variant-numeric: tabular-nums;
    font-size: 0.8rem;
    color: var(--subtle);
    min-width: 2.5rem;
  }
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
  }
  .mode {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 2.25rem !important;
    height: 2.25rem !important;
    background: var(--hl-low) !important;
    color: var(--iris) !important;
  }
  .mode svg {
    width: 1.05rem !important;
    height: 1.05rem !important;
  }
  .mode:hover:not(:disabled) {
    background: var(--hl-med) !important;
  }
  .controls button {
    background: var(--hl-med);
    color: var(--text);
    border: none;
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, transform 0.1s;
  }
  .controls button svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
  .controls button:hover:not(:disabled) {
    background: var(--hl-high);
  }
  .controls button:active:not(:disabled) {
    transform: scale(0.96);
  }
  .controls button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .play {
    background: linear-gradient(135deg, var(--iris), var(--love)) !important;
    color: var(--base) !important;
    box-shadow: 0 6px 18px -4px rgba(196, 167, 231, 0.5);
  }
  .play:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--iris), var(--rose)) !important;
  }
  .volume-bars {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    padding: 0.25rem 0.4rem;
    align-self: center;
    outline: none;
    cursor: pointer;
    touch-action: none;
  }
  .volume-bars:focus-visible {
    box-shadow: 0 0 0 2px var(--iris);
    border-radius: 6px;
  }
  .bar {
    width: 20px;
    height: 5px;
    border-radius: 2px;
    background: var(--hl-low);
    transition: background 0.12s;
    pointer-events: none;
  }
  .bar.lit {
    background: linear-gradient(
      180deg,
      var(--gold) 0%,
      var(--rose) 35%,
      var(--love) 70%,
      var(--iris) 100%
    );
    background-size: 100% 1000%;
    background-position: 0% calc((10 - var(--bar-level)) * 11.11%);
    box-shadow: 0 0 8px -2px rgba(196, 167, 231, 0.5);
  }
  input[type='range'] {
    accent-color: var(--iris);
  }
</style>
