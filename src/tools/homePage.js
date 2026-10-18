/**
 * PixelMint Homepage Component
 * Inspired by reference utility layout: Hero, Search, Shortcuts, Tool Grid, How It Works, FAQs
 */

export function renderHomePage(container, onNavigate) {
  const toolsData = [
    {
      key: 'gifMaker',
      title: 'GIF Maker',
      desc: 'Combine multiple image frames into an animated GIF with custom delays and dithering.',
      icon: '/icons/tool-animator.png',
      formats: ['PNG', 'JPG', 'WebP', 'GIF'],
      tags: ['gif', 'maker', 'animate', 'frames', 'create', 'slideshow']
    },
    {
      key: 'videoToGif',
      title: 'Video to GIF',
      desc: 'Convert MP4, WebM, or MOV video clips into lightweight, high-framerate animated GIFs.',
      icon: '/icons/camera-video.png',
      formats: ['MP4', 'WebM', 'MOV'],
      tags: ['video', 'mp4', 'webm', 'mov', 'clip', 'trim', 'fps']
    },
    {
      key: 'resizer',
      title: 'Image & GIF Resizer',
      desc: 'Resize still images and animated GIFs to exact dimensions or percentage scale.',
      icon: '/icons/transform-scale.png',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['resize', 'scale', 'dimension', 'width', 'height', 'shrink', 'enlarge']
    },
    {
      key: 'cropper',
      title: 'Image & GIF Cropper',
      desc: 'Crop still images or animated GIFs with an interactive rectangular marquee selection.',
      icon: '/icons/transform-crop.png',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['crop', 'trim', 'cut', 'aspect', 'square', '16:9', '4:3']
    },
    {
      key: 'optimizer',
      title: 'GIF Optimizer',
      desc: 'Compress animated GIFs for Discord 8MB limit and web by reducing colors or frame count.',
      icon: '/icons/speedometer.png',
      formats: ['GIF', 'Discord 8MB'],
      tags: ['optimize', 'compress', 'reduce', 'discord', 'slack', 'smaller', 'kb', 'mb']
    },
    {
      key: 'effects',
      title: 'Effects Studio',
      desc: 'Adjust brightness, contrast, saturation, hue, apply 90° rotations, or reverse playback.',
      icon: '/icons/tools-wizard.png',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['effects', 'filter', 'brightness', 'contrast', 'rotate', 'flip', 'speed', 'reverse']
    },
    {
      key: 'converter',
      title: 'Format Converter',
      desc: 'Batch convert images between WebP, PNG, JPG, and GIF with custom quality factors.',
      icon: '/icons/view-refresh.png',
      formats: ['WebP', 'PNG', 'JPG', 'GIF'],
      tags: ['convert', 'format', 'batch', 'webp', 'jpg', 'png', 'transcode']
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
              alt="PixelMint friendly monkey editor mascot" 
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

        <!-- Featured 4-Core Tools Row (EZGIF Reference Icons) -->
        <div class="featured-hero-section">
          <div class="featured-hero-heading">Online GIF maker and image editor</div>
          <div class="featured-tools-row">
            <div class="featured-tool-item" data-tool="videoToGif" title="Convert videos to animated GIF">
              <div class="featured-icon-box">
                <img src="/icons/hero-video-to-gif.png" alt="Video to GIF" class="featured-icon-img" width="76" height="84" />
              </div>
              <div class="featured-tool-name">Video to GIF</div>
            </div>
            <div class="featured-tool-item" data-tool="gifMaker" title="Create animated GIFs from frames">
              <div class="featured-icon-box">
                <img src="/icons/hero-gif-maker.png" alt="GIF Maker" class="featured-icon-img" width="84" height="84" />
              </div>
              <div class="featured-tool-name">GIF Maker</div>
            </div>
            <div class="featured-tool-item" data-tool="resizer" title="Resize images and GIFs">
              <div class="featured-icon-box">
                <img src="/icons/hero-resizer.png" alt="Resizer" class="featured-icon-img" width="76" height="84" />
              </div>
              <div class="featured-tool-name">Resizer</div>
            </div>
            <div class="featured-tool-item" data-tool="optimizer" title="Compress GIF file size">
              <div class="featured-icon-box">
                <img src="/icons/hero-optimizer.png" alt="Optimizer" class="featured-icon-img" width="80" height="84" />
              </div>
              <div class="featured-tool-name">Optimizer</div>
            </div>
          </div>
        </div>

        <!-- Working Tool Search Field -->
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
              placeholder="Search tools (e.g. crop, resize, video to gif, optimize...)" 
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
          <button class="shortcut-pill" data-tool="resizer">Resize</button>
          <button class="shortcut-pill" data-tool="cropper">Crop</button>
          <button class="shortcut-pill" data-tool="optimizer">Optimize</button>
          <button class="shortcut-pill" data-tool="converter">Convert</button>
        </div>
      </section>

      <!-- All Tools Section -->
      <section class="tools-catalog-section" id="all-tools-section">
        <div class="section-header">
          <h2>All Tools</h2>
          <span class="section-count-badge" id="tools-count-badge">7 tools available</span>
        </div>

        <div class="tools-grid" id="tools-grid">
          ${toolsData.map(tool => `
            <div class="tool-card" data-tool="${tool.key}" data-title="${tool.title.toLowerCase()}" data-tags="${tool.tags.join(' ')}">
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

      <!-- How It Works Section -->
      <section class="how-it-works-section">
        <div class="section-header">
          <h2>How It Works</h2>
        </div>
        <div class="how-it-works-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Upload</h3>
            <p>Select, drag, or drop your image, GIF, or video file into the tool. Multiple frames are supported for GIF creation.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Adjust</h3>
            <p>Fine-tune dimensions, frames, delay, crop bounding box, or compression options with real-time interactive preview.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>Download</h3>
            <p>Get your final processed media instantly with zero watermarks, or chain it directly into another tool.</p>
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
            <p>Yes. Use the GIF Optimizer tool. You can reduce palette depth to 128 or 64 colors, drop redundant frames, or scale down resolution to meet Discord and Slack upload caps.</p>
          </div>
          <div class="faq-item">
            <h3>Does resizing an animated GIF remove the animation?</h3>
            <p>No. PixelMint decodes all frames of the GIF, scales each frame individually with aspect preservation, and re-encodes the animated sequence with original delays intact.</p>
          </div>
          <div class="faq-item">
            <h3>What video formats are supported for Video to GIF?</h3>
            <p>PixelMint supports standard browser-decodable formats including MP4 (H.264), WebM (VP8/VP9), and MOV clips with interactive start and end trimming.</p>
          </div>
          <div class="faq-item">
            <h3>How does transparent image conversion work?</h3>
            <p>When converting transparent PNG or WebP files to JPG (which has no alpha channel), the Batch Format Converter lets you choose a background color fill (default white) to prevent black border artifacts.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  // Selectors
  const searchInput = container.querySelector('#home-search-input');
  const searchForm = container.querySelector('#home-search-form');
  const toolsGrid = container.querySelector('#tools-grid');
  const toolCards = container.querySelectorAll('.tool-card');
  const shortcutPills = container.querySelectorAll('.shortcut-pill');
  const countBadge = container.querySelector('#tools-count-badge');

  // Wire featured hero tool cards clicks
  const featuredTools = container.querySelectorAll('.featured-tool-item');
  featuredTools.forEach(item => {
    item.addEventListener('click', () => {
      const toolKey = item.dataset.tool;
      if (toolKey && onNavigate) {
        onNavigate(toolKey);
      }
    });
  });

  // Wire tool cards clicks
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      const toolKey = card.dataset.tool;
      if (toolKey && onNavigate) {
        onNavigate(toolKey);
      }
    });
  });

  // Wire popular shortcuts clicks
  shortcutPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const toolKey = pill.dataset.tool;
      if (toolKey && onNavigate) {
        onNavigate(toolKey);
      }
    });
  });

  // Working Tool Search Filter
  function filterTools(query) {
    const q = query.trim().toLowerCase();
    let visibleCount = 0;

    toolCards.forEach(card => {
      const title = card.dataset.title || '';
      const tags = card.dataset.tags || '';
      const match = !q || title.includes(q) || tags.includes(q);

      card.style.display = match ? 'flex' : 'none';
      if (match) visibleCount++;
    });

    // Update count badge
    if (q) {
      countBadge.textContent = `${visibleCount} of ${toolCards.length} tools`;
    } else {
      countBadge.textContent = `${toolCards.length} tools available`;
    }

    // Empty state if nothing matches
    let emptyNotice = toolsGrid.querySelector('.search-empty-state');
    if (visibleCount === 0) {
      if (!emptyNotice) {
        emptyNotice = document.createElement('div');
        emptyNotice.className = 'search-empty-state';
        emptyNotice.innerHTML = `
          <h3>No matching tools found</h3>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">Try searching for "gif", "resize", "crop", "video", or "convert".</p>
          <button class="btn btn-secondary btn-sm" id="clear-search-btn">Show All Tools</button>
        `;
        toolsGrid.appendChild(emptyNotice);
        emptyNotice.querySelector('#clear-search-btn').addEventListener('click', () => {
          searchInput.value = '';
          filterTools('');
        });
      }
    } else if (emptyNotice) {
      emptyNotice.remove();
    }
  }

  searchInput.addEventListener('input', (e) => {
    filterTools(e.target.value);
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;

    // Check if there is an exact or best match to launch
    const matchingTool = toolsData.find(t => 
      t.title.toLowerCase().includes(q) || t.tags.includes(q)
    );

    if (matchingTool && onNavigate) {
      onNavigate(matchingTool.key);
    } else {
      // Scroll to results
      const section = container.querySelector('#all-tools-section');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return {};
}
