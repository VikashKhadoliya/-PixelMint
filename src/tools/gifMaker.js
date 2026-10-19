/**
 * GIF Maker Tool for PixelMint
 */
import { encodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob, loadImageFromSrc, generateDemoSample } from '../utils/fileHelpers.js';

export function renderGifMaker(container, onChainMedia) {
  let frames = []; // Array of { id, src, img, delay }
  let nextId = 1;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/tool-animator.svg" class="tool-hero-icon" alt="GIF Maker" />
          <span class="tool-badge">Creation Studio</span>
          <h2>Animated GIF Maker</h2>
        </div>
        <p class="tool-description">
          Combine multiple images, photos, or existing animation frames into a high-quality animated GIF with custom frame delay, loop control, and reordering.
        </p>
      </div>

      <!-- Ingestion Card -->
      <div class="card dropzone-card" id="gm-dropzone">
        <input type="file" id="gm-file-input" multiple accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3>Choose, drop, or paste image frames here</h3>
          <p class="dropzone-subtext">Supports PNG, JPG, WebP, GIF, SVG. Hold Ctrl/Cmd to select multiple files.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="gm-browse-btn">Browse Images</button>
            <button class="btn btn-secondary" id="gm-demo-btn">Load Demo Frames</button>
          </div>
        </div>
      </div>

      <!-- Frames Reel & Config Stage -->
      <div id="gm-stage" class="tool-stage hidden">
        <div class="stage-section-header">
          <h3>Frame Sequence (<span id="gm-frame-count">0</span> frames)</h3>
          <div class="stage-actions">
            <button class="btn btn-sm btn-outline" id="gm-add-more-btn">+ Add More</button>
            <button class="btn btn-sm btn-danger-outline" id="gm-clear-btn">Clear All</button>
          </div>
        </div>

        <!-- Frame Thumbnails List -->
        <div class="frames-grid" id="gm-frames-grid"></div>

        <!-- Global Settings Panel -->
        <div class="card settings-card">
          <div class="settings-grid">
            <div class="form-group">
              <label for="gm-global-delay">
                Global Frame Delay: <strong id="gm-delay-val">20</strong> (1/100s)
                <span class="badge-hint" id="gm-fps-val">5.0 FPS</span>
              </label>
              <div class="range-with-number">
                <input type="range" id="gm-global-delay" min="2" max="100" value="20" class="slider" />
                <input type="number" id="gm-delay-num" min="2" max="500" value="20" class="num-input" />
              </div>
              <small class="form-hint">20 = 200ms per frame. Lower is faster.</small>
            </div>

            <div class="form-group">
              <label for="gm-colors">Max Palette Colors</label>
              <select id="gm-colors" class="select-input">
                <option value="256" selected>256 Colors (Maximum Quality)</option>
                <option value="128">128 Colors (Smaller File)</option>
                <option value="64">64 Colors (Compact)</option>
                <option value="32">32 Colors (Retro / Tiny Size)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="gm-dither">Dithering Algorithm</label>
              <select id="gm-dither" class="select-input">
                <option value="floyd" selected>Floyd-Steinberg (Smooth Gradients)</option>
                <option value="none">None (Fast & Sharp Pixel Art)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="gm-loop">Loop Count</label>
              <input type="number" id="gm-loop" min="0" value="0" class="num-input" placeholder="0 = infinite" />
              <small class="form-hint">0 = loop forever</small>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="gm-generate-btn">
              <img src="/icons/tool-animator.svg" class="btn-icon-img" alt="" /> Generate Animated GIF!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="gm-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="gm-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="gm-progress-text">Encoding GIF... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="gm-output-wrap" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Generated Animated GIF</h3>
            <span class="status-pill status-success">Success</span>
          </div>

          <div class="output-preview-container">
            <img id="gm-output-img" class="output-preview-img" alt="Generated GIF" />
          </div>

          <div class="output-stats" id="gm-output-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="gm-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download GIF
            </button>
          </div>

          <!-- Chaining Action Bar -->
          <div class="chain-pipeline">
            <div class="chain-title">Chain this result into another tool:</div>
            <div class="chain-buttons">
              <button class="chain-btn" data-tool="cropper"><img src="/icons/transform-crop.svg" class="chain-btn-icon" alt="" /> Crop</button>
              <button class="chain-btn" data-tool="resizer"><img src="/icons/transform-scale.svg" class="chain-btn-icon" alt="" /> Resize</button>
              <button class="chain-btn" data-tool="optimizer"><img src="/icons/speedometer.svg" class="chain-btn-icon" alt="" /> Optimize</button>
              <button class="chain-btn" data-tool="effects"><img src="/icons/tools-wizard.svg" class="chain-btn-icon" alt="" /> Effects</button>
              <button class="chain-btn" data-tool="converter"><img src="/icons/view-refresh.svg" class="chain-btn-icon" alt="" /> Convert</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Element Selectors
  const dropzone = container.querySelector('#gm-dropzone');
  const fileInput = container.querySelector('#gm-file-input');
  const browseBtn = container.querySelector('#gm-browse-btn');
  const demoBtn = container.querySelector('#gm-demo-btn');
  const stage = container.querySelector('#gm-stage');
  const framesGrid = container.querySelector('#gm-frames-grid');
  const frameCountSpan = container.querySelector('#gm-frame-count');
  const addMoreBtn = container.querySelector('#gm-add-more-btn');
  const clearBtn = container.querySelector('#gm-clear-btn');

  const globalDelaySlider = container.querySelector('#gm-global-delay');
  const globalDelayNum = container.querySelector('#gm-delay-num');
  const delayValText = container.querySelector('#gm-delay-val');
  const fpsValText = container.querySelector('#gm-fps-val');
  const colorsSelect = container.querySelector('#gm-colors');
  const ditherSelect = container.querySelector('#gm-dither');
  const loopInput = container.querySelector('#gm-loop');
  const generateBtn = container.querySelector('#gm-generate-btn');

  const progressWrap = container.querySelector('#gm-progress-wrap');
  const progressBar = container.querySelector('#gm-progress-bar');
  const progressText = container.querySelector('#gm-progress-text');

  const outputWrap = container.querySelector('#gm-output-wrap');
  const outputImg = container.querySelector('#gm-output-img');
  const outputStats = container.querySelector('#gm-output-stats');
  const downloadBtn = container.querySelector('#gm-download-btn');

  let generatedBlob = null;

  // File Browsing & Drop Handling
  browseBtn.addEventListener('click', () => fileInput.click());
  addMoreBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await loadFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await loadFiles(Array.from(e.dataTransfer.files));
    }
  });

  demoBtn.addEventListener('click', async () => {
    const demoDataUrls = generateDemoSample('images');
    for (const dataUrl of demoDataUrls) {
      const img = await loadImageFromSrc(dataUrl);
      frames.push({
        id: nextId++,
        src: dataUrl,
        img: img,
        delay: parseInt(globalDelaySlider.value, 10) * 10
      });
    }
    renderFrameList();
  });

  clearBtn.addEventListener('click', () => {
    frames = [];
    renderFrameList();
    outputWrap.classList.add('hidden');
  });

  // Delay & FPS bi-directional sync
  function updateFps() {
    const delayHundredths = parseInt(globalDelaySlider.value, 10);
    delayValText.textContent = delayHundredths;
    globalDelayNum.value = delayHundredths;
    const fps = (100 / delayHundredths).toFixed(1);
    fpsValText.textContent = `${fps} FPS`;

    // Update individual frame delays
    frames.forEach(f => f.delay = delayHundredths * 10);
  }

  globalDelaySlider.addEventListener('input', () => updateFps());
  globalDelayNum.addEventListener('input', () => {
    let val = parseInt(globalDelayNum.value, 10);
    if (isNaN(val) || val < 2) val = 2;
    globalDelaySlider.value = val;
    updateFps();
  });

  async function loadFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
      });
      const img = await loadImageFromSrc(dataUrl);
      frames.push({
        id: nextId++,
        src: dataUrl,
        img: img,
        delay: parseInt(globalDelaySlider.value, 10) * 10
      });
    }
    renderFrameList();
  }

  function renderFrameList() {
    frameCountSpan.textContent = frames.length;
    if (frames.length === 0) {
      stage.classList.add('hidden');
      return;
    }
    stage.classList.remove('hidden');
    framesGrid.innerHTML = '';

    frames.forEach((frame, idx) => {
      const card = document.createElement('div');
      card.className = 'frame-card';
      card.innerHTML = `
        <div class="frame-thumb-wrap">
          <img src="${frame.src}" class="frame-thumb" alt="Frame ${idx + 1}" />
          <span class="frame-badge">#${idx + 1}</span>
        </div>
        <div class="frame-details">
          <div class="frame-dims">${frame.img.naturalWidth} &times; ${frame.img.naturalHeight}</div>
          <div class="frame-controls">
            <button class="frame-btn move-up" title="Move Left/Up" ${idx === 0 ? 'disabled' : ''}>&larr;</button>
            <button class="frame-btn move-down" title="Move Right/Down" ${idx === frames.length - 1 ? 'disabled' : ''}>&rarr;</button>
            <button class="frame-btn delete-btn" title="Remove Frame">&times;</button>
          </div>
        </div>
      `;

      card.querySelector('.move-up').addEventListener('click', () => {
        if (idx > 0) {
          const temp = frames[idx];
          frames[idx] = frames[idx - 1];
          frames[idx - 1] = temp;
          renderFrameList();
        }
      });

      card.querySelector('.move-down').addEventListener('click', () => {
        if (idx < frames.length - 1) {
          const temp = frames[idx];
          frames[idx] = frames[idx + 1];
          frames[idx + 1] = temp;
          renderFrameList();
        }
      });

      card.querySelector('.delete-btn').addEventListener('click', () => {
        frames.splice(idx, 1);
        renderFrameList();
      });

      framesGrid.appendChild(card);
    });
  }

  // Generate GIF
  generateBtn.addEventListener('click', async () => {
    if (frames.length < 2) {
      alert('Please add at least 2 image frames to create an animated GIF.');
      return;
    }
    if (isProcessing) return;

    try {
      isProcessing = true;
      generateBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Preparing frame canvases...';

      // Find max dimensions to fit mixed frames
      const maxWidth = Math.max(...frames.map(f => f.img.naturalWidth));
      const maxHeight = Math.max(...frames.map(f => f.img.naturalHeight));

      // Build uniform canvas frames
      const canvasFrames = frames.map(f => {
        const c = document.createElement('canvas');
        c.width = maxWidth;
        c.height = maxHeight;
        const ctx = c.getContext('2d');
        // Center frame if dimensions differ
        const offsetX = (maxWidth - f.img.naturalWidth) / 2;
        const offsetY = (maxHeight - f.img.naturalHeight) / 2;
        ctx.drawImage(f.img, offsetX, offsetY);
        return {
          canvas: c,
          delay: f.delay
        };
      });

      const maxColors = parseInt(colorsSelect.value, 10);
      const dither = ditherSelect.value;
      const loop = parseInt(loopInput.value, 10) || 0;

      const blob = await encodeGif(canvasFrames, {
        maxColors,
        dither,
        loop,
        onProgress: (pct) => {
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `Encoding GIF... ${pct}%`;
        }
      });

      generatedBlob = blob;
      const gifUrl = URL.createObjectURL(blob);
      outputImg.src = gifUrl;

      outputStats.innerHTML = `
        <div class="stat-pill"><span class="stat-label">File Size:</span> <strong>${formatBytes(blob.size)}</strong></div>
        <div class="stat-pill"><span class="stat-label">Resolution:</span> <strong>${maxWidth} &times; ${maxHeight} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Frames:</span> <strong>${frames.length}</strong></div>
        <div class="stat-pill"><span class="stat-label">Colors:</span> <strong>${maxColors}</strong></div>
      `;

      outputWrap.classList.remove('hidden');
      outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      alert('Error creating GIF: ' + err.message);
    } finally {
      isProcessing = false;
      generateBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (generatedBlob) {
      downloadBlob(generatedBlob, `pixelmint-animation-${Date.now()}.gif`);
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

  // Direct injection API if media passed from another tool
  return {
    loadMedia: async (blob) => {
      const dataUrl = URL.createObjectURL(blob);
      const img = await loadImageFromSrc(dataUrl);
      frames.push({
        id: nextId++,
        src: dataUrl,
        img: img,
        delay: parseInt(globalDelaySlider.value, 10) * 10
      });
      renderFrameList();
    }
  };
}
