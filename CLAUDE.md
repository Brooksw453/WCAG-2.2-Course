# WCAG 2.2 for Higher Ed — Project Guide

> **For Claude Code**: The course is built, deployed, and live. This file describes what exists, where it lives, and how to work with it. For the platform-level reference (every route, API, component, and migration), read `adaptive-learning/CLAUDE.md`.

---

## 1. Project Overview

A self-paced, faculty-focused WCAG 2.2 accessibility course built on the same Next.js adaptive-learning platform that powers the Entrepreneurship course. Content is original — no OER textbook source, no attribution needed.

- **Audience**: Faculty, instructional designers, CTL staff at public higher-ed institutions. Assumes zero technical background (no HTML, CSS, ARIA).
- **Length**: 4–6 hours, 8 modules, 21 sections, 3 assignments, 1 portfolio capstone.
- **Business model**: $99 individual, $39/seat at 10+, bundled free with Document Ally Pro institutional licenses (see `ES_Designs_Marketing_Strategy_v4.docx`).

---

## 2. Current Status — Live

| | |
|---|---|
| **Course app** | https://wcag-2-2-course.vercel.app (Vercel, auto-deploys from `main`) |
| **GitHub repo** | https://github.com/Brooksw453/WCAG-2.2-Course |
| **Dashboard slug** | `wcag-2-2-higher-ed` |
| **Dashboard URL** | https://courses.esdesigns.org/courses/wcag-2-2-higher-ed |
| **Tenant** | ES Designs (`dee02d2e-cc66-401c-8aa9-e1a778e1dc94`) |
| **Price** | Currently $0 for testing (originally $99) — flip back with `UPDATE courses SET price_cents = 9900, stripe_price_id = '<id>' WHERE slug = 'wcag-2-2-higher-ed';` |
| **Supabase** | Shared instance with other ES Designs courses (no per-course DB) |

---

## 3. Repo Layout

```
WCAG-2.2-Course/
├── CLAUDE.md                           ← this file (project-level)
├── WCAG-2.2-Course-Outline.md          ← module-by-section outline with LOs, key terms, quiz topics
├── Source-Reference-Guide.md           ← 70+ curated sources + image creation plan
├── content/                            ← authoring copy (canonical source of course content)
│   ├── chapters/chNN/                  ← 8 modules, 21 section JSONs, 21 gate quizzes, 8 discussions
│   └── assignments/                    ← 3 assignment JSONs
└── adaptive-learning/                  ← the Next.js app (deploys to Vercel)
    ├── CLAUDE.md                       ← platform reference (routes, APIs, components, DB schema)
    ├── content/                        ← runtime copy (mirrored from ../content/)
    │   ├── chapters/chNN/              ← same structure as ../content/chapters/
    │   └── assignments/                ← same as ../content/assignments/
    ├── public/images/chNN/             ← 12 original SVG diagrams (see §5)
    ├── scripts/embed-svgs.py           ← idempotent helper that inserts image content blocks
    ├── scripts/validate-content.ts     ← content validator — run after any JSON edit
    └── src/lib/course.config.ts        ← course branding + AI tutor role + capstone labels
```

**Important**: `content/` at the repo root and `adaptive-learning/content/` should stay in sync. When editing course content, edit both — or edit one and `cp -r` the other.

---

## 4. Content Inventory

All 8 modules are written, validated, deployed, and illustrated with original SVG diagrams.

| Module | Dir | Sections | Gate quizzes | Discussion | Diagram |
|--------|-----|----------|--------------|------------|---------|
| 1. Why Accessibility Matters | ch01 | 1.1, 1.2 | 2 (4 Qs) | ✓ | Title II Timeline (1.1) |
| 2. WCAG 2.2 Without the Jargon | ch02 | 2.1, 2.2, 2.3 | 3 (6 Qs) | ✓ | POUR (2.1), 60-Second Scan (2.3) |
| 3. Accessible Documents | ch03 | 3.1, 3.2, 3.3 | 3 (6 Qs) | ✓ | Alt Text Decision Tree (3.2) |
| 4. Accessible Course Materials | ch04 | 4.1, 4.2, 4.3 | 3 (6 Qs) | ✓ | Syllabus Checklist (4.1) |
| 5. Accessible Multimedia | ch05 | 5.1, 5.2 | 2 (4 Qs) | ✓ | Captioning Tree (5.1), AD Tree (5.2) |
| 6. Accessible Assessments & Quizzes | ch06 | 6.1, 6.2, 6.3 | 3 (6 Qs) | ✓ | Question Type Matrix (6.1) |
| 7. Working with Disability Services | ch07 | 7.1, 7.2 | 2 (4 Qs) | ✓ | Escalation Tree (7.2) |
| 8. Tools and Workflows | ch08 | 8.1, 8.2, 8.3 | 3 (6 Qs) | ✓ | Checkers Catch/Miss (8.1), Semester-Start (8.2), 30-Day Plan (8.3) |
| **Totals** | | **21 sections** | **21 quizzes / 42 Qs** | **8** | **12 SVGs** |

