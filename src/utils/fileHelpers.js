/**
 * File helpers and sample media utilities for PixelMint
 */

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Creates high-quality demo media so users can instantly test every tool without uploading files.
 */
export function generateDemoSample(type = 'images') {
  if (type === 'images') {
    // Generates 4 vibrant animated frames
    const frames = [];
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];
    const emojis = ['🌱', '⚡', '✨', '💎'];
    
    for (let i = 0; i < 4; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 300, 300);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, colors[i]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 300);
      
      // Glowing orb
      ctx.beginPath();
      ctx.arc(150 + Math.sin((i / 4) * Math.PI * 2) * 50, 150 + Math.cos((i / 4) * Math.PI * 2) * 40, 60, 0, Math.PI * 2);
      ctx.fillStyle = colors[(i + 1) % 4] + '99';
      ctx.fill();
      
      // Emoji & text
      ctx.font = '64px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojis[i], 150, 140);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(`PixelMint Frame #${i + 1}`, 150, 230);
      
      frames.push(canvas.toDataURL('image/png'));
    }
    return frames;
  }
}
