<script>
  import { uploadFiles } from '../lib/store.js';

  let dragging = $state(false);
  let busy = $state(false);
  /** @type {string | null} */
  let error = $state(null);

  /** @param {Event} e */
  async function handleChange(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (!target.files || target.files.length === 0) return;
    busy = true;
    error = null;
    try {
      // Trust files the user explicitly picked: iOS often reports an empty MIME type.
      await uploadFiles(target.files, { filter: false });
    } catch (err) {
      console.error('Upload failed:', err);
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busy = false;
      target.value = '';
    }
  }

  /** @param {DragEvent} e */
  async function handleDrop(e) {
    e.preventDefault();
    dragging = false;
    if (!e.dataTransfer) return;
    busy = true;
    error = null;
    try {
      await uploadFiles(e.dataTransfer.files);
    } catch (err) {
      console.error('Upload failed:', err);
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busy = false;
    }
  }
</script>

<label
  class="dropzone"
  class:dragging
  ondragover={(e) => { e.preventDefault(); dragging = true; }}
  ondragleave={() => (dragging = false)}
  ondrop={handleDrop}
>
  <input
    type="file"
    accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac"
    multiple
    onchange={handleChange}
    hidden
  />
  <div class="content">
    {#if busy}
      <span>Saving…</span>
    {:else if error}
      <strong class="err">Upload failed</strong>
      <span class="err">{error}</span>
    {:else}
      <svg class="icon" viewBox="0 0 640 512" aria-hidden="true">
        <defs>
          <linearGradient id="vibe-cloud-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#c4a7e7" />
            <stop offset="0.6" stop-color="#ea9a97" />
            <stop offset="1" stop-color="#f6c177" />
          </linearGradient>
        </defs>
        <!-- Font Awesome Free 6 — cloud-arrow-up (CC BY 4.0) -->
        <path fill="url(#vibe-cloud-grad)" d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-167c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V307.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"/>
      </svg>
      <strong>Drop audio files here</strong>
      <span>or click to browse</span>
    {/if}
  </div>
</label>

<style>
  .dropzone {
    display: block;
    border: 2px dashed var(--hl-med);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background:
      linear-gradient(135deg, rgba(156, 207, 216, 0.04), rgba(196, 167, 231, 0.04));
  }
  .dropzone:hover,
  .dragging {
    border-color: var(--foam);
    background:
      linear-gradient(135deg, rgba(156, 207, 216, 0.12), rgba(196, 167, 231, 0.12));
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    color: var(--subtle);
  }
  .icon {
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 0.25rem;
    transition: transform 0.2s;
  }
  .dropzone:hover .icon,
  .dragging .icon {
    transform: translateY(-3px);
  }
  strong {
    color: var(--text);
  }
  .err {
    color: var(--love);
  }
</style>