**Assignments** (all 4-section, 150 pts, with `context` + per-section `rubric` + `tips`):
- `assignment-1.json` → appears after Ch 3 — Audit & Fix Your Own Course Materials (self-assessment, syllabus audit, syllabus remediation, one additional document)
- `assignment-2.json` → appears after Ch 6 — Build Accessible Course Materials, Multimedia, Assessment (slide deck, multimedia audit, accessible quiz, keyboard test report)
- `assignment-3.json` → appears after Ch 8 — Accessibility Workflow & Action Plan (accommodation response plan, semester-start checklist, 30-day action plan, looking ahead)

Assignment placement is wired in `adaptive-learning/src/app/chapters/page.tsx` via `const assignmentAfterChapter: Record<number, number> = { 3: 1, 6: 2, 8: 3 };`.

---

## 5. SVG Diagrams (12 total)

All diagrams are hand-authored, accessible, and embedded directly in the relevant sections.

| # | File | Section | What it shows |
|---|------|---------|---------------|
| 1 | `ch01/title-ii-timeline.svg` | 1.1 | Title II compliance milestones: Apr 2024 rule → Apr 2026 large entity → Apr 2027 small entity |
| 2 | `ch02/pour-principles.svg` | 2.1 | Four POUR principles with example violations |
| 3 | `ch02/sixty-second-scan.svg` | 2.3 | 5-item quick accessibility check |
| 4 | `ch03/alt-text-decision-tree.svg` | 3.2 | Flowchart: decorative → functional → complex → informative |
| 5 | `ch04/syllabus-checklist.svg` | 4.1 | 10-item syllabus-specific checklist |
| 6 | `ch05/captioning-decision-tree.svg` | 5.1 | 3-question caption-readiness flowchart |
| 7 | `ch05/audio-description-decision-tree.svg` | 5.2 | 3-question AD flowchart |
| 8 | `ch06/question-type-matrix.svg` | 6.1 | 10 question types × keyboard/screen-reader/time matrix |
| 9 | `ch07/escalation-decision-tree.svg` | 7.2 | When to handle yourself vs. escalate to DRC |
| 10 | `ch08/checkers-catch-vs-miss.svg` | 8.1 | Side-by-side of what automated tools catch vs. miss |
| 11 | `ch08/semester-start-workflow.svg` | 8.2 | 6-step pre-semester workflow |
| 12 | `ch08/thirty-day-action-plan.svg` | 8.3 | 4-week post-course action plan |

**Style standards** (follow if adding more):
- 900px wide, white background (renders as a card in dark mode too)
- Real `<text>` elements — not rasterized, keeps content crisp at any zoom
- `role="img"` + `<title>` + `<desc>` for screen reader use when inlined
- Decorative shapes wrapped in `<g aria-hidden="true">`
- Semantic color palette: blue (facts), green (positive/action), amber (caution), purple (tech)
- 4.5:1+ contrast on every text element
- One-line footer takeaway in italic

To add/update images: drop the SVG in `adaptive-learning/public/images/chNN/`, add its entry to `adaptive-learning/scripts/embed-svgs.py`, and run `python scripts/embed-svgs.py` (idempotent — safe to re-run).

---

## 6. Customizations from the Template

Notable deviations from the stock `course-template`:

### `src/lib/course.config.ts`
- `title: "WCAG 2.2 for Higher Ed"`, `subtitle: "Accessible Course Materials for Faculty"`
- `textbook: { name: null, pdfFilename: null }` (original content)
- `capstone.route = "/portfolio"`, `navLabel = "Portfolio"`, capstone labels re-themed around accessibility journey
- `aiTutor.role = "a friendly accessibility specialist who has worked in higher-ed faculty development…"`
- `attribution.enabled = false`, string fields set to `""` rather than `null` — the template's `Attribution.tsx` uses the fields in JSX and `strict: true` in tsconfig rejects `null` even when `enabled: false` short-circuits the component. Empty strings preserve types without affecting runtime behavior.
- `COURSE_ID = 'wcag-2-2-higher-ed'`

