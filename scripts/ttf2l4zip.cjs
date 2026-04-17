// Node.js script to convert TTF font glyphs to L4 bitmaps and package them for firmware use
// Requirements: npm install opentype.js canvas archiver

const opentype = require('opentype.js');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Settings
const FONT_DIR = path.join('src', 'assets', 'fonts');
const OUTPUT_DIR = 'font_l4_output';
const ZIP_PATH = 'font_l4_firmware.zip';
const FONT_SIZES = [14, 16, 20, 22, 24, 26];
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Glyphs to export

function toL4(gray) {
  // Convert 0-255 grayscale to 0-15 (4 bits)
  return Math.round(gray / 17);
}

function packL4Bitmap(data, width, height) {
  // Packs 4bpp grayscale into bytes (2 pixels per byte)
  const packed = Buffer.alloc(Math.ceil(width * height / 2));
  let idx = 0;
  for (let i = 0; i < data.length; i += 2) {
    const hi = data[i] & 0x0F;
    const lo = (i + 1 < data.length) ? (data[i + 1] & 0x0F) : 0;
    packed[idx++] = (hi << 4) | lo;
  }
  return packed;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  const ttfFiles = fs.readdirSync(FONT_DIR).filter(f => f.toLowerCase().endsWith('.ttf'));
  for (const ttf of ttfFiles) {
    const fontPath = path.join(FONT_DIR, ttf);
    const fontName = path.basename(ttf, '.ttf');
    const font = await opentype.load(fontPath);
    for (const size of FONT_SIZES) {
      const fontOutDir = path.join(OUTPUT_DIR, `${fontName}_${size}`);
      if (!fs.existsSync(fontOutDir)) fs.mkdirSync(fontOutDir, { recursive: true });
      for (const char of CHARS) {
        const glyph = font.charToGlyph(char);
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        const pathObj = glyph.getPath(0, size, size);
        pathObj.draw(ctx);
        // Get grayscale bitmap
        const imgData = ctx.getImageData(0, 0, size, size);
        const l4 = [];
        for (let i = 0; i < imgData.data.length; i += 4) {
          // Simple average for grayscale
          const gray = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
          l4.push(toL4(gray));
        }
        const packed = packL4Bitmap(l4, size, size);
        fs.writeFileSync(path.join(fontOutDir, `${char.charCodeAt(0)}.bin`), packed);
      }
      console.log(`[OK] Converted ${fontName} size ${size} to L4 glyphs.`);
    }
  }
  // Zip all .bin files
  const output = fs.createWriteStream(ZIP_PATH);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);
  archive.directory(OUTPUT_DIR, false);
  await archive.finalize();
  console.log('All fonts converted and zipped for firmware use.');
}

main().catch(console.error);
