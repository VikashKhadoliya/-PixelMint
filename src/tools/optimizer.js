/**
 * GIF Optimizer & Compressor for PixelMint
 * Reduces file size via palette downsampling, frame decimation, and dimension scaling
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { resizeCanvas } from '../utils/canvasUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL } from '../utils/fileHelpers.js';

export function renderOptimizer(container, onChainMedia) {
  let loadedFile = null;
  let decodedGifData = null;
  let isOptimizing = false;
  let generatedBlob = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/speedometer.svg" class="tool-hero-icon" alt="Optimizer" />
          <span class="tool-badge">Compression</span>
          <h2>Animated GIF Optimizer & Compressor</h2>
        </div>
        <p class="tool-description">
          Dramatically reduce GIF file size for Discord (8MB limit), Slack, web, or email using smart palette quantization and frame optimization.
        </p>
      </div>

      <!-- Ingestion Card -->
      <div class="card dropzone-card" id="opt-dropzone">
        <input type="file" id="opt-file-input" accept="image/gif" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <h3>Choose, drop, or paste an animated GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF files. Instant client-side compression.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="opt-browse-btn">Browse GIF</button>
            <button class="btn btn-secondary" id="opt-demo-btn">Generate Demo GIF</button>
          </div>
        </div>
      </div>

      <!-- Optimization Settings Stage -->
      <div id="opt-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <div class="preview-box">
            <img id="opt-preview-img" class="media-preview" alt="GIF preview" />
          </div>

          <div class="video-metadata" id="opt-meta"></div>

          <!-- Optimization Controls -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="opt-colors">Color Reduction</label>
              <select id="opt-colors" class="select-input">
                <option value="128" selected>128 Colors (Balanced Compression ~30% smaller)</option>
                <option value="64">64 Colors (Aggressive Compression ~50% smaller)</option>
                <option value="32">32 Colors (Extreme Compression ~70% smaller)</option>
                <option value="256">256 Colors (Preserve Max Colors)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="opt-frame-drop">Frame Reduction</label>
              <select id="opt-frame-drop" class="select-input">
                <option value="none" selected>Keep all frames</option>
                <option value="drop2">Drop every 2nd frame (Halves frame count)</option>
                <option value="drop3">Drop 2 of every 3 frames (Extreme decimation)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="opt-scale">Resolution Scale</label>
              <select id="opt-scale" class="select-input">
                <option value="1" selected>100% (Original dimensions)</option>
                <option value="0.8">80% Scale</option>
                <option value="0.65">65% Scale</option>
                <option value="0.5">50% Scale (Quarter pixel area)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="opt-dither">Dither Quality</label>
              <select id="opt-dither" class="select-input">
                <option value="floyd" selected>Floyd-Steinberg (Smooth look)</option>
                <option value="none">No Dither (Clean solids, best compression)</option>
              </select>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="opt-execute-btn">
              <img src="/icons/speedometer.svg" class="btn-icon-img" alt="" /> Optimize & Compress GIF!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="opt-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="opt-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="opt-progress-text">Compressing GIF... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="opt-output-wrap" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Optimized Animated GIF</h3>
            <span class="status-pill status-success" id="opt-savings-pill">-0% Saved</span>
          </div>

          <div class="output-preview-container">
            <img id="opt-output-img" class="output-preview-img" alt="Optimized GIF" />
          </div>

          <div class="output-stats" id="opt-output-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="opt-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Optimized GIF
            </button>
          </div>

          <!-- Chaining Action Bar -->
          <div class="chain-pipeline">
            <div class="chain-title">Chain this result into another tool:</div>
            <div class="chain-buttons">
              <button class="chain-btn" data-tool="cropper"><img src="/icons/transform-crop.svg" class="chain-btn-icon" alt="" /> Crop</button>
              <button class="chain-btn" data-tool="resizer"><img src="/icons/transform-scale.svg" class="chain-btn-icon" alt="" /> Resize</button>
              <button class="chain-btn" data-tool="effects"><img src="/icons/tools-wizard.svg" class="chain-btn-icon" alt="" /> Effects</button>
              <button class="chain-btn" data-tool="converter"><img src="/icons/view-refresh.svg" class="chain-btn-icon" alt="" /> Convert</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#opt-dropzone');
  const fileInput = container.querySelector('#opt-file-input');
  const browseBtn = container.querySelector('#opt-browse-btn');
  const demoBtn = container.querySelector('#opt-demo-btn');
  const stage = container.querySelector('#opt-stage');
  const previewImg = container.querySelector('#opt-preview-img');
  const metaBox = container.querySelector('#opt-meta');

  const colorsSelect = container.querySelector('#opt-colors');
  const frameDropSelect = container.querySelector('#opt-frame-drop');
  const scaleSelect = container.querySelector('#opt-scale');
  const ditherSelect = container.querySelector('#opt-dither');
  const executeBtn = container.querySelector('#opt-execute-btn');

  const progressWrap = container.querySelector('#opt-progress-wrap');
  const progressBar = container.querySelector('#opt-progress-bar');
  const progressText = container.querySelector('#opt-progress-text');

  const outputWrap = container.querySelector('#opt-output-wrap');
  const outputImg = container.querySelector('#opt-output-img');
  const outputStats = container.querySelector('#opt-output-stats');
  const savingsPill = container.querySelector('#opt-savings-pill');
  const downloadBtn = container.querySelector('#opt-download-btn');

  // File loading
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadGifFile(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadGifFile(e.dataTransfer.files[0]);
    }
  });

  demoBtn.addEventListener('click', async () => {
    demoBtn.disabled = true;
    demoBtn.textContent = 'Generating...';
    try {
      // Create a multi-frame demo GIF to optimize
      const demoFrames = [];
      for (let i = 0; i < 8; i++) {
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 240;
        const ctx = c.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 320, 240);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, i % 2 === 0 ? '#10b981' : '#6366f1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 320, 240);

        ctx.beginPath();
        ctx.arc(160 + Math.sin(i) * 50, 120 + Math.cos(i) * 30, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Frame ${i + 1}`, 160, 125);

        demoFrames.push({ canvas: c, delay: 100 });
      }

      const sampleBlob = await encodeGif(demoFrames, { maxColors: 256, dither: 'floyd' });
      loadGifFile(sampleBlob, 'pixelmint-demo-sample.gif');
    } catch (err) {
      console.error(err);
      alert('Could not generate demo GIF: ' + err.message);
    } finally {
      demoBtn.disabled = false;
      demoBtn.textContent = 'Generate Demo GIF';
    }
  });

  async function loadGifFile(file, name) {
    loadedFile = file;
    const dataUrl = await readFileAsDataURL(file);
    previewImg.src = dataUrl;

    const buffer = await readFileAsArrayBuffer(file);
    decodedGifData = await decodeGif(buffer);

    metaBox.innerHTML = `
      <div class="stat-pill"><span class="stat-label">File Size:</span> <strong>${formatBytes(file.size)}</strong></div>
      <div class="stat-pill"><span class="stat-label">Dimensions:</span> <strong>${decodedGifData.width} &times; ${decodedGifData.height} px</strong></div>
      <div class="stat-pill"><span class="stat-label">Frames:</span> <strong>${decodedGifData.frames.length}</strong></div>
    `;

    stage.classList.remove('hidden');
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Optimize Execution
  executeBtn.addEventListener('click', async () => {
    if (!decodedGifData || isOptimizing) return;

    try {
      isOptimizing = true;
      executeBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Optimizing GIF frames...';

      const maxColors = parseInt(colorsSelect.value, 10);
      const frameDropMode = frameDropSelect.value;
      const scaleFactor = parseFloat(scaleSelect.value);
      const dither = ditherSelect.value;

      // 1. Frame Dropping / Decimation
      let workingFrames = [];
      const origFrames = decodedGifData.frames;

      if (frameDropMode === 'drop2') {
        for (let i = 0; i < origFrames.length; i += 2) {
          const f = origFrames[i];
          const nextDelay = (origFrames[i + 1] ? origFrames[i + 1].delay : f.delay);
          workingFrames.push({
            canvas: f.canvas,
            delay: f.delay + nextDelay
          });
        }
      } else if (frameDropMode === 'drop3') {
        for (let i = 0; i < origFrames.length; i += 3) {
          const f = origFrames[i];
          let extra = 0;
          if (origFrames[i + 1]) extra += origFrames[i + 1].delay;
          if (origFrames[i + 2]) extra += origFrames[i + 2].delay;
          workingFrames.push({
            canvas: f.canvas,
            delay: f.delay + extra
          });
        }
      } else {
        workingFrames = origFrames.map(f => ({ canvas: f.canvas, delay: f.delay }));
      }

      // 2. Resolution Scaling
      const targetW = Math.max(1, Math.round(decodedGifData.width * scaleFactor));
      const targetH = Math.max(1, Math.round(decodedGifData.height * scaleFactor));

      const scaledFrames = [];
      for (let i = 0; i < workingFrames.length; i++) {
        const frame = workingFrames[i];
        let c = frame.canvas;
        if (scaleFactor !== 1) {
          c = resizeCanvas(c, targetW, targetH, 'fit');
        }
        scaledFrames.push({ canvas: c, delay: frame.delay });

        const pct = Math.round(((i + 1) / workingFrames.length) * 40);
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `Processing frame ${i + 1} of ${workingFrames.length}...`;
        if (i % 2 === 0) await new Promise(r => setTimeout(r, 0));
      }

      // 3. Re-encode with Quantized Palette
      progressText.textContent = 'Compressing palette and encoding...';
      const blob = await encodeGif(scaledFrames, {
        maxColors,
        dither,
        loop: decodedGifData.loopCount,
        onProgress: (encPct) => {
          const overall = 40 + Math.round(encPct * 0.6);
          progressBar.style.width = `${overall}%`;
          progressText.textContent = `Encoding GIF... ${overall}%`;
        }
      });

      generatedBlob = blob;
      const outUrl = URL.createObjectURL(blob);
      outputImg.src = outUrl;

      // Calculate exact savings
      const origSize = loadedFile.size;
      const newSize = blob.size;
      const diff = origSize - newSize;
      const pctSaved = ((diff / origSize) * 100).toFixed(1);

      if (diff > 0) {
        savingsPill.className = 'status-pill status-success';
        savingsPill.textContent = `-${pctSaved}% Saved!`;
      } else {
        savingsPill.className = 'status-pill status-warning';
        savingsPill.textContent = `+${Math.abs(pctSaved)}% (Already compressed)`;
      }

      outputStats.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Original:</span> <strong>${formatBytes(origSize)} (${decodedGifData.frames.length} frames)</strong></div>
        <div class="stat-pill"><span class="stat-label">Optimized:</span> <strong>${formatBytes(newSize)} (${scaledFrames.length} frames)</strong></div>
        <div class="stat-pill"><span class="stat-label">Colors:</span> <strong>${maxColors}</strong></div>
        <div class="stat-pill"><span class="stat-label">Dimensions:</span> <strong>${targetW} &times; ${targetH} px</strong></div>
      `;

      outputWrap.classList.remove('hidden');
      outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      alert('Optimization error: ' + err.message);
    } finally {
      isOptimizing = false;
      executeBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (generatedBlob) {
      downloadBlob(generatedBlob, `pixelmint-optimized-${Date.now()}.gif`);
    }
  });

  // Chaining buttons
  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTool = btn.dataset.tool;
      if (generatedBlob && onChainMedia) {
        onChainMedia(targetTool, generatedBlob, 'image/gif');
      }
    });
  });

  return {
    loadMedia: (blob) => loadGifFile(blob)
  };
}
