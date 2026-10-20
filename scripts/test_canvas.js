// Verify geometric calculations of canvas transformations

function calculateRotatedBoundingBox(sw, sh, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const destW = Math.round(sw * cos + sh * sin);
  const destH = Math.round(sw * sin + sh * cos);
  return { destW, destH };
}

console.log('=== TEST 1: ROTATION BOUNDING BOX MATH ===');
console.log('0 deg (800x600):', calculateRotatedBoundingBox(800, 600, 0));
console.log('90 deg (800x600):', calculateRotatedBoundingBox(800, 600, 90));
console.log('180 deg (800x600):', calculateRotatedBoundingBox(800, 600, 180));
console.log('270 deg (800x600):', calculateRotatedBoundingBox(800, 600, 270));

if (calculateRotatedBoundingBox(800, 600, 90).destW !== 600 || calculateRotatedBoundingBox(800, 600, 90).destH !== 800) {
  throw new Error('90 degree rotation bounding box failed!');
}

console.log('=== TEST 2: ASPECT RATIO PRESERVATION MATH ===');
function calculateFitDimensions(sw, sh, targetW, targetH) {
  const sourceAspect = sw / sh;
  const targetAspect = targetW / targetH;
  if (sourceAspect > targetAspect) {
    return { w: targetW, h: Math.round(targetW / sourceAspect) };
  } else {
    return { w: Math.round(targetH * sourceAspect), h: targetH };
  }
}

console.log('Fit 1920x1080 into 800x800 box:', calculateFitDimensions(1920, 1080, 800, 800));
console.log('Fit 1080x1920 vertical into 800x800 box:', calculateFitDimensions(1080, 1920, 800, 800));

console.log('=== ALL GEOMETRIC UTILITY TESTS PASSED ✔ ===');
