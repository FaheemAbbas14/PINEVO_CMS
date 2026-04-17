# TTF to L4 Firmware Font Conversion

This script converts TTF font glyphs to L4 (4bpp grayscale) bitmaps and packages them into a zip file for firmware use.

## Prerequisites

- Node.js
- npm install opentype.js canvas archiver

## Usage

1. Place your TTF font file in the project root and rename it to `font.ttf` (or update the FONT_PATH in the script).
2. Run the script:

```
node scripts/ttf2l4zip.js
```

3. The output will be in `font_l4_output/` and zipped as `font_l4_firmware.zip`.

- Each glyph is exported as a binary file named by its Unicode codepoint (e.g., `65.bin` for 'A').
- The zip file contains all glyph binaries for easy firmware integration.

## Customization
- Edit `CHARS` in the script to include all glyphs you need.
- Adjust `FONT_SIZE` for your target pixel size.

## Integration
- The resulting zip can be unpacked and used in your firmware build process.
