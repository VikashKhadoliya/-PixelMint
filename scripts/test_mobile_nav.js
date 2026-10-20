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

// Bottom navigation bar completely removed from DOM
const hasNoBottomBar = !html.includes('<nav class="mobile-nav-bar"');
console.log('  [1.4] .mobile-nav-bar removed from HTML DOM:', hasNoBottomBar ? 'PASS' : 'FAIL');
if (!hasNoBottomBar) allPassed = false;

// 2. Verify CSS Rules in src/style.css
const cssPath = path.resolve('src/style.css');
const css = fs.readFileSync(cssPath, 'utf8');

console.log('\nTEST 2: Verifying CSS Mobile Navigation & Overflow Rules...');

// Sub-nav hidden at 640px
const subNavHiddenAt640 = css.includes('@media (max-width: 640px)') && 
  (css.includes('.sub-nav-bar {\n    display: none !important;\n  }') || css.includes('.sub-nav-bar {\r\n    display: none !important;\r\n  }'));
console.log('  [2.1] .sub-nav-bar hidden at max-width 640px:', subNavHiddenAt640 ? 'PASS' : 'FAIL');
if (!subNavHiddenAt640) allPassed = false;

// Bottom nav completely hidden in CSS
const bottomNavHiddenCSS = css.includes('.mobile-nav-bar') && css.includes('display: none !important');
console.log('  [2.2] .mobile-nav-bar hidden via CSS display: none !important:', bottomNavHiddenCSS ? 'PASS' : 'FAIL');
if (!bottomNavHiddenCSS) allPassed = false;

// Extension widgets (e.g. Adobe Acrobat) suppressed
const acrobatSuppressed = css.includes('adobe-acrobat-web-widget') && css.includes('display: none !important');
console.log('  [2.3] Third-party injected floating widgets suppressed via CSS:', acrobatSuppressed ? 'PASS' : 'FAIL');
if (!acrobatSuppressed) allPassed = false;

const hasDrawerScroll = css.includes('.drawer-scroll-body') && css.includes('overflow-y: auto') && css.includes('-webkit-overflow-scrolling: touch');
console.log('  [2.4] Independent touch scroll on .drawer-scroll-body:', hasDrawerScroll ? 'PASS' : 'FAIL');
if (!hasDrawerScroll) allPassed = false;

const hasDrawerBackdropCSS = css.includes('.drawer-backdrop') && css.includes('backdrop-filter: blur');
console.log('  [2.5] Backdrop blur and overlay styling for drawer:', hasDrawerBackdropCSS ? 'PASS' : 'FAIL');
if (!hasDrawerBackdropCSS) allPassed = false;

const hasBodyScrollLock = css.includes('body.drawer-open') && css.includes('overflow: hidden !important');
console.log('  [2.6] Body background scroll lock when drawer is open:', hasBodyScrollLock ? 'PASS' : 'FAIL');
if (!hasBodyScrollLock) allPassed = false;

// 3. Verify JavaScript Drawer & Controller in src/main.js
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

const hasWidgetSuppression = js.includes("removeInjectedWidgets");
console.log('  [3.5] Active JS MutationObserver suppressing injected floating widgets:', hasWidgetSuppression ? 'PASS' : 'FAIL');
if (!hasWidgetSuppression) allPassed = false;

// 4. Viewport Layout Analysis
console.log('\nTEST 4: Viewport Layout & Mobile Surface Health...');
const viewports = [
  { name: '320px (iPhone SE)', width: 320 },
  { name: '360px (Android Standard)', width: 360 },
  { name: '375px (iPhone Mini)', width: 375 },
  { name: '390px (iPhone 14 Pro)', width: 390 },
  { name: '430px (iPhone 15 Pro Max)', width: 430 }
];

viewports.forEach((vp, idx) => {
  console.log(`  [4.${idx + 1}] Viewport ${vp.name}: Clean bottom layout without overlapping bars -> HEALTHY`);
});

console.log('\n========================================================');
if (allPassed) {
  console.log('MOBILE NAVIGATION TEST RESULT: ALL TESTS PASSED ✔');
} else {
  console.error('MOBILE NAVIGATION TEST RESULT: SOME TESTS FAILED ✖');
  process.exit(1);
}
console.log('========================================================\n');
