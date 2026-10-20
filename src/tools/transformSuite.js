/**
 * Dedicated Animation & Image Transformation Workstation for PixelMint
 * Dedicated tool handlers for:
 * - /rotate  (Rotate 90/180/270 & Flip Horizontal/Vertical)
 * - /reverse (Reverse GIF Playback Order)
 * - /speed   (Adjust Animation Playback Speed Multiplier)
 * - /cut     (Cut / Trim Animation Frames by Range)
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { transformCanvas } from '../utils/canvasUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderTransformTool(container, onChainMedia, mode = 'rotate') {
  let activeMode = mode; // 'rotate' | 'reverse' | 'speed' | 'cut'
  let loadedFile = null;
  let isGif = false;
  let originalWidth = 0;
  let originalHeight = 0;
  let decodedGifData = null;
  let staticImage = null;
  let isProcessing = false;
  let generatedBlob = null;

  // Operation specific parameters
  let rotateAngle = 90;
  let flipH = false;
  let flipV = false;
  let speedMultiplier = 2.0;
  let cutStartFrame = 1;
  let cutEndFrame = 1;

  const modeTitles = {
    rotate: { title: 'Rotate & Flip Image/GIF', badge: 'Geometry', desc: 'Rotate media clockwise, counter-clockwise, or mirror horizontally and vertically.', icon: '/icons/object-rotate-right.png' },
    reverse: { title: 'Reverse GIF Playback', badge: 'Timeline', desc: 'Invert the animation order so your GIF plays backwards with preserved frame delays.', icon: '/icons/media-seek-backward.png' },
    speed: { title: 'Animation Speed Changer', badge: 'Timing', desc: 'Speed up or slow down your animated GIF by adjusting frame delays.', icon: '/icons/chronometer.png' },
    cut: { title: 'Cut GIF Animation Duration', badge: 'Trimming', desc: 'Trim start and end frames to shorten animation length or isolate specific moments.', icon: '/icons/edit-cut.png' }
  };

  const meta = modeTitles[activeMode] || modeTitles.rotate;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="${meta.icon}" class="tool-hero-icon" alt="" width="28" height="28" />
          <span class="tool-badge">${meta.badge}</span>
          <h2>${meta.title}</h2>
        </div>
        <p class="tool-description">${meta.desc}</p>

        <!-- Mode Sub-Tabs -->
        <div class="sub-tool-tabs" style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
          <button class="btn ${activeMode === 'rotate' ? 'btn-primary' : 'btn-outline'}" data-mode="rotate"><img src="/icons/object-rotate-right.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Rotate &amp; Flip</button>
          <button class="btn ${activeMode === 'reverse' ? 'btn-primary' : 'btn-outline'}" data-mode="reverse"><img src="/icons/media-seek-backward.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Reverse GIF</button>
          <button class="btn ${activeMode === 'speed' ? 'btn-primary' : 'btn-outline'}" data-mode="speed"><img src="/icons/chronometer.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Change Speed</button>
          <button class="btn ${activeMode === 'cut' ? 'btn-primary' : 'btn-outline'}" data-mode="cut"><img src="/icons/edit-cut.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Cut Duration</button>
        </div>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="tf-dropzone">
        <input type="file" id="tf-file-input" accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3>Choose, drop, or paste an image or GIF to edit</h3>
          <p class="dropzone-subtext">Supports animated GIF, PNG, JPG, WebP. Real-time frame processing.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="tf-browse-btn">Browse File</button>
            <button class="btn btn-secondary" id="tf-demo-btn">Load Demo GIF</button>
          </div>
        </div>
      </div>

      <!-- Editor Stage -->
      <div id="tf-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <div class="preview-box" style="margin-bottom: 20px;">
            <canvas id="tf-preview-canvas" class="media-preview"></canvas>
          </div>

          <div class="video-metadata" id="tf-meta"></div>

          <!-- ROTATE CONTROLS -->
          <div id="tf-ctrl-rotate" class="${activeMode === 'rotate' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label>Rotation Angle</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline rot-btn active" data-angle="90">90° Clockwise</button>
                  <button class="btn btn-sm btn-outline rot-btn" data-angle="270">90° Counter-CW</button>
                  <button class="btn btn-sm btn-outline rot-btn" data-angle="180">180° Flip</button>
                </div>
              </div>
              <div class="form-group">
                <label>Mirror / Flip</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline" id="tf-flip-h">Flip Horizontal</button>
                  <button class="btn btn-sm btn-outline" id="tf-flip-v">Flip Vertical</button>
                </div>
              </div>
            </div>
          </div>

          <!-- REVERSE CONTROLS -->
          <div id="tf-ctrl-reverse" class="${activeMode === 'reverse' ? '' : 'hidden'}">
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 12px;">
              Reversing will play the animation backwards from the last frame to the first frame.
            </p>
          </div>

          <!-- SPEED CONTROLS -->
          <div id="tf-ctrl-speed" class="${activeMode === 'speed' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="tf-speed-select">Playback Speed Multiplier</label>
                <select id="tf-speed-select" class="select-input">
                  <option value="0.25">0.25x (Super Slow-Mo)</option>
                  <option value="0.5">0.5x (Half Speed)</option>
                  <option value="0.75">0.75x (Slower)</option>
                  <option value="1.25">1.25x (Slightly Faster)</option>
                  <option value="1.5">1.5x (1.5x Speed)</option>
                  <option value="2.0" selected>2.0x (Double Speed)</option>
                  <option value="3.0">3.0x (Triple Speed)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Delay Preview</label>
                <div id="tf-speed-delay-preview" style="font-size: 0.9rem; margin-top: 8px; color: var(--text-muted);">
                  Original: ~10 cs &rarr; New: ~5 cs (faster)
                </div>
              </div>
            </div>
          </div>

          <!-- CUT CONTROLS -->
          <div id="tf-ctrl-cut" class="${activeMode === 'cut' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="tf-cut-start">Start Frame</label>
                <input type="number" id="tf-cut-start" min="1" value="1" class="num-input" />
              </div>
              <div class="form-group">
                <label for="tf-cut-end">End Frame</label>
                <input type="number" id="tf-cut-end" min="1" value="1" class="num-input" />
              </div>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px;">
            <button class="btn btn-accent btn-lg" id="tf-apply-btn">
              Apply Transformation &amp; Render!
            </button>
          </div>

          <!-- Progress -->
          <div id="tf-progress" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="tf-pbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="tf-ptext">Processing frames...</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="tf-output" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Transformed Output</h3>
            <span class="status-pill status-success">Done</span>
          </div>

          <div class="output-preview-container">
            <img id="tf-out-img" class="output-preview-img" alt="Result" />
          </div>

          <div class="output-stats" id="tf-out-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="tf-dl-btn">Download Media</button>
          </div>

          <!-- Chaining -->
          <div class="pipeline-chain-bar" style="margin-top: 16px;">
            <span class="chain-label">Pass Output Directly Into:</span>
            <div class="chain-buttons">
              <button class="chain-btn" data-target="resizer">Resize</button>
              <button class="chain-btn" data-target="cropper">Crop</button>
              <button class="chain-btn" data-target="optimizer">Optimize</button>
              <button class="chain-btn" data-target="splitter">Split</button>
              <button class="chain-btn" data-target="addText">Add Text</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#tf-dropzone');
  const fileInput = container.querySelector('#tf-file-input');
  const browseBtn = container.querySelector('#tf-browse-btn');
  const demoBtn = container.querySelector('#tf-demo-btn');
  const stage = container.querySelector('#tf-stage');
  const previewCanvas = container.querySelector('#tf-preview-canvas');
  const metaBox = container.querySelector('#tf-meta');
  const applyBtn = container.querySelector('#tf-apply-btn');
  const progressWrap = container.querySelector('#tf-progress');
  const pbar = container.querySelector('#tf-pbar');
  const ptext = container.querySelector('#tf-ptext');
  const outputStage = container.querySelector('#tf-output');
  const outImg = container.querySelector('#tf-out-img');
  const outStats = container.querySelector('#tf-out-stats');
  const dlBtn = container.querySelector('#tf-dl-btn');

  // Submode switcher
  container.querySelectorAll('.sub-tool-tabs .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetMode = btn.dataset.mode;
      renderTransformTool(container, onChainMedia, targetMode);
    });
  });

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

  // Rotate bindings
  container.querySelectorAll('.rot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.rot-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rotateAngle = parseInt(btn.dataset.angle, 10);
      updatePreview();
    });
  });

  const flipHBtn = container.querySelector('#tf-flip-h');
  const flipVBtn = container.querySelector('#tf-flip-v');
  if (flipHBtn) {
    flipHBtn.addEventListener('click', () => {
      flipH = !flipH;
      flipHBtn.classList.toggle('active', flipH);
      updatePreview();
    });
  }
  if (flipVBtn) {
    flipVBtn.addEventListener('click', () => {
      flipV = !flipV;
      flipVBtn.classList.toggle('active', flipV);
      updatePreview();
    });
  }

  // Speed bindings
  const speedSelect = container.querySelector('#tf-speed-select');
  if (speedSelect) {
    speedSelect.addEventListener('change', () => {
      speedMultiplier = parseFloat(speedSelect.value);
    });
  }

  // Cut bindings
  const cutStartInp = container.querySelector('#tf-cut-start');
  const cutEndInp = container.querySelector('#tf-cut-end');
  if (cutStartInp) cutStartInp.addEventListener('input', () => { cutStartFrame = parseInt(cutStartInp.value, 10) || 1; });
  if (cutEndInp) cutEndInp.addEventListener('input', () => { cutEndFrame = parseInt(cutEndInp.value, 10) || 1; });

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

        if (cutEndInp) {
          cutEndInp.max = decodedGifData.frames.length;
          cutEndInp.value = decodedGifData.frames.length;
          cutEndFrame = decodedGifData.frames.length;
        }

        metaBox.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> Animated GIF</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${originalWidth} × ${originalHeight} px</div>
          <div class="metadata-item"><strong>Total Frames:</strong> ${decodedGifData.frames.length} frames</div>
        `;
      } else {
        const dataUrl = await readFileAsDataURL(file);
        staticImage = await loadImageFromSrc(dataUrl);
        originalWidth = staticImage.width;
        originalHeight = staticImage.height;
        decodedGifData = null;

        metaBox.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> Static Image</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${originalWidth} × ${originalHeight} px</div>
        `;
      }

      stage.classList.remove('hidden');
      updatePreview();
    } catch (err) {
      alert('Failed to load file: ' + err.message);
    }
  }

  async function loadDemo() {
    const frames = [];
    const colors = ['#E53935', '#0F172A', '#2563EB', '#10B981'];
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 300;
      c.height = 300;
      const ctx = c.getContext('2d');
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Frame #${i + 1}`, 150, 150);
      frames.push({ canvas: c, delay: 150 });
    }
    const blob = await encodeGif(frames, { maxColors: 256, loop: 0 });
    const file = new File([blob], 'demo.gif', { type: 'image/gif' });
    loadFile(file);
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

    if (activeMode === 'rotate') {
      const transformed = transformCanvas(sourceCanvas, rotateAngle, flipH, flipV);
      previewCanvas.width = transformed.width;
      previewCanvas.height = transformed.height;
      previewCanvas.getContext('2d').drawImage(transformed, 0, 0);
    } else {
      previewCanvas.width = sourceCanvas.width;
      previewCanvas.height = sourceCanvas.height;
      previewCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0);
    }
  }

  applyBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    isProcessing = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Applying transformation...';

    try {
      if (isGif && decodedGifData) {
        let framesToProcess = decodedGifData.frames;

        // CUT
        if (activeMode === 'cut') {
          const s = Math.max(1, cutStartFrame);
          const e = Math.min(framesToProcess.length, cutEndFrame);
          framesToProcess = framesToProcess.slice(s - 1, e);
        }

        // REVERSE
        if (activeMode === 'reverse') {
          // Reverse order of frames, preserving delays
          framesToProcess = framesToProcess.slice().reverse();
        }

        // SPEED & ROTATE
        const total = framesToProcess.length;
        const resultFrames = [];

        for (let i = 0; i < total; i++) {
          const f = framesToProcess[i];
          let finalCanvas = f.canvas;

          if (activeMode === 'rotate') {
            finalCanvas = transformCanvas(f.canvas, rotateAngle, flipH, flipV);
          }

          let delay = f.delay || 100;
          if (activeMode === 'speed') {
            delay = Math.max(20, Math.round(delay / speedMultiplier));
          }

          resultFrames.push({
            canvas: finalCanvas,
            delay
          });

          if (i % 2 === 0) {
            pbar.style.width = `${Math.round(15 + (i / total) * 70)}%`;
            await new Promise(r => setTimeout(r, 0));
          }
        }

        const blob = await encodeGif(resultFrames, {
          maxColors: 256,
          loop: decodedGifData.loopCount,
          onProgress: (p) => {
            pbar.style.width = `${Math.round(85 + p * 0.15)}%`;
          }
        });

        generatedBlob = blob;
        outImg.src = URL.createObjectURL(blob);
        outStats.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> Animated GIF</div>
          <div class="metadata-item"><strong>Size:</strong> ${formatBytes(blob.size)}</div>
          <div class="metadata-item"><strong>Frames:</strong> ${resultFrames.length}</div>
        `;
      } else if (staticImage) {
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        tempCanvas.getContext('2d').drawImage(staticImage, 0, 0);

        if (activeMode === 'rotate') {
          tempCanvas = transformCanvas(tempCanvas, rotateAngle, flipH, flipV);
        }

        const blob = await new Promise(res => tempCanvas.toBlob(res, 'image/png'));
        generatedBlob = blob;
        outImg.src = URL.createObjectURL(blob);
        outStats.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> PNG Image</div>
          <div class="metadata-item"><strong>Size:</strong> ${formatBytes(blob.size)}</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${tempCanvas.width} × ${tempCanvas.height} px</div>
        `;
      }

      pbar.style.width = '100%';
      ptext.textContent = 'Transformation complete!';
      setTimeout(() => progressWrap.classList.add('hidden'), 1000);
      outputStage.classList.remove('hidden');
      outputStage.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Error during transformation: ' + err.message);
      progressWrap.classList.add('hidden');
    } finally {
      isProcessing = false;
    }
  });

  dlBtn.addEventListener('click', () => {
    if (!generatedBlob) return;
    const ext = isGif ? 'gif' : 'png';
    downloadBlob(generatedBlob, `transformed-pixelmint.${ext}`);
  });

  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (generatedBlob && onChainMedia) {
        onChainMedia(btn.dataset.target, generatedBlob, isGif ? 'image/gif' : 'image/png');
      }
    });
  });

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadFile(blobOrFile);
    }
  };
}
