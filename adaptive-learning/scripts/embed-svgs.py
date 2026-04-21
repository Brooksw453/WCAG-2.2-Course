"""Insert image content blocks into the 12 sections that get diagrams.

Idempotent: if an image block with the same imageSrc already exists in a
section, it is skipped.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "chapters"

# (section_path, insert_after_block_index, image_block)
IMAGE_INSERTIONS = [
    ("ch01/sections/1.1.json", 0, {
        "type": "image",
        "title": "ADA Title II Digital Accessibility Timeline",
        "body": "",
        "imageSrc": "/images/ch01/title-ii-timeline.svg",
        "imageAlt": "Timeline showing three Title II milestones: the DOJ final rule published April 24, 2024; large public entities serving 50,000 or more people must comply by April 24, 2026; smaller public entities must comply by April 26, 2027. The required standard is WCAG 2.1 Level AA.",
        "imageCaption": "Title II compliance milestones at a glance — two deadlines, one required standard.",
    }),
    ("ch02/sections/2.1.json", 0, {
        "type": "image",
        "title": "The Four POUR Principles",
        "body": "",
        "imageSrc": "/images/ch02/pour-principles.svg",
        "imageAlt": "Two-by-two grid of the four WCAG principles. Perceivable asks whether every student can perceive the content; example violation: a syllabus logo with no alt text. Operable asks whether every student can navigate and interact; example violation: a drag-and-drop quiz keyboard users cannot complete. Understandable asks whether every student can comprehend the material; example violation: a vague attendance policy. Robust asks whether the material works with assistive technology; example violation: a scanned PDF syllabus a screen reader cannot read.",
        "imageCaption": "Every WCAG success criterion answers one of four POUR questions.",
    }),
    ("ch02/sections/2.3.json", 2, {
        "type": "image",
        "title": "The 60-Second Accessibility Scan",
        "body": "",
        "imageSrc": "/images/ch02/sixty-second-scan.svg",
        "imageAlt": "Five-item checklist you can run on any document in under a minute. One: do headings use real Heading styles? Two: does every meaningful image have alt text? Three: is link text descriptive on its own? Four: does body text meet 4.5:1 contrast? Five: can you navigate with Tab alone?",
        "imageCaption": "Five questions you can answer in under a minute on any document.",
    }),
    ("ch03/sections/3.2.json", 0, {
        "type": "image",
        "title": "Alt Text Decision Tree",
        "body": "",
        "imageSrc": "/images/ch03/alt-text-decision-tree.svg",
        "imageAlt": "Decision flowchart with four questions for writing alt text. If the image is purely decorative, use empty alt or mark decorative. If it is functional (a link or button), describe the action. If it is complex (chart, diagram, map), add a short alt plus a long description nearby. Otherwise write concise informative alt text describing what the image shows.",
        "imageCaption": "Four questions in order — the first 'yes' tells you what kind of alt text to write.",
    }),
    ("ch04/sections/4.1.json", 0, {
        "type": "image",
        "title": "Syllabus Accessibility Checklist",
        "body": "",
        "imageSrc": "/images/ch04/syllabus-checklist.svg",
        "imageAlt": "Ten-item checklist for syllabus accessibility, covering logo alt text, real heading styles, meeting times as text, descriptive link text, table header rows, an accessibility statement, visible DRC contact info, plain-text dates, color not being the only indicator, and saving in an accessible format. Plus a final verification step: run Microsoft Accessibility Checker, tab through the document, save with an accessible filename.",
        "imageCaption": "Ten checks, one Accessibility Checker run, one tab-through — about twenty minutes start to finish.",
    }),
    ("ch05/sections/5.1.json", 2, {
        "type": "image",
        "title": "Captioning Decision Tree",
        "body": "",
        "imageSrc": "/images/ch05/captioning-decision-tree.svg",
        "imageAlt": "Three-question flowchart for video captions. One: are captions present? If no, add them via auto-caption plus correction or a captioning service. Two: are captions accurate, under five percent errors? If no, fix via the YouTube editor or a service. Three: do captions include speaker labels and non-speech sounds? If no, enhance them. When all three are yes, the video is caption-ready.",
        "imageCaption": "Three questions for every video you assign — captions present, accurate, and complete.",
    }),
    ("ch05/sections/5.2.json", 1, {
        "type": "image",
        "title": "Audio Description Decision Tree",
        "body": "",
        "imageSrc": "/images/ch05/audio-description-decision-tree.svg",
        "imageAlt": "Three-question flowchart for audio description. One: does the video convey essential info visually that audio does not cover? If no, captions are sufficient. If yes, two: can you re-narrate to describe the visuals? If yes, re-record with self-describing narration. If no, three: add a separate audio description track via WebVTT or an alternate AD version. Result: meets WCAG AD requirements.",
        "imageCaption": "Most talking-head lectures don't need AD. Silent demos and visual experiments usually do.",
    }),
    ("ch06/sections/6.1.json", 0, {
        "type": "image",
        "title": "Question Type Accessibility Matrix",
        "body": "",
        "imageSrc": "/images/ch06/question-type-matrix.svg",
        "imageAlt": "Matrix showing how common quiz question types perform on keyboard, screen reader, and extended-time accommodations. Multiple choice, true or false, short answer, essay, dropdown matching, and button-based ordering are fully accessible. Fill-in-the-blank is mostly accessible with caveats. Drag-and-drop, hotspot or image-click, and drag-based ordering fail keyboard and should be replaced with alternatives.",
        "imageCaption": "Red = replace. Amber = verify in your LMS. Green = safe to use.",
    }),
    ("ch07/sections/7.2.json", 2, {
        "type": "image",
        "title": "Accommodation Escalation Decision Tree",
        "body": "",
        "imageSrc": "/images/ch07/escalation-decision-tree.svg",
        "imageAlt": "Flowchart for handling accommodation requests. One: is the accommodation documented in the DRC letter? If no, contact DRC for documentation. Two: can you implement it yourself? If no, contact DRC for guidance. Three: does it conflict with an essential course function? If yes, work with DRC on alternatives. If no, implement within 48 hours and confirm in writing with the student.",
        "imageCaption": "When in doubt, loop in DRC early — they answer fast and protect you legally.",
    }),
    ("ch08/sections/8.1.json", 0, {
        "type": "image",
        "title": "What Checkers Catch vs. What They Miss",
        "body": "",
        "imageSrc": "/images/ch08/checkers-catch-vs-miss.svg",
        "imageAlt": "Side-by-side comparison. Automated checkers catch missing alt text, obvious contrast failures, missing document language, empty table headers, missing heading structure, missing form labels, duplicate slide titles, scanned PDFs, and auto-playing media. They miss alt text quality, logical reading order, caption accuracy, keyboard operability, visible focus, meaningful link text, complex table semantics, whether color alone conveys info, audio description needs, and plain-language readability.",
        "imageCaption": "Automated tools catch the obvious 30–40%. The rest takes a five-minute manual pass.",
    }),
    ("ch08/sections/8.2.json", 1, {
        "type": "image",
        "title": "Semester-Start Accessibility Workflow",
        "body": "",
        "imageSrc": "/images/ch08/semester-start-workflow.svg",
        "imageAlt": "Six-step process to run before classes begin. Step one: audit syllabus (15 min). Step two: audit slide templates (45 min). Step three: run Accessibility Checker on all week-one materials (30 min). Step four: apply DRC accommodations in the LMS (15 min per student). Step five: verify video captions (10 min per video). Step six: monitor first quiz for issues (30 min). Total roughly two hours.",
        "imageCaption": "Two hours of work before classes start. Calendar-block it.",
    }),
    ("ch08/sections/8.3.json", 0, {
        "type": "image",
        "title": "Your 30-Day Action Plan",
        "body": "",
        "imageSrc": "/images/ch08/thirty-day-action-plan.svg",
        "imageAlt": "Four-week plan. Week 1: remediate next-semester syllabus end-to-end, the single most important fix. Weeks 2-3: broader remediation on one course — slide decks, handouts, video captions, replace drag-and-drop questions. Week 4: share one fix with a colleague and schedule a six-month follow-up review in your calendar.",
        "imageCaption": "One finishable plan beats a perfect one you never start.",
    }),
]


def main() -> int:
    inserted = 0
    skipped = 0
    for rel, after_idx, image_block in IMAGE_INSERTIONS:
        path = CONTENT / rel
        data = json.loads(path.read_text(encoding="utf-8"))
        blocks = data["contentBlocks"]

        # Idempotency: skip if we've already inserted this exact image
        if any(b.get("imageSrc") == image_block["imageSrc"] for b in blocks):
            print(f"  skip  {rel} (already has {image_block['imageSrc']})")
            skipped += 1
            continue

        blocks.insert(after_idx + 1, image_block)
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  ins   {rel} -> after block {after_idx} ({image_block['imageSrc']})")
        inserted += 1

    print(f"\nDone. {inserted} inserted, {skipped} skipped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
