#!/bin/bash
# Copy all .bin files from font_l4_output to Desktop/ui/html/fonts, preserving font/size structure

set -e

SRC="font_l4_output"
DST="Desktop/ui/html/fonts"

mkdir -p "$DST"
find "$SRC" -type f -name '*.bin' | while read -r file; do
  # Get relative path after font_l4_output/
  relpath="${file#$SRC/}"
  # Create target directory if needed
  targetdir="$DST/$(dirname "$relpath")"
  mkdir -p "$targetdir"
  cp "$file" "$targetdir/"
done
