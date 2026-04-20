"""
Text Extraction Script — extracts text from the textbook PDF chapter by chapter.

Usage:
  python3 scripts/extract-text.py <chapter_number>
  python3 scripts/extract-text.py all

Requires: pip install PyMuPDF (or: python3 -m pip install PyMuPDF)

SETUP:
  1. Set PDF_FILENAME below to match your textbook filename
  2. Set CHAPTERS dict to map chapter numbers to (start_page, end_page) ranges
     Pages are 0-indexed for PyMuPDF (page 1 in the PDF = index 0)
     Find page ranges from the textbook's table of contents
"""

import fitz  # PyMuPDF
import os
import sys

# ============================================================
# CONFIGURE THESE FOR YOUR TEXTBOOK
# ============================================================

# Textbook PDF filename (must be in the parent directory of this repo)
PDF_FILENAME = "your-textbook.pdf"

# Chapter page ranges (0-indexed for PyMuPDF)
# Example: Chapter 1 starts on PDF page 7 (index 6) and ends on page 59 (index 58)
CHAPTERS = {
    # 1: (6, 58),
    # 2: (60, 133),
    # ... add all chapters
}

# ============================================================
# Script logic (no changes needed below)
# ============================================================

PDF_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        '..', PDF_FILENAME)
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          'scripts', 'extracted')


def extract_chapter(doc, chapter_num, start_page, end_page):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, f'ch{chapter_num:02d}-raw.txt')

    text_parts = []
    for page_num in range(start_page, min(end_page + 1, len(doc))):
        page = doc[page_num]
        text = page.get_text()
        text_parts.append(f"--- PAGE {page_num + 1} ---\n{text}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(text_parts))

    print(f"Chapter {chapter_num}: {len(text_parts)} pages -> {output_path}")
    return output_path


def main():
    if not CHAPTERS:
        print("ERROR: No chapters configured. Edit CHAPTERS dict in this script.")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: python3 scripts/extract-text.py <chapter_number|all>")
        sys.exit(1)

    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF not found at {PDF_PATH}")
        print(f"Make sure '{PDF_FILENAME}' is in the parent directory of this repo.")
        sys.exit(1)

    doc = fitz.open(PDF_PATH)

    if sys.argv[1] == 'all':
        for ch, (start, end) in sorted(CHAPTERS.items()):
            extract_chapter(doc, ch, start, end)
    else:
        ch = int(sys.argv[1])
        if ch not in CHAPTERS:
            print(f"Invalid chapter: {ch}. Available: {sorted(CHAPTERS.keys())}")
            sys.exit(1)
        start, end = CHAPTERS[ch]
        extract_chapter(doc, ch, start, end)

    doc.close()


if __name__ == '__main__':
    main()
