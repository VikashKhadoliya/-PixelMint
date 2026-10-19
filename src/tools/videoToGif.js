/**
 * Video to GIF Converter for PixelMint
 * Extracts video frames at specified FPS & time range and encodes to animated GIF
 */
import { encodeGif } from '../utils/gifUtils.js';
import { formatBytes, downloadBlob } from '../utils/fileHelpers.js';

export function renderVideoToGif(container, onChainMedia) {
  let videoBlob = null;
  let videoElement = null;
  let isConverting = false;
  let generatedBlob = null;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="/icons/camera-video.svg" class="tool-hero-icon" alt="Video to GIF" />
          <span class="tool-badge">Video Converter</span>
          <h2>Video to Animated GIF</h2>
        </div>
        <p class="tool-description">
          Convert MP4, WebM, or MOV video clips into lightweight, high-framerate animated GIFs. 
          Hardware-decoded and processed directly in your browser.
        </p>
      </div>

      <!-- Video Ingestion Card -->
      <div class="card dropzone-card" id="vtg-dropzone">
        <input type="file" id="vtg-file-input" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <h3>Choose, drop, or paste a video file here</h3>
          <p class="dropzone-subtext">Supports MP4, WebM, MOV. Recommended clip length: under 30 seconds.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="vtg-browse-btn">Browse Video</button>
            <button class="btn btn-secondary" id="vtg-demo-btn">Generate Demo Video</button>
          </div>
        </div>
      </div>

      <!-- Video Player & Trimming Controls -->
      <div id="vtg-stage" class="tool-stage hidden">
        <div class="card video-player-card">
          <div class="video-preview-wrapper">
            <video id="vtg-video" controls playsinline class="video-preview-player"></video>
          </div>

          <div class="video-metadata" id="vtg-metadata"></div>

          <!-- Trimming and Settings -->
          <div class="settings-grid">
            <div class="form-group">
              <label for="vtg-start">Start Time (seconds)</label>
              <div class="input-with-button">
                <input type="number" id="vtg-start" step="0.1" min="0" value="0.0" class="num-input" />
                <button class="btn btn-sm btn-outline" id="vtg-set-start">Current Pos</button>
              </div>
            </div>

            <div class="form-group">
              <label for="vtg-end">End Time (seconds)</label>
              <div class="input-with-button">
                <input type="number" id="vtg-end" step="0.1" min="0.1" value="3.0" class="num-input" />
                <button class="btn btn-sm btn-outline" id="vtg-set-end">Current Pos</button>
              </div>
            </div>

            <div class="form-group">
              <label for="vtg-size">Target Dimensions</label>
              <select id="vtg-size" class="select-input">
                <option value="original" selected>Original Width</option>
                <option value="640">640px Max Width</option>
                <option value="480">480px Max Width (Recommended)</option>
                <option value="320">320px Max Width (Fast & Light)</option>
                <option value="240">240px Max Width (Micro GIF)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="vtg-fps">Framerate (FPS)</label>
              <select id="vtg-fps" class="select-input">
                <option value="10" selected>10 FPS (Standard balance)</option>
                <option value="15">15 FPS (Smooth motion)</option>
                <option value="20">20 FPS (Fluid animation)</option>
                <option value="5">5 FPS (Compact file size)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="vtg-dither">Dither Mode</label>
              <select id="vtg-dither" class="select-input">
                <option value="floyd" selected>Floyd-Steinberg (Best quality)</option>
                <option value="none">No Dither (Faster, sharp)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="vtg-colors">Palette Colors</label>
              <select id="vtg-colors" class="select-input">
                <option value="256" selected>256 Colors</option>
                <option value="128">128 Colors</option>
                <option value="64">64 Colors</option>
              </select>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn btn-accent btn-lg" id="vtg-convert-btn">
              <img src="/icons/camera-video.svg" class="btn-icon-img" alt="" /> Convert to GIF!
            </button>
          </div>

          <!-- Conversion Progress -->
          <div id="vtg-progress-wrap" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="vtg-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="vtg-progress-text">Extracting video frames... 0%</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="vtg-output-wrap" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Converted Animated GIF</h3>
            <span class="status-pill status-success">Success</span>
          </div>

          <div class="output-preview-container">
            <img id="vtg-output-img" class="output-preview-img" alt="Converted GIF" />
          </div>

          <div class="output-stats" id="vtg-output-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="vtg-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download GIF
            </button>
          </div>

          <!-- Chaining Action Bar -->
          <div class="chain-pipeline">
            <div class="chain-title">Chain this result into another tool:</div>
            <div class="chain-buttons">
              <button class="chain-btn" data-tool="cropper"><img src="/icons/transform-crop.svg" class="chain-btn-icon" alt="" /> Crop</button>
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
  const dropzone = container.querySelector('#vtg-dropzone');
  const fileInput = container.querySelector('#vtg-file-input');
  const browseBtn = container.querySelector('#vtg-browse-btn');
  const demoBtn = container.querySelector('#vtg-demo-btn');
  const stage = container.querySelector('#vtg-stage');
  const video = container.querySelector('#vtg-video');
  const metadata = container.querySelector('#vtg-metadata');

  const startInput = container.querySelector('#vtg-start');
  const endInput = container.querySelector('#vtg-end');
  const setStartBtn = container.querySelector('#vtg-set-start');
  const setEndBtn = container.querySelector('#vtg-set-end');
  const sizeSelect = container.querySelector('#vtg-size');
  const fpsSelect = container.querySelector('#vtg-fps');
  const ditherSelect = container.querySelector('#vtg-dither');
  const colorsSelect = container.querySelector('#vtg-colors');
  const convertBtn = container.querySelector('#vtg-convert-btn');

  const progressWrap = container.querySelector('#vtg-progress-wrap');
  const progressBar = container.querySelector('#vtg-progress-bar');
  const progressText = container.querySelector('#vtg-progress-text');

  const outputWrap = container.querySelector('#vtg-output-wrap');
  const outputImg = container.querySelector('#vtg-output-img');
  const outputStats = container.querySelector('#vtg-output-stats');
  const downloadBtn = container.querySelector('#vtg-download-btn');

  videoElement = video;

  // File handling
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadVideoFile(e.target.files[0]);
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
      loadVideoFile(e.dataTransfer.files[0]);
    }
  });

  // Demo Video Generator using HTML5 Canvas Stream + MediaRecorder
  demoBtn.addEventListener('click', async () => {
    demoBtn.disabled = true;
    demoBtn.textContent = 'Generating Demo...';
    try {
      const demoBlob = await createDemoVideoBlob();
      loadVideoBlob(demoBlob, 'pixelmint-demo-clip.webm');
    } catch (err) {
      console.warn('Canvas video recording error:', err);
      alert('Could not record demo video: ' + err.message);
    } finally {
      demoBtn.disabled = false;
      demoBtn.textContent = 'Generate Demo Video';
    }
  });

  function loadVideoFile(file) {
    videoBlob = file;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();

    video.onloadedmetadata = () => {
      stage.classList.remove('hidden');
      startInput.value = '0.0';
      endInput.value = Math.min(video.duration, 5.0).toFixed(1);
      metadata.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Resolution:</span> <strong>${video.videoWidth} &times; ${video.videoHeight} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Duration:</span> <strong>${video.duration.toFixed(2)}s</strong></div>
        <div class="stat-pill"><span class="stat-label">File Size:</span> <strong>${formatBytes(file.size)}</strong></div>
      `;
      stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  function loadVideoBlob(blob, name) {
    videoBlob = blob;
    const url = URL.createObjectURL(blob);
    video.src = url;
    video.load();
    video.onloadedmetadata = () => {
      stage.classList.remove('hidden');
      startInput.value = '0.0';
      endInput.value = Math.min(video.duration, 3.0).toFixed(1);
      metadata.innerHTML = `
        <div class="stat-pill"><span class="stat-label">Resolution:</span> <strong>${video.videoWidth} &times; ${video.videoHeight} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Duration:</span> <strong>${video.duration.toFixed(2)}s</strong></div>
        <div class="stat-pill"><span class="stat-label">File Size:</span> <strong>${formatBytes(blob.size)}</strong></div>
      `;
    };
  }

  // Set position buttons
  setStartBtn.addEventListener('click', () => {
    startInput.value = video.currentTime.toFixed(1);
  });

  setEndBtn.addEventListener('click', () => {
    endInput.value = video.currentTime.toFixed(1);
  });

  // Convert Video to GIF via Frame Extraction Loop
  convertBtn.addEventListener('click', async () => {
    if (!video || !video.duration) return;
    if (isConverting) return;

    const start = parseFloat(startInput.value) || 0;
    const end = parseFloat(endInput.value) || video.duration;
    if (end <= start) {
      alert('End time must be greater than start time.');
      return;
    }
    const duration = end - start;
    if (duration > 60) {
      alert('To maintain optimal browser performance, please limit conversion duration to 60 seconds.');
      return;
    }

    try {
      isConverting = true;
      convertBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Extracting video frames... 0%';

      const fps = parseInt(fpsSelect.value, 10);
      const totalFrames = Math.max(2, Math.round(duration * fps));
      const step = duration / totalFrames;
      const delayMs = Math.round(1000 / fps);

      // Determine dimensions
      let targetW = video.videoWidth;
      let targetH = video.videoHeight;
      const sizeOpt = sizeSelect.value;
      if (sizeOpt !== 'original') {
        const maxW = parseInt(sizeOpt, 10);
        if (targetW > maxW) {
          const ratio = maxW / targetW;
          targetW = maxW;
          targetH = Math.round(targetH * ratio);
        }
      }

      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = targetW;
      captureCanvas.height = targetH;
      const captureCtx = captureCanvas.getContext('2d');

      const extractedFrames = [];

      // Extract frames by seeking video time
      for (let i = 0; i < totalFrames; i++) {
        const time = start + i * step;
        video.currentTime = Math.min(time, video.duration);

        // Await seeked event
        await new Promise((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
        });

        captureCtx.drawImage(video, 0, 0, targetW, targetH);
        const frameData = captureCtx.getImageData(0, 0, targetW, targetH);

        extractedFrames.push({
          imageData: frameData,
          delay: delayMs
        });

        const pct = Math.round(((i + 1) / totalFrames) * 50);
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `Extracting frames (${i + 1}/${totalFrames})... ${pct}%`;
      }

      // Encode into GIF using gifenc
      progressText.textContent = 'Quantizing & Encoding GIF...';
      const maxColors = parseInt(colorsSelect.value, 10);
      const dither = ditherSelect.value;

      const blob = await encodeGif(extractedFrames, {
        maxColors,
        dither,
        loop: 0,
        onProgress: (encPct) => {
          const overallPct = 50 + Math.round(encPct * 0.5);
          progressBar.style.width = `${overallPct}%`;
          progressText.textContent = `Encoding GIF... ${overallPct}%`;
        }
      });

      generatedBlob = blob;
      const gifUrl = URL.createObjectURL(blob);
      outputImg.src = gifUrl;

      outputStats.innerHTML = `
        <div class="stat-pill"><span class="stat-label">File Size:</span> <strong>${formatBytes(blob.size)}</strong></div>
        <div class="stat-pill"><span class="stat-label">Resolution:</span> <strong>${targetW} &times; ${targetH} px</strong></div>
        <div class="stat-pill"><span class="stat-label">Frames:</span> <strong>${extractedFrames.length}</strong></div>
        <div class="stat-pill"><span class="stat-label">FPS:</span> <strong>${fps}</strong></div>
      `;

      outputWrap.classList.remove('hidden');
      outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      alert('Video conversion failed: ' + err.message);
    } finally {
      isConverting = false;
      convertBtn.disabled = false;
      progressWrap.classList.add('hidden');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (generatedBlob) {
      downloadBlob(generatedBlob, `pixelmint-video-clip-${Date.now()}.gif`);
    }
  });

  // Chaining buttons
  container.querySelectorAll('.chain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTool = btn.dataset.tool;
      if (generatedBlob && onChainMedia) {
        onChainMedia(targetTool, generatedBlob, 'image/gif');
      }
    });
  });

  return {
    loadMedia: (blob) => loadVideoFile(blob)
  };
}

/**
 * Creates an animated video blob in-memory using Canvas & MediaRecorder
 */
async function createDemoVideoBlob() {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
  });

  recorder.start();

  // Render 60 animated frames (2 seconds @ 30fps)
  for (let frame = 0; frame < 60; frame++) {
    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 400, 300);

    // Dynamic gradient waves
    const angle = (frame / 60) * Math.PI * 2;
    const grad = ctx.createRadialGradient(200, 150, 10, 200, 150, 180);
    grad.addColorStop(0, '#10b981');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Orbiting particle
    const ox = 200 + Math.cos(angle) * 90;
    const oy = 150 + Math.sin(angle) * 70;
    ctx.beginPath();
    ctx.arc(ox, oy, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Center badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PixelMint Demo Video', 200, 155);

    await new Promise(r => setTimeout(r, 1000 / 30));
  }

  recorder.stop();
  return recordingPromise;
}
