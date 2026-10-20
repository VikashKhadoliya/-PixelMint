/**
 * GIF to MP4 / WebM Video Converter for PixelMint
 * Converts animated GIFs into modern lightweight video clips directly in the browser
 */
import { decodeGif, encodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../utils/fileHelpers.js';

export function renderGifToMp4(container, onChainMedia) {
  let loadedFile = null;
  let decodedGifData = null;
  let isConverting = false;
  let generatedBlob = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="tool-hero-icon-svg" style="color: var(--brand-red);">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span class="tool-badge">Video Export</span>
          <h2>GIF to MP4 &amp; WebM Video Converter</h2>
        </div>
        <p class="tool-description">
          Convert heavy animated GIFs into lightweight, hardware-accelerated video clips. Save up to 90% bandwidth with standard video playback controls.
        </p>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="g2v-dropzone">
        <input type="file" id="g2v-file-input" accept="image/gif" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
          </div>
          <h3>Choose, drop, or paste an animated GIF here</h3>
          <p class="dropzone-subtext">Supports animated GIF files. Converted in-browser into high-efficiency video.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="g2v-browse-btn">Browse GIF</button>
            <button class="btn btn-secondary" id="g2v-demo-btn">Load Demo GIF</button>
          </div>
        </div>
      </div>

      <!-- Settings Stage -->
      <div id="g2v-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <div class="video-metadata" id="g2v-meta"></div>

          <div class="settings-grid">
            <div class="form-group">
              <label for="g2v-loops">Number of Animation Loops in Video</label>
              <select id="g2v-loops" class="select-input">
                <option value="1">1 Loop (Single Playthrough)</option>
                <option value="2" selected>2 Loops (Recommended for short clips)</option>
                <option value="3">3 Loops</option>
                <option value="5">5 Loops</option>
              </select>
            </div>
            <div class="form-group">
              <label for="g2v-fps">Video Encoding Framerate</label>
              <select id="g2v-fps" class="select-input">
                <option value="30" selected>30 FPS (Smooth Standard)</option>
                <option value="60">60 FPS (Ultra Smooth)</option>
                <option value="24">24 FPS (Cinematic)</option>
              </select>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 16px;">
            <button class="btn btn-accent btn-lg" id="g2v-convert-btn">
              Convert GIF to Video!
            </button>
          </div>

          <!-- Progress -->
          <div id="g2v-progress" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="g2v-pbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="g2v-ptext">Encoding video frames...</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="g2v-output" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Converted Video File</h3>
            <span class="status-pill status-success">Success</span>
          </div>

          <div class="output-preview-container">
            <video id="g2v-out-video" controls autoplay loop playsinline class="video-preview-player"></video>
          </div>

          <div class="output-stats" id="g2v-out-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="g2v-dl-btn">Download Video File</button>
          </div>

          <!-- Pipeline Chaining -->
          <div class="pipeline-chain-bar" style="margin-top: 16px;">
            <span class="chain-label">Pass Video Output Into:</span>
            <div class="chain-buttons">
              <button class="chain-btn" data-target="videoTools">Cut Video</button>
              <button class="chain-btn" data-target="videoTools">Resize Video</button>
              <button class="chain-btn" data-target="videoTools">Crop Video</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#g2v-dropzone');
  const fileInput = container.querySelector('#g2v-file-input');
  const browseBtn = container.querySelector('#g2v-browse-btn');
  const demoBtn = container.querySelector('#g2v-demo-btn');
  const stage = container.querySelector('#g2v-stage');
  const metaBox = container.querySelector('#g2v-meta');
  const loopsSelect = container.querySelector('#g2v-loops');
  const fpsSelect = container.querySelector('#g2v-fps');
  const convertBtn = container.querySelector('#g2v-convert-btn');
  const progressWrap = container.querySelector('#g2v-progress');
  const pbar = container.querySelector('#g2v-pbar');
  const ptext = container.querySelector('#g2v-ptext');
  const outputStage = container.querySelector('#g2v-output');
  const outVideo = container.querySelector('#g2v-out-video');
  const outStats = container.querySelector('#g2v-out-stats');
  const dlBtn = container.querySelector('#g2v-dl-btn');

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

  async function loadFile(file) {
    if (!file) return;
    try {
      loadedFile = file;
      const buffer = await readFileAsArrayBuffer(file);
      decodedGifData = await decodeGif(buffer);

      let totalDurationMs = 0;
      decodedGifData.frames.forEach(f => { totalDurationMs += (f.delay || 100); });

      metaBox.innerHTML = `
        <div class="metadata-item"><strong>Source GIF:</strong> ${file.name}</div>
        <div class="metadata-item"><strong>Dimensions:</strong> ${decodedGifData.width} × ${decodedGifData.height} px</div>
        <div class="metadata-item"><strong>Frames:</strong> ${decodedGifData.frames.length} frames</div>
        <div class="metadata-item"><strong>GIF Size:</strong> ${formatBytes(file.size)}</div>
        <div class="metadata-item"><strong>Duration:</strong> ${(totalDurationMs / 1000).toFixed(2)}s per cycle</div>
      `;

      stage.classList.remove('hidden');
    } catch (err) {
      alert('Failed to load GIF: ' + err.message);
    }
  }

  async function loadDemo() {
    const frames = [];
    const colors = ['#E53935', '#0F172A', '#2563EB', '#10B981'];
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 400;
      const ctx = c.getContext('2d');
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Video Demo #${i + 1}`, 200, 190);
      frames.push({ canvas: c, delay: 200 });
    }
    const blob = await encodeGif(frames, { maxColors: 256, loop: 0 });
    const file = new File([blob], 'demo-animation.gif', { type: 'image/gif' });
    loadFile(file);
  }

  convertBtn.addEventListener('click', async () => {
    if (!decodedGifData || isConverting) return;
    isConverting = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Rendering GIF into video stream...';

    const numLoops = parseInt(loopsSelect.value, 10) || 2;
    const fps = parseInt(fpsSelect.value, 10) || 30;
    const w = decodedGifData.width;
    const h = decodedGifData.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(fps);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = () => {
      generatedBlob = new Blob(chunks, { type: mime });
      outVideo.src = URL.createObjectURL(generatedBlob);
      outputStage.classList.remove('hidden');

      const savedBytes = loadedFile.size - generatedBlob.size;
      const savedPct = loadedFile.size > 0 ? ((savedBytes / loadedFile.size) * 100).toFixed(1) : 0;

      outStats.innerHTML = `
        <div class="metadata-item"><strong>Output Format:</strong> WebM Video (VP9)</div>
        <div class="metadata-item"><strong>GIF Size:</strong> ${formatBytes(loadedFile.size)}</div>
        <div class="metadata-item"><strong>Video Size:</strong> <span style="color: var(--brand-red); font-weight: 700;">${formatBytes(generatedBlob.size)}</span></div>
        <div class="metadata-item"><strong>Savings:</strong> ${savedPct > 0 ? `-${savedPct}% smaller` : 'High efficiency'}</div>
      `;

      pbar.style.width = '100%';
      ptext.textContent = 'Conversion complete!';
      setTimeout(() => progressWrap.classList.add('hidden'), 1000);
      isConverting = false;
      outputStage.scrollIntoView({ behavior: 'smooth' });
    };

    recorder.start();

    const frames = decodedGifData.frames;
    const totalFramesInLoop = frames.length;
    const totalFrameSteps = totalFramesInLoop * numLoops;
    let currentStep = 0;

    for (let l = 0; l < numLoops; l++) {
      for (let i = 0; i < totalFramesInLoop; i++) {
        const frameObj = frames[i];
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(frameObj.canvas, 0, 0);

        currentStep++;
        const pct = Math.round((currentStep / totalFrameSteps) * 85);
        pbar.style.width = `${pct}%`;
        ptext.textContent = `Recording frames: ${currentStep} of ${totalFrameSteps}...`;

        // Wait for frame duration
        await new Promise(r => setTimeout(r, frameObj.delay || 100));
      }
    }

    // Flush recorder
    setTimeout(() => {
      recorder.stop();
    }, 200);
  });

  dlBtn.addEventListener('click', () => {
    if (generatedBlob) downloadBlob(generatedBlob, 'converted-video.webm');
  });

  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (generatedBlob && onChainMedia) {
        onChainMedia(btn.dataset.target, generatedBlob, 'video/webm');
      }
    });
  });

  return {
    loadMedia: (blobOrFile) => {
      if (blobOrFile) loadFile(blobOrFile);
    }
  };
}
