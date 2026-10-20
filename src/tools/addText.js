/**
 * Add Text / Subtitles to Animated GIF & Images for PixelMint
 * Overlays custom text, subtitles, or watermarks across animated frames with customizable typography and frame ranges
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderAddText(container, onChainMedia) {
  let loadedFile = null;
  let isGif = false;
  let originalWidth = 0;
  let originalHeight = 0;
  let decodedGifData = null;
  let staticImage = null;
  let isProcessing = false;
  let generatedBlob = null;

  // Text Configuration State
  let textConfig = {
    content: 'YOUR TEXT HERE',
    fontSize: 36,
    fontFamily: 'Impact, sans-serif',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    position: 'bottom', // 'top' | 'center' | 'bottom' | 'custom'
    customX: 50, // %
    customY: 85, // %
    frameScope: 'all', // 'all' | 'range'
    startFrame: 1,
    endFrame: 1
  };

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="tool-hero-icon-svg" style="color: var(--brand-red);">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
          <span class="tool-badge">Typography</span>
          <h2>Add Text to Animated GIF &amp; Images</h2>
        </div>
        <p class="tool-description">
          Add subtitles, annotations, memes, or watermark text over animated GIFs and images without losing animation timing or quality.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="at-dropzone">
        <input type="file" id="at-file-input" accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
          <h3>Choose, drop, or paste an image or GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF, PNG, JPG, WebP.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="at-browse-btn">Browse File</button>
            <button class="btn btn-secondary" id="at-demo-btn">Load Demo Image</button>
          </div>
        </div>
      </div>

      <!-- Editor Stage -->
      <div id="at-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <!-- Live Preview Canvas -->
          <div class="preview-box" style="margin-bottom: 20px;">
            <canvas id="at-preview-canvas" class="media-preview"></canvas>
          </div>

          <div class="video-metadata" id="at-meta"></div>

          <!-- Controls Grid -->
          <div class="settings-grid">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label for="at-content">Text Caption</label>
              <input type="text" id="at-content" class="text-input" value="YOUR TEXT HERE" placeholder="Type text overlay..." />
            </div>

            <div class="form-group">
              <label for="at-pos">Text Position</label>
              <select id="at-pos" class="select-input">
                <option value="bottom" selected>Bottom (Standard Subtitle)</option>
                <option value="top">Top (Header Caption)</option>
                <option value="center">Center Overlay</option>
                <option value="custom">Custom Coordinates</option>
              </select>
            </div>

            <div class="form-group">
              <label for="at-font-size">Font Size: <strong id="at-size-val">36px</strong></label>
              <input type="range" id="at-font-size" min="14" max="120" value="36" class="slider" />
            </div>

            <div class="form-group">
              <label for="at-font-family">Font Family</label>
              <select id="at-font-family" class="select-input">
                <option value="Impact, sans-serif" selected>Impact (Meme Style)</option>
                <option value="system-ui, -apple-system, sans-serif">Modern Sans-Serif</option>
                <option value="Georgia, serif">Classic Serif</option>
                <option value="'Courier New', monospace">Monospace Code</option>
              </select>
            </div>

            <div class="form-group">
              <label for="at-fill-color">Text Fill Color</label>
              <div class="color-picker-wrap">
                <input type="color" id="at-fill-color" value="#ffffff" class="color-input" />
                <span class="color-hex-label" id="at-fill-label">#FFFFFF</span>
              </div>
            </div>

            <div class="form-group">
              <label for="at-stroke-color">Outline Color &amp; Width</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="color" id="at-stroke-color" value="#000000" class="color-input" />
                <input type="number" id="at-stroke-width" min="0" max="20" value="4" class="num-input" style="width: 70px;" />
                <span class="form-hint">px</span>
              </div>
            </div>

            <!-- Custom Position Coordinates (Hidden unless custom selected) -->
            <div class="form-group hidden" id="at-coords-group" style="grid-column: 1 / -1; display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label for="at-custom-x">Horizontal Position (%): <strong id="at-x-val">50%</strong></label>
                  <input type="range" id="at-custom-x" min="0" max="100" value="50" class="slider" />
                </div>
                <div>
                  <label for="at-custom-y">Vertical Position (%): <strong id="at-y-val">85%</strong></label>
                  <input type="range" id="at-custom-y" min="0" max="100" value="85" class="slider" />
                </div>
              </div>
            </div>

            <!-- Frame Range Targeting for Animated GIFs -->
            <div class="form-group" id="at-frame-scope-group" style="grid-column: 1 / -1;">
              <label>Frame Application</label>
              <div style="display: flex; gap: 12px; align-items: center; margin-top: 6px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 6px;">
                  <input type="radio" name="at-scope" value="all" checked /> All Frames
                </label>
                <label style="display: flex; align-items: center; gap: 6px;">
                  <input type="radio" name="at-scope" value="range" /> Specific Range
                </label>
                <div id="at-range-inputs" style="display: none; align-items: center; gap: 6px;">
                  <span>From frame:</span>
                  <input type="number" id="at-frame-start" min="1" value="1" class="num-input" style="width: 60px;" />
                  <span>to:</span>
                  <input type="number" id="at-frame-end" min="1" value="1" class="num-input" style="width: 60px;" />
                </div>
              </div>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px;">
            <button class="btn btn-accent btn-lg" id="at-render-btn">
              Apply Text &amp; Render Media!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="at-progress" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="at-pbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="at-ptext">Rendering text onto frames... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="at-output" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Annotated Media</h3>
            <span class="status-pill status-success">Success</span>
          </div>

          <div class="output-preview-container">
            <img id="at-out-img" class="output-preview-img" alt="Result with text" />
          </div>

          <div class="output-stats" id="at-out-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="at-dl-btn">
              Download Media
            </button>
          </div>

          <!-- Pipeline Chaining -->
          <div class="pipeline-chain-bar" style="margin-top: 16px;">
            <span class="chain-label">Pass Output Directly Into:</span>
            <div class="chain-buttons">
              <button class="chain-btn" data-target="resizer">Resize</button>
              <button class="chain-btn" data-target="cropper">Crop</button>
              <button class="chain-btn" data-target="optimizer">Optimize</button>
              <button class="chain-btn" data-target="effects">Effects</button>
              <button class="chain-btn" data-target="splitter">Split</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#at-dropzone');
  const fileInput = container.querySelector('#at-file-input');
  const browseBtn = container.querySelector('#at-browse-btn');
  const demoBtn = container.querySelector('#at-demo-btn');
  const stage = container.querySelector('#at-stage');
  const previewCanvas = container.querySelector('#at-preview-canvas');
  const metaBox = container.querySelector('#at-meta');
  const contentInput = container.querySelector('#at-content');
  const posSelect = container.querySelector('#at-pos');
  const fontSizeSlider = container.querySelector('#at-font-size');
  const fontSizeVal = container.querySelector('#at-size-val');
  const fontFamilySelect = container.querySelector('#at-font-family');
  const fillColorInput = container.querySelector('#at-fill-color');
  const fillLabel = container.querySelector('#at-fill-label');
  const strokeColorInput = container.querySelector('#at-stroke-color');
  const strokeWidthInput = container.querySelector('#at-stroke-width');
  const coordsGroup = container.querySelector('#at-coords-group');
  const customXSlider = container.querySelector('#at-custom-x');
  const customYSlider = container.querySelector('#at-custom-y');
  const xVal = container.querySelector('#at-x-val');
  const yVal = container.querySelector('#at-y-val');
  const scopeRadios = container.querySelectorAll('input[name="at-scope"]');
  const rangeInputs = container.querySelector('#at-range-inputs');
  const frameStartInput = container.querySelector('#at-frame-start');
  const frameEndInput = container.querySelector('#at-frame-end');
  const renderBtn = container.querySelector('#at-render-btn');
  const progressWrap = container.querySelector('#at-progress');
  const pbar = container.querySelector('#at-pbar');
  const ptext = container.querySelector('#at-ptext');
  const outputStage = container.querySelector('#at-output');
  const outImg = container.querySelector('#at-out-img');
  const outStats = container.querySelector('#at-out-stats');
  const dlBtn = container.querySelector('#at-dl-btn');

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

  // Input bindings
  contentInput.addEventListener('input', () => { textConfig.content = contentInput.value; updatePreview(); });
  fontSizeSlider.addEventListener('input', (e) => {
    textConfig.fontSize = parseInt(e.target.value, 10);
    fontSizeVal.textContent = `${textConfig.fontSize}px`;
    updatePreview();
  });
  fontFamilySelect.addEventListener('change', () => { textConfig.fontFamily = fontFamilySelect.value; updatePreview(); });
  fillColorInput.addEventListener('input', (e) => {
    textConfig.fillColor = e.target.value;
    fillLabel.textContent = e.target.value.toUpperCase();
    updatePreview();
  });
  strokeColorInput.addEventListener('input', (e) => { textConfig.strokeColor = e.target.value; updatePreview(); });
  strokeWidthInput.addEventListener('input', (e) => {
    textConfig.strokeWidth = parseInt(e.target.value, 10) || 0;
    updatePreview();
  });
  posSelect.addEventListener('change', () => {
    textConfig.position = posSelect.value;
    coordsGroup.style.display = textConfig.position === 'custom' ? 'block' : 'none';
    updatePreview();
  });
  customXSlider.addEventListener('input', (e) => {
    textConfig.customX = parseInt(e.target.value, 10);
    xVal.textContent = `${textConfig.customX}%`;
    updatePreview();
  });
  customYSlider.addEventListener('input', (e) => {
    textConfig.customY = parseInt(e.target.value, 10);
    yVal.textContent = `${textConfig.customY}%`;
    updatePreview();
  });

  scopeRadios.forEach(r => {
    r.addEventListener('change', () => {
      textConfig.frameScope = r.value;
      rangeInputs.style.display = r.value === 'range' ? 'inline-flex' : 'none';
    });
  });

  frameStartInput.addEventListener('input', () => { textConfig.startFrame = parseInt(frameStartInput.value, 10) || 1; });
  frameEndInput.addEventListener('input', () => { textConfig.endFrame = parseInt(frameEndInput.value, 10) || 1; });

  async function loadFile(file) {
    if (!file) return;
    try {
      loadedFile = file;
      isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

      if (isGif) {
        const buffer = await readFileAsArrayBuffer(file);
        decodedGifData = await decodeGif(buffer);
        originalWidth = decodedGifData.width;
        originalHeight = decodedGifData.height;
        staticImage = null;

        frameEndInput.max = decodedGifData.frames.length;
        frameEndInput.value = decodedGifData.frames.length;
        textConfig.endFrame = decodedGifData.frames.length;

        metaBox.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> Animated GIF</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${originalWidth} × ${originalHeight} px</div>
          <div class="metadata-item"><strong>Frames:</strong> ${decodedGifData.frames.length}</div>
        `;
      } else {
        const dataUrl = await readFileAsDataURL(file);
        staticImage = await loadImageFromSrc(dataUrl);
        originalWidth = staticImage.width;
        originalHeight = staticImage.height;
        decodedGifData = null;

        container.querySelector('#at-frame-scope-group').style.display = 'none';

        metaBox.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> Static Image (${file.type.split('/')[1]?.toUpperCase() || 'IMG'})</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${originalWidth} × ${originalHeight} px</div>
        `;
      }

      stage.classList.remove('hidden');
      updatePreview();
    } catch (err) {
      alert('Failed to load image: ' + err.message);
    }
  }

  async function loadDemo() {
    // Generate sample image
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 400;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#E53935');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PixelMint Media Studio', 300, 180);
    ctx.font = '18px system-ui';
    ctx.fillText('Sample Background for Text Tool', 300, 220);

    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const file = new File([blob], 'text-demo.png', { type: 'image/png' });
    loadFile(file);
  }

  function drawTextOnCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.font = `bold ${textConfig.fontSize}px ${textConfig.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let x = w / 2;
    let y = h - textConfig.fontSize - 10;

    if (textConfig.position === 'top') {
      y = textConfig.fontSize + 10;
    } else if (textConfig.position === 'center') {
      y = h / 2;
    } else if (textConfig.position === 'custom') {
      x = (textConfig.customX / 100) * w;
      y = (textConfig.customY / 100) * h;
    }

    if (textConfig.strokeWidth > 0) {
      ctx.strokeStyle = textConfig.strokeColor;
      ctx.lineWidth = textConfig.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(textConfig.content, x, y);
    }

    ctx.fillStyle = textConfig.fillColor;
    ctx.fillText(textConfig.content, x, y);
    ctx.restore();
  }

  function updatePreview() {
    previewCanvas.width = originalWidth;
    previewCanvas.height = originalHeight;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, originalWidth, originalHeight);

    if (isGif && decodedGifData && decodedGifData.frames.length > 0) {
      ctx.drawImage(decodedGifData.frames[0].canvas, 0, 0);
    } else if (staticImage) {
      ctx.drawImage(staticImage, 0, 0);
    }

    drawTextOnCanvas(previewCanvas);
  }

  renderBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    isProcessing = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Rendering text onto media...';

    try {
      if (isGif && decodedGifData) {
        const total = decodedGifData.frames.length;
        const processedFrames = [];

        for (let i = 0; i < total; i++) {
          const frameObj = decodedGifData.frames[i];
          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = originalWidth;
          frameCanvas.height = originalHeight;
          const ctx = frameCanvas.getContext('2d');
          ctx.drawImage(frameObj.canvas, 0, 0);

          // Check frame scope
          const frameNum = i + 1;
          const shouldApply = textConfig.frameScope === 'all' || 
            (frameNum >= textConfig.startFrame && frameNum <= textConfig.endFrame);

          if (shouldApply) {
            drawTextOnCanvas(frameCanvas);
          }

          processedFrames.push({
            canvas: frameCanvas,
            delay: frameObj.delay
          });
        }

        const gifBlob = await encodeGif(processedFrames, {
          maxColors: 256,
          loop: decodedGifData.loopCount,
          onProgress: (pct) => {
            pbar.style.width = `${pct}%`;
            ptext.textContent = `Encoding GIF frames... ${pct}%`;
          }
        });

        generatedBlob = gifBlob;
        outImg.src = URL.createObjectURL(gifBlob);
        outStats.innerHTML = `
          <div class="metadata-item"><strong>Output Format:</strong> Animated GIF</div>
          <div class="metadata-item"><strong>File Size:</strong> ${formatBytes(gifBlob.size)}</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${originalWidth} × ${originalHeight} px</div>
        `;
      } else if (staticImage) {
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = originalWidth;
        resultCanvas.height = originalHeight;
        const ctx = resultCanvas.getContext('2d');
        ctx.drawImage(staticImage, 0, 0);
        drawTextOnCanvas(resultCanvas);

        const blob = await new Promise(res => resultCanvas.toBlob(res, 'image/png'));
        generatedBlob = blob;
        outImg.src = URL.createObjectURL(blob);
        outStats.innerHTML = `
          <div class="metadata-item"><strong>Output Format:</strong> PNG Image</div>
          <div class="metadata-item"><strong>File Size:</strong> ${formatBytes(blob.size)}</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${originalWidth} × ${originalHeight} px</div>
        `;
      }

      pbar.style.width = '100%';
      ptext.textContent = 'Rendering complete!';
      setTimeout(() => progressWrap.classList.add('hidden'), 1000);
      outputStage.classList.remove('hidden');
      outputStage.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Error applying text: ' + err.message);
      progressWrap.classList.add('hidden');
    } finally {
      isProcessing = false;
    }
  });

  dlBtn.addEventListener('click', () => {
    if (!generatedBlob) return;
    const ext = isGif ? 'gif' : 'png';
    downloadBlob(generatedBlob, `annotated-pixelmint.${ext}`);
  });

  // Chaining buttons
  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (generatedBlob && onChainMedia) {
        const mime = isGif ? 'image/gif' : 'image/png';
        onChainMedia(btn.dataset.target, generatedBlob, mime);
      }
    });
  });

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadFile(blobOrFile);
    }
  };
}
