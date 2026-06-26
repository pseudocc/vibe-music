<script>
  import { updateAvailable, offlineReady, applyUpdate } from '../lib/pwa.js';

  function dismissOffline() {
    offlineReady.set(false);
  }
</script>

{#if $updateAvailable}
  <div class="banner update">
    <span>A new version is available.</span>
    <button onclick={applyUpdate}>Reload</button>
  </div>
{:else if $offlineReady}
  <div class="banner offline">
    <span>Ready to work offline ✓</span>
    <button onclick={dismissOffline}>Dismiss</button>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  .update {
    background: linear-gradient(135deg, rgba(246, 193, 119, 0.22), rgba(234, 154, 151, 0.18));
    border: 1px solid rgba(246, 193, 119, 0.45);
    color: var(--gold);
  }
  .offline {
    background: linear-gradient(135deg, rgba(156, 207, 216, 0.22), rgba(62, 143, 176, 0.18));
    border: 1px solid rgba(156, 207, 216, 0.45);
    color: var(--foam);
  }
  button {
    background: rgba(255, 255, 255, 0.08);
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.16);
  }
</style>
