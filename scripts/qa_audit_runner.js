import http from 'http';

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { return ${expr}; })()`,
      awaitPromise: true,
      returnByValue: true
    });
    return res.result?.value;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runAudit() {
  console.log('Connecting to Chrome CDP...');
  const targets = await getTargets();
  const target = targets.find(t => t.url.includes('localhost:5173'));
  if (!target) throw new Error('PixelMint tab not found in Chrome');

  console.log('Target found:', target.title, target.url);
  const client = new CDPClient(target.webSocketDebuggerUrl);
  await client.connect();
  console.log('Connected to CDP!');

  const viewports = [
    { name: 'iPhone SE (320x568)', w: 320, h: 568, mobile: true },
    { name: 'Android Standard (360x800)', w: 360, h: 800, mobile: true },
    { name: 'iPhone Mini (375x812)', w: 375, h: 812, mobile: true },
    { name: 'iPhone 14 Pro (390x844)', w: 390, h: 844, mobile: true },
    { name: 'iPhone 15 Pro Max (430x932)', w: 430, h: 932, mobile: true },
    { name: 'iPad Portrait (768x1024)', w: 768, h: 1024, mobile: true },
    { name: 'iPad Landscape (1024x768)', w: 1024, h: 768, mobile: false },
    { name: 'Laptop HD (1366x768)', w: 1366, h: 768, mobile: false },
    { name: 'Desktop Full HD (1920x1080)', w: 1920, h: 1080, mobile: false }
  ];

  const toolsToTest = [
    { hash: 'home', titleContains: 'PixelMint' },
    { hash: 'maker', titleContains: 'GIF Maker', testDemo: true },
    { hash: 'video-to-gif', titleContains: 'Video to GIF', testDemo: true },
    { hash: 'resize', titleContains: 'Resizer', testDemo: true },
    { hash: 'crop', titleContains: 'Cropper', testDemo: true },
    { hash: 'optimize', titleContains: 'Optimizer', testDemo: true },
    { hash: 'target-size-compressor', titleContains: 'Target Size', testDemo: true },
    { hash: 'effects', titleContains: 'Effects', testDemo: true },
    { hash: 'split', titleContains: 'Split', testDemo: true },
    { hash: 'gif-to-sprite', titleContains: 'Sprite Sheet', testDemo: true },
    { hash: 'analyzer', titleContains: 'Analyzer', testDemo: true },
    { hash: 'converter', titleContains: 'Converter', testDemo: true },
    { hash: 'gif-to-mp4', titleContains: 'MP4', testDemo: true },
    { hash: 'svg-to-png', titleContains: 'SVG', testDemo: true },
    { hash: 'privacy', titleContains: 'Privacy' },
    { hash: 'about', titleContains: 'About' },
    { hash: 'help', titleContains: 'Help' },
    { hash: 'sitemap', titleContains: 'Sitemap' }
  ];

  const results = {
    viewportsTested: [],
    toolTests: [],
    overflowFailures: [],
    themeToggleVerified: false,
    mobileMenuVerified: false
  };

  // 1. Test Theme Toggle
  console.log('\n--- TESTING THEME TOGGLE & PERSISTENCE ---');
  await client.eval(`window.location.hash = 'home'`);
  await sleep(400);

  const initialTheme = await client.eval(`document.documentElement.getAttribute('data-theme')`);
  console.log('Initial theme:', initialTheme);
  
  // Click theme toggle
  await client.eval(`document.getElementById('theme-toggle-btn').click()`);
  await sleep(200);
  const toggledTheme = await client.eval(`document.documentElement.getAttribute('data-theme')`);
  const storedTheme = await client.eval(`localStorage.getItem('pixelmint_theme')`);
  console.log('Toggled theme:', toggledTheme, 'Stored theme in localStorage:', storedTheme);

  // Toggle back to dark
  if (toggledTheme !== initialTheme) {
    await client.eval(`document.getElementById('theme-toggle-btn').click()`);
    await sleep(200);
    const restoredTheme = await client.eval(`document.documentElement.getAttribute('data-theme')`);
    console.log('Restored theme:', restoredTheme);
    results.themeToggleVerified = true;
  }

  // 2. Test Mobile Hamburger Menu at 375px
  console.log('\n--- TESTING MOBILE HAMBURGER MENU AT 375x812 ---');
  await client.setViewport(375, 812, true);
  await client.eval(`window.location.hash = 'home'`);
  await sleep(400);

  const drawerHiddenBefore = await client.eval(`document.getElementById('mobile-drawer').classList.contains('hidden')`);
  console.log('Mobile drawer hidden initially:', drawerHiddenBefore);

  // Click hamburger button
  await client.eval(`document.getElementById('mobile-menu-btn').click()`);
  await sleep(200);
  const drawerHiddenAfter = await client.eval(`document.getElementById('mobile-drawer').classList.contains('hidden')`);
  const drawerLinksCount = await client.eval(`document.querySelectorAll('#mobile-drawer .mobile-drawer-link').length`);
  console.log('Mobile drawer opened:', !drawerHiddenAfter, 'Total tool links in drawer:', drawerLinksCount);

  // Click a tool in mobile drawer
  await client.eval(`document.querySelector('#mobile-drawer [data-tool=\"gifMaker\"]').click()`);
  await sleep(400);
  const drawerClosedAfterClick = await client.eval(`document.getElementById('mobile-drawer').classList.contains('hidden')`);
  const activeHash = await client.eval(`window.location.hash`);
  console.log('Drawer closed after link click:', drawerClosedAfterClick, 'Active hash:', activeHash);

  if (!drawerHiddenAfter && drawerClosedAfterClick && activeHash === '#maker') {
    results.mobileMenuVerified = true;
  }

  // 3. Test Viewport Responsiveness Matrix
  console.log('\n--- TESTING VIEWPORT RESPONSIVENESS MATRIX ---');
  for (const vp of viewports) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.w}x${vp.h})`);
    await client.setViewport(vp.w, vp.h, vp.mobile);
    let vpPassed = true;

    for (const tool of toolsToTest) {
      await client.eval(`window.location.hash = '${tool.hash}'`);
      await sleep(250);

      const metrics = await client.eval(`({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        title: document.title
      })`);

      const hasHorizontalScroll = metrics.scrollWidth > metrics.clientWidth + 1 || metrics.bodyScrollWidth > metrics.clientWidth + 1;
      if (hasHorizontalScroll) {
        vpPassed = false;
        const err = `FAIL: Viewport ${vp.w}x${vp.h} on #${tool.hash} has overflow (scrollWidth: ${metrics.scrollWidth}, bodyScrollWidth: ${metrics.bodyScrollWidth}, clientWidth: ${metrics.clientWidth})`;
        console.error(err);
        results.overflowFailures.push({ vp: vp.name, tool: tool.hash, metrics });
      }
    }

    if (vpPassed) {
      console.log(`✔ ${vp.name}: PASSED (0 horizontal overflow on all pages)`);
      results.viewportsTested.push({ name: vp.name, status: 'PASSED' });
    } else {
      results.viewportsTested.push({ name: vp.name, status: 'FAILED' });
    }
  }

  // 4. Test Tool Real Processing Pipelines
  console.log('\n--- TESTING REAL TOOL PROCESSING PIPELINES ---');
  await client.setViewport(1280, 800, false);

  for (const tool of toolsToTest.filter(t => t.testDemo)) {
    await client.eval(`window.location.hash = '${tool.hash}'`);
    await sleep(400);

    let processed = false;

    if (tool.hash === 'maker') {
      await client.eval(`document.getElementById('gm-demo-btn').click()`);
      await sleep(600);
      const frameCount = await client.eval(`document.getElementById('gm-frame-count')?.textContent || '0'`);
      await client.eval(`document.getElementById('gm-generate-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const src = await client.eval(`document.getElementById('gm-output-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ GIF Maker: Loaded ${frameCount} frames -> Generated GIF Blob: ${processed}`);
    } else if (tool.hash === 'video-to-gif') {
      await client.eval(`document.getElementById('vtg-demo-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const ready = await client.eval(`(document.getElementById('vtg-video')?.duration || 0) > 0`);
        if (ready) break;
      }
      await client.eval(`document.getElementById('vtg-convert-btn').click()`);
      for (let w = 0; w < 30; w++) {
        await sleep(400);
        const src = await client.eval(`document.getElementById('vtg-output-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ Video to GIF: Generated GIF Blob: ${processed}`);
    } else if (tool.hash === 'resize') {
      await client.eval(`document.getElementById('rs-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('rs-execute-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const src = await client.eval(`document.getElementById('rs-output-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ Resizer: Generated Output Blob: ${processed}`);
    } else if (tool.hash === 'crop') {
      await client.eval(`document.getElementById('cr-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('cr-execute-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const src = await client.eval(`document.getElementById('cr-output-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ Cropper: Generated Cropped Blob: ${processed}`);
    } else if (tool.hash === 'optimize') {
      await client.eval(`document.getElementById('opt-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('opt-execute-btn').click()`);
      for (let w = 0; w < 25; w++) {
        await sleep(400);
        const src = await client.eval(`document.getElementById('opt-output-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ Optimizer: Generated Compressed Blob: ${processed}`);
    } else if (tool.hash === 'target-size-compressor') {
      await client.eval(`document.getElementById('tsc-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('tsc-compress-btn').click()`);
      for (let w = 0; w < 25; w++) {
        await sleep(400);
        const src = await client.eval(`document.getElementById('tsc-out-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ Target Size Compressor: Generated Target Blob: ${processed}`);
    } else if (tool.hash === 'effects') {
      await client.eval(`document.getElementById('ef-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('ef-execute-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const src = await client.eval(`document.getElementById('ef-output-img')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ Effects Studio: Generated Filtered Blob: ${processed}`);
    } else if (tool.hash === 'split') {
      await client.eval(`document.getElementById('sp-demo-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const count = await client.eval(`document.querySelectorAll('#sp-frames-grid > *').length`);
        if (count > 0) { processed = true; break; }
      }
      const frameCards = await client.eval(`document.querySelectorAll('#sp-frames-grid > *').length`);
      console.log(`✔ Splitter: Decompiled GIF into ${frameCards} frames`);
    } else if (tool.hash === 'analyzer') {
      await client.eval(`document.getElementById('an-demo-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const count = await client.eval(`parseInt(document.getElementById('an-table-count')?.textContent || '0', 10)`);
        if (count > 0) { processed = true; break; }
      }
      const tableCount = await client.eval(`document.getElementById('an-table-count')?.textContent || '0'`);
      console.log(`✔ Analyzer: Parsed GIF Specs (${tableCount} frames)`);
    } else if (tool.hash === 'converter') {
      await client.eval(`document.getElementById('conv-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('conv-execute-btn').click()`);
      for (let w = 0; w < 20; w++) {
        await sleep(300);
        const count = await client.eval(`document.querySelectorAll('#conv-queue-list > *').length`);
        if (count > 0) { processed = true; break; }
      }
      const resultsCount = await client.eval(`document.querySelectorAll('#conv-queue-list > *').length`);
      console.log(`✔ Converter: Converted batch images: ${resultsCount} items`);
    } else if (tool.hash === 'gif-to-mp4') {
      await client.eval(`document.getElementById('g2v-demo-btn').click()`);
      await sleep(500);
      await client.eval(`document.getElementById('g2v-convert-btn').click()`);
      for (let w = 0; w < 25; w++) {
        await sleep(400);
        const src = await client.eval(`document.getElementById('g2v-out-video')?.src || ''`);
        if (src.startsWith('blob:')) { processed = true; break; }
      }
      console.log(`✔ GIF to MP4 Video: Generated Video Blob: ${processed}`);
    } else if (tool.hash === 'svg-to-png') {
      await client.eval(`document.getElementById('svg-demo-btn').click()`);
      await sleep(500);
      const canvasWidth = await client.eval(`document.getElementById('svg-preview-canvas')?.width || 0`);
      processed = canvasWidth > 0;
      console.log(`✔ SVG to PNG: Loaded & Rendered Vector Canvas width: ${canvasWidth}px`);
    }

    results.toolTests.push({ tool: tool.hash, processed });
  }

  // Restore normal viewport
  await client.setViewport(1280, 800, false);
  client.close();

  console.log('\n========================================');
  console.log('FINAL AUDIT SUMMARY:');
  console.log('Viewports Tested:', results.viewportsTested);
  console.log('Overflow Failures:', results.overflowFailures);
  console.log('Tools Tested:', results.toolTests);
  console.log('Theme Toggle Verified:', results.themeToggleVerified);
  console.log('Mobile Menu Verified:', results.mobileMenuVerified);
  console.log('========================================');
}

runAudit().catch(err => {
  console.error('Audit Runner Error:', err);
  process.exit(1);
});
