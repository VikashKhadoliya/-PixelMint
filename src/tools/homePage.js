/**
 * PixelMint Comprehensive Homepage Component
 * Organized into searchable categories, popular shortcuts, featured tools, recent updates, and FAQs
 */

export function renderHomePage(container, onNavigate) {
  const toolsData = [
    // Category: Animation & GIF Creation
    {
      key: 'gifMaker',
      category: 'animation',
      categoryName: 'GIF & Animation',
      title: 'GIF Maker',
      desc: 'Combine multiple image frames into an animated GIF with custom delays, dithering, and crossfades.',
      icon: '/icons/tool-animator.svg',
      formats: ['PNG', 'JPG', 'WebP', 'GIF', 'SVG'],
      tags: ['gif', 'maker', 'animate', 'frames', 'create', 'slideshow', 'crossfade']
    },
    {
      key: 'reverse',
      category: 'animation',
      categoryName: 'GIF & Animation',
      title: 'Reverse GIF',
      desc: 'Invert animation playback order so your GIF plays backwards with preserved delays.',
      icon: '/icons/tool-animator.svg',
      formats: ['GIF'],
      tags: ['reverse', 'backwards', 'rewind', 'invert', 'order']
    },
    {
      key: 'speed',
      category: 'animation',
      categoryName: 'GIF & Animation',
      title: 'Animation Speed Changer',
      desc: 'Speed up or slow down GIF playback speed by multiplying frame delay durations.',
      icon: '/icons/speedometer.svg',
      formats: ['GIF'],
      tags: ['speed', 'fast', 'slow', 'motion', 'multiplier', 'fps']
    },
    {
      key: 'cut',
      category: 'animation',
      categoryName: 'GIF & Animation',
      title: 'Cut GIF Animation',
      desc: 'Trim start and end frames to shorten animation length or isolate specific moments.',
      icon: '/icons/transform-crop.svg',
      formats: ['GIF'],
      tags: ['cut', 'trim', 'duration', 'shorten', 'clip', 'slice']
    },

    // Category: Video Tools
    {
      key: 'videoToGif',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video to GIF',
      desc: 'Convert MP4, WebM, or MOV video clips into lightweight, high-framerate animated GIFs.',
      icon: '/icons/camera-video.svg',
      formats: ['MP4', 'WebM', 'MOV'],
      tags: ['video', 'mp4', 'webm', 'mov', 'clip', 'trim', 'fps']
    },
    {
      key: 'cutVideo',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Online Video Cutter',
      desc: 'Trim video duration with precise start and end timestamps directly in your browser.',
      icon: '/icons/camera-video.svg',
      formats: ['MP4', 'WebM', 'MOV'],
      tags: ['cut', 'trim', 'clip', 'video', 'duration', 'timestamp']
    },
    {
      key: 'resizeVideo',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video Resizer',
      desc: 'Scale video resolution to 1080p, 720p, 480p, 360p, or custom dimensions.',
      icon: '/icons/transform-scale.svg',
      formats: ['MP4', 'WebM'],
      tags: ['resize', 'scale', 'video', '1080p', '720p', 'dimensions', 'resolution']
    },
    {
      key: 'cropVideo',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video Cropper',
      desc: 'Crop video viewports to 1:1 square, 16:9 widescreen, or 9:16 vertical TikTok/Reels.',
      icon: '/icons/transform-crop.svg',
      formats: ['MP4', 'WebM'],
      tags: ['crop', 'video', 'tiktok', 'reels', 'aspect', 'square', 'vertical']
    },
    {
      key: 'rotateVideo',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Rotate Video',
      desc: 'Rotate video 90°, 180°, 270° or mirror horizontally and vertically.',
      icon: '/icons/camera-video.svg',
      formats: ['MP4', 'WebM'],
      tags: ['rotate', 'flip', 'video', 'orientation', 'mirror']
    },
    {
      key: 'videoSpeed',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video Speed Changer',
      desc: 'Speed up or slow down video playback from 0.25x to 3.0x.',
      icon: '/icons/speedometer.svg',
      formats: ['MP4', 'WebM'],
      tags: ['speed', 'fast', 'slow', 'playback', 'rate', 'video']
    },
    {
      key: 'videoFilters',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video Filters',
      desc: 'Apply color filters like Grayscale, Sepia, Invert, and Vibrant contrast to video clips.',
      icon: '/icons/tools-wizard.svg',
      formats: ['MP4', 'WebM'],
      tags: ['filter', 'grayscale', 'sepia', 'color', 'video', 'effects']
    },
    {
      key: 'loopVideo',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video Looper',
      desc: 'Repeat video clips 2x, 3x, 4x, or 5x into an extended continuous video.',
      icon: '/icons/view-refresh.svg',
      formats: ['MP4', 'WebM'],
      tags: ['loop', 'repeat', 'extend', 'video', 'boomerang']
    },
    {
      key: 'videoToJpg',
      category: 'video',
      categoryName: 'Video Tools',
      title: 'Video to JPG Sequence',
      desc: 'Extract keyframes from video files into a downloadable image sequence or ZIP archive.',
      icon: '/icons/camera-video.svg',
      formats: ['MP4', 'WebM', 'JPG'],
      tags: ['extract', 'keyframes', 'frames', 'sequence', 'video', 'zip']
    },

    // Category: Transform & Edit
    {
      key: 'resizer',
      category: 'transform',
      categoryName: 'Transform & Edit',
      title: 'Image & GIF Resizer',
      desc: 'Resize still images and animated GIFs to exact dimensions or percentage scale.',
      icon: '/icons/transform-scale.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['resize', 'scale', 'dimension', 'width', 'height', 'shrink', 'enlarge']
    },
    {
      key: 'cropper',
      category: 'transform',
      categoryName: 'Transform & Edit',
      title: 'Image & GIF Cropper',
      desc: 'Crop still images or animated GIFs with an interactive rectangular marquee selection.',
      icon: '/icons/transform-crop.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['crop', 'trim', 'cut', 'aspect', 'square', '16:9', '4:3']
    },
    {
      key: 'rotate',
      category: 'transform',
      categoryName: 'Transform & Edit',
      title: 'Rotate & Flip Image/GIF',
      desc: 'Rotate images and animated GIFs 90°, 180°, 270°, or mirror horizontally and vertically.',
      icon: '/icons/transform-scale.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['rotate', 'flip', 'horizontal', 'vertical', 'mirror', 'orientation']
    },

    // Category: Optimization
    {
      key: 'optimizer',
      category: 'optimization',
      categoryName: 'Optimization',
      title: 'GIF Optimizer',
      desc: 'Compress animated GIFs by downsampling color palettes, dropping redundant frames, or scaling down.',
      icon: '/icons/speedometer.svg',
      formats: ['GIF', 'Discord 8MB'],
      tags: ['optimize', 'compress', 'reduce', 'smaller', 'kb', 'mb']
    },
    {
      key: 'targetSizeCompressor',
      category: 'optimization',
      categoryName: 'Optimization',
      title: 'Target Size Compressor',
      desc: 'Automatically optimize GIFs to meet exact constraints: Discord 8MB, Slack 10MB, or custom KB/MB.',
      icon: '/icons/speedometer.svg',
      formats: ['GIF', 'Discord 8MB', 'Slack 10MB'],
      tags: ['discord', 'slack', 'target', 'size', '8mb', '10mb', 'compress', 'limit']
    },

    // Category: Effects & Text
    {
      key: 'effects',
      category: 'effects',
      categoryName: 'Effects & Text',
      title: 'Effects Studio',
      desc: 'Adjust brightness, contrast, saturation, hue, or apply presets like Sepia, Grayscale, and Invert.',
      icon: '/icons/tools-wizard.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['effects', 'filter', 'brightness', 'contrast', 'saturation', 'hue', 'sepia']
    },
    {
      key: 'addText',
      category: 'effects',
      categoryName: 'Effects & Text',
      title: 'Add Text to GIF',
      desc: 'Overlay subtitles, annotations, memes, or watermark text over animated GIFs and images.',
      icon: '/icons/tools-wizard.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['text', 'caption', 'subtitle', 'watermark', 'font', 'annotate']
    },
    {
      key: 'whiteBoxCaption',
      category: 'effects',
      categoryName: 'Effects & Text',
      title: 'White Box Caption Meme',
      desc: 'Add classic meme white banner header above or below your animated GIF with auto-wrapping text.',
      icon: '/icons/tools-wizard.svg',
      formats: ['GIF', 'PNG', 'JPG'],
      tags: ['meme', 'white box', 'caption', 'twitter', 'reddit', 'banner', 'funny']
    },

    // Category: Frames & Sprites
    {
      key: 'splitter',
      category: 'frames',
      categoryName: 'Frames & Sprites',
      title: 'GIF Frame Splitter',
      desc: 'Decompile animated GIFs into individual frames (PNG, WebP, JPG) and download single frames or ZIP archive.',
      icon: '/icons/tool-animator.svg',
      formats: ['GIF', 'PNG', 'ZIP'],
      tags: ['split', 'decompile', 'extract', 'frames', 'zip', 'explode']
    },
    {
      key: 'spriteSheet',
      category: 'frames',
      categoryName: 'Frames & Sprites',
      title: 'Sprite Sheet Studio',
      desc: 'Stitch GIF frames into game sprite sheets or slice existing sprite sheets into animated GIFs.',
      icon: '/icons/tool-animator.svg',
      formats: ['GIF', 'PNG', 'Sprite Sheet'],
      tags: ['sprite', 'sheet', 'game', 'tiles', 'cutter', 'slice', 'matrix']
    },
    {
      key: 'analyzer',
      category: 'frames',
      categoryName: 'Frames & Sprites',
      title: 'GIF Analyzer',
      desc: 'Inspect GIF specification headers, dimensions, frame delays, disposal methods, and color tables.',
      icon: '/icons/speedometer.svg',
      formats: ['GIF'],
      tags: ['analyzer', 'metadata', 'inspect', 'disposal', 'delay', 'headers', 'fps']
    },

    // Category: Converters
    {
      key: 'converter',
      category: 'conversion',
      categoryName: 'Format Converters',
      title: 'Batch Format Converter',
      desc: 'Batch convert images between WebP, PNG, JPG, and GIF with custom quality and background color fill.',
      icon: '/icons/view-refresh.svg',
      formats: ['WebP', 'PNG', 'JPG', 'GIF'],
      tags: ['convert', 'format', 'batch', 'webp', 'jpg', 'png', 'transcode']
    },
    {
      key: 'gifToMp4',
      category: 'conversion',
      categoryName: 'Format Converters',
      title: 'GIF to MP4 Video',
      desc: 'Convert heavy animated GIFs into lightweight, high-efficiency HTML5 video clips.',
      icon: '/icons/camera-video.svg',
      formats: ['GIF', 'MP4', 'WebM'],
      tags: ['gif to mp4', 'webm', 'video', 'convert', 'lightweight', 'h264']
    },
    {
      key: 'svgToPng',
      category: 'conversion',
      categoryName: 'Format Converters',
      title: 'SVG to PNG Converter',
      desc: 'Rasterize scalable vector graphics (SVG) into crisp PNG/JPG images at up to 8x resolution.',
      icon: '/icons/view-refresh.svg',
      formats: ['SVG', 'PNG', 'JPG'],
      tags: ['svg', 'png', 'vector', 'rasterize', 'dpi', 'scale', 'crisp']
    }
  ];

  container.innerHTML = `
    <div class="home-layout">
      <!-- Hero Section -->
      <section class="hero-block">
        <div class="hero-header-row">
          <div class="hero-mascot-wrap">
            <img 
              src="/images/monkey-editor.gif" 
              alt="PixelMint editor monkey mascot" 
              class="hero-mascot-img" 
              width="68" 
              height="68" 
            />
          </div>
          <h1>Edit, Convert and Create Media Files Easily</h1>
        </div>

        <p>
          A fast, lightweight toolkit for your daily image and animation needs. 
          Resize, crop, convert, optimize, and build animated GIFs with clean in-browser controls.
        </p>

        <!-- Featured 4-Core Tools Row -->
        <div class="featured-hero-section">
          <div class="featured-hero-heading">Online GIF maker and image editor</div>
          <div class="featured-tools-row">
            <div class="featured-tool-item" data-tool="videoToGif" title="Convert videos to animated GIF">
              <div class="featured-icon-box">
                <img src="/icons/camera-video.svg" alt="" width="36" height="36" />
              </div>
              <span class="featured-tool-name">Video to GIF</span>
            </div>
            <div class="featured-tool-item" data-tool="gifMaker" title="Create animated GIFs from images">
              <div class="featured-icon-box">
                <img src="/icons/tool-animator.svg" alt="" width="36" height="36" />
              </div>
              <span class="featured-tool-name">GIF Maker</span>
            </div>
            <div class="featured-tool-item" data-tool="resizer" title="Resize images and animated GIFs">
              <div class="featured-icon-box">
                <img src="/icons/transform-scale.svg" alt="" width="36" height="36" />
              </div>
              <span class="featured-tool-name">Resizer</span>
            </div>
            <div class="featured-tool-item" data-tool="optimizer" title="Compress and reduce GIF file size">
              <div class="featured-icon-box">
                <img src="/icons/speedometer.svg" alt="" width="36" height="36" />
              </div>
              <span class="featured-tool-name">Optimizer</span>
            </div>
          </div>
        </div>

        <!-- Tool Search Field -->
        <div class="hero-search-wrap">
          <form class="search-input-form" id="home-search-form" onsubmit="return false;">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              id="home-search-input" 
              class="search-text-input" 
              placeholder="Search all ${toolsData.length} tools (e.g. crop, video cut, split, text, discord, svg...)" 
              autocomplete="off"
            />
            <button type="submit" id="home-search-btn" class="search-submit-btn">Search</button>
          </form>
        </div>

        <!-- Popular Shortcuts -->
        <div class="popular-shortcuts-row">
          <span class="popular-label">Popular:</span>
          <button class="shortcut-pill" data-tool="gifMaker">GIF Maker</button>
          <button class="shortcut-pill" data-tool="videoToGif">Video to GIF</button>
          <button class="shortcut-pill" data-tool="targetSizeCompressor">Discord 8MB</button>
          <button class="shortcut-pill" data-tool="splitter">Split to Frames</button>
          <button class="shortcut-pill" data-tool="addText">Add Text</button>
          <button class="shortcut-pill" data-tool="whiteBoxCaption">Meme Caption</button>
          <button class="shortcut-pill" data-tool="cutVideo">Video Cutter</button>
          <button class="shortcut-pill" data-tool="gifToMp4">GIF to MP4</button>
          <button class="shortcut-pill" data-tool="analyzer">Analyzer</button>
        </div>
      </section>

      <!-- Category Filter Tabs -->
      <section class="tools-catalog-section" id="all-tools-section">
        <div class="section-header">
          <h2>All Media Tools</h2>
          <span class="section-count-badge" id="tools-count-badge">${toolsData.length} tools available</span>
        </div>

        <!-- Category Filter Pills -->
        <div class="category-pills-row" style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
          <button class="cat-pill active" data-category="all">All Tools</button>
          <button class="cat-pill" data-category="animation">GIF &amp; Animation</button>
          <button class="cat-pill" data-category="video">Video Tools</button>
          <button class="cat-pill" data-category="transform">Transform</button>
          <button class="cat-pill" data-category="optimization">Optimize</button>
          <button class="cat-pill" data-category="effects">Effects &amp; Text</button>
          <button class="cat-pill" data-category="frames">Frames &amp; Sprites</button>
          <button class="cat-pill" data-category="conversion">Converters</button>
        </div>

        <!-- Tools Grid -->
        <div class="tools-grid" id="tools-grid">
          ${toolsData.map(tool => `
            <div class="tool-card" data-tool="${tool.key}" data-category="${tool.category}" data-title="${tool.title.toLowerCase()}" data-tags="${tool.tags.join(' ')}">
              <div>
                <div class="tool-card-head">
                  <div class="tool-card-icon-box">
                    <img src="${tool.icon}" alt="${tool.title} icon" class="tool-card-icon-img" width="24" height="24" />
                  </div>
                  <h3>${tool.title}</h3>
                </div>
                <p>${tool.desc}</p>
              </div>
              <div class="tool-card-foot">
                <div class="format-tags">
                  ${tool.formats.map(fmt => `<span class="format-tag">${fmt}</span>`).join('')}
                </div>
                <span class="open-tool-link">Open &rarr;</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Recent Updates / News (EZGIF Benchmark Style) -->
      <section class="news-section card" style="padding: 24px; margin-bottom: 32px;">
        <div class="section-header" style="margin-bottom: 16px;">
          <h2>Recent Updates &amp; Releases</h2>
        </div>
        <ul class="news-list" style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px;">
          <li style="border-left: 3px solid var(--brand-red); padding-left: 14px;">
            <div style="font-size: 0.8rem; color: var(--brand-red); font-weight: 700; margin-bottom: 4px;">OCTOBER 2026</div>
            <strong style="font-size: 1rem;">Full In-Browser Video Processing &amp; Frame Extraction Suite</strong>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
              Added dedicated Video Cutter, Resizer, Cropper, Speed, and Filters workstations powered by canvas capture streams. Introduced GIF Frame Splitter with ZIP packaging and Target Size Compressor for Discord 8MB caps.
            </p>
          </li>
          <li style="border-left: 3px solid var(--brand-red); padding-left: 14px;">
            <div style="font-size: 0.8rem; color: var(--brand-red); font-weight: 700; margin-bottom: 4px;">OCTOBER 2026</div>
            <strong style="font-size: 1rem;">Meme Typography, Sprite Sheet Studio &amp; GIF Analyzer</strong>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
              Added White Box Caption / Meme Maker with auto-text wrapping, Subtitles overlay with frame targeting, Sprite Sheet stitcher/cutter, and comprehensive GIF header structure inspection.
            </p>
          </li>
        </ul>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works-section">
        <div class="section-header">
          <h2>How It Works</h2>
        </div>
        <div class="how-it-works-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Upload Media</h3>
            <p>Select, drag, or drop your image, GIF, or video file into the tool. Multiple frames are supported for GIF creation and batch processing.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Configure &amp; Preview</h3>
            <p>Fine-tune dimensions, frames, delay, crop bounding box, or compression options with real-time interactive preview.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>Export Instantly</h3>
            <p>Get your final processed media with zero watermarks and zero registration, or chain it directly into another tool in the suite.</p>
          </div>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section class="faqs-section">
        <div class="section-header">
          <h2>Frequently Asked Questions</h2>
        </div>
        <div class="faqs-list">
          <div class="faq-item">
            <h3>How do I create an animated GIF from photos?</h3>
            <p>Open the GIF Maker tool, upload your PNG, JPG, or WebP image frames, adjust the global frame delay or individual delays, select dithering, and click Generate Animated GIF.</p>
          </div>
          <div class="faq-item">
            <h3>Can I reduce GIF file size under 8MB for Discord?</h3>
            <p>Yes. Use the Target Size Compressor tool. Select Discord 8MB and the algorithm will automatically downsample color depth, resolution, and frame rates to guarantee the output is under 8MB.</p>
          </div>
          <div class="faq-item">
            <h3>How do I extract all frames from a GIF into a ZIP file?</h3>
            <p>Open the GIF Frame Splitter tool, upload your animated GIF, select your desired format (PNG, WebP, or JPG), and click "Download All as ZIP Archive". All frames will be bundled into a single ZIP file.</p>
          </div>
          <div class="faq-item">
            <h3>Can I edit and cut video files in PixelMint?</h3>
            <p>Yes. PixelMint features a dedicated video processing workstation allowing you to cut video duration, scale resolution, crop framing, change playback speed, apply color filters, and loop clips.</p>
          </div>
          <div class="faq-item">
            <h3>Does resizing an animated GIF remove the animation?</h3>
            <p>No. PixelMint decodes all frames of the GIF, scales each frame individually with aspect preservation, and re-encodes the animated sequence with original delays intact.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  // Attach Navigation & Search Listeners
  const searchInput = container.querySelector('#home-search-input');
  const searchForm = container.querySelector('#home-search-form');
  const toolCards = container.querySelectorAll('.tool-card');
  const countBadge = container.querySelector('#tools-count-badge');
  const catPills = container.querySelectorAll('.cat-pill');

  let activeCategory = 'all';

  function filterTools() {
    const query = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    toolCards.forEach(card => {
      const title = card.dataset.title;
      const tags = card.dataset.tags;
      const cat = card.dataset.category;

      const matchesQuery = !query || title.includes(query) || tags.includes(query);
      const matchesCat = activeCategory === 'all' || cat === activeCategory;

      if (matchesQuery && matchesCat) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    countBadge.textContent = `${visibleCount} of ${toolCards.length} tools`;
  }

  searchInput.addEventListener('input', filterTools);
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    filterTools();
  });

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.category;
      filterTools();
    });
  });

  // Tool Card Clicks
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      const toolKey = card.dataset.tool;
      if (onNavigate) onNavigate(toolKey);
    });
  });

  // Featured 4-tools row
  container.querySelectorAll('.featured-tool-item').forEach(item => {
    item.addEventListener('click', () => {
      const toolKey = item.dataset.tool;
      if (onNavigate) onNavigate(toolKey);
    });
  });

  // Popular shortcuts
  container.querySelectorAll('.shortcut-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const toolKey = pill.dataset.tool;
      if (onNavigate) onNavigate(toolKey);
    });
  });
}
