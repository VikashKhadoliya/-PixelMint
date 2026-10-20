/**
 * GIF Encoding and Decoding Utilities for PixelMint
 * Leverages omggif for robust frame decoding/coalescing and gifenc for high-speed encoding
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import omggif from 'omggif';

const { GifReader } = omggif;

/**
 * Decodes an animated or static GIF from an ArrayBuffer into full-frame RGBA canvas elements
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<{ width: number, height: number, loopCount: number, frames: Array<{ canvas: HTMLCanvasElement, delay: number, disposal: number }> }>}
 */
export async function decodeGif(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const reader = new GifReader(bytes);
  const width = reader.width;
  const height = reader.height;
  const numFrames = reader.numFrames();
  const loopCount = reader.loopCount();

  const frames = [];

  // Intermediate rendering canvas to handle proper GIF frame disposal & coalescing
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const compositeCtx = compositeCanvas.getContext('2d', { willReadFrequently: true });

  // Pixel buffer for decoding
  const frameRgba = new Uint8ClampedArray(width * height * 4);

  // Buffer to snapshot previous state if disposal === 3 (restore previous)
  let prevSnapshot = null;

  for (let i = 0; i < numFrames; i++) {
    const info = reader.frameInfo(i);
    // Delay is in 100ths of a sec (10ms units). Minimum browser standard clamp is 2 (20ms)
    let delayHundredths = info.delay || 10;
    if (delayHundredths < 2) delayHundredths = 10;
    const delayMs = delayHundredths * 10;

    if (info.disposal === 3 && !prevSnapshot) {
      prevSnapshot = compositeCtx.getImageData(0, 0, width, height);
    }

    // Decode current frame RGBA onto frameRgba
    reader.decodeAndBlitFrameRGBA(i, frameRgba);

    // Create temp canvas for the blitted frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    const imgData = new ImageData(new Uint8ClampedArray(frameRgba), width, height);
    tempCtx.putImageData(imgData, 0, 0);

    // Draw frame onto composite
    compositeCtx.drawImage(tempCanvas, 0, 0);

    // Save full coalesced frame canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.drawImage(compositeCanvas, 0, 0);

    frames.push({
      canvas: outputCanvas,
      delay: delayMs,
      delayHundredths: delayHundredths,
      disposal: info.disposal
    });

    // Handle frame disposal for subsequent frame
    if (info.disposal === 2) {
      // Restore to transparent / background
      compositeCtx.clearRect(info.x, info.y, info.width, info.height);
    } else if (info.disposal === 3 && prevSnapshot) {
      // Restore to previous snapshot
      compositeCtx.putImageData(prevSnapshot, 0, 0);
      prevSnapshot = null;
    }
  }

  return {
    width,
    height,
    loopCount: loopCount === null ? 0 : loopCount,
    frames
  };
}

/**
 * Encodes an array of HTMLCanvasElement or ImageData frames into an animated GIF
 * @param {Array<{ canvas?: HTMLCanvasElement, imageData?: ImageData, delay?: number }>} frames
 * @param {Object} options
 * @param {number} [options.maxColors=256] 2 to 256
 * @param {string} [options.dither='floyd'] 'floyd' | 'none'
 * @param {number} [options.loop=0] 0 = infinite, >0 = count
 * @param {function} [options.onProgress] progress callback (pct 0..100)
 * @returns {Promise<Blob>}
 */
export async function encodeGif(frames, options = {}) {
  const {
    maxColors = 256,
    dither = 'floyd',
    loop = 0,
    onProgress = () => {}
  } = options;

  if (!frames || frames.length === 0) {
    throw new Error('No frames provided for GIF encoding');
  }

  const firstCanvas = frames[0].canvas;
  const width = firstCanvas ? firstCanvas.width : frames[0].imageData.width;
  const height = firstCanvas ? firstCanvas.height : frames[0].imageData.height;

  const gif = GIFEncoder();
  const total = frames.length;

  for (let i = 0; i < total; i++) {
    const frame = frames[i];
    let rgba;

    if (frame.imageData) {
      rgba = frame.imageData.data;
    } else if (frame.canvas) {
      const ctx = frame.canvas.getContext('2d', { willReadFrequently: true });
      rgba = ctx.getImageData(0, 0, width, height).data;
    } else {
      throw new Error(`Frame ${i} does not have valid canvas or imageData`);
    }

    // Palette quantization
    const palette = quantize(rgba, Math.min(Math.max(maxColors, 2), 256), {
      format: 'rgb565',
      oneBitAlpha: true
    });

    // Apply palette indexing
    const index = applyPalette(rgba, palette, dither === 'floyd' ? 'floyd-steinberg' : 'none');

    // Delay in milliseconds (gifenc rounds /10 into 100ths of a sec)
    const delay = frame.delay || 100;

    gif.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: loop,
      dispose: 2 // Restore to background to prevent stacking transparency artifacts
    });

    onProgress(Math.round(((i + 1) / total) * 100));

    // Allow UI thread to breathe for smooth 60fps progress updates
    if (i % 2 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  gif.finish();
  const bytes = gif.bytes();
  return new Blob([bytes], { type: 'image/gif' });
}

/**
 * Inspects GIF structural metadata and per-frame specs for the GIF Analyzer tool
 * @param {ArrayBuffer} arrayBuffer 
 */
export function analyzeGif(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const reader = new GifReader(bytes);

  // Read header signature
  let version = 'GIF89a';
  if (bytes.length >= 6) {
    version = String.fromCharCode(...bytes.slice(0, 6));
  }

  const width = reader.width;
  const height = reader.height;
  const numFrames = reader.numFrames();
  const loopCount = reader.loopCount();

  const disposalNames = {
    0: 'Unspecified',
    1: 'Do Not Dispose (Leave in place)',
    2: 'Restore to Background (Clear to transparent)',
    3: 'Restore to Previous (Revert canvas)'
  };

  let totalDurationMs = 0;
  const frameReports = [];

  for (let i = 0; i < numFrames; i++) {
    const info = reader.frameInfo(i);
    let delayHundredths = info.delay || 10;
    if (delayHundredths < 2) delayHundredths = 10;
    const delayMs = delayHundredths * 10;
    totalDurationMs += delayMs;

    frameReports.push({
      index: i + 1,
      x: info.x,
      y: info.y,
      width: info.width,
      height: info.height,
      delayHundredths,
      delayMs,
      disposal: info.disposal,
      disposalName: disposalNames[info.disposal] || `Method ${info.disposal}`,
      transparentIndex: info.transparent_index,
      hasTransparency: info.transparent_index !== null,
      hasLocalPalette: !!info.has_local_palette
    });
  }

  const durationSec = (totalDurationMs / 1000).toFixed(2);
  const avgFps = totalDurationMs > 0 ? (numFrames / (totalDurationMs / 1000)).toFixed(1) : 0;

  return {
    version,
    width,
    height,
    aspectRatio: `${width} : ${height}`,
    numFrames,
    loopCount: loopCount === null ? 0 : loopCount,
    loopText: loopCount === 0 || loopCount === null ? 'Infinite (Loops Forever)' : `${loopCount} times`,
    totalDurationMs,
    durationSec,
    avgFps,
    byteSize: arrayBuffer.byteLength,
    frameReports
  };
}