### `src/app/chapters/page.tsx`
- `assignmentAfterChapter: Record<number, number> = { 3: 1, 6: 2, 8: 3 }` (swapped from the template's 4-assignment mapping).

### TTS / audio player upgrades (synced from Entrepreneurship repo)
Six files were carried over from `Brooksw453/Entrepreneurship/adaptive-learning/src/` because the stock template was behind on audio UX:

| File | What it adds |
|---|---|
| `src/hooks/useTextToSpeech.ts` | Echo as default voice; keepalive persists across section navigation for Bluetooth/CarPlay continuity |
| `src/components/TTSController.tsx` | Auto-starts playback when Listen is pressed (no separate Play step) |
| `src/lib/openaiTTSPlayer.ts` | Cleanup lifecycle rewrites — session only fully releases on explicit Close |
| `src/components/FreeTextPrompt.tsx` | Listen button at the top of every written response |
| `src/components/QuizGate.tsx` | Listen button at the top of every quiz gate |
| `src/app/chapter/[chapterId]/[sectionId]/SectionLearningFlow.tsx` | Listen button on the content step |

Result: **Listen button appears at the top of content, quiz, and written-response pages**. Echo is default. Pressing Listen auto-plays. Playback stops cleanly at the end of each section.

---

## 7. Working on the Course

### Edit content
1. Edit the JSON in `adaptive-learning/content/chapters/chNN/` (or `content/chapters/chNN/` — keep them in sync)
2. `cd adaptive-learning && npx tsx scripts/validate-content.ts` — must show 0 errors
3. `npm run build` — catches TypeScript issues the validator doesn't
4. Commit and push to `main` — Vercel auto-deploys in ~2 min

### Edit visuals
1. Edit the SVG in `adaptive-learning/public/images/chNN/`
2. If adding a new diagram: also add an entry to `scripts/embed-svgs.py` and run it
3. Validate + build + commit as above

### Preview locally
Pre-configured in `.claude/launch.json` (gitignored) — use the Claude Code Launch preview panel, or:
```bash
cd adaptive-learning
npm run dev    # autoPort enabled; will pick any free port if 3000 is taken
```
Without a local `.env.local`, most pages return 500 because Supabase isn't configured — that's expected for local work.

### Dev server env
Don't commit `.env.local`. Secrets live in Vercel Project Settings. Required env vars:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (optional, enables premium TTS voices), `DASHBOARD_SSO_SECRET`, `DASHBOARD_URL=https://courses.esdesigns.org`, `COURSE_SLUG=wcag-2-2-higher-ed`.

### Course Dashboard
Registration SQL was run once to link the course to the ES Designs tenant. If you ever need to re-run it (e.g., tenant change, price flip), the block lives in git history at commit `da65d4a`.

---

## 8. JSON Schemas (Quick Reference)

For the full schema + platform docs read `adaptive-learning/CLAUDE.md`. Short version:

- **Section files**: `sectionId`, `chapterId`, `title`, `learningObjectives[]`, `keyTerms[{term, definition}]`, `contentBlocks[{type: concept|example|summary|image, title?, body, imageSrc?, imageAlt?, imageCaption?}]`, `freeTextPrompt{id, prompt, minWords, rubric}`
- **Quiz files**: `sectionId`, `chapterId`, `questions[{id, question, options[{text, correct}], explanation}]`, `passThreshold: 80` (2 questions per quiz, 4 options each, exactly 1 correct)
- **Discussion files**: `chapterId`, `weekNum`, `title`, `prompt`, `requirements{initialPost, replies}`
- **Assignment files**: `assignmentId`, `title`, `points`, `description`, `relatedChapters[]`, `context{purpose, goals[], whatToExpect}`, `sections[{key, title, instructions, minWords, maxWords, rubric, tips[]}]`

---

## 9. Reference Documents

| File | Purpose |
|------|---------|
| `adaptive-learning/CLAUDE.md` | **Primary platform reference** — every route, API, component, hook, migration |
| `adaptive-learning/AGENTS.md` | Warning that Next.js 16 has breaking changes; read `node_modules/next/dist/docs/` before editing platform code |
| `WCAG-2.2-Course-Outline.md` | Detailed module-by-section outline with LOs, key terms, content block descriptions |
| `Source-Reference-Guide.md` | 70+ curated sources + the original image creation plan (12 diagrams now ✓) |
| `ES_Designs_Marketing_Strategy_v4.docx` | Business model, pricing, positioning |
