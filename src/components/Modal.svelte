<script>
  /** @type {{ open: boolean, title?: string, onClose: () => void, children?: import('svelte').Snippet, footer?: import('svelte').Snippet }} */
  let { open, title = '', onClose, children, footer } = $props();

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div
    class="backdrop"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Enter' && onClose()}
    role="presentation"
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      tabindex="-1"
    >
      {#if title}
        <header><h3>{title}</h3></header>
      {/if}
      <div class="body">
        {@render children?.()}
      </div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 13, 25, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
    animation: fade 0.15s ease-out;
  }
  .modal {
    width: min(420px, 100%);
    background:
      linear-gradient(135deg, rgba(196, 167, 231, 0.08), rgba(235, 111, 146, 0.05)),
      linear-gradient(180deg, var(--surface), var(--overlay));
    border: 1px solid var(--hl-high);
    border-radius: 14px;
    box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    animation: pop 0.18s ease-out;
  }
  header {
    padding: 1rem 1.1rem 0.5rem;
  }
  header h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text);
    background: linear-gradient(135deg, var(--iris), var(--rose));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .body {
    padding: 0.75rem 1.1rem;
    color: var(--text);
  }
  footer {
    padding: 0.75rem 1.1rem 1rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  @keyframes fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pop {
    from { transform: translateY(8px) scale(0.98); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
</style>
