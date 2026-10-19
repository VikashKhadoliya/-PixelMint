/**
 * Interactive Image & Animated GIF Cropper for PixelMint
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { cropCanvas } from '../utils/canvasUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderCropper(container, onChainMedia) {
  let loadedFile = null;
  let isGif = false;
  let originalWidth = 0;
  let originalHeight = 0;
  let decodedGifData = null;
  let staticImage = null;
  let isProcessing = false;
  let generatedBlob = null;

  // Crop Box normalized coordinates (0..1)
  let cropState = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
  let isDraggingBox = false;
  let activeHandle = null;
  let dragStartX = 0, dragStartY = 0;
  let initialCropState = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/transform-crop.svg" class="tool-hero-icon" alt="Cropper" />
          <span class="tool-badge">Transformation</span>
          <h2>Image & Animated GIF Cropper</h2>
        </div>
        <p class="tool-description">
          Crop static images or animated GIFs with precision. Drag to frame your crop area or choose predefined aspect ratios.
        </p>
      </div>

      <!-- Ingestion Card -->
      <div class="card dropzone-card" id="cr-dropzone">
        <input type="file" id="cr-file-input" accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
              <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
            </svg>
          </div>
          <h3>Choose, drop, or paste an image or GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF, PNG, JPG, WebP.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="cr-browse-btn">Browse File</button>
            <button class="btn btn-secondary" id="cr-demo-btn">Load Demo Image</button>
          </div>
        </div>
      </div>

      <!-- Interactive Crop Stage -->
      <div id="cr-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <!-- Interactive Crop Canvas Overlay Area -->
          <div class="crop-interactive-wrapper" id="cr-canvas-wrap">
            <img id="cr-source-img" class="crop-source-img" alt="Source" />
            <div id="cr-crop-box" class="crop-selection-box">
              <div class="crop-handle handle-tl" data-handle="tl"></div>
              <div class="crop-handle handle-tr" data-handle="tr"></div>
              <div class="crop-handle handle-bl" data-handle="bl"></div>
              <div class="crop-handle handle-br" data-handle="br"></div>
              <div class="crop-grid-lines"></div>
            </div>
          </div>

          <!-- Numerical Inputs & Aspect Controls -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="cr-x">Left (X px)</label>
              <input type="number" id="cr-x" min="0" class="num-input" />
            </div>

            <div class="form-group">
              <label for="cr-y">Top (Y px)</label>
              <input type="number" id="cr-y" min="0" class="num-input" />
            </div>

            <div class="form-group">
              <label for="cr-w">Crop Width (px)</label>
              <input type="number" id="cr-w" min="1" class="num-input" />
            </div>

            <div class="form-group">
              <label for="cr-h">Crop Height (px)</label>
              <input type="number" id="cr-h" min="1" class="num-input" />
            </div>

            <div class="form-group">
              <label for="cr-aspect">Lock Aspect Ratio</label>
              <select id="cr-aspect" class="select-input">
                <option value="free" selected>Free (Unconstrained)</option>
                <option value="1:1">1:1 Square (Avatar / Social)</option>
                <option value="16:9">16:9 Landscape (Video / Screen)</option>
                <option value="4:3">4:3 Standard Photo</option>
                <option value="9:16">9:16 Vertical (Story / Reel)</option>
                <option value="3:2">3:2 Classic 35mm</option>
              </select>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="cr-execute-btn">
              <img src="/icons/transform-crop.svg" class="btn-icon-img" alt="" /> Crop Media!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="cr-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="cr-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="cr-progress-text">Cropping frames... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="cr-output-wrap" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Cropped Output</h3>
            <span class="status-pill status-success">Ready</span>
          </div>

          <div class="output-preview-container">
            <img id="cr-output-img" class="output-preview-img" alt="Cropped image" />
          </div>

          <div class="output-stats" id="cr-output-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="cr-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Cropped File
            </button>
          </div>

          <!-- Chaining Action Bar -->
          <div class="chain-pipeline">
            <div class="chain-title">Chain this result into another tool:</div>
            <div class="chain-buttons">
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

  // Selectors
  const dropzone = container.querySelector('#cr-dropzone');
  const fileInput = container.querySelector('#cr-file-input');
  const browseBtn = container.querySelector('#cr-browse-btn');
  const demoBtn = container.querySelector('#cr-demo-btn');
  const stage = container.querySelector('#cr-stage');
  const canvasWrap = container.querySelector('#cr-canvas-wrap');
  const sourceImg = container.querySelector('#cr-source-img');
  const cropBox = container.querySelector('#cr-crop-box');

  const xInput = container.querySelector('#cr-x');
  const yInput = container.querySelector('#cr-y');
  const wInput = container.querySelector('#cr-w');
  const hInput = container.querySelector('#cr-h');
  const aspectSelect = container.querySelector('#cr-aspect');
  const executeBtn = container.querySelector('#cr-execute-btn');

  const progressWrap = container.querySelector('#cr-progress-wrap');
  const progressBar = container.querySelector('#cr-progress-bar');
  const progressText = container.querySelector('#cr-progress-text');

  const outputWrap = container.querySelector('#cr-output-wrap');
  const outputImg = container.querySelector('#cr-output-img');
  const outputStats = container.querySelector('#cr-output-stats');
  const downloadBtn = container.querySelector('#cr-download-btn');

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
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(1, '#10b981');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PixelMint Interactive Cropper', 300, 180);
    ctx.font = '18px system-ui';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('Drag the bounding box or handles to frame the crop', 300, 220);

    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    loadFile(blob, 'sample-crop.png');
  });

  async function loadFile(file) {
    loadedFile = file;
    const isImageGif = file.type === 'image/gif' || (file.name && file.name.toLowerCase().endsWith('.gif'));
    isGif = isImageGif;

    const dataUrl = await readFileAsDataURL(file);
    sourceImg.src = dataUrl;

    if (isGif) {
      const buffer = await readFileAsArrayBuffer(file);
      decodedGifData = await decodeGif(buffer);
      originalWidth = decodedGifData.width;
      originalHeight = decodedGifData.height;
    } else {
      staticImage = await loadImageFromSrc(dataUrl);
      originalWidth = staticImage.naturalWidth;
      originalHeight = staticImage.naturalHeight;
    }

    cropState = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
    stage.classList.remove('hidden');
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    sourceImg.onload = () => {
      syncCropBoxUI();
    };
    syncCropBoxUI();
  }

  // Visual Sync between Crop Box and Numeric Inputs
  function syncCropBoxUI() {
    const rect = sourceImg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const left = cropState.x * rect.width;
    const top = cropState.y * rect.height;
    const width = cropState.w * rect.width;
    const height = cropState.h * rect.height;

    cropBox.style.left = `${left}px`;
    cropBox.style.top = `${top}px`;
    cropBox.style.width = `${width}px`;
    cropBox.style.height = `${height}px`;

    // Numerical pixel values
    const pxX = Math.round(cropState.x * originalWidth);
    const pxY = Math.round(cropState.y * originalHeight);
    const pxW = Math.round(cropState.w * originalWidth);
    const pxH = Math.round(cropState.h * originalHeight);

    xInput.value = pxX;
    yInput.value = pxY;
    wInput.value = pxW;
    hInput.value = pxH;
  }

  // Pointer & Touch Events for Dragging and Resizing Crop Box
  cropBox.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const handle = e.target.dataset.handle;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialCropState = { ...cropState };

    if (handle) {
      activeHandle = handle;
    } else {
      isDraggingBox = true;
    }

    const onPointerMove = (ev) => {
      const rect = sourceImg.getBoundingClientRect();
      const dx = (ev.clientX - dragStartX) / rect.width;
      const dy = (ev.clientY - dragStartY) / rect.height;

      if (isDraggingBox) {
        let newX = initialCropState.x + dx;
        let newY = initialCropState.y + dy;
        newX = Math.max(0, Math.min(newX, 1 - initialCropState.w));
        newY = Math.max(0, Math.min(newY, 1 - initialCropState.h));
        cropState.x = newX;
        cropState.y = newY;
      } else if (activeHandle) {
        let newX = initialCropState.x;
        let newY = initialCropState.y;
        let newW = initialCropState.w;
        let newH = initialCropState.h;

        if (activeHandle === 'br') {
          newW = Math.max(0.05, Math.min(initialCropState.w + dx, 1 - initialCropState.x));
          newH = Math.max(0.05, Math.min(initialCropState.h + dy, 1 - initialCropState.y));
        } else if (activeHandle === 'bl') {
          const rawW = initialCropState.w - dx;
          if (rawW >= 0.05 && initialCropState.x + dx >= 0) {
            newX = initialCropState.x + dx;
            newW = rawW;
          }
          newH = Math.max(0.05, Math.min(initialCropState.h + dy, 1 - initialCropState.y));
        } else if (activeHandle === 'tr') {
          newW = Math.max(0.05, Math.min(initialCropState.w + dx, 1 - initialCropState.x));
          const rawH = initialCropState.h - dy;
          if (rawH >= 0.05 && initialCropState.y + dy >= 0) {
            newY = initialCropState.y + dy;
            newH = rawH;
          }
        } else if (activeHandle === 'tl') {
          const rawW = initialCropState.w - dx;
          const rawH = initialCropState.h - dy;
          if (rawW >= 0.05 && initialCropState.x + dx >= 0) {
            newX = initialCropState.x + dx;
            newW = rawW;
          }
          if (rawH >= 0.05 && initialCropState.y + dy >= 0) {
            newY = initialCropState.y + dy;
            newH = rawH;
          }
        }

        cropState.x = newX;
        cropState.y = newY;
        cropState.w = newW;
        cropState.h = newH;
      }
      syncCropBoxUI();
    };

    const onPointerUp = () => {
      isDraggingBox = false;
      activeHandle = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });

  // Numeric input bindings
  function onNumericChange() {
    const x = parseInt(xInput.value, 10) || 0;
    const y = parseInt(yInput.value, 10) || 0;
    const w = parseInt(wInput.value, 10) || 1;
    const h = parseInt(hInput.value, 10) || 1;

    cropState.x = Math.max(0, Math.min(x / originalWidth, 1));
    cropState.y = Math.max(0, Math.min(y / originalHeight, 1));
    cropState.w = Math.max(0.05, Math.min(w / originalWidth, 1 - cropState.x));
    cropState.h = Math.max(0.05, Math.min(h / originalHeight, 1 - cropState.y));
    syncCropBoxUI();
  }

  [xInput, yInput, wInput, hInput].forEach(inp => inp.addEventListener('input', onNumericChange));

  // Aspect ratio presets
  aspectSelect.addEventListener('change', () => {
    const val = aspectSelect.value;
    if (val === 'free') return;
    const [ratioW, ratioH] = val.split(':').map(Number);
    const targetRatio = ratioW / ratioH;

    const currentW = cropState.w * originalWidth;
    let newH = currentW / targetRatio;
    if (newH / originalHeight > 1 - cropState.y) {
      newH = (1 - cropState.y) * originalHeight;
      cropState.w = (newH * targetRatio) / originalWidth;
      cropState.h = newH / originalHeight;
    } else {
      cropState.h = newH / originalHeight;
    }
    syncCropBoxUI();
  });

  window.addEventListener('resize', () => syncCropBoxUI());

  // Execute Crop
  executeBtn.addEventListener('click', async () => {
    if (isProcessing) return;

    const cropPx = {
      x: Math.round(cropState.x * originalWidth),
      y: Math.round(cropState.y * originalHeight),
      width: Math.round(cropState.w * originalWidth),
      height: Math.round(cropState.h * originalHeight)
    };

    if (cropPx.width < 2 || cropPx.height < 2) {
      alert('Crop area is too small.');
      return;
    }

    try {
      isProcessing = true;
      executeBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Processing crop...';

      if (isGif && decodedGifData) {
        const total = decodedGifData.frames.length;
        const croppedFrames = [];

        for (let i = 0; i < total; i++) {
          const frame = decodedGifData.frames[i];
          const croppedCanvas = cropCanvas(frame.canvas, cropPx);
          croppedFrames.push({
            canvas: croppedCanvas,
            delay: frame.delay
          });

          const pct = Math.round(((i + 1) / total) * 50);
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `Cropping frame ${i + 1} of ${total}...`;
          if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));
        }

        progressText.textContent = 'Encoding cropped GIF...';
        const blob = await encodeGif(croppedFrames, {
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
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(staticImage, 0, 0);

        const cropped = cropCanvas(tempCanvas, cropPx);
        const mimeType = loadedFile.type || 'image/png';
        const blob = await new Promise(r => cropped.toBlob(r, mimeType, 0.95));
        generatedBlob = blob;
      }

      const outUrl = URL.createObjectURL(generatedBlob);
      outputImg.src = outUrl;

      outputStats.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Source:</span> <strong>${originalWidth} &times; ${originalHeight} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Cropped:</span> <strong>${cropPx.width} &times; ${cropPx.height} px</strong></div>
        <div class="stat-pill"><span class="stat-label">File Size:</span> <strong>${formatBytes(generatedBlob.size)}</strong></div>
      `;

      outputWrap.classList.remove('hidden');
      outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      alert('Error cropping: ' + err.message);
    } finally {
      isProcessing = false;
      executeBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (generatedBlob) {
      const ext = isGif ? 'gif' : 'png';
      downloadBlob(generatedBlob, `pixelmint-cropped-${Date.now()}.${ext}`);
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
