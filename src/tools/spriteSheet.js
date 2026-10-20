/**
 * Sprite Sheet Tools for PixelMint
 * Dual-Mode Workstation:
 * 1. GIF to Sprite Sheet: Stitches animation frames into a single sprite sheet image (grid/strip)
 * 2. Sprite Sheet Cutter: Slices tiled sprite sheets into animation frames and creates animated GIFs
 */
import JSZip from 'jszip';
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderSpriteSheet(container, onChainMedia, initialMode = 'generator') {
  let activeTab = initialMode; // 'generator' | 'cutter'
  
  // Generator State
  let genLoadedFile = null;
  let genDecodedGif = null;
  let genLayout = 'grid'; // 'grid' | 'horizontal' | 'vertical'
  let genColumns = 4;
  let genPadding = 0;
  let genBgColor = 'transparent';
  let genResultCanvas = null;

  // Cutter State
  let cutLoadedImage = null;
  let cutMode = 'grid'; // 'grid' | 'dimension'
  let cutCols = 4, cutRows = 2;
  let cutTileW = 64, cutTileH = 64;
  let cutDelay = 15; // in 1/100s
  let cutLoop = 0;
  let cutSlicedCanvases = [];

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/view-grid.png" class="tool-hero-icon" alt="Sprite Sheet" width="28" height="28" />
          <span class="tool-badge">Sprite Utilities</span>
          <h2>Sprite Sheet Studio</h2>
        </div>
        <p class="tool-description">
          Convert animated GIFs into game sprite sheets, or slice existing sprite sheets back into animation frames and animated GIFs.
        </p>

        <!-- Submode Switcher Tabs -->
        <div class="sub-tool-tabs" style="display: flex; gap: 8px; margin-top: 16px;">
          <button class="btn ${activeTab === 'generator' ? 'btn-primary' : 'btn-outline'}" id="ss-tab-gen">
            GIF to Sprite Sheet
          </button>
          <button class="btn ${activeTab === 'cutter' ? 'btn-primary' : 'btn-outline'}" id="ss-tab-cut">
            Sprite Sheet Cutter
          </button>
        </div>
      </div>

      <!-- ================= MODE 1: GIF TO SPRITE SHEET ================= -->
      <div id="ss-view-gen" class="${activeTab === 'generator' ? '' : 'hidden'}">
        <div class="card dropzone-card" id="ss-gen-dropzone">
          <input type="file" id="ss-gen-file-input" accept="image/gif" class="file-input-hidden" />
          <div class="dropzone-content">
            <div class="dropzone-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h3>Upload an animated GIF to stitch into a sprite sheet</h3>
            <p class="dropzone-subtext">Tile your animation frames into horizontal strips, vertical columns, or responsive matrices.</p>
            <div class="dropzone-actions">
              <button class="btn btn-primary" id="ss-gen-browse-btn">Browse GIF</button>
              <button class="btn btn-secondary" id="ss-gen-demo-btn">Load Demo GIF</button>
            </div>
          </div>
        </div>

        <div id="ss-gen-stage" class="tool-stage hidden">
          <div class="card editor-card">
            <div class="settings-grid">
              <div class="form-group">
                <label for="ss-gen-layout">Tiling Layout</label>
                <select id="ss-gen-layout" class="select-input">
                  <option value="grid" selected>Grid Matrix (Custom Columns)</option>
                  <option value="horizontal">Horizontal Strip (1 Row)</option>
                  <option value="vertical">Vertical Strip (1 Column)</option>
                </select>
              </div>

              <div class="form-group" id="ss-gen-cols-group">
                <label for="ss-gen-cols">Number of Columns: <strong id="ss-gen-cols-val">4</strong></label>
                <input type="range" id="ss-gen-cols" min="1" max="12" value="4" class="slider" />
              </div>

              <div class="form-group">
                <label for="ss-gen-pad">Frame Spacing (padding px): <strong id="ss-gen-pad-val">0</strong></label>
                <input type="range" id="ss-gen-pad" min="0" max="20" value="0" class="slider" />
              </div>

              <div class="form-group">
                <label for="ss-gen-bg">Background Fill</label>
                <select id="ss-gen-bg" class="select-input">
                  <option value="transparent" selected>Transparent (Alpha PNG)</option>
                  <option value="#ffffff">White (#FFFFFF)</option>
                  <option value="#000000">Black (#000000)</option>
                </select>
              </div>
            </div>

            <div class="preview-box" style="margin: 20px 0; overflow: auto; max-height: 440px;">
              <canvas id="ss-gen-canvas" class="media-preview" style="background: repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 16px 16px;"></canvas>
            </div>

            <div class="actions-row" style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-accent btn-lg" id="ss-gen-dl-btn">Download Sprite Sheet (PNG)</button>
              <button class="btn btn-outline" id="ss-gen-to-cut-btn">Send to Cutter Tool &rarr;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MODE 2: SPRITE SHEET CUTTER ================= -->
      <div id="ss-view-cut" class="${activeTab === 'cutter' ? '' : 'hidden'}">
        <div class="card dropzone-card" id="ss-cut-dropzone">
          <input type="file" id="ss-cut-file-input" accept="image/*" class="file-input-hidden" />
          <div class="dropzone-content">
            <div class="dropzone-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3>Upload a Sprite Sheet Image to Slice</h3>
            <p class="dropzone-subtext">Supports PNG, JPG, WebP sprite sheets. Slice by grid rows/cols or fixed tile dimensions.</p>
            <div class="dropzone-actions">
              <button class="btn btn-primary" id="ss-cut-browse-btn">Browse Sprite Sheet</button>
              <button class="btn btn-secondary" id="ss-cut-demo-btn">Load Demo Sheet</button>
            </div>
          </div>
        </div>

        <div id="ss-cut-stage" class="tool-stage hidden">
          <div class="card editor-card">
            <div class="video-metadata" id="ss-cut-meta"></div>

            <div class="settings-grid">
              <div class="form-group">
                <label for="ss-cut-method">Slicing Method</label>
                <select id="ss-cut-method" class="select-input">
                  <option value="grid" selected>By Grid Count (Columns & Rows)</option>
                  <option value="dimension">By Tile Size (Width & Height px)</option>
                </select>
              </div>

              <!-- Grid Fields -->
              <div class="form-group" id="ss-cut-cols-group">
                <label for="ss-cut-cols">Columns</label>
                <input type="number" id="ss-cut-cols" min="1" max="100" value="4" class="num-input" />
              </div>
              <div class="form-group" id="ss-cut-rows-group">
                <label for="ss-cut-rows">Rows</label>
                <input type="number" id="ss-cut-rows" min="1" max="100" value="2" class="num-input" />
              </div>

              <!-- Dimension Fields -->
              <div class="form-group hidden" id="ss-cut-w-group">
                <label for="ss-cut-w">Tile Width (px)</label>
                <input type="number" id="ss-cut-w" min="1" max="4096" value="64" class="num-input" />
              </div>
              <div class="form-group hidden" id="ss-cut-h-group">
                <label for="ss-cut-h">Tile Height (px)</label>
                <input type="number" id="ss-cut-h" min="1" max="4096" value="64" class="num-input" />
              </div>

              <div class="form-group">
                <label for="ss-cut-delay">Animation Frame Delay: <strong id="ss-cut-delay-val">15</strong> (1/100s)</label>
                <input type="range" id="ss-cut-delay" min="2" max="100" value="15" class="slider" />
              </div>

              <div class="form-group">
                <label for="ss-cut-loop">Loop Count</label>
                <input type="number" id="ss-cut-loop" min="0" value="0" class="num-input" placeholder="0 = infinite" />
              </div>
            </div>

            <!-- Interactive Slice Preview with Grid Overlay -->
            <div class="preview-box" style="margin: 20px 0; overflow: auto; max-height: 400px; position: relative;">
              <canvas id="ss-cut-preview-canvas" class="media-preview"></canvas>
            </div>

            <div class="actions-row" style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-accent btn-lg" id="ss-cut-gen-gif-btn">
                Generate Animated GIF from Tiles!
              </button>
              <button class="btn btn-outline" id="ss-cut-zip-btn">
                Download Sliced Frames (ZIP)
              </button>
            </div>

            <!-- Progress Bar -->
            <div id="ss-cut-progress" class="progress-wrap hidden">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="ss-cut-pbar" style="width: 0%"></div>
              </div>
              <div class="progress-text" id="ss-cut-ptext">Slicing frames...</div>
            </div>
          </div>

          <!-- Output Preview for Cutter -->
          <div id="ss-cut-output" class="tool-output-stage hidden" style="margin-top: 24px;">
            <div class="card output-card">
              <div class="output-header">
                <h3>Assembled Animation</h3>
                <span class="status-pill status-success">Ready</span>
              </div>
              <div class="output-preview-container">
                <img id="ss-cut-out-img" class="output-preview-img" alt="Sliced Animated GIF" />
              </div>
              <div class="output-actions">
                <button class="btn btn-primary btn-lg" id="ss-cut-out-dl">Download GIF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Mode switching tabs
  const tabGen = container.querySelector('#ss-tab-gen');
  const tabCut = container.querySelector('#ss-tab-cut');
  const viewGen = container.querySelector('#ss-view-gen');
  const viewCut = container.querySelector('#ss-view-cut');

  function switchTab(mode) {
    activeTab = mode;
    tabGen.className = `btn ${mode === 'generator' ? 'btn-primary' : 'btn-outline'}`;
    tabCut.className = `btn ${mode === 'cutter' ? 'btn-primary' : 'btn-outline'}`;
    viewGen.classList.toggle('hidden', mode !== 'generator');
    viewCut.classList.toggle('hidden', mode !== 'cutter');
  }

  tabGen.addEventListener('click', () => switchTab('generator'));
  tabCut.addEventListener('click', () => switchTab('cutter'));

  // =========================================================================
  // GENERATOR LOGIC (GIF to Sprite Sheet)
  // =========================================================================
  const genDropzone = container.querySelector('#ss-gen-dropzone');
  const genFileInput = container.querySelector('#ss-gen-file-input');
  const genBrowseBtn = container.querySelector('#ss-gen-browse-btn');
  const genDemoBtn = container.querySelector('#ss-gen-demo-btn');
  const genStage = container.querySelector('#ss-gen-stage');
  const genLayoutSelect = container.querySelector('#ss-gen-layout');
  const genColsGroup = container.querySelector('#ss-gen-cols-group');
  const genColsSlider = container.querySelector('#ss-gen-cols');
  const genColsVal = container.querySelector('#ss-gen-cols-val');
  const genPadSlider = container.querySelector('#ss-gen-pad');
  const genPadVal = container.querySelector('#ss-gen-pad-val');
  const genBgSelect = container.querySelector('#ss-gen-bg');
  const genCanvas = container.querySelector('#ss-gen-canvas');
  const genDlBtn = container.querySelector('#ss-gen-dl-btn');
  const genToCutBtn = container.querySelector('#ss-gen-to-cut-btn');

  genBrowseBtn.addEventListener('click', () => genFileInput.click());
  genFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) loadGenGif(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(n => {
    genDropzone.addEventListener(n, (e) => { e.preventDefault(); genDropzone.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(n => {
    genDropzone.addEventListener(n, (e) => { e.preventDefault(); genDropzone.classList.remove('drag-active'); });
  });
  genDropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadGenGif(e.dataTransfer.files[0]);
    }
  });

  genDemoBtn.addEventListener('click', async () => {
    // Generate multi-frame canvas GIF for demo
    const frames = [];
    const emojis = ['💎', '🚀', '🔥', '✨', '⚡', '🌟', '🎯', '🏆'];
    for (let i = 0; i < 8; i++) {
      const c = document.createElement('canvas');
      c.width = 120;
      c.height = 120;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, 120, 120);
      ctx.fillStyle = '#E53935';
      ctx.beginPath();
      ctx.arc(60, 60, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '36px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojis[i], 60, 60);
      frames.push({ canvas: c, delay: 150 });
    }
    genDecodedGif = { width: 120, height: 120, frames };
    genLoadedFile = { name: 'demo-sprites.gif' };
    renderGenSpriteSheet();
  });

  async function loadGenGif(file) {
    if (!file) return;
    try {
      const buffer = await readFileAsArrayBuffer(file);
      genDecodedGif = await decodeGif(buffer);
      genLoadedFile = file;
      renderGenSpriteSheet();
    } catch (err) {
      alert('Failed to load GIF: ' + err.message);
    }
  }

  genLayoutSelect.addEventListener('change', () => {
    genLayout = genLayoutSelect.value;
    genColsGroup.classList.toggle('hidden', genLayout !== 'grid');
    renderGenSpriteSheet();
  });

  genColsSlider.addEventListener('input', (e) => {
    genColumns = parseInt(e.target.value, 10);
    genColsVal.textContent = genColumns;
    renderGenSpriteSheet();
  });

  genPadSlider.addEventListener('input', (e) => {
    genPadding = parseInt(e.target.value, 10);
    genPadVal.textContent = genPadding;
    renderGenSpriteSheet();
  });

  genBgSelect.addEventListener('change', () => {
    genBgColor = genBgSelect.value;
    renderGenSpriteSheet();
  });

  function renderGenSpriteSheet() {
    if (!genDecodedGif || genDecodedGif.frames.length === 0) return;
    genStage.classList.remove('hidden');

    const frames = genDecodedGif.frames;
    const numFrames = frames.length;
    const tileW = genDecodedGif.width;
    const tileH = genDecodedGif.height;

    let cols, rows;
    if (genLayout === 'horizontal') {
      cols = numFrames;
      rows = 1;
    } else if (genLayout === 'vertical') {
      cols = 1;
      rows = numFrames;
    } else {
      cols = Math.min(genColumns, numFrames);
      rows = Math.ceil(numFrames / cols);
    }

    const totalW = cols * tileW + (cols + 1) * genPadding;
    const totalH = rows * tileH + (rows + 1) * genPadding;

    genCanvas.width = totalW;
    genCanvas.height = totalH;
    const ctx = genCanvas.getContext('2d');
    ctx.clearRect(0, 0, totalW, totalH);

    if (genBgColor !== 'transparent') {
      ctx.fillStyle = genBgColor;
      ctx.fillRect(0, 0, totalW, totalH);
    }

    frames.forEach((frameObj, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const x = genPadding + c * (tileW + genPadding);
      const y = genPadding + r * (tileH + genPadding);
      ctx.drawImage(frameObj.canvas, x, y);
    });

    genResultCanvas = genCanvas;
  }

  genDlBtn.addEventListener('click', () => {
    if (!genResultCanvas) return;
    genResultCanvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'pixelmint-spritesheet.png');
    }, 'image/png');
  });

  genToCutBtn.addEventListener('click', () => {
    if (!genResultCanvas) return;
    genResultCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'spritesheet.png', { type: 'image/png' });
        loadCutImage(file);
        switchTab('cutter');
      }
    }, 'image/png');
  });

  // =========================================================================
  // CUTTER LOGIC (Sprite Sheet to Animation Frames & GIF)
  // =========================================================================
  const cutDropzone = container.querySelector('#ss-cut-dropzone');
  const cutFileInput = container.querySelector('#ss-cut-file-input');
  const cutBrowseBtn = container.querySelector('#ss-cut-browse-btn');
  const cutDemoBtn = container.querySelector('#ss-cut-demo-btn');
  const cutStage = container.querySelector('#ss-cut-stage');
  const cutMeta = container.querySelector('#ss-cut-meta');
  const cutMethodSelect = container.querySelector('#ss-cut-method');
  const cutColsGroup = container.querySelector('#ss-cut-cols-group');
  const cutRowsGroup = container.querySelector('#ss-cut-rows-group');
  const cutWGroup = container.querySelector('#ss-cut-w-group');
  const cutHGroup = container.querySelector('#ss-cut-h-group');
  const cutColsInput = container.querySelector('#ss-cut-cols');
  const cutRowsInput = container.querySelector('#ss-cut-rows');
  const cutWInput = container.querySelector('#ss-cut-w');
  const cutHInput = container.querySelector('#ss-cut-h');
  const cutDelaySlider = container.querySelector('#ss-cut-delay');
  const cutDelayVal = container.querySelector('#ss-cut-delay-val');
  const cutLoopInput = container.querySelector('#ss-cut-loop');
  const cutPreviewCanvas = container.querySelector('#ss-cut-preview-canvas');
  const cutGenGifBtn = container.querySelector('#ss-cut-gen-gif-btn');
  const cutZipBtn = container.querySelector('#ss-cut-zip-btn');
  const cutProgress = container.querySelector('#ss-cut-progress');
  const cutPbar = container.querySelector('#ss-cut-pbar');
  const cutPtext = container.querySelector('#ss-cut-ptext');
  const cutOutputStage = container.querySelector('#ss-cut-output');
  const cutOutImg = container.querySelector('#ss-cut-out-img');
  const cutOutDlBtn = container.querySelector('#ss-cut-out-dl');
  let cutGeneratedGifBlob = null;

  cutBrowseBtn.addEventListener('click', () => cutFileInput.click());
  cutFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) loadCutImage(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(n => {
    cutDropzone.addEventListener(n, (e) => { e.preventDefault(); cutDropzone.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(n => {
    cutDropzone.addEventListener(n, (e) => { e.preventDefault(); cutDropzone.classList.remove('drag-active'); });
  });
  cutDropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadCutImage(e.dataTransfer.files[0]);
    }
  });

  cutDemoBtn.addEventListener('click', async () => {
    // Generate a 4x2 demo sprite sheet
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 320;
    demoCanvas.height = 160;
    const ctx = demoCanvas.getContext('2d');
    const cols = 4, rows = 2;
    const tw = 80, th = 80;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        ctx.fillStyle = idx % 2 === 0 ? '#E53935' : '#1E293B';
        ctx.fillRect(c * tw, r * th, tw, th);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Tile ${idx + 1}`, c * tw + tw / 2, r * th + th / 2);
      }
    }
    const blob = await new Promise(res => demoCanvas.toBlob(res, 'image/png'));
    const file = new File([blob], 'demo-sheet.png', { type: 'image/png' });
    loadCutImage(file);
  });

  async function loadCutImage(file) {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      cutLoadedImage = await loadImageFromSrc(dataUrl);

      cutMeta.innerHTML = `
        <div class="metadata-item"><strong>Source Image:</strong> ${file.name || 'sheet.png'}</div>
        <div class="metadata-item"><strong>Dimensions:</strong> ${cutLoadedImage.width} × ${cutLoadedImage.height} px</div>
      `;

      cutStage.classList.remove('hidden');
      updateCutterGrid();
    } catch (err) {
      alert('Failed to load sprite sheet: ' + err.message);
    }
  }

  cutMethodSelect.addEventListener('change', () => {
    cutMode = cutMethodSelect.value;
    const isGrid = cutMode === 'grid';
    cutColsGroup.classList.toggle('hidden', !isGrid);
    cutRowsGroup.classList.toggle('hidden', !isGrid);
    cutWGroup.classList.toggle('hidden', isGrid);
    cutHGroup.classList.toggle('hidden', isGrid);
    updateCutterGrid();
  });

  [cutColsInput, cutRowsInput, cutWInput, cutHInput].forEach(inp => {
    inp.addEventListener('input', updateCutterGrid);
  });

  cutDelaySlider.addEventListener('input', (e) => {
    cutDelay = parseInt(e.target.value, 10);
    cutDelayVal.textContent = cutDelay;
  });

  function updateCutterGrid() {
    if (!cutLoadedImage) return;
    const imgW = cutLoadedImage.width;
    const imgH = cutLoadedImage.height;

    let cols, rows, tw, th;
    if (cutMode === 'grid') {
      cols = Math.max(1, parseInt(cutColsInput.value, 10) || 1);
      rows = Math.max(1, parseInt(cutRowsInput.value, 10) || 1);
      tw = Math.floor(imgW / cols);
      th = Math.floor(imgH / rows);
    } else {
      tw = Math.max(1, parseInt(cutWInput.value, 10) || 64);
      th = Math.max(1, parseInt(cutHInput.value, 10) || 64);
      cols = Math.floor(imgW / tw);
      rows = Math.floor(imgH / th);
    }

    cutCols = cols;
    cutRows = rows;
    cutTileW = tw;
    cutTileH = th;

    // Draw preview with red slice grid overlays
    cutPreviewCanvas.width = imgW;
    cutPreviewCanvas.height = imgH;
    const ctx = cutPreviewCanvas.getContext('2d');
    ctx.drawImage(cutLoadedImage, 0, 0);

    // Grid lines
    ctx.strokeStyle = '#E53935';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * tw, 0);
      ctx.lineTo(c * tw, rows * th);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * th);
      ctx.lineTo(cols * tw, r * th);
      ctx.stroke();
    }

    // Tile indices label
    ctx.setLineDash([]);
    ctx.fillStyle = '#E53935';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c + 1;
        ctx.fillStyle = 'rgba(229, 57, 53, 0.7)';
        ctx.fillRect(c * tw + 2, r * th + 2, 24, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`#${idx}`, c * tw + 4, r * th + 4);
      }
    }
  }

  function sliceFrames() {
    if (!cutLoadedImage) return [];
    const slices = [];
    for (let r = 0; r < cutRows; r++) {
      for (let c = 0; c < cutCols; c++) {
        const canvas = document.createElement('canvas');
        canvas.width = cutTileW;
        canvas.height = cutTileH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          cutLoadedImage,
          c * cutTileW, r * cutTileH, cutTileW, cutTileH,
          0, 0, cutTileW, cutTileH
        );
        slices.push(canvas);
      }
    }
    return slices;
  }

  // Generate GIF from slices
  cutGenGifBtn.addEventListener('click', async () => {
    const slices = sliceFrames();
    if (slices.length === 0) return;

    cutProgress.classList.remove('hidden');
    cutPbar.style.width = '10%';
    cutPtext.textContent = 'Encoding animated GIF...';

    const loop = parseInt(cutLoopInput.value, 10) || 0;
    const delayMs = cutDelay * 10;
    const frameData = slices.map(c => ({ canvas: c, delay: delayMs }));

    try {
      const blob = await encodeGif(frameData, {
        maxColors: 256,
        dither: 'floyd',
        loop,
        onProgress: (p) => {
          cutPbar.style.width = `${p}%`;
          cutPtext.textContent = `Encoding GIF... ${p}%`;
        }
      });

      cutGeneratedGifBlob = blob;
      cutOutImg.src = URL.createObjectURL(blob);
      cutOutputStage.classList.remove('hidden');
      cutPbar.style.width = '100%';
      cutPtext.textContent = 'Done!';
      setTimeout(() => cutProgress.classList.add('hidden'), 1200);

      cutOutImg.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Failed to generate GIF: ' + err.message);
      cutProgress.classList.add('hidden');
    }
  });

  cutOutDlBtn.addEventListener('click', () => {
    if (cutGeneratedGifBlob) {
      downloadBlob(cutGeneratedGifBlob, 'sliced-animation.gif');
    }
  });

  // ZIP download of sliced frames
  cutZipBtn.addEventListener('click', async () => {
    const slices = sliceFrames();
    if (slices.length === 0) return;

    cutProgress.classList.remove('hidden');
    cutPbar.style.width = '20%';
    cutPtext.textContent = 'Packaging sliced frames into ZIP...';

    try {
      const zip = new JSZip();
      const folder = zip.folder('pixelmint-sprites');
      for (let i = 0; i < slices.length; i++) {
        const b = await new Promise(res => slices[i].toBlob(res, 'image/png'));
        folder.file(`tile_${String(i + 1).padStart(3, '0')}.png`, b);
      }
      cutPbar.style.width = '80%';
      cutPtext.textContent = 'Compressing archive...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'sliced-sprites.zip');
      cutPbar.style.width = '100%';
      cutPtext.textContent = 'ZIP download started!';
      setTimeout(() => cutProgress.classList.add('hidden'), 1200);
    } catch (err) {
      alert('Failed to create ZIP: ' + err.message);
      cutProgress.classList.add('hidden');
    }
  });

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) {
        if (blobOrFile.type === 'image/gif') {
          switchTab('generator');
          loadGenGif(blobOrFile);
        } else {
          switchTab('cutter');
          loadCutImage(blobOrFile);
        }
      }
    }
  };
}
