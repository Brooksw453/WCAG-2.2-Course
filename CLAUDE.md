# WCAG 2.2 for Higher Ed — Course Build Instructions

> **For Claude Code**: This file contains everything you need to build the complete adaptive learning course from the content in this repo and the course-template from the Entrepreneurship repo.

---

## 1. Project Overview

This is a self-paced, faculty-focused WCAG 2.2 accessibility course built on the same Next.js adaptive learning platform used by the Entrepreneurship course. The course content (8 modules, 21 sections, 42 quiz questions, 8 discussions, 3 assignments, and a capstone portfolio) has already been written as JSON files in the `content/` directory. Your job is to:

1. Fork the course platform from the Entrepreneurship repo's `course-template` directory
2. Drop the content into it
3. Customize the course configuration
4. Build the 3 remaining assignment JSON files
5. Validate everything works

---

## 2. Step-by-Step Build Instructions

### Step 1: Fork the Course Template

```bash
# Clone the Entrepreneurship repo temporarily
git clone https://github.com/Brooksw453/Entrepreneurship.git /tmp/entrepreneurship-source

# Copy ONLY the course-template directory (NOT the adaptive-learning directory — that contains the Workplace Software course content)
cp -r /tmp/entrepreneurship-source/course-template ./adaptive-learning

# Clean up
rm -rf /tmp/entrepreneurship-source
```

**IMPORTANT**: Read the `CLAUDE.md` inside the `adaptive-learning/` directory after copying — it contains the complete course creation template and platform documentation. Follow its instructions for any platform-level setup steps (dependencies, environment variables, database setup, etc.).

### Step 2: Copy Content Into the Platform

The `content/` directory in this repo contains all 8 modules of course content, already written and validated. Copy it into the platform's expected location:

```bash
# The platform expects content at adaptive-learning/content/
cp -r ./content/* ./adaptive-learning/content/
```

### Step 3: Customize course.config.ts

Locate `adaptive-learning/src/lib/course.config.ts` and update it with these values:

```typescript
export const courseConfig = {
  // Core identity
  title: "WCAG 2.2 for Higher Ed",
  subtitle: "Accessible Course Materials for Faculty",
  description: "A plain-English accessibility course built for faculty — not web developers. In 4–6 hours, faculty learn how to build accessible syllabi, slides, quizzes, and course materials. No crash-course in HTML or ARIA. Real examples from actual college classrooms. Completion certificate suitable for professional development credit.",

  // Textbook info — this course is ORIGINAL CONTENT, no external textbook
  textbook: {
    name: null,
    pdfFilename: null,
  },

  // Capstone configuration
  capstone: {
    enabled: true,
    title: "Accessible Course Materials Portfolio",
    route: "/portfolio",
    navLabel: "Portfolio",
    labels: {
      finalTitle: "Accessible Course Materials Portfolio",
      yourTitle: "Your Portfolio",
      compileDescription: "Compile your accessible course materials into a professional portfolio",
      previewButton: "Preview Portfolio",
      printButton: "Print Portfolio",
      assignmentTag: "Portfolio Component",
      summaryPrompt: "Reflect on your accessibility journey this course. What was your biggest 'aha' moment? How has your understanding of student experience changed? What will you do differently starting next semester?",
      summaryPlaceholder: "Write a reflective summary of your accessibility journey...",
      introPrompt: "Introduce your portfolio. What courses do you teach? What was your accessibility knowledge before this course? What motivated you to complete it?",
      introPlaceholder: "Introduce yourself and your motivation for this course...",
    },
  },

  // AI tutor role
  aiTutor: {
    role: "a friendly accessibility specialist who has worked in higher-ed faculty development and understands the realities of teaching loads, LMS frustrations, and Title II compliance pressure",
    tone: "warm, practical, and judgment-free — like a colleague who happens to know a lot about accessibility",
  },

  // Attribution — ORIGINAL CONTENT, no OER source
  attribution: {
    enabled: false,
    sourceTitle: null,
    sourceAuthors: null,
    sourceUrl: null,
    sourcePublisher: null,
    license: null,
    licenseUrl: null,
    accessLine: null,
    adaptedBy: "ES Designs",
    adaptationNote: "Original content created by ES Designs for the WCAG 2.2 for Higher Ed course.",
  },
};
```

### Step 4: Build the 3 Assignment Files

The content directory has the 8 modules but the assignments still need to be created. Create these 3 files in `content/assignments/`:

