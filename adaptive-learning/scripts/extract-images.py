"""
Image Extraction Script — extracts embedded images from the textbook PDF chapter by chapter.

Usage: python3 scripts/extract-images.py

Requires: pip install PyMuPDF (or: python3 -m pip install PyMuPDF)

Output:
  - Images saved to public/images/chNN/fig-chNN-XX.{png,jpeg}
  - Manifest saved to public/images/manifest.json

SETUP:
  1. Set PDF_FILENAME below to match your textbook filename
  2. Set CHAPTERS dict to map chapter numbers to (start_page, end_page) ranges
     Pages are 0-indexed for PyMuPDF (page 1 in the PDF = index 0)
  3. Adjust MIN_WIDTH/MIN_HEIGHT to control filtering of small decorative images
"""

import fitz  # PyMuPDF
import os
import json
import sys

# ============================================================
# CONFIGURE THESE FOR YOUR TEXTBOOK
# ============================================================

# Textbook PDF filename (must be in the parent directory of this repo)
PDF_FILENAME = "your-textbook.pdf"

# Chapter page ranges (0-indexed for PyMuPDF)
CHAPTERS = {
    # 1: (6, 58),
    # 2: (60, 133),
    # ... add all chapters
}

# Minimum image dimensions to keep (filters out icons, bullets, decorative elements)
MIN_WIDTH = 200
MIN_HEIGHT = 100

# ============================================================
# Script logic (no changes needed below)
# ============================================================

PDF_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        '..', PDF_FILENAME)
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          'public', 'images')


def extract_chapter_images(doc, chapter_num, start_page, end_page):
    """Extract images from a chapter's page range."""
    chapter_dir = os.path.join(OUTPUT_DIR, f'ch{chapter_num:02d}')
    os.makedirs(chapter_dir, exist_ok=True)

    image_count = 0
    manifest_entries = []

    for page_num in range(start_page, min(end_page + 1, len(doc))):
        page = doc[page_num]
        images = page.get_images(full=True)

        for img_index, img_info in enumerate(images):
            xref = img_info[0]
            try:
                base_image = doc.extract_image(xref)
                if not base_image:
                    continue

                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Skip tiny images (icons, bullets, decorative elements)
                if width < MIN_WIDTH or height < MIN_HEIGHT:
                    continue

                image_count += 1
                ext = base_image.get("ext", "png")
                filename = f'fig-ch{chapter_num:02d}-{image_count:02d}.{ext}'
                filepath = os.path.join(chapter_dir, filename)

                with open(filepath, 'wb') as f:
                    f.write(base_image["image"])

                manifest_entries.append({
                    "chapter": chapter_num,
                    "filename": filename,
                    "page": page_num + 1,  # 1-indexed for display
                    "width": width,
                    "height": height,
                    "path": f"/images/ch{chapter_num:02d}/{filename}",
                })

            except Exception as e:
                print(f"  Warning: Could not extract image xref={xref} on page {page_num+1}: {e}")

    return manifest_entries


def main():
    if not CHAPTERS:
        print("ERROR: No chapters configured. Edit CHAPTERS dict in this script.")
        sys.exit(1)

    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF not found at {PDF_PATH}")
        print(f"Make sure '{PDF_FILENAME}' is in the parent directory of this repo.")
        sys.exit(1)

    print(f"Opening PDF: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    print(f"Total pages: {len(doc)}")

    all_manifest = []

    for chapter_num, (start, end) in sorted(CHAPTERS.items()):
        print(f"\nChapter {chapter_num}: pages {start+1}-{end+1}")
        entries = extract_chapter_images(doc, chapter_num, start, end)
        all_manifest.extend(entries)
        print(f"  Extracted {len(entries)} images")

    # Write manifest
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(all_manifest, f, indent=2)

    doc.close()

    print(f"\n{'='*50}")
    print(f"Total images extracted: {len(all_manifest)}")
    print(f"Manifest saved to: {manifest_path}")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()
