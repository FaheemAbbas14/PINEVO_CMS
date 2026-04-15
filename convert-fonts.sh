#!/bin/bash
# Font conversion pipeline for LVGL firmware integration
# Converts all .ttf fonts in assets/fonts/ to LVGL C arrays in lvgl/fonts/
# Supports multiple sizes, BPP=4, basic Latin range by default
# Usage: ./convert-fonts.sh [--sizes "14 16 20"] [--range 0x20-0x7F] [--arabic]

FONT_DIR="src/assets/fonts"
OUT_DIR="lvgl/fonts"
SIZES="14 16 20"
RANGE="0x20-0x7F"
BPP=4
LV_FONT_CONV="lv_font_conv" # Assumes in PATH

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --sizes)
      SIZES="$2"
      shift 2
      ;;
    --range)
      RANGE="$2"
      shift 2
      ;;
    --arabic|--urdu)
      RANGE="0x20-0x7F,0x0600-0x06FF"
      shift
      ;;
    *)
      echo "Unknown option: $1"; exit 1;
      ;;
  esac
done

mkdir -p "$OUT_DIR"

if ! command -v "$LV_FONT_CONV" &> /dev/null; then
  echo "Error: lv_font_conv not found in PATH. Install with 'npm i -g lv_font_conv'"
  exit 1
fi

for FONT in "$FONT_DIR"/*.ttf; do
  if [[ ! -f "$FONT" ]]; then
    echo "No .ttf fonts found in $FONT_DIR. Skipping."
    continue
  fi
  FONT_BASENAME=$(basename "$FONT" .ttf | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
  for SIZE in $SIZES; do
    OUT_FILE="$OUT_DIR/${FONT_BASENAME}_${SIZE}.c"
    echo "[INFO] Converting $FONT (size $SIZE px, range $RANGE) -> $OUT_FILE"
    "$LV_FONT_CONV" --font "$FONT" --size $SIZE --bpp $BPP --range $RANGE --format lvgl -o "$OUT_FILE"
    if [[ $? -ne 0 ]]; then
      echo "[ERROR] Conversion failed for $FONT size $SIZE"
    else
      echo "[OK] $OUT_FILE generated."
    fi
  done
done

echo "[DONE] Font conversion complete. Output in $OUT_DIR."
