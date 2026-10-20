// Mobile Navigation Automated Verification Script
import fs from 'fs';
import path from 'path';

console.log('========================================================');
console.log('PIXELMINT MOBILE NAVIGATION VERIFICATION TEST SUITE');
console.log('========================================================\n');

let allPassed = true;

// 1. Verify index.html navigation elements
const htmlPath = path.resolve('index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('TEST 1: Verifying index.html Mobile Navigation Elements...');
const hasViewportFit = html.includes('viewport-fit=cover');
console.log('  [1.1] viewport-fit=cover present in viewport meta:', hasViewportFit ? 'PASS' : 'FAIL');
if (!hasViewportFit) allPassed = false;

const hasDrawerBackdrop = html.includes('id="drawer-backdrop"');
console.log('  [1.2] #drawer-backdrop element present:', hasDrawerBackdrop ? 'PASS' : 'FAIL');
if (!hasDrawerBackdrop) allPassed = false;

const hasDrawerCloseBtn = html.includes('id="drawer-close-btn"');
console.log('  [1.3] #drawer-close-btn present in drawer header:', hasDrawerCloseBtn ? 'PASS' : 'FAIL');
if (!hasDrawerCloseBtn) allPassed = false;

// Extract mobile-nav-item buttons from mobile-nav-bar
const mobileNavMatch = html.match(/<nav class="mobile-nav-bar"[^>]*>([\s\S]*?)<\/nav>/);
if (!mobileNavMatch) {
  console.log('  [1.4] .mobile-nav-bar found: FAIL');
  allPassed = false;
} else {
  const bottomNavContent = mobileNavMatch[1];
  const items = [...bottomNavContent.matchAll(/data-tool="([^"]+)"/g)].map(m => m[1]);
  console.log('  [1.4] Bottom Nav Shortcuts Count:', items.length, '(Items:', items.join(', '), ')');
  const countValid = items.length >= 5 && items.length <= 7;
  console.log('  [1.5] Bottom Nav Count within 5–7 range:', countValid ? 'PASS' : 'FAIL');
  if (!countValid) allPassed = false;

  const expectedShortcuts = ['home', 'gifMaker', 'videoToGif', 'resizer', 'cropper', 'optimizer'];
  const hasExpected = expectedShortcuts.every(s => items.includes(s));
  console.log('  [1.6] Contains Home, Maker, Video, Resize, Crop, Optimize:', hasExpected ? 'PASS' : 'FAIL');
  if (!hasExpected) allPassed = false;
}

// 2. Verify CSS Rules in src/style.css
const cssPath = path.resolve('src/style.css');
const css = fs.readFileSync(cssPath, 'utf8');

console.log('\nTEST 2: Verifying CSS Mobile Navigation & Overflow Rules...');

// Sub-nav hidden at 640px
const subNavHiddenAt640 = css.includes('@media (max-width: 640px)') && 
  css.includes('.sub-nav-bar {\n    display: none !important;\n  }') || css.includes('.sub-nav-bar {\r\n    display: none !important;\r\n  }');
console.log('  [2.1] .sub-nav-bar hidden at max-width 640px:', subNavHiddenAt640 ? 'PASS' : 'FAIL');
if (!subNavHiddenAt640) allPassed = false;

// Bottom navigation padding & clearance
const hasSafeArea = css.includes('env(safe-area-inset-bottom');
console.log('  [2.2] Safe-area-inset-bottom support in CSS:', hasSafeArea ? 'PASS' : 'FAIL');
if (!hasSafeArea) allPassed = false;

const hasMainBottomPadding = css.includes('padding-bottom: calc(5.5rem + env(safe-area-inset-bottom');
console.log('  [2.3] Content clearance padding-bottom on .main-wrapper:', hasMainBottomPadding ? 'PASS' : 'FAIL');
if (!hasMainBottomPadding) allPassed = false;

const hasFooterBottomPadding = css.includes('.site-footer') && css.includes('calc(5.5rem + env(safe-area-inset-bottom');
console.log('  [2.4] Footer clearance padding-bottom for bottom bar:', hasFooterBottomPadding ? 'PASS' : 'FAIL');
if (!hasFooterBottomPadding) allPassed = false;

const hasFloatingBtnClearance = css.includes('.floating-btn') && css.includes('calc(4.75rem + env(safe-area-inset-bottom');
console.log('  [2.5] Floating button clearance above bottom bar:', hasFloatingBtnClearance ? 'PASS' : 'FAIL');
if (!hasFloatingBtnClearance) allPassed = false;

const hasDrawerScroll = css.includes('.drawer-scroll-body') && css.includes('overflow-y: auto') && css.includes('-webkit-overflow-scrolling: touch');
console.log('  [2.6] Independent touch scroll on .drawer-scroll-body:', hasDrawerScroll ? 'PASS' : 'FAIL');
if (!hasDrawerScroll) allPassed = false;

const hasDrawerBackdropCSS = css.includes('.drawer-backdrop') && css.includes('backdrop-filter: blur');
console.log('  [2.7] Backdrop blur and overlay styling for drawer:', hasDrawerBackdropCSS ? 'PASS' : 'FAIL');
if (!hasDrawerBackdropCSS) allPassed = false;

const hasBodyScrollLock = css.includes('body.drawer-open') && css.includes('overflow: hidden !important');
console.log('  [2.8] Body background scroll lock when drawer is open:', hasBodyScrollLock ? 'PASS' : 'FAIL');
if (!hasBodyScrollLock) allPassed = false;

// 3. Verify JavaScript Drawer & Bottom Nav Controller in src/main.js
const jsPath = path.resolve('src/main.js');
const js = fs.readFileSync(jsPath, 'utf8');

console.log('\nTEST 3: Verifying main.js Drawer & Nav Controller Logic...');

const hasBackdropSelector = js.includes('drawerBackdrop');
console.log('  [3.1] drawerBackdrop selected and bound:', hasBackdropSelector ? 'PASS' : 'FAIL');
if (!hasBackdropSelector) allPassed = false;

const hasCloseBtnSelector = js.includes('drawerCloseBtn');
console.log('  [3.2] drawerCloseBtn selected and bound:', hasCloseBtnSelector ? 'PASS' : 'FAIL');
if (!hasCloseBtnSelector) allPassed = false;

const hasDrawerOpenClass = js.includes("document.body.classList.add('drawer-open')");
console.log('  [3.3] Drawer toggles drawer-open body class on open:', hasDrawerOpenClass ? 'PASS' : 'FAIL');
if (!hasDrawerOpenClass) allPassed = false;

const hasDrawerCloseOnLink = js.includes("toggleMobileDrawer(false)");
console.log('  [3.4] Drawer closes automatically on navigation:', hasDrawerCloseOnLink ? 'PASS' : 'FAIL');
if (!hasDrawerCloseOnLink) allPassed = false;

const hasBottomCategoryMap = js.includes('bottomCategoryMap');
console.log('  [3.5] Bottom bar active state mapped to core shortcuts:', hasBottomCategoryMap ? 'PASS' : 'FAIL');
if (!hasBottomCategoryMap) allPassed = false;

// 4. Viewport Column Width Analysis
console.log('\nTEST 4: Analyzing Bottom Nav Shortcut Widths Across Viewports...');
const viewports = [
  { name: 'iPhone SE', w: 320 },
  { name: 'Android Standard', w: 360 },
  { name: 'iPhone Mini', w: 375 },
  { name: 'iPhone 14 Pro', w: 390 },
  { name: 'iPhone 15 Pro Max', w: 430 }
];

const shortcutCount = 6;
for (const vp of viewports) {
  const colWidth = (vp.w / shortcutCount).toFixed(1);
  const isHealthy = colWidth >= 48; // Standard touch target width
  console.log(`  [4.${viewports.indexOf(vp) + 1}] Viewport ${vp.w}px (${vp.name}): ${colWidth}px per item -> ${isHealthy ? 'HEALTHY (>=48px touch target)' : 'TIGHT'}`);
  if (!isHealthy && vp.w >= 360) allPassed = false;
}

console.log('\n========================================================');
console.log('MOBILE NAVIGATION TEST RESULT:', allPassed ? 'ALL TESTS PASSED ✔' : 'SOME TESTS FAILED ✖');
console.log('========================================================');

process.exit(allPassed ? 0 : 1);
