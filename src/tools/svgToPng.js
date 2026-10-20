/**
 * SVG to PNG / Raster Converter for PixelMint
 * Rasterizes scalable vector graphics (SVG) at custom DPI scale factors (1x, 2x, 4x, 8x)
 */
import { formatBytes, downloadBlob, readFileAsDataURL, loadImageFromSrc } from '../utils/fileHelpers.js';

export function renderSvgToPng(container, onChainMedia) {
  let loadedFile = null;
  let svgImage = null;
  let svgDataUrl = null;
  let originalW = 0;
  let originalH = 0;
  let scaleFactor = 2; // Default 2x Retina
  let targetFormat = 'image/png';
  let bgColor = '#ffffff';
  let generatedBlob = null;
  let resultCanvas = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="tool-hero-icon-svg" style="color: var(--brand-red);">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span class="tool-badge">Vector Converter</span>
          <h2>SVG to PNG &amp; Raster Converter</h2>
        </div>
        <p class="tool-description">
          Convert vector SVG graphics into crisp raster images (PNG, WebP, JPG) with high-DPI scaling up to 8x resolution.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="svg-dropzone">
        <input type="file" id="svg-file-input" accept=".svg,image/svg+xml" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <h3>Choose, drop, or paste an SVG file here</h3>
          <p class="dropzone-subtext">Supports vector SVG files. Clean rasterization at arbitrary resolution without quality loss.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="svg-browse-btn">Browse SVG</button>
            <button class="btn btn-secondary" id="svg-demo-btn">Load Demo SVG</button>
          </div>
        </div>
      </div>

      <!-- Settings Stage -->
      <div id="svg-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <div class="preview-box" style="margin-bottom: 20px; background: repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 16px 16px;">
            <canvas id="svg-preview-canvas" class="media-preview"></canvas>
          </div>

          <div class="video-metadata" id="svg-meta"></div>

          <div class="settings-grid">
            <div class="form-group">
              <label for="svg-scale">Resolution Scale Factor</label>
              <select id="svg-scale" class="select-input">
                <option value="1">1x (Original SVG Dimensions)</option>
                <option value="2" selected>2x (High-DPI / Retina Crisp)</option>
                <option value="4">4x (Ultra HD / 4K Resolution)</option>
                <option value="8">8x (Print &amp; High-Magnification)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="svg-format">Output Format</label>
              <select id="svg-format" class="select-input">
                <option value="image/png" selected>PNG (Lossless Transparency)</option>
                <option value="image/webp">WebP (Modern Compact)</option>
                <option value="image/jpeg">JPG / JPEG (Flattened)</option>
              </select>
            </div>

            <div class="form-group" id="svg-bg-wrap" style="display: none;">
              <label for="svg-bg-color">Background Color (for JPG)</label>
              <div class="color-picker-wrap">
                <input type="color" id="svg-bg-color" value="#ffffff" class="color-input" />
                <span class="color-hex-label" id="svg-bg-label">#FFFFFF</span>
              </div>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-accent btn-lg" id="svg-raster-btn">
              Download Raster Image!
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#svg-dropzone');
  const fileInput = container.querySelector('#svg-file-input');
  const browseBtn = container.querySelector('#svg-browse-btn');
  const demoBtn = container.querySelector('#svg-demo-btn');
  const stage = container.querySelector('#svg-stage');
  const previewCanvas = container.querySelector('#svg-preview-canvas');
  const metaBox = container.querySelector('#svg-meta');
  const scaleSelect = container.querySelector('#svg-scale');
  const formatSelect = container.querySelector('#svg-format');
  const bgWrap = container.querySelector('#svg-bg-wrap');
  const bgColorInput = container.querySelector('#svg-bg-color');
  const bgLabel = container.querySelector('#svg-bg-label');
  const rasterBtn = container.querySelector('#svg-raster-btn');

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) loadSvg(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(n => {
    dropzone.addEventListener(n, (e) => { e.preventDefault(); dropzone.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(n => {
    dropzone.addEventListener(n, (e) => { e.preventDefault(); dropzone.classList.remove('drag-active'); });
  });
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadSvg(e.dataTransfer.files[0]);
    }
  });

  demoBtn.addEventListener('click', () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E53935"/>
          <stop offset="100%" stop-color="#1E293B"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#g)"/>
      <polygon points="100,30 125,80 180,85 140,125 150,180 100,150 50,180 60,125 20,85 75,80" fill="#FFFFFF"/>
    </svg>`;
    const blob = new Blob([sampleSvg], { type: 'image/svg+xml' });
    const file = new File([blob], 'demo-star.svg', { type: 'image/svg+xml' });
    loadSvg(file);
  });

  scaleSelect.addEventListener('change', () => {
    scaleFactor = parseInt(scaleSelect.value, 10);
    renderCanvas();
  });

  formatSelect.addEventListener('change', () => {
    targetFormat = formatSelect.value;
    bgWrap.style.display = targetFormat === 'image/jpeg' ? 'block' : 'none';
    renderCanvas();
  });

  bgColorInput.addEventListener('input', (e) => {
    bgColor = e.target.value;
    bgLabel.textContent = bgColor.toUpperCase();
    if (targetFormat === 'image/jpeg') renderCanvas();
  });

  async function loadSvg(file) {
    if (!file) return;
    try {
      loadedFile = file;
      svgDataUrl = await readFileAsDataURL(file);
      svgImage = await loadImageFromSrc(svgDataUrl);
      originalW = svgImage.naturalWidth || svgImage.width || 400;
      originalH = svgImage.naturalHeight || svgImage.height || 400;

      stage.classList.remove('hidden');
      renderCanvas();
    } catch (err) {
      alert('Error loading SVG: ' + err.message);
    }
  }

  function renderCanvas() {
    if (!svgImage) return;

    const outW = Math.round(originalW * scaleFactor);
    const outH = Math.round(originalH * scaleFactor);

    previewCanvas.width = outW;
    previewCanvas.height = outH;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, outW, outH);

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, outW, outH);
    }

    ctx.drawImage(svgImage, 0, 0, outW, outH);

    metaBox.innerHTML = `
      <div class="metadata-item"><strong>Source:</strong> ${loadedFile.name}</div>
      <div class="metadata-item"><strong>Vector Dimensions:</strong> ${originalW} × ${originalH} px</div>
      <div class="metadata-item"><strong>Raster Dimensions:</strong> <span style="color: var(--brand-red); font-weight: 700;">${outW} × ${outH} px</span> (${scaleFactor}x)</div>
    `;

    resultCanvas = previewCanvas;
  }

  rasterBtn.addEventListener('click', () => {
    if (!resultCanvas) return;
    const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/webp' ? 'webp' : 'png';
    resultCanvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `rasterized-${scaleFactor}x.${ext}`);
      }
    }, targetFormat, 0.95);
  });

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadSvg(blobOrFile);
    }
  };
}
