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

  onMount(async () => {
    initPWA();
    await refreshTracks();
    restoreLast();
  });

  const activeName = $derived.by(() => {
    if ($activePlaylistId === null) return 'Library';
    return $playlists.find((p) => p.id === $activePlaylistId)?.name ?? 'Library';
  });
</script>

<main>
  <header>
    <h1>🎵 Vibe Music</h1>
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
