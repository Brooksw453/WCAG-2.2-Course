"""
Update Image Captions — replaces generic image captions with section-contextual ones.

Usage: python3 scripts/update-captions.py

Run this AFTER curate-images.py to improve caption quality.
No configuration needed — it reads section titles from the JSON files.
"""

import json
import os
import re
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(BASE_DIR, 'content', 'chapters')


def update_captions_for_file(filepath):
    """Update generic image captions with section-context-aware ones."""
    with open(filepath, 'r', encoding='utf-8') as f:
        section = json.load(f)

    section_title = section.get('title', '')
    modified = False
    img_num = 0

    for block in section.get('contentBlocks', []):
        if block.get('type') != 'image':
            continue

        img_num += 1
        page = ''
        # Extract page from existing caption
        if 'page' in block.get('imageCaption', ''):
            m = re.search(r'page (\d+)', block['imageCaption'])
            if not m:
                m = re.search(r'p\. (\d+)', block['imageCaption'])
            if m:
                page = m.group(1)

        # Generate contextual caption
        if section_title:
            caption = f"{section_title} — textbook illustration"
            if page:
                caption += f" (p. {page})"
            alt = f"Screenshot illustrating {section_title.lower()}"
        else:
            caption = block.get('imageCaption', '')
            alt = block.get('imageAlt', '')

        if caption != block.get('imageCaption') or alt != block.get('imageAlt'):
            block['imageCaption'] = caption
            block['imageAlt'] = alt
            block['title'] = caption
            modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(section, f, indent=2, ensure_ascii=False)

    return modified, img_num


def main():
    total_updated = 0
    total_images = 0

    section_files = sorted(glob.glob(os.path.join(CONTENT_DIR, 'ch*', 'sections', '*.json')))

    for filepath in section_files:
        updated, count = update_captions_for_file(filepath)
        total_images += count
        if updated:
            total_updated += 1

    print(f"Updated captions in {total_updated} section files ({total_images} images total)")


if __name__ == '__main__':
    main()