#### Assignment 1: `content/assignments/assignment-1.json`
- **Title**: "Audit and Fix Your Own Course Materials"
- **Points**: 150
- **relatedChapters**: [1, 2, 3]
- **Appears after**: Module 3
- **Sections** (4 parts):
  1. `accessibility-self-assessment` — "Accessibility Self-Assessment": Faculty reflect on their starting point — what they knew before the course, what surprised them, and which of their materials they suspect have issues. (minWords: 75, maxWords: 300)
  2. `syllabus-audit` — "Syllabus Accessibility Audit": Faculty run the 60-Second Scan AND the Microsoft Accessibility Checker on their syllabus. They report every issue found, categorize them by POUR principle, and explain what each issue means for students. (minWords: 100, maxWords: 400)
  3. `syllabus-remediation` — "Syllabus Remediation": Faculty fix every issue identified in the audit — headings, alt text, links, color, reading order. They describe each change made and why. Upload the fixed syllabus. (minWords: 100, maxWords: 400)
  4. `document-fix` — "Fix One Additional Document": Faculty choose one other document they use in teaching (handout, slide deck, PDF reading) and remediate it. They describe the issues found and fixes applied. (minWords: 100, maxWords: 400)
- **Context/goals**: Establish baseline awareness, apply Module 2-3 skills to real materials, produce a remediated syllabus for the portfolio.
- **Rubric for each section**: Should reference specific techniques from the course (heading styles, alt text decision tree, descriptive links, contrast ratios, Accessibility Checker).

#### Assignment 2: `content/assignments/assignment-2.json`
- **Title**: "Build Accessible Course Materials, Multimedia, and an Assessment"
- **Points**: 150
- **relatedChapters**: [4, 5, 6]
- **Appears after**: Module 6
- **Sections** (4 parts):
  1. `accessible-slide-deck` — "Accessible Slide Deck or Handout": Faculty rebuild one slide deck or handout for accessibility — built-in layouts, unique slide titles, alt text, reading order, contrast. Describe the changes. (minWords: 100, maxWords: 400)
  2. `multimedia-audit` — "Multimedia Accessibility Check": Faculty audit one video they use in their course for captions and audio description needs. Report: are captions present? Accurate? Does it need AD? What tool would they use to fix it? (minWords: 100, maxWords: 400)
  3. `accessible-quiz` — "Accessible Assessment": Faculty redesign one quiz or exam for accessibility — no drag-and-drop, keyboard testable, images have alt text, time settings accommodate extended time. Describe the original design, what changed, and why. (minWords: 100, maxWords: 400)
  4. `keyboard-test-report` — "Keyboard-Only Test Report": Faculty complete their redesigned quiz using only the keyboard (Tab, Enter, Space). Report what worked, what didn't, and any remaining issues. (minWords: 75, maxWords: 300)
- **Context/goals**: Apply Modules 4-6 skills to real materials, produce accessible versions for the portfolio, experience keyboard-only navigation firsthand.

#### Assignment 3: `content/assignments/assignment-3.json`
- **Title**: "Your Accessibility Workflow and Action Plan"
- **Points**: 150
- **relatedChapters**: [7, 8]
- **Appears after**: Module 8
- **Sections** (4 parts):
  1. `accommodation-response-plan` — "Accommodation Response Plan": Faculty write their plan for handling accommodation letters — step-by-step process, who to contact for questions, how to implement common accommodations in their LMS. Include their syllabus accessibility statement. (minWords: 100, maxWords: 400)
  2. `semester-start-checklist` — "Your Semester-Start Accessibility Checklist": Faculty create a personalized checklist they'll use each semester — specific steps, tools, estimated time per step. Must reference tools from Module 8. (minWords: 100, maxWords: 400)
  3. `thirty-day-action-plan` — "Your 30-Day Action Plan": Faculty write a concrete, week-by-week plan for the month after completing the course — what they'll fix, test, and share. (minWords: 100, maxWords: 400)
  4. `looking-ahead` — "Looking Ahead: Accessibility Beyond This Course": Faculty identify 2-3 resources they'll follow for ongoing learning, describe how they'll advocate for accessibility in their department, and set a goal for where they want to be in 6 months. (minWords: 75, maxWords: 300)
- **Context/goals**: Synthesize all course learning into actionable plans, create portfolio-ready workflow documents, prepare for ongoing accessibility practice.

**Follow the exact JSON schema from the Entrepreneurship course's assignment files** — including the `context` object with `purpose`, `goals`, and `whatToExpect` fields, and `rubric` strings for each section.

### Step 5: Configure Assignment Placement

In the dashboard/chapters page component (likely `src/app/chapters/page.tsx` or similar — check the Entrepreneurship course for the exact location), set the `assignmentAfterChapter` mapping:

```
Assignment 1 → after Chapter 3
Assignment 2 → after Chapter 6
Assignment 3 → after Chapter 8
```

### Step 6: Validate Content

Run the content validation script (if it exists in the template):
```bash
npx tsx scripts/validate-content.ts
```

If no validation script exists, verify:
- All 8 `meta.json` files reference the correct sections
- All 21 section files have valid JSON with the correct schema
- All 21 gate quiz files have exactly 2 questions each
- Question IDs are sequential: ch01-q01 through ch08-q06 (42 total)
- All 8 discussion.json files have valid structure
- All 3 assignment files follow the assignment schema

---

## 3. Content Summary

### What's Already Built (in `content/` directory)

