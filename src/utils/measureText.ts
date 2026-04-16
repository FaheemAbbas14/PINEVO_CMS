// Utility to measure text width and height using canvas
export function measureText(text: string, font: string): { width: number, height: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { width: 0, height: 0 };
  context.font = font;
  const metrics = context.measureText(text);
  // Approximate height: https://stackoverflow.com/a/13318387
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || parseInt(font, 10) || 16;
  return { width: Math.ceil(metrics.width), height: Math.ceil(height) };
}
