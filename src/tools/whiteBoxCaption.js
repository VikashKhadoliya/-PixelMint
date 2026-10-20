/**
 * White Box Caption / Meme Maker for PixelMint
 * Adds header or footer white banner box with bold centered text for animated GIFs & images
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderWhiteBoxCaption(container, onChainMedia) {
  let loadedFile = null;
  let isGif = false;
  let originalWidth = 0;
  let originalHeight = 0;
  let decodedGifData = null;
  let staticImage = null;
  let isProcessing = false;
  let generatedBlob = null;

  // Caption state
  let captionText = 'WHEN THE CLIENT ASKS FOR A QUICK CHANGE ON FRIDAY 5PM';
  let bannerPosition = 'top'; // 'top' | 'bottom'
  let fontSize = 28;
  let paddingY = 24;
  let isUppercase = true;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/draw-bezier-curves.png" class="tool-hero-icon" alt="Caption Maker" width="28" height="28" />
          <span class="tool-badge">Meme Studio</span>
          <h2>White Box Caption Maker</h2>
        </div>
        <p class="tool-description">
          Add a classic white caption banner above or below your animated GIF or image with auto-wrapping bold typography.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="wbc-dropzone">
        <input type="file" id="wbc-file-input" accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="7" y1="7" x2="17" y2="7"></line>
              <line x1="7" y1="12" x2="17" y2="12"></line>
            </svg>
          </div>
          <h3>Choose, drop, or paste a GIF or image to caption</h3>
          <p class="dropzone-subtext">Supports animated GIF, PNG, JPG, WebP. High-res meme typography with smart wrapping.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="wbc-browse-btn">Browse File</button>
            <button class="btn btn-secondary" id="wbc-demo-btn">Load Demo Media</button>
          </div>
        </div>
      </div>

      <!-- Caption Editor Stage -->
      <div id="wbc-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <!-- Live Preview Canvas -->
          <div class="preview-box" style="margin-bottom: 20px;">
            <canvas id="wbc-preview-canvas" class="media-preview"></canvas>
          </div>

          <div class="settings-grid">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label for="wbc-text">Caption Text (Auto-wraps across lines)</label>
              <textarea id="wbc-text" rows="2" class="text-input" style="resize: vertical; font-weight: 600;">${captionText}</textarea>
            </div>

            <div class="form-group">
              <label for="wbc-pos">Banner Placement</label>
              <select id="wbc-pos" class="select-input">
                <option value="top" selected>Top Banner (Classic Meme Header)</option>
                <option value="bottom">Bottom Banner (Footer Annotation)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="wbc-font-size">Font Size: <strong id="wbc-size-val">${fontSize}px</strong></label>
              <input type="range" id="wbc-font-size" min="16" max="72" value="${fontSize}" class="slider" />
            </div>

            <div class="form-group">
              <label for="wbc-padding">Vertical Padding: <strong id="wbc-pad-val">${paddingY}px</strong></label>
              <input type="range" id="wbc-padding" min="10" max="60" value="${paddingY}" class="slider" />
            </div>

            <div class="form-group checkbox-group" style="margin-top: 24px;">
              <label class="custom-checkbox">
                <input type="checkbox" id="wbc-upper-toggle" checked />
                <span class="checkbox-mark"></span>
                Uppercase Text (ALL CAPS)
              </label>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px;">
            <button class="btn btn-accent btn-lg" id="wbc-render-btn">
              Generate Captioned GIF!
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="wbc-progress" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="wbc-pbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="wbc-ptext">Generating captioned frames...</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="wbc-output" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Captioned Media Output</h3>
            <span class="status-pill status-success">Success</span>
          </div>

          <div class="output-preview-container">
            <img id="wbc-out-img" class="output-preview-img" alt="Captioned Output" />
          </div>

          <div class="output-stats" id="wbc-out-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="wbc-dl-btn">Download Captioned GIF</button>
          </div>

          <!-- Pipeline Chaining -->
          <div class="pipeline-chain-bar" style="margin-top: 16px;">
            <span class="chain-label">Pass Captioned Output Directly Into:</span>
            <div class="chain-buttons">
              <button class="chain-btn" data-target="optimizer">Optimize</button>
              <button class="chain-btn" data-target="resizer">Resize</button>
              <button class="chain-btn" data-target="cropper">Crop</button>
              <button class="chain-btn" data-target="splitter">Split</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#wbc-dropzone');
  const fileInput = container.querySelector('#wbc-file-input');
  const browseBtn = container.querySelector('#wbc-browse-btn');
  const demoBtn = container.querySelector('#wbc-demo-btn');
  const stage = container.querySelector('#wbc-stage');
  const previewCanvas = container.querySelector('#wbc-preview-canvas');
  const textInput = container.querySelector('#wbc-text');
  const posSelect = container.querySelector('#wbc-pos');
  const fontSizeSlider = container.querySelector('#wbc-font-size');
  const fontSizeVal = container.querySelector('#wbc-size-val');
  const padSlider = container.querySelector('#wbc-padding');
  const padVal = container.querySelector('#wbc-pad-val');
  const upperToggle = container.querySelector('#wbc-upper-toggle');
  const renderBtn = container.querySelector('#wbc-render-btn');
  const progressWrap = container.querySelector('#wbc-progress');
  const pbar = container.querySelector('#wbc-pbar');
  const ptext = container.querySelector('#wbc-ptext');
  const outputStage = container.querySelector('#wbc-output');
  const outImg = container.querySelector('#wbc-out-img');
  const outStats = container.querySelector('#wbc-out-stats');
  const dlBtn = container.querySelector('#wbc-dl-btn');

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

  textInput.addEventListener('input', () => { captionText = textInput.value; updatePreview(); });
  posSelect.addEventListener('change', () => { bannerPosition = posSelect.value; updatePreview(); });
  fontSizeSlider.addEventListener('input', (e) => {
    fontSize = parseInt(e.target.value, 10);
    fontSizeVal.textContent = `${fontSize}px`;
    updatePreview();
  });
  padSlider.addEventListener('input', (e) => {
    paddingY = parseInt(e.target.value, 10);
    padVal.textContent = `${paddingY}px`;
    updatePreview();
  });
  upperToggle.addEventListener('change', (e) => {
    isUppercase = e.target.checked;
    updatePreview();
  });

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
      } else {
        const dataUrl = await readFileAsDataURL(file);
        staticImage = await loadImageFromSrc(dataUrl);
        originalWidth = staticImage.width;
        originalHeight = staticImage.height;
        decodedGifData = null;
      }

      stage.classList.remove('hidden');
      updatePreview();
    } catch (err) {
      alert('Failed to load media: ' + err.message);
    }
  }

  async function loadDemo() {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 360;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 480, 360);
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.arc(240, 180, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '64px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', 240, 180);

    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const file = new File([blob], 'demo-cat.png', { type: 'image/png' });
    loadFile(file);
  }

  // Calculate wrapped lines and total banner height
  function computeBannerLayout(width) {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    const fontStr = `bold ${fontSize}px system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`;
    ctx.font = fontStr;

    const maxTextWidth = width - 40; // 20px margin left/right
    const rawText = isUppercase ? captionText.toUpperCase() : captionText;
    const words = rawText.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = Math.round(fontSize * 1.3);
    const bannerHeight = Math.max(60, lines.length * lineHeight + paddingY * 2);

    return { lines, lineHeight, bannerHeight, fontStr };
  }

  function renderCaptionedFrame(sourceCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const { lines, lineHeight, bannerHeight, fontStr } = computeBannerLayout(w);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h + bannerHeight;
    const ctx = outCanvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    const isTop = bannerPosition === 'top';
    const mediaY = isTop ? bannerHeight : 0;
    const textStartY = isTop ? paddingY + lineHeight / 2 : h + paddingY + lineHeight / 2;

    // Draw media
    ctx.drawImage(sourceCanvas, 0, mediaY);

    // Render wrapped text in white box
    ctx.font = fontStr;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, textStartY + i * lineHeight);
    });

    return outCanvas;
  }

  function updatePreview() {
    let sourceCanvas = null;
    if (isGif && decodedGifData && decodedGifData.frames.length > 0) {
      sourceCanvas = decodedGifData.frames[0].canvas;
    } else if (staticImage) {
      sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = originalWidth;
      sourceCanvas.height = originalHeight;
      sourceCanvas.getContext('2d').drawImage(staticImage, 0, 0);
    }

    if (!sourceCanvas) return;

    const rendered = renderCaptionedFrame(sourceCanvas);
    previewCanvas.width = rendered.width;
    previewCanvas.height = rendered.height;
    const ctx = previewCanvas.getContext('2d');
    ctx.drawImage(rendered, 0, 0);
  }

  renderBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    isProcessing = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Rendering white box caption...';

    try {
      if (isGif && decodedGifData) {
        const total = decodedGifData.frames.length;
        const processedFrames = [];

        for (let i = 0; i < total; i++) {
          const frameObj = decodedGifData.frames[i];
          const captioned = renderCaptionedFrame(frameObj.canvas);
          processedFrames.push({
            canvas: captioned,
            delay: frameObj.delay
          });

          if (i % 2 === 0) {
            const pct = Math.round(10 + (i / total) * 70);
            pbar.style.width = `${pct}%`;
            ptext.textContent = `Rendering frame ${i + 1} of ${total}...`;
            await new Promise(r => setTimeout(r, 0));
          }
        }

        const gifBlob = await encodeGif(processedFrames, {
          maxColors: 256,
          loop: decodedGifData.loopCount,
          onProgress: (pct) => {
            pbar.style.width = `${Math.round(80 + pct * 0.2)}%`;
            ptext.textContent = `Encoding GIF output...`;
          }
        });

        generatedBlob = gifBlob;
        outImg.src = URL.createObjectURL(gifBlob);
        outStats.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> Animated GIF</div>
          <div class="metadata-item"><strong>File Size:</strong> ${formatBytes(gifBlob.size)}</div>
          <div class="metadata-item"><strong>Frames:</strong> ${total}</div>
        `;
      } else if (staticImage) {
        const tempC = document.createElement('canvas');
        tempC.width = originalWidth;
        tempC.height = originalHeight;
        tempC.getContext('2d').drawImage(staticImage, 0, 0);

        const captioned = renderCaptionedFrame(tempC);
        const blob = await new Promise(res => captioned.toBlob(res, 'image/png'));
        generatedBlob = blob;
        outImg.src = URL.createObjectURL(blob);
        outStats.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> PNG Image</div>
          <div class="metadata-item"><strong>File Size:</strong> ${formatBytes(blob.size)}</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${captioned.width} × ${captioned.height} px</div>
        `;
      }

      pbar.style.width = '100%';
      ptext.textContent = 'Meme generated!';
      setTimeout(() => progressWrap.classList.add('hidden'), 1000);
      outputStage.classList.remove('hidden');
      outputStage.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Error creating meme: ' + err.message);
      progressWrap.classList.add('hidden');
    } finally {
      isProcessing = false;
    }
  });

  dlBtn.addEventListener('click', () => {
    if (!generatedBlob) return;
    const ext = isGif ? 'gif' : 'png';
    downloadBlob(generatedBlob, `captioned-meme.${ext}`);
  });

  // Pipeline chaining
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
