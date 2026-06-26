<script>
  import { onMount } from 'svelte';
  import Player from './components/Player.svelte';
  import Uploader from './components/Uploader.svelte';
  import TrackList from './components/TrackList.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
  import PlaylistSidebar from './components/PlaylistSidebar.svelte';
  import TrashBin from './components/TrashBin.svelte';
  import { refreshTracks, restoreLast, activePlaylistId, playlists } from './lib/store.js';
  import { initPWA } from './lib/pwa.js';
  import pkg from '../package.json';

  const STAR_FALLBACK = 42;
  const APP_VERSION = `v${pkg.version}`;
  const STAR_OWNER = 'pseudoc';
  const STAR_REPO = 'vibe-music';
  const STAR_URL = `https://github.com/${STAR_OWNER}/${STAR_REPO}`;

  let stars = $state(STAR_FALLBACK);

  async function refreshStars() {
    if (!navigator.onLine) {
      stars = STAR_FALLBACK;
      return;
    }
    try {
      const res = await fetch(`https://api.github.com/repos/${STAR_OWNER}/${STAR_REPO}`);
      if (!res.ok) throw new Error('GitHub API request failed');
      const data = await res.json();
      stars = Number.isFinite(data?.stargazers_count) ? data.stargazers_count : STAR_FALLBACK;
    } catch {
      stars = STAR_FALLBACK;
    }
  }

  onMount(() => {
    const onOnline = () => {
      refreshStars();
    };
    const onOffline = () => {
      stars = STAR_FALLBACK;
    };

    initPWA();
    refreshTracks().then(() => {
      restoreLast();
    });
    refreshStars();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });

  const activeName = $derived.by(() => {
    if ($activePlaylistId === null) return 'Library';
    return $playlists.find((p) => p.id === $activePlaylistId)?.name ?? 'Library';
  });
</script>

<main>
  <header>
    <div class="title-row">
      <div class="title-main">
        <h1>🎵 Vibe Music</h1>
        <span class="version-badge" aria-label="App version">{APP_VERSION}</span>
      </div>
      <a class="star-badge" href={STAR_URL} target="_blank" rel="noreferrer noopener" aria-label="GitHub stars">
        <span class="star" aria-hidden="true">★</span>
        <span>{stars}</span>
      </a>
    </div>
    <p class="tagline">Local-first MP3 player · works offline</p>
  </header>

  <UpdateBanner />
  <Player />

  <div class="layout">
    <section class="sidebar-column">
      <PlaylistSidebar />
      <Uploader />
    </section>

    <section class="content">
      <div class="list-header">
        <h2>{activeName}</h2>
        {#if $activePlaylistId === null}
          <span class="hint">Drag tracks onto a playlist on the left, or onto the bin to delete.</span>
        {:else}
          <span class="hint">Drag from your library to add. Drag onto the bin to remove.</span>
        {/if}
      </div>
      <TrackList />
    </section>
  </div>

  <footer>
    Files are stored locally in your browser. Nothing is uploaded.
  </footer>
</main>

<TrashBin />

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 1rem 5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  header h1 {
    margin: 0;
    font-size: 1.7rem;
    background: linear-gradient(135deg, var(--iris), var(--rose) 50%, var(--gold));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .tagline {
    margin: 0.25rem 0 0;
    color: var(--subtle);
    font-size: 0.9rem;
  }
  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .title-main {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .version-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--hl-med);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--subtle);
    background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 85%, transparent), var(--hl-low));
    white-space: nowrap;
  }
  .star-badge {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    border: 1px solid var(--hl-med);
    color: var(--text);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 600;
    background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 85%, transparent), var(--hl-low));
  }
  .star-badge:hover {
    border-color: var(--iris);
    background: linear-gradient(180deg, color-mix(in srgb, var(--overlay) 90%, transparent), var(--hl-med));
  }
  .star {
    color: var(--gold);
    line-height: 1;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(260px, 36%) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }
  .sidebar-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  .list-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .list-header h2 {
    margin: 0;
    font-size: 1.05rem;
    color: var(--text);
    font-weight: 600;
  }
  .list-header .hint {
    font-size: 0.75rem;
    color: var(--muted);
  }
  footer {
    margin-top: 1rem;
    text-align: center;
    color: var(--muted);
    font-size: 0.8rem;
  }
  @media (max-width: 720px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
