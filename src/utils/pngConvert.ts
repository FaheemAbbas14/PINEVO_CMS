// PNG conversion utility for image uploads
// Uses browser APIs to convert images to PNG with strict constraints

import { EXPORT_CONFIG } from '../config/project';

export async function convertImageToPngStrict(file: File): Promise<{ dataUrl: string, width: number, height: number, size: number }> {
  const constraints = EXPORT_CONFIG.pngUpload;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      // Check dimensions
      if (img.width > constraints.maxWidth || img.height > constraints.maxHeight) {
        URL.revokeObjectURL(url);
        reject(new Error(`Image dimensions exceed allowed size (${constraints.maxWidth}x${constraints.maxHeight})`));
        return;
      }
      // Create canvas with image dimensions
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas not supported.'));
        return;
      }
      // Draw image on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // Check for transparency
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasAlpha = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 255) {
          hasAlpha = true;
          break;
        }
      }
      // If no alpha, flatten to RGB (remove alpha channel)
      let pngDataUrl;
      if (!hasAlpha) {
        // Create new canvas without alpha
        const rgbCanvas = document.createElement('canvas');
        rgbCanvas.width = canvas.width;
        rgbCanvas.height = canvas.height;
        const rgbCtx = rgbCanvas.getContext('2d', { alpha: false });
        if (!rgbCtx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas not supported.'));
          return;
        }
        rgbCtx.drawImage(canvas, 0, 0);
        pngDataUrl = rgbCanvas.toDataURL('image/png');
      } else {
        pngDataUrl = canvas.toDataURL('image/png');
      }
      // Get file size
      fetch(pngDataUrl)
        .then(res => res.blob())
        .then(blob => {
          URL.revokeObjectURL(url);
          if (blob.size > constraints.maxFileSize) {
            reject(new Error(`Image file size exceeds allowed limit (${constraints.maxFileSize} bytes)`));
            return;
          }
          resolve({
            dataUrl: pngDataUrl,
            width: img.width,
            height: img.height,
            size: blob.size
          });
        });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}
