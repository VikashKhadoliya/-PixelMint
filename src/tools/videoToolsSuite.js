/**
 * Comprehensive In-Browser Video Processing Workstation for PixelMint
 * Supports:
 * - /cut-video     (Trim video duration by Start & End time)
 * - /resize-video  (Scale resolution: 1080p, 720p, 480p, 360p, or custom dimensions)
 * - /crop-video    (Crop video viewport with aspect ratio presets: 1:1, 16:9, 9:16 vertical, 4:3)
 * - /rotate-video  (Rotate 90° CW, 180°, 270° CCW, Horizontal & Vertical Flip)
 * - /video-speed   (Playback rate speed changer: 0.25x to 3.0x)
 * - /video-filters (Grayscale, Sepia, Invert, Brightness, Contrast)
 * - /loop-video    (Repeat / Loop video clip 2x, 3x, 4x, 5x)
 * - /video-to-jpg  (Extract keyframe image sequence into ZIP)
 */
import JSZip from 'jszip';
import { formatBytes, downloadBlob } from '../utils/fileHelpers.js';

export function renderVideoTools(container, onChainMedia, initialMode = 'cut') {
  let activeMode = initialMode; // 'cut' | 'resize' | 'crop' | 'rotate' | 'speed' | 'filters' | 'loop' | 'to-images'
  let videoFile = null;
  let videoEl = null;
  let isProcessing = false;
  let generatedBlob = null;
  let animFrameId = null;

  // Parameters
  let cutStart = 0;
  let cutEnd = 3;
  let resizeW = 640;
  let resizeH = 360;
  let resizePreset = '640x360';
  let cropBox = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
  let rotateAngle = 90;
  let flipH = false;
  let flipV = false;
  let speedRate = 2.0;
  let activeFilter = 'none'; // 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage'
  let loopCount = 2;

  const modeDescriptions = {
    cut: { title: 'Online Video Cutter & Trimmer', badge: 'Trimming', desc: 'Trim start and end points of your video and export a clean shortened clip.', icon: '/icons/player-volume.png' },
    resize: { title: 'Online Video Resizer', badge: 'Dimensions', desc: 'Scale video resolution to standard presets (1080p, 720p, 480p, 360p) or custom width and height.', icon: '/icons/transform-scale.png' },
    crop: { title: 'Online Video Cropper', badge: 'Framing', desc: 'Crop video area to custom framing or standard aspect ratios (1:1 Square, 16:9 Wide, 9:16 TikTok/Reels).', icon: '/icons/transform-crop.png' },
    rotate: { title: 'Rotate & Flip Video', badge: 'Orientation', desc: 'Rotate video 90°, 180°, 270° or mirror horizontally and vertically.', icon: '/icons/transform-rotate.png' },
    speed: { title: 'Video Speed Changer', badge: 'Speed', desc: 'Speed up or slow down video playback rate from 0.25x to 3x.', icon: '/icons/chronometer.png' },
    filters: { title: 'Video Filters & Effects', badge: 'Styling', desc: 'Apply real-time color filters: Grayscale, Sepia, Invert, or Vintage pop to your video.', icon: '/icons/color-picker.png' },
    loop: { title: 'Video Looper', badge: 'Repetition', desc: 'Repeat a video clip multiple times (2x, 3x, 4x, 5x) into an extended continuous video.', icon: '/icons/media-playlist-repeat.png' },
    'to-images': { title: 'Video to JPG / PNG Sequence', badge: 'Extraction', desc: 'Extract video keyframes into a downloadable still image sequence or ZIP archive.', icon: '/icons/archive-extract.png' },
    'screen-record': { title: 'Online Screen Recorder', badge: 'Capture', desc: 'Record your desktop screen, browser tab, or window directly with instant trimming and GIF export.', icon: '/icons/media-record.png' }
  };

  const meta = modeDescriptions[activeMode] || modeDescriptions.cut;

  container.innerHTML = `
    <div class="tool-view">
      <div class="tool-header">
        <div class="tool-title-row">
          <img src="${meta.icon}" class="tool-hero-icon" alt="" width="28" height="28" />
          <span class="tool-badge">${meta.badge}</span>
          <h2>${meta.title}</h2>
        </div>
        <p class="tool-description">${meta.desc}</p>

        <!-- Operation Tabs -->
        <div class="sub-tool-tabs" style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
          <button class="btn ${activeMode === 'cut' ? 'btn-primary' : 'btn-outline'}" data-mode="cut"><img src="/icons/player-volume.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Cut Video</button>
          <button class="btn ${activeMode === 'resize' ? 'btn-primary' : 'btn-outline'}" data-mode="resize"><img src="/icons/transform-scale.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Resize</button>
          <button class="btn ${activeMode === 'crop' ? 'btn-primary' : 'btn-outline'}" data-mode="crop"><img src="/icons/transform-crop.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Crop</button>
          <button class="btn ${activeMode === 'rotate' ? 'btn-primary' : 'btn-outline'}" data-mode="rotate"><img src="/icons/transform-rotate.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Rotate</button>
          <button class="btn ${activeMode === 'speed' ? 'btn-primary' : 'btn-outline'}" data-mode="speed"><img src="/icons/chronometer.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Speed</button>
          <button class="btn ${activeMode === 'filters' ? 'btn-primary' : 'btn-outline'}" data-mode="filters"><img src="/icons/color-picker.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Filters</button>
          <button class="btn ${activeMode === 'loop' ? 'btn-primary' : 'btn-outline'}" data-mode="loop"><img src="/icons/media-playlist-repeat.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Loop</button>
          <button class="btn ${activeMode === 'to-images' ? 'btn-primary' : 'btn-outline'}" data-mode="to-images"><img src="/icons/archive-extract.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />to Images</button>
          <button class="btn ${activeMode === 'screen-record' ? 'btn-primary' : 'btn-outline'}" data-mode="screen-record"><img src="/icons/media-record.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" alt="" />Screen Record</button>
        </div>
      </div>

      <!-- Ingestion Dropzone -->
      <div class="card dropzone-card" id="vt-dropzone">
        <input type="file" id="vt-file-input" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="file-input-hidden" />
        <div class="dropzone-content">
          <div class="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <h3>Choose, drop, or paste a video file here</h3>
          <p class="dropzone-subtext">Supports MP4, WebM, MOV. Processed directly in your browser using hardware acceleration.</p>
          <div class="dropzone-actions">
            <button class="btn btn-primary" id="vt-browse-btn">Browse Video</button>
            <button class="btn btn-outline" id="vt-screen-rec-btn" style="border-color: #EF4444; color: #EF4444;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444;margin-right:6px;"></span>Record Screen
            </button>
            <button class="btn btn-secondary" id="vt-demo-btn">Generate Demo Video</button>
          </div>
        </div>
      </div>

      <!-- Processing Stage -->
      <div id="vt-stage" class="tool-stage hidden">
        <div class="card editor-card">
          <!-- Video Player Preview -->
          <div class="preview-box" style="margin-bottom: 20px; background: #000000; border-radius: var(--radius-md); overflow: hidden;">
            <video id="vt-player" controls playsinline style="max-height: 400px; width: 100%; display: block; margin: 0 auto;"></video>
            <canvas id="vt-crop-overlay-canvas" style="display: none; position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
          </div>

          <div class="video-metadata" id="vt-meta"></div>

          <!-- MODE 1: CUT CONTROLS -->
          <div id="vt-ctrl-cut" class="${activeMode === 'cut' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="vt-cut-start">Start Time (seconds)</label>
                <div class="input-with-button">
                  <input type="number" id="vt-cut-start" step="0.1" min="0" value="0.0" class="num-input" />
                  <button class="btn btn-sm btn-outline" id="vt-set-start">Current Pos</button>
                </div>
              </div>
              <div class="form-group">
                <label for="vt-cut-end">End Time (seconds)</label>
                <div class="input-with-button">
                  <input type="number" id="vt-cut-end" step="0.1" min="0.1" value="3.0" class="num-input" />
                  <button class="btn btn-sm btn-outline" id="vt-set-end">Current Pos</button>
                </div>
              </div>
            </div>
          </div>

          <!-- MODE 2: RESIZE CONTROLS -->
          <div id="vt-ctrl-resize" class="${activeMode === 'resize' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="vt-resize-preset">Resolution Preset</label>
                <select id="vt-resize-preset" class="select-input">
                  <option value="1920x1080">1920 × 1080 (1080p Full HD)</option>
                  <option value="1280x720">1280 × 720 (720p HD)</option>
                  <option value="854x480">854 × 480 (480p SD)</option>
                  <option value="640x360" selected>640 × 360 (360p Standard Web)</option>
                  <option value="426x240">426 × 240 (240p Compact)</option>
                  <option value="1080x1920">1080 × 1920 (Vertical 9:16 TikTok/Reels)</option>
                  <option value="720x720">720 × 720 (Square 1:1)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Aspect Fit</label>
                <select id="vt-resize-fit" class="select-input">
                  <option value="fit" selected>Fit within bounds (Keep original ratio)</option>
                  <option value="stretch">Stretch to exact dimensions</option>
                </select>
              </div>
            </div>
          </div>

          <!-- MODE 3: CROP CONTROLS -->
          <div id="vt-ctrl-crop" class="${activeMode === 'crop' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="vt-crop-aspect">Aspect Ratio Preset</label>
                <select id="vt-crop-aspect" class="select-input">
                  <option value="1:1" selected>1:1 Square (Instagram Feed)</option>
                  <option value="16:9">16:9 Widescreen (YouTube standard)</option>
                  <option value="9:16">9:16 Vertical (TikTok / Reels / Shorts)</option>
                  <option value="4:3">4:3 Classic TV</option>
                  <option value="center-crop">Center 80% Viewport</option>
                </select>
              </div>
            </div>
          </div>

          <!-- MODE 4: ROTATE CONTROLS -->
          <div id="vt-ctrl-rotate" class="${activeMode === 'rotate' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label>Rotation Direction</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline vt-rot-btn active" data-angle="90">90° Clockwise</button>
                  <button class="btn btn-sm btn-outline vt-rot-btn" data-angle="270">90° Counter-CW</button>
                  <button class="btn btn-sm btn-outline vt-rot-btn" data-angle="180">180° Invert</button>
                </div>
              </div>
              <div class="form-group">
                <label>Flip Mirroring</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline" id="vt-flip-h">Flip Horizontal</button>
                  <button class="btn btn-sm btn-outline" id="vt-flip-v">Flip Vertical</button>
                </div>
              </div>
            </div>
          </div>

          <!-- MODE 5: SPEED CONTROLS -->
          <div id="vt-ctrl-speed" class="${activeMode === 'speed' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="vt-speed-select">Playback Speed Rate</label>
                <select id="vt-speed-select" class="select-input">
                  <option value="0.25">0.25x (Super Slow)</option>
                  <option value="0.5">0.5x (Half Speed)</option>
                  <option value="0.75">0.75x</option>
                  <option value="1.25">1.25x (Slightly Faster)</option>
                  <option value="1.5">1.5x</option>
                  <option value="2.0" selected>2.0x (Double Speed)</option>
                  <option value="3.0">3.0x (3x Speed)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- MODE 6: FILTERS CONTROLS -->
          <div id="vt-ctrl-filters" class="${activeMode === 'filters' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label>Color Filter Preset</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline vt-filter-btn active" data-filter="none">Normal</button>
                  <button class="btn btn-sm btn-outline vt-filter-btn" data-filter="grayscale(100%)">Grayscale</button>
                  <button class="btn btn-sm btn-outline vt-filter-btn" data-filter="sepia(100%)">Sepia</button>
                  <button class="btn btn-sm btn-outline vt-filter-btn" data-filter="invert(100%)">Invert</button>
                  <button class="btn btn-sm btn-outline vt-filter-btn" data-filter="contrast(140%) brightness(110%)">Vibrant</button>
                </div>
              </div>
            </div>
          </div>

          <!-- MODE 7: LOOP CONTROLS -->
          <div id="vt-ctrl-loop" class="${activeMode === 'loop' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="vt-loop-select">Repeat Loop Multiplier</label>
                <select id="vt-loop-select" class="select-input">
                  <option value="2" selected>Loop 2 Times</option>
                  <option value="3">Loop 3 Times</option>
                  <option value="4">Loop 4 Times</option>
                  <option value="5">Loop 5 Times</option>
                </select>
              </div>
            </div>
          </div>

          <!-- MODE 8: TO IMAGES CONTROLS -->
          <div id="vt-ctrl-images" class="${activeMode === 'to-images' ? '' : 'hidden'}">
            <div class="settings-grid">
              <div class="form-group">
                <label for="vt-fps-extract">Extraction Sampling Rate</label>
                <select id="vt-fps-extract" class="select-input">
                  <option value="2">2 Frames per Second (Keyframes)</option>
                  <option value="5" selected>5 Frames per Second</option>
                  <option value="10">10 Frames per Second</option>
                </select>
              </div>
              <div class="form-group">
                <label for="vt-img-format">Image Format</label>
                <select id="vt-img-format" class="select-input">
                  <option value="image/jpeg" selected>JPG / JPEG</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>
            </div>
          </div>

          <div class="actions-row" style="margin-top: 20px;">
            <button class="btn btn-accent btn-lg" id="vt-process-btn">
              ${activeMode === 'to-images' ? 'Extract Frames & Download ZIP' : 'Process & Export Video!'}
            </button>
          </div>

          <!-- Progress -->
          <div id="vt-progress" class="progress-wrap hidden">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="vt-pbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="vt-ptext">Processing video...</div>
          </div>
        </div>
      </div>

      <!-- Output Showcase -->
      <div id="vt-output" class="tool-output-stage hidden">
        <div class="card output-card">
          <div class="output-header">
            <h3>Processed Video Output</h3>
            <span class="status-pill status-success">Ready</span>
          </div>

          <div class="output-preview-container">
            <video id="vt-out-video" controls playsinline class="video-preview-player"></video>
          </div>

          <div class="output-stats" id="vt-out-stats"></div>

          <div class="output-actions">
            <button class="btn btn-primary btn-lg" id="vt-dl-btn">Download Video File</button>
          </div>

          <!-- Pipeline Chaining -->
          <div class="pipeline-chain-bar" style="margin-top: 16px;">
            <span class="chain-label">Convert or Chain Output Into:</span>
            <div class="chain-buttons">
              <button class="chain-btn" data-target="videoToGif">Convert to GIF</button>
              <button class="chain-btn" data-target="resizer">Resize GIF</button>
              <button class="chain-btn" data-target="cropper">Crop GIF</button>
              <button class="chain-btn" data-target="optimizer">Optimize</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Selectors
  const dropzone = container.querySelector('#vt-dropzone');
  const fileInput = container.querySelector('#vt-file-input');
  const browseBtn = container.querySelector('#vt-browse-btn');
  const demoBtn = container.querySelector('#vt-demo-btn');
  const stage = container.querySelector('#vt-stage');
  const player = container.querySelector('#vt-player');
  const metaBox = container.querySelector('#vt-meta');
  const processBtn = container.querySelector('#vt-process-btn');
  const progressWrap = container.querySelector('#vt-progress');
  const pbar = container.querySelector('#vt-pbar');
  const ptext = container.querySelector('#vt-ptext');
  const outputStage = container.querySelector('#vt-output');
  const outVideo = container.querySelector('#vt-out-video');
  const outStats = container.querySelector('#vt-out-stats');
  const dlBtn = container.querySelector('#vt-dl-btn');

  // Submode buttons
  container.querySelectorAll('.sub-tool-tabs .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderVideoTools(container, onChainMedia, btn.dataset.mode);
    });
  });

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) loadVideo(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(n => {
    dropzone.addEventListener(n, (e) => { e.preventDefault(); dropzone.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(n => {
    dropzone.addEventListener(n, (e) => { e.preventDefault(); dropzone.classList.remove('drag-active'); });
  });
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadVideo(e.dataTransfer.files[0]);
    }
  });

  demoBtn.addEventListener('click', generateDemoVideo);

  const screenRecBtn = container.querySelector('#vt-screen-rec-btn');
  if (screenRecBtn) {
    screenRecBtn.addEventListener('click', async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('Screen recording is not supported in this browser.');
          return;
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        
        screenRecBtn.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444;margin-right:6px;"></span>🔴 Stop Recording';
        screenRecBtn.style.background = 'rgba(239, 68, 68, 0.2)';

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        const stopRecording = () => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          stream.getTracks().forEach(t => t.stop());
        };

        stream.getVideoTracks()[0].onended = stopRecording;

        screenRecBtn.onclick = () => {
          stopRecording();
        };

        mediaRecorder.onstop = () => {
          const recordedBlob = new Blob(chunks, { type: 'video/webm' });
          const recFile = new File([recordedBlob], 'screen-recording.webm', { type: 'video/webm' });
          loadVideo(recFile);
          screenRecBtn.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444;margin-right:6px;"></span>Record Screen';
          screenRecBtn.style.background = '';
        };

        mediaRecorder.start();
      } catch (err) {
        console.warn('Screen recording cancelled or error:', err);
      }
    });
  }

  // Parameter bindings
  const cutStartInp = container.querySelector('#vt-cut-start');
  const cutEndInp = container.querySelector('#vt-cut-end');
  const setStartBtn = container.querySelector('#vt-set-start');
  const setEndBtn = container.querySelector('#vt-set-end');
  if (setStartBtn) setStartBtn.addEventListener('click', () => { cutStartInp.value = player.currentTime.toFixed(1); cutStart = player.currentTime; });
  if (setEndBtn) setEndBtn.addEventListener('click', () => { cutEndInp.value = player.currentTime.toFixed(1); cutEnd = player.currentTime; });

  const resizePresetSelect = container.querySelector('#vt-resize-preset');
  if (resizePresetSelect) {
    resizePresetSelect.addEventListener('change', () => {
      const [w, h] = resizePresetSelect.value.split('x').map(Number);
      resizeW = w;
      resizeH = h;
    });
  }

  container.querySelectorAll('.vt-rot-btn').forEach(b => {
    b.addEventListener('click', () => {
      container.querySelectorAll('.vt-rot-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      rotateAngle = parseInt(b.dataset.angle, 10);
    });
  });

  const flipHBtn = container.querySelector('#vt-flip-h');
  const flipVBtn = container.querySelector('#vt-flip-v');
  if (flipHBtn) flipHBtn.addEventListener('click', () => { flipH = !flipH; flipHBtn.classList.toggle('active', flipH); });
  if (flipVBtn) flipVBtn.addEventListener('click', () => { flipV = !flipV; flipVBtn.classList.toggle('active', flipV); });

  const speedSelect = container.querySelector('#vt-speed-select');
  if (speedSelect) speedSelect.addEventListener('change', () => { speedRate = parseFloat(speedSelect.value); player.playbackRate = speedRate; });

  container.querySelectorAll('.vt-filter-btn').forEach(b => {
    b.addEventListener('click', () => {
      container.querySelectorAll('.vt-filter-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      activeFilter = b.dataset.filter;
      player.style.filter = activeFilter;
    });
  });

  const loopSelect = container.querySelector('#vt-loop-select');
  if (loopSelect) loopSelect.addEventListener('change', () => { loopCount = parseInt(loopSelect.value, 10); });

  async function loadVideo(file) {
    if (!file) return;
    try {
      videoFile = file;
      const url = URL.createObjectURL(file);
      player.src = url;

      player.onloadedmetadata = () => {
        const dur = player.duration.toFixed(2);
        cutEnd = Math.min(player.duration, 5);
        if (cutEndInp) cutEndInp.value = cutEnd.toFixed(1);

        metaBox.innerHTML = `
          <div class="metadata-item"><strong>Source:</strong> ${file.name}</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${player.videoWidth} × ${player.videoHeight} px</div>
          <div class="metadata-item"><strong>Duration:</strong> ${dur} seconds</div>
          <div class="metadata-item"><strong>File Size:</strong> ${formatBytes(file.size)}</div>
        `;

        stage.classList.remove('hidden');
      };
    } catch (err) {
      alert('Error loading video: ' + err.message);
    }
  }

  function generateDemoVideo() {
    // Generate a 4-second WebM clip using Canvas captureStream
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const ctx = c.getContext('2d');
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const f = new File([blob], 'pixelmint-demo-video.webm', { type: 'video/webm' });
      loadVideo(f);
    };

    rec.start();
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 640, 360);

      // Moving graphic
      const x = 320 + Math.sin(frame * 0.1) * 200;
      const y = 180 + Math.cos(frame * 0.1) * 80;
      ctx.fillStyle = '#E53935';
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('PixelMint In-Browser Video', 320, 170);
      ctx.font = '16px system-ui';
      ctx.fillText(`Timestamp: ${(frame / 30).toFixed(2)}s`, 320, 210);

      if (frame >= 120) { // 4 seconds @ 30fps
        clearInterval(timer);
        rec.stop();
      }
    }, 1000 / 30);
  }

  // =========================================================================
  // VIDEO PROCESSING PIPELINE (Canvas + MediaRecorder)
  // =========================================================================
  processBtn.addEventListener('click', async () => {
    if (!videoFile || isProcessing) return;

    if (activeMode === 'to-images') {
      extractVideoKeyframes();
      return;
    }

    isProcessing = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Preparing video processor...';

    try {
      const srcW = player.videoWidth || 640;
      const srcH = player.videoHeight || 360;

      // Determine target canvas dimensions based on mode
      let targetW = srcW;
      let targetH = srcH;

      if (activeMode === 'resize') {
        targetW = resizeW;
        targetH = resizeH;
      } else if (activeMode === 'crop') {
        const aspectVal = container.querySelector('#vt-crop-aspect').value;
        if (aspectVal === '1:1') {
          const side = Math.min(srcW, srcH);
          targetW = side;
          targetH = side;
        } else if (aspectVal === '9:16') {
          targetW = Math.round(srcH * (9 / 16));
          targetH = srcH;
        } else if (aspectVal === '16:9') {
          targetW = srcW;
          targetH = Math.round(srcW * (9 / 16));
        } else {
          targetW = Math.round(srcW * 0.8);
          targetH = Math.round(srcH * 0.8);
        }
      } else if (activeMode === 'rotate') {
        if (rotateAngle === 90 || rotateAngle === 270) {
          targetW = srcH;
          targetH = srcW;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const startTime = activeMode === 'cut' ? Math.max(0, parseFloat(cutStartInp.value) || 0) : 0;
      const endTime = activeMode === 'cut' ? Math.min(player.duration, parseFloat(cutEndInp.value) || player.duration) : player.duration;
      const totalSec = endTime - startTime;

      let loopsDone = 0;
      const maxLoops = activeMode === 'loop' ? loopCount : 1;

      recorder.onstop = () => {
        generatedBlob = new Blob(chunks, { type: mime });
        outVideo.src = URL.createObjectURL(generatedBlob);
        outputStage.classList.remove('hidden');

        outStats.innerHTML = `
          <div class="metadata-item"><strong>Format:</strong> WebM Video (VP9)</div>
          <div class="metadata-item"><strong>Dimensions:</strong> ${targetW} × ${targetH} px</div>
          <div class="metadata-item"><strong>File Size:</strong> ${formatBytes(generatedBlob.size)}</div>
        `;

        pbar.style.width = '100%';
        ptext.textContent = 'Processing complete!';
        setTimeout(() => progressWrap.classList.add('hidden'), 1000);
        isProcessing = false;
        outputStage.scrollIntoView({ behavior: 'smooth' });
      };

      recorder.start();
      player.currentTime = startTime;
      player.playbackRate = activeMode === 'speed' ? speedRate : 1.0;
      await player.play();

      function drawLoop() {
        if (!isProcessing) return;

        // Apply transformations
        ctx.save();
        ctx.clearRect(0, 0, targetW, targetH);

        if (activeMode === 'filters' && activeFilter !== 'none') {
          ctx.filter = activeFilter;
        }

        if (activeMode === 'rotate') {
          ctx.translate(targetW / 2, targetH / 2);
          ctx.rotate((rotateAngle * Math.PI) / 180);
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          ctx.drawImage(player, -srcW / 2, -srcH / 2);
        } else if (activeMode === 'crop') {
          const sx = (srcW - targetW) / 2;
          const sy = (srcH - targetH) / 2;
          ctx.drawImage(player, sx, sy, targetW, targetH, 0, 0, targetW, targetH);
        } else {
          ctx.drawImage(player, 0, 0, targetW, targetH);
        }
        ctx.restore();

        // Progress calculation
        const cur = player.currentTime - startTime;
        const pct = Math.min(95, Math.round(((loopsDone * totalSec + cur) / (maxLoops * totalSec)) * 100));
        pbar.style.width = `${pct}%`;
        ptext.textContent = `Encoding video stream: ${pct}%...`;

        if (player.currentTime >= endTime || player.ended) {
          loopsDone++;
          if (loopsDone < maxLoops) {
            player.currentTime = startTime;
            player.play();
            animFrameId = requestAnimationFrame(drawLoop);
          } else {
            player.pause();
            recorder.stop();
          }
        } else {
          animFrameId = requestAnimationFrame(drawLoop);
        }
      }

      animFrameId = requestAnimationFrame(drawLoop);

    } catch (err) {
      alert('Video processing error: ' + err.message);
      progressWrap.classList.add('hidden');
      isProcessing = false;
    }
  });

  // Keyframe Extraction into ZIP
  async function extractVideoKeyframes() {
    isProcessing = true;
    progressWrap.classList.remove('hidden');
    pbar.style.width = '10%';
    ptext.textContent = 'Extracting video keyframes...';

    try {
      const zip = new JSZip();
      const folder = zip.folder('pixelmint-video-frames');
      const fps = parseInt(container.querySelector('#vt-fps-extract').value, 10) || 5;
      const format = container.querySelector('#vt-img-format').value;
      const ext = format === 'image/jpeg' ? 'jpg' : 'png';

      const interval = 1 / fps;
      const dur = player.duration;
      const totalFrames = Math.floor(dur * fps);

      const c = document.createElement('canvas');
      c.width = player.videoWidth;
      c.height = player.videoHeight;
      const ctx = c.getContext('2d');

      let frameIdx = 0;
      for (let t = 0; t < dur; t += interval) {
        player.currentTime = t;
        await new Promise(r => { player.onseeked = r; });

        ctx.drawImage(player, 0, 0);
        const blob = await new Promise(r => c.toBlob(r, format, 0.9));
        folder.file(`frame_${String(frameIdx + 1).padStart(4, '0')}.${ext}`, blob);

        frameIdx++;
        const pct = Math.round((frameIdx / totalFrames) * 85);
        pbar.style.width = `${pct}%`;
        ptext.textContent = `Extracting frame ${frameIdx} of ${totalFrames}...`;
      }

      ptext.textContent = 'Packaging ZIP archive...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `video-frames-${Date.now()}.zip`);

      pbar.style.width = '100%';
      ptext.textContent = 'ZIP download started!';
      setTimeout(() => progressWrap.classList.add('hidden'), 1500);
    } catch (err) {
      alert('Frame extraction error: ' + err.message);
      progressWrap.classList.add('hidden');
    } finally {
      isProcessing = false;
    }
  }

  dlBtn.addEventListener('click', () => {
    if (generatedBlob) downloadBlob(generatedBlob, 'processed-video.webm');
  });

  container.querySelectorAll('.chain-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (generatedBlob && onChainMedia) {
        onChainMedia(b.dataset.target, generatedBlob, 'video/webm');
      }
    });
  });

  return {
    loadMedia: (file) => {
      if (file) loadVideo(file);
    }
  };
}
