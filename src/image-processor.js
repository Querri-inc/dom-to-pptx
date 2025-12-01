// src/image-processor.js

export async function getProcessedImage(src, targetW, targetH, radius) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Critical for canvas manipulation

    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Double resolution for better quality
      const scale = 2;
      canvas.width = targetW * scale;
      canvas.height = targetH * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // 1. Draw the Mask (Rounded Rect)
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, targetW, targetH, radius);
      } else {
        // Fallback for older browsers if needed
        ctx.rect(0, 0, targetW, targetH);
      }
      ctx.fillStyle = '#000';
      ctx.fill();

      // 2. Composite Source-In
      ctx.globalCompositeOperation = 'source-in';

      // 3. Draw Image (Object Cover Logic)
      const wRatio = targetW / img.width;
      const hRatio = targetH / img.height;
      const maxRatio = Math.max(wRatio, hRatio);
      const renderW = img.width * maxRatio;
      const renderH = img.height * maxRatio;
      const renderX = (targetW - renderW) / 2;
      const renderY = (targetH - renderH) / 2;

      ctx.drawImage(img, renderX, renderY, renderW, renderH);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });
}
