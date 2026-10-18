/**
 * PixelMint Main Application Controller & Tool Chaining Router
 */
import './style.css';
import { renderHomePage } from './tools/homePage.js';
import { renderGifMaker } from './tools/gifMaker.js';
import { renderVideoToGif } from './tools/videoToGif.js';
import { renderResizer } from './tools/resizer.js';
import { renderCropper } from './tools/cropper.js';
import { renderOptimizer } from './tools/optimizer.js';
import { renderEffects } from './tools/effects.js';
import { renderConverter } from './tools/converter.js';

// DOM Selectors
const appContainer = document.querySelector('#tool-viewport');
const navTabButtons = document.querySelectorAll('.nav-tab-btn');
const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
const drawerLinks = document.querySelectorAll('.mobile-drawer-link');
const brandLogo = document.querySelector('.brand-logo');
const themeToggleBtn = document.querySelector('#theme-toggle-btn');
const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
const mobileDrawer = document.querySelector('#mobile-drawer');

let activeToolName = 'home';
let toolInstances = {};

// ============================================================================
// Theme Management (Dark / Light with #E53935 Accent)
// ============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('pixelmint_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pixelmint_theme', theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// Listen to system changes if user hasn't explicitly set a preference
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('pixelmint_theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// Initialize theme immediately
initTheme();

// ============================================================================
// Mobile Drawer Controller
// ============================================================================
function toggleMobileDrawer(forceState) {
  if (!mobileDrawer) return;
  const isHidden = mobileDrawer.classList.contains('hidden');
  const shouldOpen = typeof forceState === 'boolean' ? forceState : isHidden;
  
  if (shouldOpen) {
    mobileDrawer.classList.remove('hidden');
    mobileDrawer.setAttribute('aria-hidden', 'false');
  } else {
    mobileDrawer.classList.add('hidden');
    mobileDrawer.setAttribute('aria-hidden', 'true');
  }
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => toggleMobileDrawer());
}

// Close drawer when clicking outside
document.addEventListener('click', (e) => {
  if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
    if (!mobileDrawer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      toggleMobileDrawer(false);
    }
  }
});

// Close drawer on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
    toggleMobileDrawer(false);
  }
});

// ============================================================================
// Tool Registry & Router
// ============================================================================
const TOOLS = {
  home: {
    hash: 'home',
    render: (container) => renderHomePage(container, navigateToTool)
  },
  gifMaker: {
    hash: 'maker',
    render: renderGifMaker
  },
  videoToGif: {
    hash: 'video-to-gif',
    render: renderVideoToGif
  },
  resizer: {
    hash: 'resize',
    render: renderResizer
  },
  cropper: {
    hash: 'crop',
    render: renderCropper
  },
  optimizer: {
    hash: 'optimize',
    render: renderOptimizer
  },
  effects: {
    hash: 'effects',
    render: renderEffects
  },
  converter: {
    hash: 'converter',
    render: renderConverter
  }
};

/**
 * Universal Navigation and Media Loading Bus
 */
function navigateToTool(targetToolKey, mediaPayload) {
  if (!TOOLS[targetToolKey]) {
    console.warn(`Unknown target tool: ${targetToolKey}`);
    return;
  }

  // Switch to target tool
  switchTool(targetToolKey);

  // Deliver media into tool instance
  if (mediaPayload) {
    setTimeout(() => {
      const instance = toolInstances[targetToolKey];
      if (instance && instance.loadMedia) {
        if (Array.isArray(mediaPayload)) {
          if (targetToolKey === 'gifMaker' || targetToolKey === 'converter') {
            instance.loadMedia(mediaPayload);
          } else if (mediaPayload.length > 0) {
            instance.loadMedia(mediaPayload[0]);
          }
        } else {
          instance.loadMedia(mediaPayload);
        }
      }
    }, 60);
  }
}

/**
 * Global Chaining Bus
 * Passes output from one tool directly into the input of another
 */
function handleChainMedia(targetToolKey, blob, mimeType) {
  navigateToTool(targetToolKey, blob);
}

/**
 * Switches the active tool view
 */
function switchTool(toolKey) {
  if (!TOOLS[toolKey]) toolKey = 'home';
  activeToolName = toolKey;

  // Update hash
  window.location.hash = TOOLS[toolKey].hash;

  // Update desktop navigation active states
  navTabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolKey);
  });

  // Update mobile bottom bar active states
  mobileNavItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tool === toolKey);
  });

  // Update mobile drawer active states
  drawerLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.tool === toolKey);
  });

  // Update sub-nav toolbar active states
  document.querySelectorAll('.sub-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.tool === toolKey);
  });

  // Close mobile drawer if open
  toggleMobileDrawer(false);

  // Clear viewport & render tool
  appContainer.innerHTML = '';
  const renderer = TOOLS[toolKey].render;
  const instance = renderer(appContainer, handleChainMedia);
  toolInstances[toolKey] = instance;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation event bindings
navTabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTool(btn.dataset.tool);
  });
});

mobileNavItems.forEach(item => {
  item.addEventListener('click', () => {
    switchTool(item.dataset.tool);
  });
});

drawerLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchTool(link.dataset.tool);
  });
});

if (brandLogo) {
  brandLogo.addEventListener('click', (e) => {
    e.preventDefault();
    switchTool('home');
  });
}

// Handle quick tools sub-nav buttons
document.querySelectorAll('.sub-nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tool) {
      switchTool(btn.dataset.tool);
    }
  });
});

// Handle footer tool buttons & mini quick nav
document.querySelectorAll('.footer-tool-btn, .footer-mini-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (btn.dataset.tool) {
      switchTool(btn.dataset.tool);
    }
  });
});

// URL Hash routing listener
function handleHashChange() {
  const hash = window.location.hash.replace('#', '').trim();
  if (!hash || hash === 'home') {
    switchTool('home');
    return;
  }
  const foundEntry = Object.entries(TOOLS).find(([key, conf]) => conf.hash === hash);
  if (foundEntry) {
    switchTool(foundEntry[0]);
  } else {
    switchTool('home');
  }
}

window.addEventListener('hashchange', handleHashChange);

// Initial Load
if (window.location.hash && window.location.hash !== '#home') {
  handleHashChange();
} else {
  switchTool('home');
}

console.log('🚀 PixelMint initialized: Fast In-Browser Media Suite');
