/**
 * Multi-Format Image Converter for PixelMint
 * Converts images between WebP, PNG, JPG, and GIF with batch processing and quality control
 */
import { formatBytes, downloadBlob, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderConverter(container, onChainMedia) {
  let fileQueue = []; // Array of { id, file, status, convertedBlob, url }
  let nextId = 1;
  let isConverting = false;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/view-refresh.png" class="tool-hero-icon" alt="Format Converter" />
          <span class="tool-badge">Format Converter</span>
          <h2>Batch Format Converter</h2>
        </div>
        <p class="tool-description">
          Convert multiple images simultaneously between WebP, PNG, JPG, and GIF with custom quality and background color handling for transparent images.
        </p>
      </div>

      <!-- Ingestion Card -->
      <div class="card dropzone-card" id="conv-dropzone">
        <input type="file" id="conv-file-input" multiple accept="image/*" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
          </div>
          <h3>Choose, drop, or paste images to convert</h3>
          <p class="dropzone-subtext">Supports WebP, PNG, JPG, GIF, SVG, BMP. Batch processing supported.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="conv-browse-btn">Browse Images</button>
            <button class="btn btn-secondary" id="conv-demo-btn">Load Demo Batch</button>
          </div>
        </div>
      </div>

      <!-- Conversion Settings & Queue -->
      <div id="conv-stage" class="tool-stage hidden">
        <div class="card settings-card">
          <div class="settings-grid">
            <div class="form-group">
              <label for="conv-target-format">Target Format</label>
              <select id="conv-target-format" class="select-input">
                <option value="image/jpeg" selected>JPG / JPEG (Universal Compatibility)</option>
                <option value="image/png">PNG (Lossless with Transparency)</option>
                <option value="image/webp">WebP (Modern Compact Web Format)</option>
              </select>
            </div>

            <div class="form-group" id="conv-quality-group">
              <label for="conv-quality">Quality Factor: <strong id="conv-quality-val">90%</strong></label>
              <input type="range" id="conv-quality" min="10" max="100" value="90" class="slider" />
            </div>

            <div class="form-group" id="conv-bg-group">
              <label for="conv-bg-color">Background Fill (for JPG)</label>
              <div class="color-picker-wrap">
                <input type="color" id="conv-bg-color" value="#ffffff" class="color-input" />
                <span class="color-hex-label">#FFFFFF</span>
              </div>
              <small class="form-hint">Used for transparent areas when converting to JPG</small>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="conv-execute-btn">
              <img src="/icons/view-refresh.png" class="btn-icon-img" alt="" /> Convert All (<span id="conv-queue-count">0</span>)
            </button>
            <button class="btn btn-outline" id="conv-clear-btn">Clear Queue</button>
          </div>

          <!-- Progress Bar -->
          <div id="conv-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="conv-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="conv-progress-text">Converting queue... 0%</div>
          </div>
        </div>

        <!-- Conversion Results Queue -->
        <div class="queue-section">
          <div class="stage-section-header">
            <h3>Conversion Queue</h3>
            <button class="btn btn-sm btn-primary hidden" id="conv-download-all-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download All Converted
            </button>
          </div>
          <div class="queue-list" id="conv-queue-list"></div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#conv-dropzone');
  const fileInput = container.querySelector('#conv-file-input');
  const browseBtn = container.querySelector('#conv-browse-btn');
  const demoBtn = container.querySelector('#conv-demo-btn');
  const stage = container.querySelector('#conv-stage');

  const targetFormatSelect = container.querySelector('#conv-target-format');
  const qualitySlider = container.querySelector('#conv-quality');
  const qualityVal = container.querySelector('#conv-quality-val');
  const qualityGroup = container.querySelector('#conv-quality-group');
  const bgColorInput = container.querySelector('#conv-bg-color');
  const bgGroup = container.querySelector('#conv-bg-group');
  const executeBtn = container.querySelector('#conv-execute-btn');
  const clearBtn = container.querySelector('#conv-clear-btn');
  const queueCountSpan = container.querySelector('#conv-queue-count');

  const progressWrap = container.querySelector('#conv-progress-wrap');
  const progressBar = container.querySelector('#conv-progress-bar');
  const progressText = container.querySelector('#conv-progress-text');

  const queueList = container.querySelector('#conv-queue-list');
  const downloadAllBtn = container.querySelector('#conv-download-all-btn');

  // File loading
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      fileInput.value = '';
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  });

  demoBtn.addEventListener('click', async () => {
    // Generate 3 sample canvases
    const samples = [];
    const colors = ['#10b981', '#3b82f6', '#8b5cf6'];
    const names = ['logo-badge.png', 'avatar-sample.webp', 'banner-test.png'];

    for (let i = 0; i < 3; i++) {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 300;
      const ctx = c.getContext('2d');
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 400, 300);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Sample Image #${i + 1}`, 200, 150);

      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      blob.name = names[i];
      samples.push(blob);
    }

    addFilesToQueue(samples);
  });

  function addFilesToQueue(files) {
    for (const f of files) {
      fileQueue.push({
        id: nextId++,
        file: f,
        name: f.name || `image-${Date.now()}`,
        status: 'pending',
        convertedBlob: null,
        url: null
      });
    }
    renderQueue();
  }

  function renderQueue() {
    queueCountSpan.textContent = fileQueue.length;
    if (fileQueue.length === 0) {
      stage.classList.add('hidden');
      return;
    }
    stage.classList.remove('hidden');
    queueList.innerHTML = '';

    const hasAnyConverted = fileQueue.some(item => item.status === 'done');
    downloadAllBtn.classList.toggle('hidden', !hasAnyConverted);

    fileQueue.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'queue-item-card';

      let statusBadge = '<span class="status-pill status-pending">Pending</span>';
      let actionArea = `<button class="btn btn-xs btn-danger-outline remove-item">&times;</button>`;

      if (item.status === 'processing') {
        statusBadge = '<span class="status-pill status-warning">Converting...</span>';
        actionArea = `<div class="spinner-sm"></div>`;
      } else if (item.status === 'done') {
        statusBadge = '<span class="status-pill status-success">Done</span>';
        actionArea = `
          <button class="btn btn-xs btn-primary dl-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 3px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download
          </button>
          <button class="btn btn-xs btn-outline chain-item"><img src="/icons/transform-scale.png" class="chain-btn-icon" alt="" /> Chain</button>
        `;
      }

      row.innerHTML = `
        <div class="queue-item-info">
          <div class="queue-item-name">${item.name}</div>
          <div class="queue-item-size">${formatBytes(item.file.size)} ${item.convertedBlob ? `&rarr; ${formatBytes(item.convertedBlob.size)}` : ''}</div>
        </div>
        <div class="queue-item-status">${statusBadge}</div>
        <div class="queue-item-actions">${actionArea}</div>
      `;

      if (row.querySelector('.remove-item')) {
        row.querySelector('.remove-item').addEventListener('click', () => {
          fileQueue.splice(idx, 1);
          renderQueue();
        });
      }

      if (row.querySelector('.dl-item')) {
        row.querySelector('.dl-item').addEventListener('click', () => {
          const targetMime = targetFormatSelect.value;
          const ext = targetMime === 'image/jpeg' ? 'jpg' : (targetMime === 'image/webp' ? 'webp' : 'png');
          const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          downloadBlob(item.convertedBlob, `${baseName}.${ext}`);
        });
      }

      if (row.querySelector('.chain-item')) {
        row.querySelector('.chain-item').addEventListener('click', () => {
          if (onChainMedia && item.convertedBlob) {
            onChainMedia('resizer', item.convertedBlob, targetFormatSelect.value);
          }
        });
      }

      queueList.appendChild(row);
    });
  }

  // Format selection changes
  targetFormatSelect.addEventListener('change', () => {
    const fmt = targetFormatSelect.value;
    qualityGroup.style.display = (fmt === 'image/jpeg' || fmt === 'image/webp') ? 'block' : 'none';
    bgGroup.style.display = fmt === 'image/jpeg' ? 'block' : 'none';
  });

  qualitySlider.addEventListener('input', () => {
    qualityVal.textContent = `${qualitySlider.value}%`;
  });

  clearBtn.addEventListener('click', () => {
    fileQueue = [];
    renderQueue();
  });

  // Execute Batch Conversion
  executeBtn.addEventListener('click', async () => {
    if (fileQueue.length === 0 || isConverting) return;

    try {
      isConverting = true;
      executeBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';

      const targetMime = targetFormatSelect.value;
      const quality = parseInt(qualitySlider.value, 10) / 100;
      const bgColor = bgColorInput.value || '#ffffff';

      const total = fileQueue.length;

      for (let i = 0; i < total; i++) {
        const item = fileQueue[i];
        item.status = 'processing';
        renderQueue();

        const dataUrl = await readFileAsDataURL(item.file);
        const img = await loadImageFromSrc(dataUrl);

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (targetMime === 'image/jpeg') {
          // Flatten background color for transparent images
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const blob = await new Promise(r => canvas.toBlob(r, targetMime, quality));
        item.convertedBlob = blob;
        item.url = URL.createObjectURL(blob);
        item.status = 'done';

        const pct = Math.round(((i + 1) / total) * 100);
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `Converted ${i + 1} of ${total} files... ${pct}%`;
      }

      renderQueue();
    } catch (err) {
      console.error(err);
      alert('Batch conversion error: ' + err.message);
    } finally {
      isConverting = false;
      executeBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadAllBtn.addEventListener('click', () => {
    fileQueue.forEach(item => {
      if (item.convertedBlob) {
        const targetMime = targetFormatSelect.value;
        const ext = targetMime === 'image/jpeg' ? 'jpg' : (targetMime === 'image/webp' ? 'webp' : 'png');
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        downloadBlob(item.convertedBlob, `${baseName}.${ext}`);
      }
    });
  });

  return {
    loadMedia: (blob) => addFilesToQueue([blob])
  };
}
