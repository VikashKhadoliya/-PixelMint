import omggif from 'omggif';
import gifencPkg from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifencPkg;
import JSZip from 'jszip';

console.log('=== TEST 1: SYNTHETIC MULTI-FRAME GIF ENCODING ===');
const width = 120, height = 120;
const frames = [];
const numFrames = 5;

for (let i = 0; i < numFrames; i++) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const idx = p * 4;
    // Varying colored patterns per frame
    rgba[idx] = (i * 50) % 256;      // R
    rgba[idx + 1] = (255 - i * 40) % 256; // G
    rgba[idx + 2] = (100 + i * 30) % 256; // B
    rgba[idx + 3] = 255;            // Alpha
  }
  frames.push({
    rgba,
    delay: 150 // 150ms per frame
  });
}

const gif = GIFEncoder();
for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  const palette = quantize(f.rgba, 256, { format: 'rgb565', oneBitAlpha: true });
  const index = applyPalette(f.rgba, palette, 'floyd-steinberg');
  gif.writeFrame(index, width, height, {
    palette,
    delay: f.delay,
    repeat: 0,
    dispose: 2
  });
}
gif.finish();
const encodedBytes = gif.bytes();
console.log('✔ Encoded GIF size:', encodedBytes.length, 'bytes');

console.log('=== TEST 2: GIF DECODING & COALESCING (omggif) ===');
const reader = new omggif.GifReader(encodedBytes);
console.log('✔ Decoded Dimensions:', reader.width, 'x', reader.height);
console.log('✔ Decoded Frame Count:', reader.numFrames());
console.log('✔ Decoded Loop Count:', reader.loopCount());

if (reader.width !== width || reader.height !== height || reader.numFrames() !== numFrames) {
  throw new Error('GIF dimensions or frame count mismatch!');
}

console.log('=== TEST 3: GIF STRUCTURE ANALYZER ===');
const disposalNames = {
  0: 'Unspecified',
  1: 'Do Not Dispose',
  2: 'Restore to Background',
  3: 'Restore to Previous'
};

let totalDurationMs = 0;
const frameReports = [];

for (let i = 0; i < reader.numFrames(); i++) {
  const info = reader.frameInfo(i);
  const delayHundredths = info.delay || 10;
  const delayMs = delayHundredths * 10;
  totalDurationMs += delayMs;

  frameReports.push({
    index: i + 1,
    x: info.x,
    y: info.y,
    width: info.width,
    height: info.height,
    delayMs,
    disposalName: disposalNames[info.disposal] || `Method ${info.disposal}`
  });
}

const durationSec = (totalDurationMs / 1000).toFixed(2);
const avgFps = (reader.numFrames() / (totalDurationMs / 1000)).toFixed(1);
console.log('✔ Total Duration:', durationSec, 'seconds');
console.log('✔ Average FPS:', avgFps);
console.log('✔ Sample Frame Report 1:', frameReports[0]);

console.log('=== TEST 4: JSZIP FRAME BUNDLING ===');
const zip = new JSZip();
for (let i = 0; i < reader.numFrames(); i++) {
  const frameRgba = new Uint8ClampedArray(width * height * 4);
  reader.decodeAndBlitFrameRGBA(i, frameRgba);
  zip.file(`frame-${String(i + 1).padStart(3, '0')}.raw`, frameRgba.buffer);
}

const zipContent = await zip.generateAsync({ type: 'uint8array' });
console.log('✔ JSZip Package Generated Successfully, byte length:', zipContent.length);

console.log('=== TEST 5: TARGET SIZE COMPRESSOR RATIO LOGIC ===');
const targetLimit = 8 * 1024 * 1024; // 8MB Discord limit
const sampleSizes = [15 * 1024 * 1024, 9 * 1024 * 1024, 4 * 1024 * 1024];

for (const curSize of sampleSizes) {
  const targetRatio = Math.min(0.95, targetLimit / curSize);
  const scale = targetRatio < 1 ? Math.max(0.3, Math.sqrt(targetRatio)) : 1;
  const recommendedColors = targetRatio < 0.5 ? 64 : targetRatio < 0.8 ? 128 : 256;
  console.log(`✔ Input: ${(curSize / (1024*1024)).toFixed(1)}MB -> Target Ratio: ${targetRatio.toFixed(2)}, Resolution Scale: ${scale.toFixed(2)}, Colors: ${recommendedColors}`);
}

console.log('=== ALL MEDIA PROCESSING PIPELINE TESTS PASSED ✔ ===');
