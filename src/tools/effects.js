/**
 * Effects & Color Studio Tool for PixelMint
 * Applies color adjustments, filters, rotation, flip, speed change, and frame reversal
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { applyFiltersToCanvas, transformCanvas } from '../utils/canvasUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderEffects(container, onChainMedia) {
  let loadedFile = null;
  let isGif = false;
  let decodedGifData = null;
  let staticImage = null;
  let isProcessing = false;
  let generatedBlob = null;

  // Filter & Transform State
  let filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0
  };
  let rotationAngle = 0;
  let flipHorizontal = false;
  let flipVertical = false;
  let speedMultiplier = 1.0;
  let isReversed = false;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/tools-wizard.png" class="tool-hero-icon" alt="Effects" />
          <span class="tool-badge">Creative Studio</span>
          <h2>Effects & Adjustments</h2>
        </div>
        <p class="tool-description">
          Apply visual color filters, adjustments, rotation, horizontal/vertical mirroring, animation speed changes, and frame reversal.
        </p>
      </div>

      <!-- Ingestion Card -->
      <div class="card dropzone-card" id="ef-dropzone">
        <input type="file" id="ef-file-input" accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
              <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
              <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
              <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
              <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
              <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
            </svg>
          </div>
          <h3>Choose, drop, or paste an image or GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF, PNG, JPG, WebP.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="ef-browse-btn">Browse File</button>
            <button class="btn btn-secondary" id="ef-demo-btn">Load Demo Image</button>
          </div>
        </div>
      </div>

      <!-- Effects Controls Stage -->
      <div id="ef-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <!-- Live Preview Canvas -->
          <div class="preview-box">
            <canvas id="ef-preview-canvas" class="media-preview"></canvas>
          </div>

          <!-- Filter Presets -->
          <div class="presets-row">
            <span class="preset-label">Presets:</span>
            <button class="btn btn-xs btn-outline ef-preset-btn" data-preset="normal">Original</button>
            <button class="btn btn-xs btn-outline ef-preset-btn" data-preset="grayscale">Grayscale</button>
            <button class="btn btn-xs btn-outline ef-preset-btn" data-preset="sepia">Vintage Sepia</button>
            <button class="btn btn-xs btn-outline ef-preset-btn" data-preset="invert">Invert Negative</button>
            <button class="btn btn-xs btn-outline ef-preset-btn" data-preset="vibrant">Vibrant Pop</button>
            <button class="btn btn-xs btn-outline ef-preset-btn" data-preset="cool">Cool Mint</button>
          </div>

          <!-- Color Sliders -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="ef-brightness">Brightness: <span id="ef-bright-val">100%</span></label>
              <input type="range" id="ef-brightness" min="20" max="200" value="100" class="slider" />
            </div>

            <div class="form-group">
              <label for="ef-contrast">Contrast: <span id="ef-contrast-val">100%</span></label>
              <input type="range" id="ef-contrast" min="20" max="200" value="100" class="slider" />
            </div>

            <div class="form-group">
              <label for="ef-saturation">Saturation: <span id="ef-sat-val">100%</span></label>
              <input type="range" id="ef-saturation" min="0" max="250" value="100" class="slider" />
            </div>

            <div class="form-group">
              <label for="ef-hue">Hue Shift: <span id="ef-hue-val">0°</span></label>
              <input type="range" id="ef-hue" min="-180" max="180" value="0" class="slider" />
            </div>
          </div>

          <!-- Transform & Playback Controls -->
          <div class="transform-section-title">Orientation & Playback</div>
          <div class="settings-grid">
            <div class="form-group">
              <label>Rotate & Flip</label>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline" id="ef-rot-left">↺ 90°</button>
                <button class="btn btn-sm btn-outline" id="ef-rot-right">↻ 90°</button>
                <button class="btn btn-sm btn-outline" id="ef-flip-h">⇄ Flip H</button>
                <button class="btn btn-sm btn-outline" id="ef-flip-v">⇅ Flip V</button>
              </div>
            </div>

            <div class="form-group" id="ef-gif-speed-wrap">
              <label for="ef-speed">Animation Speed</label>
              <select id="ef-speed" class="select-input">
                <option value="0.5">0.5x (Slow Motion)</option>
                <option value="1.0" selected>1.0x (Normal)</option>
                <option value="1.25">1.25x (Fast)</option>
                <option value="1.5">1.5x (Faster)</option>
                <option value="2.0">2.0x (Double Speed)</option>
              </select>
            </div>

            <div class="form-group checkbox-group" id="ef-gif-reverse-wrap">
              <label class="custom-checkbox">
                <input type="checkbox" id="ef-reverse" />
                <span class="checkbox-mark"></span>
                Reverse Animation Playback
              </label>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="ef-execute-btn">
              <img src="/icons/tools-wizard.png" class="btn-icon-img" alt="" /> Apply Effects!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="ef-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="ef-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="ef-progress-text">Applying effects... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="ef-output-wrap" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Rendered Result</h3>
            <span class="status-pill status-success">Ready</span>
          </div>

          <div class="output-preview-container">
            <img id="ef-output-img" class="output-preview-img" alt="Result" />
          </div>

          <div class="output-stats" id="ef-output-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="ef-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download File
            </button>
          </div>

          <!-- Chaining Action Bar -->
          <div class="chain-pipeline">
            <div class="chain-title">Chain this result into another tool:</div>
            <div class="chain-buttons">
              <button class="chain-btn" data-tool="cropper"><img src="/icons/transform-crop.png" class="chain-btn-icon" alt="" /> Crop</button>
              <button class="chain-btn" data-tool="resizer"><img src="/icons/transform-scale.png" class="chain-btn-icon" alt="" /> Resize</button>
              <button class="chain-btn" data-tool="optimizer"><img src="/icons/speedometer.png" class="chain-btn-icon" alt="" /> Optimize</button>
              <button class="chain-btn" data-tool="converter"><img src="/icons/view-refresh.png" class="chain-btn-icon" alt="" /> Convert</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#ef-dropzone');
  const fileInput = container.querySelector('#ef-file-input');
  const browseBtn = container.querySelector('#ef-browse-btn');
  const demoBtn = container.querySelector('#ef-demo-btn');
  const stage = container.querySelector('#ef-stage');
  const previewCanvas = container.querySelector('#ef-preview-canvas');

  const brightSlider = container.querySelector('#ef-brightness');
  const contrastSlider = container.querySelector('#ef-contrast');
  const satSlider = container.querySelector('#ef-saturation');
  const hueSlider = container.querySelector('#ef-hue');
  const brightVal = container.querySelector('#ef-bright-val');
  const contrastVal = container.querySelector('#ef-contrast-val');
  const satVal = container.querySelector('#ef-sat-val');
  const hueVal = container.querySelector('#ef-hue-val');

  const rotLeftBtn = container.querySelector('#ef-rot-left');
  const rotRightBtn = container.querySelector('#ef-rot-right');
  const flipHBtn = container.querySelector('#ef-flip-h');
  const flipVBtn = container.querySelector('#ef-flip-v');
  const speedSelect = container.querySelector('#ef-speed');
  const reverseCheck = container.querySelector('#ef-reverse');
  const executeBtn = container.querySelector('#ef-execute-btn');

  const progressWrap = container.querySelector('#ef-progress-wrap');
  const progressBar = container.querySelector('#ef-progress-bar');
  const progressText = container.querySelector('#ef-progress-text');

  const outputWrap = container.querySelector('#ef-output-wrap');
  const outputImg = container.querySelector('#ef-output-img');
  const outputStats = container.querySelector('#ef-output-stats');
  const downloadBtn = container.querySelector('#ef-download-btn');

  // File loading
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
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
      loadFile(e.dataTransfer.files[0]);
    }
  });

  demoBtn.addEventListener('click', async () => {
    const c = document.createElement('canvas');
    c.width = 500;
    c.height = 350;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 500, 350);
    grad.addColorStop(0, '#312e81');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 500, 350);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PixelMint Effects Studio', 250, 160);
    ctx.font = '18px system-ui';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Live adjustment filters & transformations', 250, 200);

    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    loadFile(blob, 'sample-effects.png');
  });

  async function loadFile(file) {
    loadedFile = file;
    const isImageGif = file.type === 'image/gif' || (file.name && file.name.toLowerCase().endsWith('.gif'));
    isGif = isImageGif;

    if (isGif) {
      const buffer = await readFileAsArrayBuffer(file);
      decodedGifData = await decodeGif(buffer);
    } else {
      const dataUrl = await readFileAsDataURL(file);
      staticImage = await loadImageFromSrc(dataUrl);
    }

    resetControls();
    stage.classList.remove('hidden');
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    updateLivePreview();
  }

  function resetControls() {
    filters = { brightness: 100, contrast: 100, saturation: 100, hue: 0, grayscale: 0, sepia: 0, invert: 0 };
    rotationAngle = 0;
    flipHorizontal = false;
    flipVertical = false;
    speedMultiplier = 1.0;
    isReversed = false;

    brightSlider.value = 100;
    contrastSlider.value = 100;
    satSlider.value = 100;
    hueSlider.value = 0;
    brightVal.textContent = '100%';
    contrastVal.textContent = '100%';
    satVal.textContent = '100%';
    hueVal.textContent = '0°';
    speedSelect.value = '1.0';
    reverseCheck.checked = false;
  }

  // Live Canvas Preview Update
  function updateLivePreview() {
    let baseCanvas;
    if (isGif && decodedGifData) {
      baseCanvas = decodedGifData.frames[0].canvas;
    } else if (staticImage) {
      baseCanvas = document.createElement('canvas');
      baseCanvas.width = staticImage.naturalWidth;
      baseCanvas.height = staticImage.naturalHeight;
      const ctx = baseCanvas.getContext('2d');
      ctx.drawImage(staticImage, 0, 0);
    } else {
      return;
    }

    // Apply color filters
    const filtered = applyFiltersToCanvas(baseCanvas, filters);
    // Apply transform
    const transformed = transformCanvas(filtered, rotationAngle, flipHorizontal, flipVertical);

    previewCanvas.width = transformed.width;
    previewCanvas.height = transformed.height;
    const pCtx = previewCanvas.getContext('2d');
    pCtx.drawImage(transformed, 0, 0);
  }

  // Sliders binding
  brightSlider.addEventListener('input', () => {
    filters.brightness = parseInt(brightSlider.value, 10);
    brightVal.textContent = `${filters.brightness}%`;
    updateLivePreview();
  });

  contrastSlider.addEventListener('input', () => {
    filters.contrast = parseInt(contrastSlider.value, 10);
    contrastVal.textContent = `${filters.contrast}%`;
    updateLivePreview();
  });

  satSlider.addEventListener('input', () => {
    filters.saturation = parseInt(satSlider.value, 10);
    satVal.textContent = `${filters.saturation}%`;
    updateLivePreview();
  });

  hueSlider.addEventListener('input', () => {
    filters.hue = parseInt(hueSlider.value, 10);
    hueVal.textContent = `${filters.hue}°`;
    updateLivePreview();
  });

  // Preset Buttons
  container.querySelectorAll('.ef-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      filters.grayscale = 0;
      filters.sepia = 0;
      filters.invert = 0;
      filters.hue = 0;
      filters.saturation = 100;
      filters.contrast = 100;
      filters.brightness = 100;

      if (p === 'grayscale') filters.grayscale = 100;
      if (p === 'sepia') filters.sepia = 100;
      if (p === 'invert') filters.invert = 100;
      if (p === 'vibrant') {
        filters.saturation = 160;
        filters.contrast = 115;
      }
      if (p === 'cool') {
        filters.hue = 140;
        filters.saturation = 120;
      }

      brightSlider.value = filters.brightness;
      contrastSlider.value = filters.contrast;
      satSlider.value = filters.saturation;
      hueSlider.value = filters.hue;
      brightVal.textContent = `${filters.brightness}%`;
      contrastVal.textContent = `${filters.contrast}%`;
      satVal.textContent = `${filters.saturation}%`;
      hueVal.textContent = `${filters.hue}°`;

      updateLivePreview();
    });
  });

  // Transform buttons
  rotLeftBtn.addEventListener('click', () => {
    rotationAngle = (rotationAngle - 90) % 360;
    updateLivePreview();
  });
  rotRightBtn.addEventListener('click', () => {
    rotationAngle = (rotationAngle + 90) % 360;
    updateLivePreview();
  });
  flipHBtn.addEventListener('click', () => {
    flipHorizontal = !flipHorizontal;
    updateLivePreview();
  });
  flipVBtn.addEventListener('click', () => {
    flipVertical = !flipVertical;
    updateLivePreview();
  });

  speedSelect.addEventListener('change', () => {
    speedMultiplier = parseFloat(speedSelect.value);
  });
  reverseCheck.addEventListener('change', () => {
    isReversed = reverseCheck.checked;
  });

  // Execute Effects
  executeBtn.addEventListener('click', async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      executeBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Rendering effects...';

      if (isGif && decodedGifData) {
        let frameList = [...decodedGifData.frames];
        if (isReversed) {
          frameList.reverse();
        }

        const total = frameList.length;
        const processedFrames = [];

        for (let i = 0; i < total; i++) {
          const f = frameList[i];
          const filtered = applyFiltersToCanvas(f.canvas, filters);
          const transformed = transformCanvas(filtered, rotationAngle, flipHorizontal, flipVertical);

          // Speed multiplier adjusts frame delay inversely (e.g. 2x speed -> half delay)
          const newDelay = Math.max(20, Math.round(f.delay / speedMultiplier));

          processedFrames.push({
            canvas: transformed,
            delay: newDelay
          });

          const pct = Math.round(((i + 1) / total) * 50);
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `Processing frame ${i + 1} of ${total}...`;
          if (i % 2 === 0) await new Promise(r => setTimeout(r, 0));
        }

        progressText.textContent = 'Encoding resulting GIF...';
        const blob = await encodeGif(processedFrames, {
          maxColors: 256,
          dither: 'floyd',
          loop: decodedGifData.loopCount,
          onProgress: (encPct) => {
            const overall = 50 + Math.round(encPct * 0.5);
            progressBar.style.width = `${overall}%`;
            progressText.textContent = `Encoding GIF... ${overall}%`;
          }
        });

        generatedBlob = blob;
      } else {
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = staticImage.naturalWidth;
        baseCanvas.height = staticImage.naturalHeight;
        const ctx = baseCanvas.getContext('2d');
        ctx.drawImage(staticImage, 0, 0);

        const filtered = applyFiltersToCanvas(baseCanvas, filters);
        const transformed = transformCanvas(filtered, rotationAngle, flipHorizontal, flipVertical);

        const mimeType = loadedFile.type || 'image/png';
        const blob = await new Promise(r => transformed.toBlob(r, mimeType, 0.95));
        generatedBlob = blob;
      }

      const outUrl = URL.createObjectURL(generatedBlob);
      outputImg.src = outUrl;

      outputStats.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Output Size:</span> <strong>${formatBytes(generatedBlob.size)}</strong></div>
        <div class="stat-pill"><span class="stat-label">Dimensions:</span> <strong>${outputImg.naturalWidth || previewCanvas.width} &times; ${outputImg.naturalHeight || previewCanvas.height} px</strong></div>
      `;

      outputWrap.classList.remove('hidden');
      outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      alert('Error applying effects: ' + err.message);
    } finally {
      isProcessing = false;
      executeBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (generatedBlob) {
      const ext = isGif ? 'gif' : 'png';
      downloadBlob(generatedBlob, `pixelmint-effects-${Date.now()}.${ext}`);
    }
  });

  // Chaining buttons
  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTool = btn.dataset.tool;
      if (generatedBlob && onChainMedia) {
        onChainMedia(targetTool, generatedBlob, isGif ? 'image/gif' : 'image/png');
      }
    });
  });

  return {
    loadMedia: (blob) => loadFile(blob)
  };
}
