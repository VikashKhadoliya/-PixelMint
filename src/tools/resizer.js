/**
 * Image & GIF Resizer for PixelMint
 * Scales static images and multi-frame animated GIFs preserving animation timing
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { resizeCanvas } from '../utils/canvasUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderResizer(container, onChainMedia) {
  let loadedFile = null;
  let isGif = false;
  let originalWidth = 0;
  let originalHeight = 0;
  let decodedGifData = null; // { width, height, frames, loopCount }
  let staticImage = null;
  let isProcessing = false;
  let generatedBlob = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/transform-scale.png" class="tool-hero-icon" alt="Resizer" />
          <span class="tool-badge">Transformation</span>
          <h2>Image & Animated GIF Resizer</h2>
        </div>
        <p class="tool-description">
          Resize still images (PNG, JPG, WebP) and multi-frame animated GIFs without losing quality or animation timing.
        </p>
      </div>

      <!-- Ingestion Card -->
      <div class="card dropzone-card" id="rs-dropzone">
        <input type="file" id="rs-file-input" accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </div>
          <h3>Choose, drop, or paste an image or GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF, PNG, JPG, WebP.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="rs-browse-btn">Browse File</button>
            <button class="btn btn-secondary" id="rs-demo-btn">Load Demo Image</button>
          </div>
        </div>
      </div>

      <!-- Resizer Controls Stage -->
      <div id="rs-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <div class="preview-box">
            <img id="rs-preview-img" class="media-preview" alt="Source preview" />
          </div>

          <div class="video-metadata" id="rs-meta"></div>

          <!-- Dimension Controls -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="rs-width">Width (pixels)</label>
              <input type="number" id="rs-width" min="1" max="7680" class="num-input" />
            </div>

            <div class="form-group">
              <label for="rs-height">Height (pixels)</label>
              <input type="number" id="rs-height" min="1" max="7680" class="num-input" />
            </div>

            <div class="form-group checkbox-group">
              <label class="custom-checkbox">
                <input type="checkbox" id="rs-lock-aspect" checked />
                <span class="checkbox-mark"></span>
                Lock Aspect Ratio
              </label>
            </div>

            <div class="form-group">
              <label for="rs-mode">Resize Mode</label>
              <select id="rs-mode" class="select-input">
                <option value="fit" selected>Proportional Fit (Preserve All)</option>
                <option value="stretch">Stretch to Exact Dimensions</option>
                <option value="crop">Center & Crop to Fill</option>
              </select>
            </div>
          </div>

          <!-- Preset Percentage Buttons -->
          <div class="presets-row">
            <span class="preset-label">Quick Scale:</span>
            <button class="btn btn-xs btn-outline rs-pct-btn" data-pct="25">25%</button>
            <button class="btn btn-xs btn-outline rs-pct-btn" data-pct="50">50%</button>
            <button class="btn btn-xs btn-outline rs-pct-btn" data-pct="75">75%</button>
            <button class="btn btn-xs btn-outline rs-pct-btn" data-pct="150">150%</button>
            <button class="btn btn-xs btn-outline rs-pct-btn" data-pct="200">200%</button>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="rs-execute-btn">
              <img src="/icons/transform-scale.png" class="btn-icon-img" alt="" /> Resize Image!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="rs-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="rs-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="rs-progress-text">Resizing frames... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="rs-output-wrap" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Resized Result</h3>
            <span class="status-pill status-success">Ready</span>
          </div>

          <div class="output-preview-container">
            <img id="rs-output-img" class="output-preview-img" alt="Resized image" />
          </div>

          <div class="output-stats" id="rs-output-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="rs-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Resized File
            </button>
          </div>

          <!-- Chaining Action Bar -->
          <div class="chain-pipeline">
            <div class="chain-title">Chain this result into another tool:</div>
            <div class="chain-buttons">
              <button class="chain-btn" data-tool="cropper"><img src="/icons/transform-crop.png" class="chain-btn-icon" alt="" /> Crop</button>
              <button class="chain-btn" data-tool="optimizer"><img src="/icons/speedometer.png" class="chain-btn-icon" alt="" /> Optimize</button>
              <button class="chain-btn" data-tool="effects"><img src="/icons/tools-wizard.png" class="chain-btn-icon" alt="" /> Effects</button>
              <button class="chain-btn" data-tool="converter"><img src="/icons/view-refresh.png" class="chain-btn-icon" alt="" /> Convert</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#rs-dropzone');
  const fileInput = container.querySelector('#rs-file-input');
  const browseBtn = container.querySelector('#rs-browse-btn');
  const demoBtn = container.querySelector('#rs-demo-btn');
  const stage = container.querySelector('#rs-stage');
  const previewImg = container.querySelector('#rs-preview-img');
  const metaBox = container.querySelector('#rs-meta');

  const widthInput = container.querySelector('#rs-width');
  const heightInput = container.querySelector('#rs-height');
  const lockAspectCheck = container.querySelector('#rs-lock-aspect');
  const modeSelect = container.querySelector('#rs-mode');
  const executeBtn = container.querySelector('#rs-execute-btn');

  const progressWrap = container.querySelector('#rs-progress-wrap');
  const progressBar = container.querySelector('#rs-progress-bar');
  const progressText = container.querySelector('#rs-progress-text');

  const outputWrap = container.querySelector('#rs-output-wrap');
  const outputImg = container.querySelector('#rs-output-img');
  const outputStats = container.querySelector('#rs-output-stats');
  const downloadBtn = container.querySelector('#rs-download-btn');

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
    // Generate sample image
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PixelMint Sample', 300, 190);
    ctx.font = '20px system-ui';
    ctx.fillStyle = '#34d399';
    ctx.fillText('600 x 400 Standard Test Canvas', 300, 235);

    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    loadFile(blob, 'sample-pixelmint.png');
  });

  async function loadFile(file, customName) {
    loadedFile = file;
    const isImageGif = file.type === 'image/gif' || (file.name && file.name.toLowerCase().endsWith('.gif'));
    isGif = isImageGif;

    const dataUrl = await readFileAsDataURL(file);
    previewImg.src = dataUrl;

    if (isGif) {
      const buffer = await readFileAsArrayBuffer(file);
      decodedGifData = await decodeGif(buffer);
      originalWidth = decodedGifData.width;
      originalHeight = decodedGifData.height;

      metaBox.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Type:</span> <strong>Animated GIF (${decodedGifData.frames.length} frames)</strong></div>
        <div class="stat-pill"><span class="stat-label">Dimensions:</span> <strong>${originalWidth} &times; ${originalHeight} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Size:</span> <strong>${formatBytes(file.size)}</strong></div>
      `;
    } else {
      staticImage = await loadImageFromSrc(dataUrl);
      originalWidth = staticImage.naturalWidth;
      originalHeight = staticImage.naturalHeight;
      metaBox.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Type:</span> <strong>Static Image</strong></div>
        <div class="stat-pill"><span class="stat-label">Dimensions:</span> <strong>${originalWidth} &times; ${originalHeight} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Size:</span> <strong>${formatBytes(file.size)}</strong></div>
      `;
    }

    widthInput.value = originalWidth;
    heightInput.value = originalHeight;
    stage.classList.remove('hidden');
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Aspect Ratio Sync
  widthInput.addEventListener('input', () => {
    if (lockAspectCheck.checked && originalWidth > 0) {
      const w = parseInt(widthInput.value, 10);
      if (w > 0) {
        heightInput.value = Math.round((w / originalWidth) * originalHeight);
      }
    }
  });

  heightInput.addEventListener('input', () => {
    if (lockAspectCheck.checked && originalHeight > 0) {
      const h = parseInt(heightInput.value, 10);
      if (h > 0) {
        widthInput.value = Math.round((h / originalHeight) * originalWidth);
      }
    }
  });

  // Scale Percentage Buttons
  container.querySelectorAll('.rs-pct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseFloat(btn.dataset.pct) / 100;
      widthInput.value = Math.max(1, Math.round(originalWidth * pct));
      heightInput.value = Math.max(1, Math.round(originalHeight * pct));
    });
  });

  // Resize Execution
  executeBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    const targetW = parseInt(widthInput.value, 10);
    const targetH = parseInt(heightInput.value, 10);

    if (isNaN(targetW) || isNaN(targetH) || targetW < 1 || targetH < 1) {
      alert('Please enter valid width and height values.');
      return;
    }

    try {
      isProcessing = true;
      executeBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Processing resize...';

      const mode = modeSelect.value;

      if (isGif && decodedGifData) {
        // Multi-frame animated GIF resize
        const total = decodedGifData.frames.length;
        const resizedFrames = [];

        for (let i = 0; i < total; i++) {
          const frame = decodedGifData.frames[i];
          const resized = resizeCanvas(frame.canvas, targetW, targetH, mode);
          resizedFrames.push({
            canvas: resized,
            delay: frame.delay
          });

          const pct = Math.round(((i + 1) / total) * 50);
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `Rescaling frame ${i + 1} of ${total}...`;
          if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));
        }

        progressText.textContent = 'Re-encoding animated GIF...';
        const blob = await encodeGif(resizedFrames, {
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
        // Static image resize
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(staticImage, 0, 0);

        const resizedCanvas = resizeCanvas(tempCanvas, targetW, targetH, mode);
        const mimeType = loadedFile.type || 'image/png';
        const blob = await new Promise(r => resizedCanvas.toBlob(r, mimeType, 0.92));
        generatedBlob = blob;
      }

      const outUrl = URL.createObjectURL(generatedBlob);
      outputImg.src = outUrl;

      outputStats.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Original:</span> <strong>${originalWidth} &times; ${originalHeight} px (${formatBytes(loadedFile.size)})</strong></div>
        <div class="stat-pill"><span class="stat-label">Resized:</span> <strong>${targetW} &times; ${targetH} px (${formatBytes(generatedBlob.size)})</strong></div>
      `;

      outputWrap.classList.remove('hidden');
      outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      alert('Error resizing: ' + err.message);
    } finally {
      isProcessing = false;
      executeBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (generatedBlob) {
      const ext = isGif ? 'gif' : 'png';
      downloadBlob(generatedBlob, `pixelmint-resized-${Date.now()}.${ext}`);
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
