/**
 * Canvas 2D image transformation & filtering utilities for PixelMint
 */

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

/**
 * Resizes a source canvas into a target dimension
 * @param {HTMLCanvasElement} sourceCanvas 
 * @param {number} targetW 
 * @param {number} targetH 
 * @param {'fit'|'stretch'|'crop'} mode 
 * @returns {HTMLCanvasElement}
 */
export function resizeCanvas(sourceCanvas, targetW, targetH, mode = 'fit') {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  if (mode === 'stretch') {
    const dest = createCanvas(targetW, targetH);
    const ctx = dest.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);
    return dest;
  }

  if (mode === 'crop') {
    // Center and crop to fill target dimensions
    const dest = createCanvas(targetW, targetH);
    const ctx = dest.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sourceAspect = sw / sh;
    const targetAspect = targetW / targetH;
    let sx = 0, sy = 0, sCropW = sw, sCropH = sh;

    if (sourceAspect > targetAspect) {
      // Source is wider than target
      sCropW = sh * targetAspect;
      sx = (sw - sCropW) / 2;
    } else {
      // Source is taller than target
      sCropH = sw / targetAspect;
      sy = (sh - sCropH) / 2;
    }

    ctx.drawImage(sourceCanvas, sx, sy, sCropW, sCropH, 0, 0, targetW, targetH);
    return dest;
  }

  // Default 'fit' (proportional within bounds)
  const dest = createCanvas(targetW, targetH);
  const ctx = dest.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);
  return dest;
}

/**
 * Crops a rect region from a canvas
 */
export function cropCanvas(sourceCanvas, rect) {
  const { x, y, width, height } = rect;
  const clampedW = Math.max(1, Math.min(width, sourceCanvas.width - x));
  const clampedH = Math.max(1, Math.min(height, sourceCanvas.height - y));

  const dest = createCanvas(clampedW, clampedH);
  const ctx = dest.getContext('2d');
  ctx.drawImage(sourceCanvas, x, y, clampedW, clampedH, 0, 0, clampedW, clampedH);
  return dest;
}

/**
 * Applies geometric rotation and flips
 */
export function transformCanvas(sourceCanvas, angleDeg = 0, flipH = false, flipV = false) {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const rad = (angleDeg * Math.PI) / 180;

  // Determine bounding box for rotated canvas
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const destW = Math.round(sw * cos + sh * sin);
  const destH = Math.round(sw * sin + sh * cos);

  const dest = createCanvas(destW, destH);
  const ctx = dest.getContext('2d');

  ctx.translate(destW / 2, destH / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(sourceCanvas, -sw / 2, -sh / 2);

  return dest;
}

/**
 * Applies color adjustments & filters
 * @param {HTMLCanvasElement} sourceCanvas 
 * @param {Object} filters
 * @param {number} [filters.brightness=100] % (0..200)
 * @param {number} [filters.contrast=100] % (0..200)
 * @param {number} [filters.saturation=100] % (0..200)
 * @param {number} [filters.hue=0] deg (-180..180)
 * @param {number} [filters.grayscale=0] % (0..100)
 * @param {number} [filters.sepia=0] % (0..100)
 * @param {number} [filters.invert=0] % (0..100)
 */
export function applyFiltersToCanvas(sourceCanvas, filters = {}) {
  const {
    brightness = 100,
    contrast = 100,
    saturation = 100,
    hue = 0,
    grayscale = 0,
    sepia = 0,
    invert = 0
  } = filters;

  const dest = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = dest.getContext('2d');

  const filterString = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    `hue-rotate(${hue}deg)`,
    `grayscale(${grayscale}%)`,
    `sepia(${sepia}%)`,
    `invert(${invert}%)`
  ].join(' ');

  ctx.filter = filterString;
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.filter = 'none';

  return dest;
}
