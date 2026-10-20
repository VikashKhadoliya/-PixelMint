/**
 * Target Size GIF Compressor for PixelMint
 * Automatically compresses animated GIFs to fit within exact target limits (Discord 8MB, Slack 10MB, 256KB, Custom KB/MB)
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { resizeCanvas } from '../utils/canvasUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../utils/fileHelpers.js';

export function renderTargetSizeCompressor(container, onChainMedia) {
  let loadedFile = null;
  let decodedGifData = null;
  let isCompressing = false;
  let generatedBlob = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="tool-hero-icon-svg" style="color: var(--brand-red);">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M12 12v9"></path>
            <path d="m8 17 4 4 4-4"></path>
          </svg>
          <span class="tool-badge">Target Size</span>
          <h2>Target Size GIF Compressor</h2>
        </div>
        <p class="tool-description">
          Automatically compress animated GIFs to fit under exact file size limits for Discord (8MB limit), Slack, email, or forum avatars with multi-pass optimization.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="tsc-dropzone">
        <input type="file" id="tsc-file-input" accept="image/gif" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <h3>Choose, drop, or paste a GIF to compress to a target size</h3>
          <p class="dropzone-subtext">Intelligent iterative compression automatically tunes color depth, resolution, and frame rate.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="tsc-browse-btn">Browse GIF</button>
            <button class="btn btn-secondary" id="tsc-demo-btn">Load Demo GIF</button>
          </div>
        </div>
      </div>

      <!-- Settings Stage -->
      <div id="tsc-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <div class="preview-box" style="margin-bottom: 20px;">
            <img id="tsc-preview-img" class="media-preview" alt="GIF preview" />
          </div>

          <div class="video-metadata" id="tsc-meta"></div>

          <!-- Target Size Presets -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="tsc-preset">Target Platform Preset</label>
              <select id="tsc-preset" class="select-input">
                <option value="8000" selected>Discord Standard (8 MB limit)</option>
                <option value="10000">Discord Nitro / Slack (10 MB limit)</option>
                <option value="50000">Discord Nitro Max (50 MB limit)</option>
                <option value="1000">Web / Forum Embed (1 MB limit)</option>
                <option value="500">Avatar / Email (500 KB limit)</option>
                <option value="256">Legacy Forum (256 KB limit)</option>
                <option value="128">Micro Avatar (128 KB limit)</option>
                <option value="custom">Custom File Size Limit</option>
              </select>
            </div>

            <div class="form-group" id="tsc-custom-wrap" style="display: none;">
              <label for="tsc-custom-val">Custom Size Target</label>
              <div style="display: flex; gap: 8px;">
                <input type="number" id="tsc-custom-val" min="10" value="8000" class="num-input" style="flex: 1;" />
                <select id="tsc-custom-unit" class="select-input" style="width: 80px;">
                  <option value="kb" selected>KB</option>
                  <option value="mb">MB</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="tsc-priority">Optimization Strategy</label>
              <select id="tsc-priority" class="select-input">
                <option value="balanced" selected>Balanced (Color + Moderate Resizing)</option>
                <option value="keep-fps">Preserve Smooth Framerate (Scale size first)</option>
                <option value="keep-res">Preserve Resolution (Drop frames first)</option>
              </select>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px;">
            <button class="btn btn-accent btn-lg" id="tsc-compress-btn">
              Compress to Target Size!
            </button>
          </div>

          <!-- Progress Indicator -->
          <div id="tsc-progress" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="tsc-pbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="tsc-ptext">Analyzing and running optimization passes...</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="tsc-output" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Target Size Compression Result</h3>
            <span class="status-pill status-success" id="tsc-target-met-pill">Target Limit Met</span>
          </div>

          <div class="output-preview-container">
            <img id="tsc-out-img" class="output-preview-img" alt="Compressed Result" />
          </div>

          <div class="output-stats" id="tsc-out-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="tsc-dl-btn">Download Compressed GIF</button>
          </div>

          <!-- Chaining -->
          <div class="pipeline-chain-bar" style="margin-top: 16px;">
            <span class="chain-label">Pass Compressed File Directly Into:</span>
            <div class="chain-buttons">
              <button class="chain-btn" data-target="resizer">Resize</button>
              <button class="chain-btn" data-target="cropper">Crop</button>
              <button class="chain-btn" data-target="effects">Effects</button>
              <button class="chain-btn" data-target="splitter">Split</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#tsc-dropzone');
  const fileInput = container.querySelector('#tsc-file-input');
  const browseBtn = container.querySelector('#tsc-browse-btn');
  const demoBtn = container.querySelector('#tsc-demo-btn');
  const stage = container.querySelector('#tsc-stage');
  const previewImg = container.querySelector('#tsc-preview-img');
  const metaBox = container.querySelector('#tsc-meta');
  const presetSelect = container.querySelector('#tsc-preset');
  const customWrap = container.querySelector('#tsc-custom-wrap');
  const customVal = container.querySelector('#tsc-custom-val');
  const customUnit = container.querySelector('#tsc-custom-unit');
  const prioritySelect = container.querySelector('#tsc-priority');
  const compressBtn = container.querySelector('#tsc-compress-btn');
  const progressWrap = container.querySelector('#tsc-progress');
  const pbar = container.querySelector('#tsc-pbar');
  const ptext = container.querySelector('#tsc-ptext');
  const outputStage = container.querySelector('#tsc-output');
  const outImg = container.querySelector('#tsc-out-img');
  const outStats = container.querySelector('#tsc-out-stats');
  const dlBtn = container.querySelector('#tsc-dl-btn');

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) loadFile(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(n => {
    dropzone.addEventListener(n, (e) => { e.preventDefault(); dropzone.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(n => {
    dropzone.addEventListener(n, (e) => { e.preventDefault(); dropzone.classList.remove('drag-active'); });
  });
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  demoBtn.addEventListener('click', loadDemo);

  presetSelect.addEventListener('change', () => {
    customWrap.style.display = presetSelect.value === 'custom' ? 'block' : 'none';
  });

  async function loadFile(file) {
    if (!file) return;
    try {
      loadedFile = file;
      const buffer = await readFileAsArrayBuffer(file);
      decodedGifData = await decodeGif(buffer);

      previewImg.src = URL.createObjectURL(file);
      metaBox.innerHTML = `
        <div class="metadata-item"><strong>Original Size:</strong> ${formatBytes(file.size)}</div>
        <div class="metadata-item"><strong>Dimensions:</strong> ${decodedGifData.width} × ${decodedGifData.height} px</div>
        <div class="metadata-item"><strong>Frames:</strong> ${decodedGifData.frames.length} frames</div>
      `;

      stage.classList.remove('hidden');
    } catch (err) {
      alert('Failed to load GIF: ' + err.message);
    }
  }

  async function loadDemo() {
    const frames = [];
    const colors = ['#E53935', '#0F172A', '#2563EB', '#10B981'];
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 400;
      const ctx = c.getContext('2d');
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Target Size Demo #${i + 1}`, 200, 190);
      frames.push({ canvas: c, delay: 150 });
    }
    const blob = await encodeGif(frames, { maxColors: 256, loop: 0 });
    const file = new File([blob], 'demo-target.gif', { type: 'image/gif' });
    loadFile(file);
  }

  function getTargetSizeBytes() {
    if (presetSelect.value === 'custom') {
      const num = parseFloat(customVal.value) || 1000;
      const multiplier = customUnit.value === 'mb' ? 1024 * 1024 : 1024;
      return Math.round(num * multiplier);
    }
    // Preset KB values (e.g. 8000 = 8000 KB)
    const kb = parseInt(presetSelect.value, 10);
    return kb * 1024;
  }

  compressBtn.addEventListener('click', async () => {
    if (!decodedGifData || isCompressing) return;
    isCompressing = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Analyzing file size target...';

    const targetBytes = getTargetSizeBytes();
    const origBytes = loadedFile.size;

    try {
      // Define cascading compression parameter presets to test
      const attempts = [
        { maxColors: 128, scale: 1.0, dropStep: 1, dither: 'floyd' },
        { maxColors: 96,  scale: 0.9, dropStep: 1, dither: 'floyd' },
        { maxColors: 64,  scale: 0.8, dropStep: 1, dither: 'none' },
        { maxColors: 64,  scale: 0.7, dropStep: 2, dither: 'none' },
        { maxColors: 48,  scale: 0.6, dropStep: 2, dither: 'none' },
        { maxColors: 32,  scale: 0.5, dropStep: 2, dither: 'none' },
        { maxColors: 16,  scale: 0.4, dropStep: 3, dither: 'none' }
      ];

      let bestBlob = null;
      let attemptIdx = 0;

      for (let attempt of attempts) {
        attemptIdx++;
        const pct = Math.round((attemptIdx / attempts.length) * 85);
        pbar.style.width = `${pct}%`;
        ptext.textContent = `Testing optimization pass ${attemptIdx}: ${attempt.maxColors} colors, ${(attempt.scale * 100).toFixed(0)}% scale...`;

        // Prepare frames according to attempt parameters
        let workingFrames = decodedGifData.frames;

        // Frame dropping if dropStep > 1
        if (attempt.dropStep === 2) {
          workingFrames = workingFrames.filter((_, idx) => idx % 2 === 0).map(f => ({
            ...f,
            delay: (f.delay || 100) * 2
          }));
        } else if (attempt.dropStep === 3) {
          workingFrames = workingFrames.filter((_, idx) => idx % 3 === 0).map(f => ({
            ...f,
            delay: (f.delay || 100) * 3
          }));
        }

        // Rescaling
        const targetW = Math.max(16, Math.round(decodedGifData.width * attempt.scale));
        const targetH = Math.max(16, Math.round(decodedGifData.height * attempt.scale));

        const scaledFrames = workingFrames.map(f => ({
          canvas: attempt.scale < 0.99 ? resizeCanvas(f.canvas, targetW, targetH, 'fit') : f.canvas,
          delay: f.delay
        }));

        const blob = await encodeGif(scaledFrames, {
          maxColors: attempt.maxColors,
          dither: attempt.dither,
          loop: decodedGifData.loopCount
        });

        bestBlob = blob;

        // If this pass achieves <= targetBytes, we can stop!
        if (blob.size <= targetBytes) {
          break;
        }
      }

      generatedBlob = bestBlob;
      outImg.src = URL.createObjectURL(bestBlob);

      const targetMet = bestBlob.size <= targetBytes;
      const targetPill = container.querySelector('#tsc-target-met-pill');
      targetPill.textContent = targetMet ? 'Target Limit Achieved ✓' : 'Best Compression Achieved';
      targetPill.className = `status-pill ${targetMet ? 'status-success' : 'status-warning'}`;

      const savedBytes = origBytes - bestBlob.size;
      const savedPct = origBytes > 0 ? ((savedBytes / origBytes) * 100).toFixed(1) : 0;

      outStats.innerHTML = `
        <div class="metadata-item"><strong>Target Limit:</strong> ${formatBytes(targetBytes)}</div>
        <div class="metadata-item"><strong>Original Size:</strong> ${formatBytes(origBytes)}</div>
        <div class="metadata-item"><strong>Optimized Size:</strong> <span style="color: var(--brand-red); font-weight: 700;">${formatBytes(bestBlob.size)}</span></div>
        <div class="metadata-item"><strong>File Size Reduction:</strong> -${savedPct}% (${formatBytes(Math.max(0, savedBytes))} saved)</div>
      `;

      pbar.style.width = '100%';
      ptext.textContent = 'Optimization complete!';
      setTimeout(() => progressWrap.classList.add('hidden'), 1000);
      outputStage.classList.remove('hidden');
      outputStage.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Compression error: ' + err.message);
      progressWrap.classList.add('hidden');
    } finally {
      isCompressing = false;
    }
  });

  dlBtn.addEventListener('click', () => {
    if (generatedBlob) downloadBlob(generatedBlob, 'optimized-pixelmint.gif');
  });

  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (generatedBlob && onChainMedia) {
        onChainMedia(btn.dataset.target, generatedBlob, 'image/gif');
      }
    });
  });

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadFile(blobOrFile);
    }
  };
}
