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
      icon: '/icons/tool-animator.svg',
      formats: ['PNG', 'JPG', 'WebP', 'GIF'],
      tags: ['gif', 'maker', 'animate', 'frames', 'create', 'slideshow']
    },
    {
      key: 'videoToGif',
      title: 'Video to GIF',
      desc: 'Convert MP4, WebM, or MOV video clips into lightweight, high-framerate animated GIFs.',
      icon: '/icons/camera-video.svg',
      formats: ['MP4', 'WebM', 'MOV'],
      tags: ['video', 'mp4', 'webm', 'mov', 'clip', 'trim', 'fps']
    },
    {
      key: 'resizer',
      title: 'Image & GIF Resizer',
      desc: 'Resize still images and animated GIFs to exact dimensions or percentage scale.',
      icon: '/icons/transform-scale.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['resize', 'scale', 'dimension', 'width', 'height', 'shrink', 'enlarge']
    },
    {
      key: 'cropper',
      title: 'Image & GIF Cropper',
      desc: 'Crop still images or animated GIFs with an interactive rectangular marquee selection.',
      icon: '/icons/transform-crop.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['crop', 'trim', 'cut', 'aspect', 'square', '16:9', '4:3']
    },
    {
      key: 'optimizer',
      title: 'GIF Optimizer',
      desc: 'Compress animated GIFs for Discord 8MB limit and web by reducing colors or frame count.',
      icon: '/icons/speedometer.svg',
      formats: ['GIF', 'Discord 8MB'],
      tags: ['optimize', 'compress', 'reduce', 'discord', 'slack', 'smaller', 'kb', 'mb']
    },
    {
      key: 'effects',
      title: 'Effects Studio',
      desc: 'Adjust brightness, contrast, saturation, hue, apply 90° rotations, or reverse playback.',
      icon: '/icons/tools-wizard.svg',
      formats: ['GIF', 'PNG', 'JPG', 'WebP'],
      tags: ['effects', 'filter', 'brightness', 'contrast', 'rotate', 'flip', 'speed', 'reverse']
    },
    {
      key: 'converter',
      title: 'Format Converter',
      desc: 'Batch convert images between WebP, PNG, JPG, and GIF with custom quality factors.',
      icon: '/icons/view-refresh.svg',
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

        <!-- Featured 4-Core Tools Row (Pure Vector SVG Icons) -->
        <div class="featured-hero-section">
          <div class="featured-hero-heading">Online GIF maker and image editor</div>
          <div class="featured-tools-row">
            <div class="featured-tool-item" data-tool="videoToGif" title="Convert videos to animated GIF">
              <div class="featured-icon-box">
                <svg class="featured-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="v2g-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#E53935"/>
                      <stop offset="100%" stop-color="#B71C1C"/>
                    </linearGradient>
                    <linearGradient id="v2g-board" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#2D3748"/>
                      <stop offset="100%" stop-color="#1A202C"/>
                    </linearGradient>
                  </defs>
                  <rect x="8" y="22" width="48" height="34" rx="5" fill="url(#v2g-board)" stroke="#E53935" stroke-width="2"/>
                  <g transform="rotate(-6 8 22)">
                    <rect x="8" y="10" width="48" height="12" rx="3" fill="#1A202C" stroke="#E53935" stroke-width="2"/>
                    <path d="M16 10L22 22M28 10L34 22M40 10L46 22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                    <path d="M22 10L28 22M34 10L40 22M46 10L52 22" stroke="#E53935" stroke-width="3" stroke-linecap="round"/>
                  </g>
                  <rect x="13" y="27" width="10" height="9" rx="1.5" fill="#FFFFFF" fill-opacity="0.12"/>
                  <rect x="27" y="27" width="10" height="9" rx="1.5" fill="#FFFFFF" fill-opacity="0.12"/>
                  <rect x="41" y="27" width="10" height="9" rx="1.5" fill="#FFFFFF" fill-opacity="0.12"/>
                  <text x="18" y="34.5" fill="#FFFFFF" font-size="7" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">2</text>
                  <text x="32" y="34.5" fill="#FFFFFF" font-size="7" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">4</text>
                  <text x="46" y="34.5" fill="#FFFFFF" font-size="7" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">5</text>
                  <circle cx="32" cy="45" r="7" fill="url(#v2g-grad)"/>
                  <polygon points="30,41.5 30,48.5 36,45" fill="#FFFFFF"/>
                </svg>
              </div>
              <div class="featured-tool-name">Video to GIF</div>
            </div>

            <div class="featured-tool-item" data-tool="gifMaker" title="Create animated GIFs from frames">
              <div class="featured-icon-box">
                <svg class="featured-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gm-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#E53935"/>
                      <stop offset="100%" stop-color="#C62828"/>
                    </linearGradient>
                    <linearGradient id="gm-card" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#374151"/>
                      <stop offset="100%" stop-color="#1F2937"/>
                    </linearGradient>
                  </defs>
                  <rect x="6" y="14" width="38" height="34" rx="4" fill="#1F2937" stroke="#E53935" stroke-width="1.5" stroke-opacity="0.5" stroke-dasharray="3 3"/>
                  <rect x="12" y="10" width="40" height="36" rx="4" fill="url(#gm-card)" stroke="#4B5563" stroke-width="1.8"/>
                  <rect x="18" y="16" width="40" height="38" rx="4" fill="#111827" stroke="#E53935" stroke-width="2"/>
                  <circle cx="28" cy="27" r="3.5" fill="#EF5350"/>
                  <path d="M22 47L33 35L41 43L47 37L54 45V50C54 52.2091 52.2091 54 50 54H22V47Z" fill="url(#gm-grad)" fill-opacity="0.4" stroke="#E53935" stroke-width="1.5" stroke-linejoin="round"/>
                  <rect x="36" y="20" width="18" height="10" rx="3" fill="url(#gm-grad)"/>
                  <text x="45" y="27.5" fill="#FFFFFF" font-size="6.5" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" letter-spacing="0.5">GIF</text>
                  <circle cx="24" cy="50" r="1.5" fill="#E53935"/>
                  <circle cx="29" cy="50" r="1.5" fill="#E53935" fill-opacity="0.6"/>
                  <circle cx="34" cy="50" r="1.5" fill="#E53935" fill-opacity="0.3"/>
                </svg>
              </div>
              <div class="featured-tool-name">GIF Maker</div>
            </div>

            <div class="featured-tool-item" data-tool="resizer" title="Resize images and GIFs">
              <div class="featured-icon-box">
                <svg class="featured-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="rs-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#E53935"/>
                      <stop offset="100%" stop-color="#D32F2F"/>
                    </linearGradient>
                  </defs>
                  <rect x="10" y="10" width="44" height="44" rx="4" stroke="#9CA3AF" stroke-width="1.8" stroke-dasharray="4 4" fill="#FFFFFF" fill-opacity="0.04"/>
                  <rect x="12" y="12" width="22" height="22" rx="3" fill="#E53935" fill-opacity="0.15" stroke="#E53935" stroke-width="2"/>
                  <rect x="7" y="7" width="8" height="8" rx="2" fill="url(#rs-grad)" stroke="#FFFFFF" stroke-width="1.5"/>
                  <rect x="49" y="7" width="8" height="8" rx="2" fill="url(#rs-grad)" stroke="#FFFFFF" stroke-width="1.5"/>
                  <rect x="7" y="49" width="8" height="8" rx="2" fill="url(#rs-grad)" stroke="#FFFFFF" stroke-width="1.5"/>
                  <rect x="49" y="49" width="8" height="8" rx="2" fill="url(#rs-grad)" stroke="#FFFFFF" stroke-width="1.5"/>
                  <line x1="20" y1="20" x2="44" y2="44" stroke="#E53935" stroke-width="3.2" stroke-linecap="round"/>
                  <path d="M33 44H44V33" stroke="#E53935" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="featured-tool-name">Resizer</div>
            </div>

            <div class="featured-tool-item" data-tool="optimizer" title="Compress GIF file size">
              <div class="featured-icon-box">
                <svg class="featured-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="opt-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#E53935"/>
                      <stop offset="100%" stop-color="#FF5252"/>
                    </linearGradient>
                  </defs>
                  <path d="M12 44C8 36 8 25 15 17C22 9 33 6 43 9C52 13 57 23 55 33C54 38 51 42 47 45" stroke="#4B5563" stroke-width="3" stroke-linecap="round"/>
                  <line x1="16" y1="25" x2="20" y2="28" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
                  <line x1="32" y1="12" x2="32" y2="17" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round"/>
                  <line x1="48" y1="25" x2="44" y2="28" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
                  <path d="M16 41C12 33 13 24 20 18C26 12 35 11 42 14" stroke="url(#opt-grad)" stroke-width="3.5" stroke-linecap="round"/>
                  <circle cx="32" cy="41" r="5.5" fill="#1F2937" stroke="#E53935" stroke-width="2"/>
                  <circle cx="32" cy="41" r="2.5" fill="#E53935"/>
                  <line x1="32" y1="41" x2="45" y2="22" stroke="#E53935" stroke-width="3" stroke-linecap="round"/>
                  <path d="M22 51L27 51M25 48L28 51L25 54" stroke="#E53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M42 51L37 51M39 48L36 51L39 54" stroke="#E53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
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
