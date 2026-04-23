"""Insert or update image content blocks for the 12 sections with diagrams.

Runs against BOTH content trees (adaptive-learning/content/ and
repo-root content/) so they stay in sync per CLAUDE.md.

If a section already has an image block with the same imageSrc, its title,
imageAlt, and imageCaption are updated in place (so copy tweaks here
propagate on re-run). Otherwise the block is inserted after the specified
index.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve()
ADAPTIVE_CONTENT = HERE.parent.parent / "content" / "chapters"
ROOT_CONTENT = HERE.parent.parent.parent / "content" / "chapters"
CONTENT_DIRS = [ADAPTIVE_CONTENT, ROOT_CONTENT]

# (section_path, insert_after_block_index, image_block)
IMAGE_INSERTIONS = [
    ("ch01/sections/1.1.json", 0, {
        "type": "image",
        "title": "ADA Title II Digital Accessibility Timeline",
        "body": "",
        "imageSrc": "/images/ch01/title-ii-timeline.svg",
        "imageAlt": "Timeline of three ADA Title II digital accessibility milestones: the Department of Justice rule published in April 2024, the April 2026 compliance deadline for public entities serving 50,000 or more people, and the April 2027 deadline for smaller entities. All must meet WCAG 2.1 Level AA.",
        "imageCaption": "Title II compliance milestones at a glance — two deadlines, one required standard.",
    }),
    ("ch02/sections/2.1.json", 0, {
        "type": "image",
        "title": "The Four POUR Principles",
        "body": "",
        "imageSrc": "/images/ch02/pour-principles.svg",
        "imageAlt": "Two-by-two grid of the four WCAG principles — Perceivable, Operable, Understandable, and Robust — each paired with a common classroom example of a failure. The first letters form the acronym POUR.",
        "imageCaption": "Every WCAG success criterion answers one of four POUR questions.",
    }),
    ("ch02/sections/2.3.json", 2, {
        "type": "image",
        "title": "The 60-Second Accessibility Scan",
        "body": "",
        "imageSrc": "/images/ch02/sixty-second-scan.svg",
        "imageAlt": "Five-item quick check for any document: real heading styles, alt text on meaningful images, descriptive link text, 4.5-to-1 contrast on body text, and tab-only keyboard navigation. A document that passes all five is mostly accessible.",
        "imageCaption": "Five questions you can answer in under a minute on any document.",
    }),
    ("ch03/sections/3.2.json", 0, {
        "type": "image",
        "title": "Alt Text Decision Tree",
        "body": "",
        "imageSrc": "/images/ch03/alt-text-decision-tree.svg",
        "imageAlt": "Decision flowchart with four questions — is the image decorative, functional, complex, or informative — each branching to a different alt-text strategy. The first 'yes' answer tells you which kind of alt text the image needs.",
        "imageCaption": "Four questions in order — the first 'yes' tells you what kind of alt text to write.",
    }),
    ("ch04/sections/4.1.json", 0, {
        "type": "image",
        "title": "Syllabus Accessibility Checklist",
        "body": "",
        "imageSrc": "/images/ch04/syllabus-checklist.svg",
        "imageAlt": "Ten syllabus-specific accessibility checks covering logos, headings, meeting times, links, tables, the accessibility statement, DRC contact info, color use, and file format, plus a final three-step verification using the Microsoft Accessibility Checker.",
        "imageCaption": "Ten checks, one Accessibility Checker run, one tab-through — about twenty minutes start to finish.",
    }),
    ("ch05/sections/5.1.json", 2, {
        "type": "image",
        "title": "Captioning Decision Tree",
        "body": "",
        "imageSrc": "/images/ch05/captioning-decision-tree.svg",
        "imageAlt": "Three-question flowchart for video captions: are captions present, are they accurate under five percent errors, and do they include speaker labels and non-speech sounds. A 'yes' to all three means the video is caption-ready.",
        "imageCaption": "Three questions for every video you assign — captions present, accurate, and complete.",
    }),
    ("ch05/sections/5.2.json", 1, {
        "type": "image",
        "title": "Audio Description Decision Tree",
        "body": "",
        "imageSrc": "/images/ch05/audio-description-decision-tree.svg",
        "imageAlt": "Three-question flowchart for audio description: does the video carry essential visual information, can you re-narrate it yourself, or do you need a separate description track. Most talking-head lectures skip AD entirely; silent demos usually need it.",
        "imageCaption": "Most talking-head lectures don't need AD. Silent demos and visual experiments usually do.",
    }),
    ("ch06/sections/6.1.json", 0, {
        "type": "image",
        "title": "Question Type Accessibility Matrix",
        "body": "",
        "imageSrc": "/images/ch06/question-type-matrix.svg",
        "imageAlt": "Matrix of ten common quiz question types rated on keyboard, screen reader, and extended-time access. Green types like multiple choice and essay are safe to use; amber types like fill-in-the-blank need LMS verification; red types like drag-and-drop and hotspot should be replaced.",
        "imageCaption": "Red = replace. Amber = verify in your LMS. Green = safe to use.",
    }),
    ("ch07/sections/7.2.json", 2, {
        "type": "image",
        "title": "Accommodation Escalation Decision Tree",
        "body": "",
        "imageSrc": "/images/ch07/escalation-decision-tree.svg",
        "imageAlt": "Flowchart for handling accommodation requests in three checks: the accommodation is documented in the DRC letter, you can implement it yourself, and it does not conflict with an essential course function. Any 'no' means loop in DRC.",
        "imageCaption": "When in doubt, loop in DRC early — they answer fast and protect you legally.",
    }),
    ("ch08/sections/8.1.json", 0, {
        "type": "image",
        "title": "What Checkers Catch vs. What They Miss",
        "body": "",
        "imageSrc": "/images/ch08/checkers-catch-vs-miss.svg",
        "imageAlt": "Two-column comparison of what automated accessibility checkers catch — missing alt text, contrast failures, missing document language, empty headers — versus what they miss: alt-text quality, reading order, caption accuracy, keyboard operability, and plain-language readability.",
        "imageCaption": "Automated tools catch the obvious 30–40%. The rest takes a five-minute manual pass.",
    }),
    ("ch08/sections/8.2.json", 1, {
        "type": "image",
        "title": "Semester-Start Accessibility Workflow",
        "body": "",
        "imageSrc": "/images/ch08/semester-start-workflow.svg",
        "imageAlt": "Six pre-semester steps: audit the syllabus, audit slide templates, run Accessibility Checker on week-one materials, apply DRC accommodations in the LMS, verify video captions, and monitor the first quiz. Total time is about two hours.",
        "imageCaption": "Two hours of work before classes start. Calendar-block it.",
    }),
    ("ch08/sections/8.3.json", 0, {
        "type": "image",
        "title": "Your 30-Day Action Plan",
        "body": "",
        "imageSrc": "/images/ch08/thirty-day-action-plan.svg",
        "imageAlt": "Four-week plan: week one remediate next semester's syllabus end-to-end, weeks two and three broaden remediation across one full course, and week four share one fix with a colleague and schedule a six-month follow-up review.",
        "imageCaption": "One finishable plan beats a perfect one you never start.",
    }),
]


UPDATE_FIELDS = ("title", "imageAlt", "imageCaption")


def process_tree(content_dir: Path) -> tuple[int, int, int]:
    inserted = updated = unchanged = 0
    if not content_dir.exists():
        return (0, 0, 0)
    for rel, after_idx, image_block in IMAGE_INSERTIONS:
        path = content_dir / rel
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        blocks = data["contentBlocks"]

        existing_idx = next(
            (i for i, b in enumerate(blocks) if b.get("imageSrc") == image_block["imageSrc"]),
            None,
        )

        if existing_idx is None:
            blocks.insert(after_idx + 1, image_block)
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"  ins   {path} -> after block {after_idx}")
            inserted += 1
            continue

        existing = blocks[existing_idx]
        changed = False
        for field in UPDATE_FIELDS:
            if existing.get(field) != image_block.get(field):
                existing[field] = image_block.get(field)
                changed = True
        if changed:
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"  upd   {path}")
            updated += 1
        else:
            unchanged += 1
    return (inserted, updated, unchanged)


def main() -> int:
    total_ins = total_upd = total_same = 0
    for tree in CONTENT_DIRS:
        print(f"Tree: {tree}")
        ins, upd, same = process_tree(tree)
        total_ins += ins
        total_upd += upd
        total_same += same
    print(f"\nDone. {total_ins} inserted, {total_upd} updated, {total_same} unchanged.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
