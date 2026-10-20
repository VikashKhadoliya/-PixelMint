/**
 * PixelMint Static Information & Legal Pages
 * Provides Privacy & Cookies, About & Contacts, Help / FAQ, and Sitemap views
 */

export function renderPrivacyPage(container) {
  container.innerHTML = `
    <div class="static-page-container">
      <div class="static-page-header">
        <h1 class="static-page-title">Privacy &amp; Cookies Policy</h1>
        <p class="static-page-subtitle">Last updated: October 2026 &bull; Fully compliant with global privacy standards</p>
      </div>

      <div class="static-page-card">
        <div class="static-section">
          <h2>1. Pure In-Browser Client-Side Processing</h2>
          <p>
            At PixelMint, we prioritize your absolute privacy. Unlike traditional media conversion websites that upload your files to remote Linux server farms for processing, 
            <strong>PixelMint executes 100% of its media operations entirely inside your local web browser</strong>.
          </p>
          <p>
            When you select or drop a GIF, video, or photo into PixelMint:
          </p>
          <ul class="static-list">
            <li>Your files are loaded into your device's memory using HTML5 File APIs.</li>
            <li>All frame extraction, resizing, color quantization, video clipping, text rendering, and re-encoding occur on your device via Canvas 2D, WebAssembly, and native Web APIs.</li>
            <li><strong>Your media files are never uploaded to our servers, transferred over the internet, or stored in any remote cloud or database.</strong></li>
          </ul>
        </div>

        <div class="static-section">
          <h2>2. Zero Tracking Cookies &amp; Telemetry</h2>
          <p>
            PixelMint does not use tracking cookies, behavioral tracking beacons, advertising cookies, or third-party profiling scripts. We do not track your browsing history or sell your information to advertisers.
          </p>
        </div>

        <div class="static-section">
          <h2>3. Local Storage Usage</h2>
          <p>
            We only utilize your browser's <code>localStorage</code> for saving client-side preferences you explicitly select:
          </p>
          <ul class="static-list">
            <li><code>pixelmint_theme</code>: Remembers your preferred interface appearance (Dark or Light mode).</li>
          </ul>
          <p>This preference never leaves your browser and can be cleared at any time via your browser settings.</p>
        </div>

        <div class="static-section">
          <h2>4. Data Retention</h2>
          <p>
            Because we do not collect, ingest, or transmit your media files, there is zero server-side data retention. Once you close or reload your browser tab, all media buffers are immediately released from your device's RAM.
          </p>
        </div>

        <div class="static-section">
          <h2>5. Contact &amp; Questions</h2>
          <p>
            If you have questions or inquiries regarding our privacy standards, you can contact us at <a href="mailto:privacy@pixelmint.com">privacy@pixelmint.com</a>.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderAboutPage(container) {
  container.innerHTML = `
    <div class="static-page-container">
      <div class="static-page-header">
        <h1 class="static-page-title">About PixelMint</h1>
        <p class="static-page-subtitle">High-performance, private, and modern media workstation built for the open web.</p>
      </div>

      <div class="static-page-card">
        <div class="static-section">
          <h2>Our Philosophy</h2>
          <p>
            PixelMint was conceived to solve the fundamental flaws of legacy online image and video editors. Traditional tools force users to upload gigabytes of sensitive media to remote servers, endure frustrating upload queues, and deal with restrictive file-size caps.
          </p>
          <p>
            PixelMint reverses this paradigm: modern client hardware and web browsers are remarkably fast. By leveraging modern web technologies—such as Canvas 2D, <code>MediaRecorder</code>, <code>gifenc</code>, <code>omggif</code>, and <code>JSZip</code>—PixelMint delivers lightning-fast editing right on your machine with zero server latency and absolute privacy.
          </p>
        </div>

        <div class="static-section">
          <h2>What Makes PixelMint Different?</h2>
          <div class="features-summary-grid">
            <div class="feat-summary-box">
              <h3>⚡ Instant Execution</h3>
              <p>No waiting in line behind thousands of other users. Your computer handles the work with full hardware acceleration.</p>
            </div>
            <div class="feat-summary-box">
              <h3>🔒 Confidential &amp; Safe</h3>
              <p>Your media never leaves your device. Perfect for sensitive documents, proprietary design assets, and private memories.</p>
            </div>
            <div class="feat-summary-box">
              <h3>🛠️ 30+ Media Workstations</h3>
              <p>From frame-by-frame GIF making to video cutting, meme captioning, sprite sheet generation, and high-DPI SVG rasterization.</p>
            </div>
            <div class="feat-summary-box">
              <h3>📦 Single-Click ZIP Exports</h3>
              <p>Decompile GIFs or extract video keyframes and download the entire collection in an instantly generated client-side ZIP.</p>
            </div>
          </div>
        </div>

        <div class="static-section">
          <h2>Contact &amp; Support</h2>
          <p>
            Have feedback, feature suggestions, or bug reports? We are constantly improving PixelMint:
          </p>
          <ul class="static-list">
            <li><strong>General Inquiries:</strong> <a href="mailto:hello@pixelmint.com">hello@pixelmint.com</a></li>
            <li><strong>Technical Support:</strong> <a href="mailto:support@pixelmint.com">support@pixelmint.com</a></li>
            <li><strong>Community &amp; Bugs:</strong> <a href="#home">PixelMint Community Hub</a></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

export function renderHelpPage(container) {
  container.innerHTML = `
    <div class="static-page-container">
      <div class="static-page-header">
        <h1 class="static-page-title">Help &amp; Frequently Asked Questions</h1>
        <p class="static-page-subtitle">Learn how to make the most of PixelMint's client-side media tools.</p>
      </div>

      <div class="static-page-card">
        <div class="faq-item">
          <h3>How do I make an animated GIF from photos or image frames?</h3>
          <p>
            Go to the <a href="#maker">GIF Maker</a>. Drag and drop your image files (PNG, JPG, WebP, GIF) into the upload area. 
            Arrange the frames in your desired sequence, set the frame delay (in 1/100ths of a second), pick your color quantization mode, and click "Generate GIF".
          </p>
        </div>

        <div class="faq-item">
          <h3>How do I compress a GIF to meet Discord's 8MB upload limit?</h3>
          <p>
            Use our dedicated <a href="#target-size-compressor">Target Size Compressor</a> or <a href="#discord-8mb">Discord 8MB</a> tool. 
            Upload your GIF, select the "Discord (8.00 MB)" preset, and click "Compress to Target Size". Our multi-pass optimizer will automatically balance color quantization, resolution scaling, and frame decimation until your file fits under 8MB.
          </p>
        </div>

        <div class="faq-item">
          <h3>How does Video Cutting and Video to GIF work in the browser?</h3>
          <p>
            Our <a href="#cut-video">Video Cutter</a> and <a href="#video-to-gif">Video to GIF</a> tools load your video directly into an HTML5 video playback element. 
            You can scrub through the timeline, use "Current Pos" to set exact start and end points, and export directly as a WebM video clip or high-framerate animated GIF without any server uploads.
          </p>
        </div>

        <div class="faq-item">
          <h3>How do I extract individual frames from a GIF as a ZIP file?</h3>
          <p>
            Navigate to the <a href="#split">GIF Splitter</a> tool and upload your GIF. PixelMint will decompile every animation frame and display them in a visual reel. 
            Click the "Download All Frames (ZIP)" button to instantly package all frames into a <code>pixelmint-frames.zip</code> file.
          </p>
        </div>

        <div class="faq-item">
          <h3>Are my files ever uploaded to your servers?</h3>
          <p>
            <strong>No, never.</strong> All operations run 100% locally in your browser. We have no backend media servers, no user accounts, and zero tracking databases.
          </p>
        </div>

        <div class="faq-item">
          <h3>What file formats does PixelMint support?</h3>
          <p>
            PixelMint supports animated GIFs, WebP, PNG, JPG/JPEG, SVG vector files, MP4, WebM, and MOV video formats supported natively by modern web browsers.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderSitemapPage(container, onNavigate) {
  container.innerHTML = `
    <div class="static-page-container">
      <div class="static-page-header">
        <h1 class="static-page-title">PixelMint Complete Sitemap</h1>
        <p class="static-page-subtitle">Directory of all 30+ media workstations and utilities.</p>
      </div>

      <div class="sitemap-grid">
        <div class="sitemap-col">
          <h2 class="sitemap-col-title">🎬 GIF &amp; Animation</h2>
          <ul class="sitemap-list">
            <li><a href="#maker">Animated GIF Maker</a></li>
            <li><a href="#reverse">Reverse GIF Playback</a></li>
            <li><a href="#speed">Animation Speed Multiplier</a></li>
            <li><a href="#cut">Cut Animation Duration</a></li>
            <li><a href="#optimize">GIF File Size Optimizer</a></li>
            <li><a href="#target-size-compressor">Target Size Compressor</a></li>
            <li><a href="#discord-8mb">Discord 8MB Optimizer</a></li>
          </ul>
        </div>

        <div class="sitemap-col">
          <h2 class="sitemap-col-title">📹 Video Workstations</h2>
          <ul class="sitemap-list">
            <li><a href="#video-to-gif">Video to GIF Converter</a></li>
            <li><a href="#cut-video">Online Video Cutter &amp; Trimmer</a></li>
            <li><a href="#resize-video">Resize Video Resolution</a></li>
            <li><a href="#crop-video">Video Cropper (Square &amp; 9:16)</a></li>
            <li><a href="#rotate-video">Rotate &amp; Mirror Video</a></li>
            <li><a href="#video-speed">Video Playback Speed</a></li>
            <li><a href="#video-filters">Video Color Filters</a></li>
            <li><a href="#loop-video">Video Looper (Repeat N Times)</a></li>
            <li><a href="#video-to-jpg">Video to JPG Sequence (ZIP)</a></li>
          </ul>
        </div>

        <div class="sitemap-col">
          <h2 class="sitemap-col-title">✂️ Transform &amp; Text</h2>
          <ul class="sitemap-list">
            <li><a href="#resize">Image &amp; GIF Resizer</a></li>
            <li><a href="#crop">Image &amp; GIF Cropper</a></li>
            <li><a href="#rotate">Rotate &amp; Flip Image/GIF</a></li>
            <li><a href="#effects">Color Effects &amp; Filters Studio</a></li>
            <li><a href="#add-text">Add Text &amp; Subtitles to GIF</a></li>
            <li><a href="#white-box-caption">White Box Caption Meme Maker</a></li>
          </ul>
        </div>

        <div class="sitemap-col">
          <h2 class="sitemap-col-title">📦 Sprites, Frames &amp; Formats</h2>
          <ul class="sitemap-list">
            <li><a href="#split">GIF Frame Splitter (ZIP Export)</a></li>
            <li><a href="#gif-to-sprite">GIF to Sprite Sheet Generator</a></li>
            <li><a href="#sprite-cutter">Sprite Sheet Tile Cutter</a></li>
            <li><a href="#analyzer">GIF Structure &amp; Header Analyzer</a></li>
            <li><a href="#gif-to-mp4">GIF to MP4 &amp; WebM Video</a></li>
            <li><a href="#svg-to-png">SVG to PNG High-DPI Rasterizer</a></li>
            <li><a href="#converter">Batch Format Converter (WebP, PNG, JPG)</a></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}
