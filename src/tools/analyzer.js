/**
 * GIF Analyzer & Metadata Inspector for PixelMint
 * Deep inspection of GIF file structure, frame timing, disposal methods, and dimensions
 */
import { analyzeGif, decodeGif, encodeGif } from '../utils/gifUtils.js';
import { formatBytes, readFileAsArrayBuffer } from '../utils/fileHelpers.js';

export function renderAnalyzer(container, onChainMedia) {
  let loadedFile = null;
  let analysisReport = null;
  let decodedGifData = null;
  let activeFrameIndex = 0;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/view-statistics.png" class="tool-hero-icon" alt="Analyzer" width="28" height="28" />
          <span class="tool-badge">Analysis</span>
          <h2>GIF Structure Analyzer</h2>
        </div>
        <p class="tool-description">
          Inspect GIF specification header, frame delays, disposal methods, color palette parameters, loop counts, and individual frame delta offsets.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="an-dropzone">
        <input type="file" id="an-file-input" accept="image/gif" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3>Choose, drop, or paste an animated GIF to inspect</h3>
          <p class="dropzone-subtext">Supports animated and static GIF files. 100% in-browser structural disassembly.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="an-browse-btn">Browse GIF</button>
            <button class="btn btn-secondary" id="an-demo-btn">Load Demo GIF</button>
          </div>
        </div>
      </div>

      <!-- Analysis Results Stage -->
      <div id="an-stage" class="tool-stage hidden">
        <!-- Technical Summary Cards Grid -->
        <div class="analysis-stats-grid" id="an-summary-grid"></div>

        <!-- Interactive Frame Scrubber & Preview Card -->
        <div class="card editor-card" style="margin-top: 20px;">
          <div class="stage-section-header">
            <h3>Visual Frame Inspector</h3>
            <span class="meta-pill" id="an-scrubber-counter">Frame 1 of 1</span>
          </div>

          <div class="preview-box" style="margin: 16px 0; max-height: 380px;">
            <canvas id="an-scrubber-canvas" class="media-preview" style="max-height: 360px;"></canvas>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label for="an-scrubber-range">Scrub Animation Frames:</label>
            <input type="range" id="an-scrubber-range" min="0" max="0" value="0" class="slider" />
          </div>

          <!-- Chaining Action Bar -->
          <div class="quick-chain-bar" style="margin-top: 14px;">
            <span class="chain-label">Quick Actions:</span>
            <button class="btn btn-sm btn-outline an-chain-btn" data-tool="optimizer">Optimize Size</button>
            <button class="btn btn-sm btn-outline an-chain-btn" data-tool="resizer">Resize</button>
            <button class="btn btn-sm btn-outline an-chain-btn" data-tool="cropper">Crop</button>
            <button class="btn btn-sm btn-outline an-chain-btn" data-tool="splitter">Split Frames</button>
            <button class="btn btn-sm btn-outline an-chain-btn" data-tool="effects">Effects</button>
          </div>
        </div>

        <!-- Per-Frame Technical Table -->
        <div class="card" style="margin-top: 24px; padding: 20px; overflow-x: auto;">
          <div class="stage-section-header">
            <h3>Per-Frame Breakdown (<span id="an-table-count">0</span> frames)</h3>
          </div>
          <table class="data-table" id="an-frames-table" style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left;">
                <th style="padding: 10px;">Frame #</th>
                <th style="padding: 10px;">Dimensions</th>
                <th style="padding: 10px;">Offset (X, Y)</th>
                <th style="padding: 10px;">Delay (1/100s)</th>
                <th style="padding: 10px;">Delay (ms)</th>
                <th style="padding: 10px;">Disposal Method</th>
                <th style="padding: 10px;">Transparency</th>
              </tr>
            </thead>
            <tbody id="an-table-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#an-dropzone');
  const fileInput = container.querySelector('#an-file-input');
  const browseBtn = container.querySelector('#an-browse-btn');
  const demoBtn = container.querySelector('#an-demo-btn');
  const stage = container.querySelector('#an-stage');
  const summaryGrid = container.querySelector('#an-summary-grid');
  const scrubberCanvas = container.querySelector('#an-scrubber-canvas');
  const scrubberRange = container.querySelector('#an-scrubber-range');
  const scrubberCounter = container.querySelector('#an-scrubber-counter');
  const tableCount = container.querySelector('#an-table-count');
  const tableBody = container.querySelector('#an-table-body');
  const chainBtns = container.querySelectorAll('.an-chain-btn');

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

  chainBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (loadedFile && onChainMedia) {
        onChainMedia(btn.dataset.tool, loadedFile, 'image/gif');
      }
    });
  });

  scrubberRange.addEventListener('input', (e) => {
    const idx = parseInt(e.target.value, 10);
    renderScrubberFrame(idx);
  });

  async function loadFile(file) {
    if (!file) return;
    try {
      const buffer = await readFileAsArrayBuffer(file);
      analysisReport = analyzeGif(buffer);
      decodedGifData = await decodeGif(buffer);
      loadedFile = file;
      renderAnalysis();
    } catch (err) {
      alert('Failed to analyze GIF: ' + err.message);
    }
  }

  async function loadDemo() {
    // Generate multi-frame canvas GIF buffer
    const frames = [];
    const colors = ['#E53935', '#2563EB', '#10B981', '#F59E0B'];
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 300;
      c.height = 300;
      const ctx = c.getContext('2d');
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Analyzer Frame #${i + 1}`, 150, 140);
      ctx.font = '14px system-ui';
      ctx.fillText('Inspection Demo', 150, 175);
      frames.push({ canvas: c, delay: (i + 1) * 80 });
    }
    const blob = await encodeGif(frames, { maxColors: 256, loop: 0 });
    const buffer = await blob.arrayBuffer();
    analysisReport = analyzeGif(buffer);
    decodedGifData = await decodeGif(buffer);
    loadedFile = new File([blob], 'pixelmint-sample.gif', { type: 'image/gif' });
    renderAnalysis();
  }

  function renderAnalysis() {
    stage.classList.remove('hidden');

    // Summary Metric Cards
    summaryGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">GIF Specification</div>
        <div class="stat-val" style="color: var(--brand-red);">${analysisReport.version}</div>
        <div class="stat-hint">${analysisReport.version === 'GIF89a' ? 'Supports Transparency & Delays' : 'Legacy Format'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Canvas Dimensions</div>
        <div class="stat-val">${analysisReport.width} × ${analysisReport.height} px</div>
        <div class="stat-hint">Aspect Ratio ${analysisReport.aspectRatio}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Frame Count</div>
        <div class="stat-val">${analysisReport.numFrames} frames</div>
        <div class="stat-hint">Average ${analysisReport.avgFps} FPS</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Duration & Loop</div>
        <div class="stat-val">${analysisReport.durationSec}s</div>
        <div class="stat-hint">${analysisReport.loopText}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">File Size</div>
        <div class="stat-val">${formatBytes(analysisReport.byteSize)}</div>
        <div class="stat-hint">${(analysisReport.byteSize / analysisReport.numFrames).toFixed(0)} bytes / frame avg</div>
      </div>
    `;

    // Setup Scrubber
    scrubberRange.max = analysisReport.numFrames - 1;
    scrubberRange.value = 0;
    renderScrubberFrame(0);

    // Populate Table
    tableCount.textContent = analysisReport.numFrames;
    tableBody.innerHTML = '';
    analysisReport.frameReports.forEach(r => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-subtle)';
      tr.innerHTML = `
        <td style="padding: 8px 10px; font-weight: 600;">#${r.index}</td>
        <td style="padding: 8px 10px;">${r.width} × ${r.height} px</td>
        <td style="padding: 8px 10px;">(${r.x}, ${r.y})</td>
        <td style="padding: 8px 10px;">${r.delayHundredths} cs</td>
        <td style="padding: 8px 10px;">${r.delayMs} ms</td>
        <td style="padding: 8px 10px;">
          <span class="meta-pill" style="font-size: 0.75rem;">${r.disposalName}</span>
        </td>
        <td style="padding: 8px 10px;">
          ${r.hasTransparency ? `<span style="color: #10B981; font-weight: 600;">Index ${r.transparentIndex}</span>` : '<span style="color: var(--text-dim);">None</span>'}
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function renderScrubberFrame(idx) {
    if (!decodedGifData || !decodedGifData.frames[idx]) return;
    activeFrameIndex = idx;
    scrubberCounter.textContent = `Frame ${idx + 1} of ${analysisReport.numFrames}`;

    const frameCanvas = decodedGifData.frames[idx].canvas;
    scrubberCanvas.width = frameCanvas.width;
    scrubberCanvas.height = frameCanvas.height;
    const ctx = scrubberCanvas.getContext('2d');
    ctx.clearRect(0, 0, scrubberCanvas.width, scrubberCanvas.height);
    ctx.drawImage(frameCanvas, 0, 0);
  }

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadFile(blobOrFile);
    }
  };
}