| Module | Dir | Sections | Quizzes | Discussion | Words |
|--------|-----|----------|---------|------------|-------|
| 1. Why Accessibility Matters | ch01 | 1.1, 1.2 | 2 | ✅ | 2,447 |
| 2. WCAG 2.2 Without the Jargon | ch02 | 2.1, 2.2, 2.3 | 3 | ✅ | 3,170 |
| 3. Accessible Documents | ch03 | 3.1, 3.2, 3.3 | 3 | ✅ | 4,082 |
| 4. Accessible Course Materials | ch04 | 4.1, 4.2, 4.3 | 3 | ✅ | 3,732 |
| 5. Accessible Multimedia | ch05 | 5.1, 5.2 | 2 | ✅ | 3,851 |
| 6. Accessible Assessments & Quizzes | ch06 | 6.1, 6.2, 6.3 | 3 | ✅ | 3,528 |
| 7. Working with Disability Services | ch07 | 7.1, 7.2 | 2 | ✅ | 3,639 |
| 8. Tools and Workflows | ch08 | 8.1, 8.2, 8.3 | 3 | ✅ | 3,475 |
| **Totals** | | **21 sections** | **21 quizzes (42 Qs)** | **8** | **~27,900** |

### What Still Needs to Be Built

- [ ] 3 assignment JSON files (detailed specs in Step 4 above)
- [ ] course.config.ts customization (values provided in Step 3 above)
- [ ] Assignment placement mapping in the dashboard component

### What Does NOT Need to Be Built

- No textbook extraction (content is original, not adapted from OER)
- No image extraction scripts (no source textbook PDF)
- No OER attribution (original content by ES Designs)

---

## 4. Course Architecture Reference

### File Structure
```
content/
├── chapters/
│   ├── ch01/  (2 sections — Why Accessibility Matters)
│   ├── ch02/  (3 sections — WCAG 2.2 Without the Jargon)
│   ├── ch03/  (3 sections — Accessible Documents)
│   ├── ch04/  (3 sections — Accessible Course Materials)
│   ├── ch05/  (2 sections — Accessible Multimedia)
│   ├── ch06/  (3 sections — Accessible Assessments & Quizzes)
│   ├── ch07/  (2 sections — Working with Disability Services)
│   └── ch08/  (3 sections — Tools and Workflows)
└── assignments/
    ├── assignment-1.json  (After Module 3 — Audit & fix syllabus + document)
    ├── assignment-2.json  (After Module 6 — Accessible materials, multimedia, quiz)
    └── assignment-3.json  (After Module 8 — Workflow & action plan)
```

Each chapter directory contains:
```
chNN/
├── meta.json
├── sections/
│   ├── N.1.json
│   ├── N.2.json
│   └── N.3.json  (if applicable)
├── quizzes/
│   ├── gate-N.1.json
│   ├── gate-N.2.json
│   └── gate-N.3.json  (if applicable)
└── discussion.json
```

### JSON Schemas

**Section files** contain: sectionId, chapterId, title, learningObjectives, keyTerms (term + definition), contentBlocks (type: concept/example/summary with markdown body), freeTextPrompt (id, prompt, minWords, rubric).

**Quiz files** contain: sectionId, chapterId, questions (2 per quiz, 4 options each, exactly 1 correct), passThreshold: 80.

**Discussion files** contain: chapterId, weekNum, title, prompt, requirements (initialPost with word limits and due day, replies with count and word limits).

**Assignment files** contain: assignmentId, title, points, description, relatedChapters, context (purpose, goals, whatToExpect), sections (key, title, instructions, minWords, maxWords, rubric).

---

## 5. Additional Context

### Target Audience
Faculty, instructional designers, and CTL staff at public higher-ed institutions. The course assumes NO technical background — no HTML, CSS, ARIA, or web development knowledge. Every concept is explained in plain English with examples from real college classrooms.

### Business Context
This course is part of ES Designs' higher-ed accessibility product line. It's sold individually ($99), at departmental rates ($39/seat at 10+), and bundled free with institutional Document Ally Pro licenses (10 seats). It serves as both direct revenue and a cross-sell vehicle for Document Ally Pro. See `ES_Designs_Marketing_Strategy_v4.docx` for full business context.

### Platform Notes
- The platform is a Next.js app (App Router, React 19, TypeScript, Tailwind CSS 4) deployed on Vercel
- Backend: Supabase (PostgreSQL + Auth with SSO)
- AI: Claude API (Sonnet) for tutoring, quiz remediation, and assignment coaching
- The same Supabase instance supports multiple courses — this course will be registered alongside the Entrepreneurship course
- SSO is handled by a centralized Course Dashboard

### Reference Documents in This Repo
- `WCAG-2.2-Course-Outline.md` — The detailed module-by-section outline with learning objectives, key terms, content block descriptions, quiz topics, and image/source notes for every section
- `Source-Reference-Guide.md` — 70+ curated sources (with URLs) mapped to each section, plus key statistics and an image creation plan
