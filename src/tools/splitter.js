/**
 * GIF Frame Splitter & Extractor for PixelMint
 * Decompiles animated GIFs into individual frames (PNG, WebP, JPG) with single-click ZIP archive packaging
 */
import JSZip from 'jszip';
import { decodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL } from '../utils/fileHelpers.js';

export function renderSplitter(container, onChainMedia) {
  let loadedFile = null;
  let decodedGifData = null; // { width, height, frames, loopCount }
  let extractedFrames = []; // Array of { id, canvas, delay, blob, url }
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/split.png" class="tool-hero-icon" alt="Split" width="28" height="28" />
          <span class="tool-badge">Frame Extraction</span>
          <h2>GIF Frame Splitter</h2>
        </div>
        <p class="tool-description">
          Split animated GIFs into individual still image frames. Inspect frame timing, download individual frames, or bundle the complete sequence into a ZIP file.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="sp-dropzone">
        <input type="file" id="sp-file-input" accept="image/gif" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3>Choose, drop, or paste an animated GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF. Frames are decompiled with full coalescing and transparency preserved.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="sp-browse-btn">Browse GIF</button>
            <button class="btn btn-secondary" id="sp-demo-btn">Load Demo Animation</button>
          </div>
        </div>
      </div>

      <!-- Extraction Settings & Frames Viewer -->
      <div id="sp-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <!-- GIF Summary Banner -->
          <div class="video-metadata" id="sp-meta"></div>

          <!-- Output Format Options -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="sp-format">Output Image Format</label>
              <select id="sp-format" class="select-input">
                <option value="image/png" selected>PNG (Lossless, Transparent)</option>
                <option value="image/webp">WebP (Modern, Compact)</option>
                <option value="image/jpeg">JPG / JPEG (Flattened)</option>
              </select>
            </div>

            <div class="form-group" id="sp-bg-group" style="display: none;">
              <label for="sp-bg-color">Background Color (for JPG)</label>
              <div class="color-picker-wrap">
                <input type="color" id="sp-bg-color" value="#ffffff" class="color-input" />
                <span class="color-hex-label" id="sp-bg-label">#FFFFFF</span>
              </div>
              <small class="form-hint">JPG does not support transparency.</small>
            </div>

            <div class="form-group">
              <label>Extraction Scope</label>
              <div class="meta-pills-row" style="margin-top: 6px;">
                <span class="meta-pill" id="sp-total-pill">Total: 0 frames</span>
                <span class="meta-pill" id="sp-duration-pill">0.0s duration</span>
              </div>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-accent btn-lg" id="sp-zip-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download All as ZIP Archive
            </button>
            <button class="btn btn-outline" id="sp-chain-maker">
              Assemble in GIF Maker
            </button>
          </div>

          <!-- Progress Bar -->
          <div id="sp-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="sp-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="sp-progress-text">Preparing frames... 0%</div>
          </div>
        </div>

        <!-- Frame Grid List -->
        <div class="stage-section-header" style="margin-top: 24px;">
          <h3>Extracted Frames (<span id="sp-grid-count">0</span>)</h3>
          <p class="tool-description">Click any frame to download it individually or pass it to another workstation.</p>
        </div>

        <div class="frames-grid" id="sp-frames-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));"></div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#sp-dropzone');
  const fileInput = container.querySelector('#sp-file-input');
  const browseBtn = container.querySelector('#sp-browse-btn');
  const demoBtn = container.querySelector('#sp-demo-btn');
  const stage = container.querySelector('#sp-stage');
  const metaBox = container.querySelector('#sp-meta');
  const formatSelect = container.querySelector('#sp-format');
  const bgGroup = container.querySelector('#sp-bg-group');
  const bgColor = container.querySelector('#sp-bg-color');
  const bgLabel = container.querySelector('#sp-bg-label');
  const totalPill = container.querySelector('#sp-total-pill');
  const durationPill = container.querySelector('#sp-duration-pill');
  const zipBtn = container.querySelector('#sp-zip-btn');
  const chainMakerBtn = container.querySelector('#sp-chain-maker');
  const progressWrap = container.querySelector('#sp-progress-wrap');
  const progressBar = container.querySelector('#sp-progress-bar');
  const progressText = container.querySelector('#sp-progress-text');
  const gridCount = container.querySelector('#sp-grid-count');
  const framesGrid = container.querySelector('#sp-frames-grid');

  formatSelect.addEventListener('change', () => {
    bgGroup.style.display = formatSelect.value === 'image/jpeg' ? 'block' : 'none';
    renderFrameCards();
  });

  bgColor.addEventListener('input', (e) => {
    bgLabel.textContent = e.target.value.toUpperCase();
    if (formatSelect.value === 'image/jpeg') renderFrameCards();
  });

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadFile(e.target.files[0]);
    }
  });

  // Drag and drop
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });
  });
  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  demoBtn.addEventListener('click', loadDemo);

  async function loadFile(file) {
    if (!file) return;
    try {
      showProgress(10, 'Decoding GIF frames...');
      const buffer = await readFileAsArrayBuffer(file);
      decodedGifData = await decodeGif(buffer);
      loadedFile = file;

      if (!decodedGifData || decodedGifData.frames.length === 0) {
        throw new Error('No valid frames detected in GIF file.');
      }

      displayDecodedData();
    } catch (err) {
      alert('Failed to split GIF: ' + err.message);
      hideProgress();
    }
  }

  async function loadDemo() {
    showProgress(20, 'Generating demo animation...');
    // Create multi-frame canvas GIF on the fly
    const demoCanvases = [];
    const colors = ['#E53935', '#1E293B', '#D32F2F', '#0F172A'];
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 320;
      const ctx = c.getContext('2d');
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`PixelMint Frame #${i + 1}`, 160, 150);
      ctx.font = '16px system-ui';
      ctx.fillText('Splitter Demo Animation', 160, 185);
      demoCanvases.push({ canvas: c, delay: 200, delayHundredths: 20, disposal: 2 });
    }
    decodedGifData = {
      width: 320,
      height: 320,
      loopCount: 0,
      frames: demoCanvases
    };
    loadedFile = { name: 'demo-sample.gif', size: 35000 };
    displayDecodedData();
  }

  function displayDecodedData() {
    hideProgress();
    stage.classList.remove('hidden');

    const totalFrames = decodedGifData.frames.length;
    let totalDurationMs = 0;
    decodedGifData.frames.forEach(f => { totalDurationMs += (f.delay || 100); });
    const durationSec = (totalDurationMs / 1000).toFixed(2);

    metaBox.innerHTML = `
      <div class="metadata-item"><strong>Source:</strong> ${loadedFile.name || 'image.gif'}</div>
      <div class="metadata-item"><strong>Dimensions:</strong> ${decodedGifData.width} × ${decodedGifData.height} px</div>
      <div class="metadata-item"><strong>Total Frames:</strong> ${totalFrames} frames</div>
      <div class="metadata-item"><strong>Total Duration:</strong> ${durationSec} seconds</div>
    `;

    totalPill.textContent = `Total: ${totalFrames} frames`;
    durationPill.textContent = `${durationSec}s duration`;
    gridCount.textContent = totalFrames;

    renderFrameCards();
  }

  function getFrameCanvasWithBg(sourceCanvas, format, bgHex) {
    if (format !== 'image/jpeg') return sourceCanvas;
    const dest = document.createElement('canvas');
    dest.width = sourceCanvas.width;
    dest.height = sourceCanvas.height;
    const ctx = dest.getContext('2d');
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, dest.width, dest.height);
    ctx.drawImage(sourceCanvas, 0, 0);
    return dest;
  }

  function renderFrameCards() {
    if (!decodedGifData) return;
    framesGrid.innerHTML = '';
    const format = formatSelect.value;
    const bg = bgColor.value;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';

    decodedGifData.frames.forEach((frameObj, idx) => {
      const card = document.createElement('div');
      card.className = 'frame-item-card';

      const finalCanvas = getFrameCanvasWithBg(frameObj.canvas, format, bg);
      const dataUrl = finalCanvas.toDataURL(format, 0.92);

      card.innerHTML = `
        <div class="frame-thumb-box" style="position: relative;">
          <img src="${dataUrl}" class="frame-thumb-img" alt="Frame ${idx + 1}" style="width: 100%; height: 140px; object-fit: contain; background: repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 16px 16px;" />
          <span class="frame-badge">#${idx + 1}</span>
        </div>
        <div class="frame-item-body" style="padding: 10px; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Delay: <strong>${frameObj.delayHundredths || Math.round(frameObj.delay / 10)}</strong> cs</span>
            <span>${frameObj.delay} ms</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-outline sp-dl-btn" style="flex: 1;" data-index="${idx}">Download</button>
            <button class="btn btn-sm btn-secondary sp-edit-btn" title="Edit in Cropper" data-index="${idx}">Crop</button>
          </div>
        </div>
      `;

      // Download single frame
      card.querySelector('.sp-dl-btn').addEventListener('click', () => {
        finalCanvas.toBlob((blob) => {
          if (blob) {
            downloadBlob(blob, `frame_${String(idx + 1).padStart(3, '0')}.${ext}`);
          }
        }, format, 0.92);
      });

      // Chain frame into cropper
      card.querySelector('.sp-edit-btn').addEventListener('click', () => {
        finalCanvas.toBlob((blob) => {
          if (blob && onChainMedia) {
            onChainMedia('cropper', blob, format);
          }
        }, format, 0.92);
      });

      framesGrid.appendChild(card);
    });
  }

  // ZIP packaging
  zipBtn.addEventListener('click', async () => {
    if (!decodedGifData || decodedGifData.frames.length === 0 || isProcessing) return;
    isProcessing = true;
    showProgress(15, 'Creating ZIP archive...');

    try {
      const zip = new JSZip();
      const folder = zip.folder('pixelmint-frames');
      const format = formatSelect.value;
      const bg = bgColor.value;
      const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
      const total = decodedGifData.frames.length;

      for (let i = 0; i < total; i++) {
        const frameObj = decodedGifData.frames[i];
        const finalCanvas = getFrameCanvasWithBg(frameObj.canvas, format, bg);
        const blob = await new Promise(res => finalCanvas.toBlob(res, format, 0.92));
        const filename = `frame_${String(i + 1).padStart(3, '0')}.${ext}`;
        folder.file(filename, blob);

        const pct = Math.round(15 + ((i + 1) / total) * 70);
        showProgress(pct, `Packaging frame ${i + 1} of ${total}...`);
      }

      showProgress(90, 'Compressing ZIP package...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `pixelmint-frames-${Date.now()}.zip`);
      showProgress(100, 'ZIP download ready!');
      setTimeout(hideProgress, 1500);
    } catch (err) {
      alert('Failed to generate ZIP: ' + err.message);
      hideProgress();
    } finally {
      isProcessing = false;
    }
  });

  // Chain into GIF Maker
  chainMakerBtn.addEventListener('click', async () => {
    if (!decodedGifData || !onChainMedia) return;
    const format = 'image/png';
    const blobs = [];
    for (let f of decodedGifData.frames) {
      const b = await new Promise(res => f.canvas.toBlob(res, format));
      blobs.push(b);
    }
    onChainMedia('gifMaker', blobs, format);
  });

  function showProgress(pct, text) {
    progressWrap.classList.remove('hidden');
    progressBar.style.width = `${pct}%`;
    progressText.textContent = text;
  }

  function hideProgress() {
    progressWrap.classList.add('hidden');
  }

  // Media ingestion handoff from chaining router
  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadFile(blobOrFile);
    }
  };
}
