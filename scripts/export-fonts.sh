#!/bin/bash
# End-to-end font conversion and export for BLE/HTML deployment
# 1. Converts all .ttf in src/assets/fonts/ to LVGL .c files in lvgl/fonts/
# 2. Copies all .c files to Desktop/ui/html/fonts/ for export

FONT_SRC="src/assets/fonts"
LVGL_OUT="lvgl/fonts"
HTML_FONTS="Desktop/ui/html/fonts"

# Step 1: Convert fonts (reuse existing script)
./convert-fonts.sh --sizes "14 16 20 22 24 26" --range 0x20-0x7F

# Step 2: Copy all .c files to HTML fonts folder
mkdir -p "$HTML_FONTS"
cp "$LVGL_OUT"/*.c "$HTML_FONTS"/

echo "[DONE] All LVGL fonts copied to $HTML_FONTS for export."
