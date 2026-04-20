# WCAG 2.2 for Higher Ed — Detailed Course Outline

**Version:** Draft 1.0
**Date:** April 20, 2026
**Format:** Self-paced, 4–6 hours total
**Audience:** Faculty, instructional designers, CTL staff
**Platform:** courses.esdesigns.org (same Next.js adaptive learning platform as Entrepreneurship course)
**Content Format:** JSON files following the Entrepreneurship course architecture

---

## Course Architecture Overview

- **8 modules** (equivalent to "chapters" in the platform)
- **2–3 sections per module** (21 sections total)
- **Gate quiz per section** (2 questions each, 80% pass threshold)
- **Free-text prompt per section** (application-focused, faculty write about their own materials)
- **Discussion prompt per module** (8 total)
- **3 assignments** spaced across the course (after modules 3, 6, and 8)
- **Capstone:** Accessible Course Materials Portfolio

### Estimated Pacing

| Module | Sections | Est. Time | Running Total |
|--------|----------|-----------|---------------|
| 1. Why Accessibility Matters | 2 | 25 min | 25 min |
| 2. WCAG 2.2 Without the Jargon | 3 | 40 min | 1 hr 5 min |
| 3. Accessible Documents | 3 | 45 min | 1 hr 50 min |
| 4. Accessible Course Materials | 3 | 40 min | 2 hr 30 min |
| 5. Accessible Multimedia | 2 | 30 min | 3 hr |
| 6. Accessible Assessments & Quizzes | 3 | 40 min | 3 hr 40 min |
| 7. Working with Disability Services | 2 | 25 min | 4 hr 5 min |
| 8. Tools and Workflows | 3 | 35 min | 4 hr 40 min |

**Total: ~4 hr 40 min** (within the 4–6 hour target)

---

## Assignment Placement

| Assignment | After Module | Chapters Covered | Focus |
|------------|-------------|------------------|-------|
| Assignment 1 | Module 3 | 1–3 | Audit & fix your own syllabus and one document |
| Assignment 2 | Module 6 | 4–6 | Build accessible versions of course materials, multimedia, and a quiz |
| Assignment 3 | Module 8 | 7–8 | Create your personal accessibility workflow and action plan |

---

## Capstone: Accessible Course Materials Portfolio

Faculty compile their assignment work into a polished portfolio demonstrating they can produce accessible materials. Sections:

1. **Accessibility Self-Assessment** — Reflection on where they started and what they learned
2. **Remediated Syllabus** — Their actual syllabus, fixed and annotated (from Assignment 1)
3. **Accessible Slide Deck or Handout** — One course material rebuilt for accessibility (from Assignment 2)
4. **Accessible Assessment** — A quiz or exam redesigned for accessibility (from Assignment 2)
5. **Personal Accessibility Workflow** — Step-by-step process they'll follow each semester (from Assignment 3)
6. **Accommodation Response Plan** — How they'll handle accommodation letters going forward (from Assignment 3)

**Config labels:**
- `finalTitle`: "Accessible Course Materials Portfolio"
- `navLabel`: "Portfolio"
- `route`: "/portfolio"
- `compileDescription`: "Compile your accessible course materials into a professional portfolio"
- `summaryPrompt`: "Reflect on your accessibility journey this course. What was your biggest 'aha' moment? How has your understanding of student experience changed? What will you do differently starting next semester?"

---

## AI Tutor Configuration

```
role: "a friendly accessibility specialist who has worked in higher-ed faculty development and understands the realities of teaching loads, LMS frustrations, and Title II compliance pressure"
tone: "warm, practical, and judgment-free — like a colleague who happens to know a lot about accessibility"
```

---

## Module 1: Why Accessibility Matters in Higher Ed

**Module Learning Objectives:**
- Explain what ADA Title II requires of public higher-ed institutions
- Describe the real-world impact of inaccessible materials on students with disabilities
- Identify the compliance timeline and what it means for your institution
- Articulate the difference between accommodations and universal design

### Section 1.1: Title II in Plain English

**Learning Objectives:**
- Summarize the DOJ's ADA Title II final rule and what it requires
- Identify the compliance deadlines for large vs. small public entities
- Explain why digital accessibility is now a legal obligation, not just best practice

**Key Terms:**
- ADA Title II
- WCAG (Web Content Accessibility Guidelines)
- Digital accessibility
- Public entity
- Conformance level (A, AA, AAA)
- Undue burden (and why it's not the escape hatch people think)

**Content Blocks:**
1. `concept` — "What Title II Actually Says": The DOJ final rule in plain language. What changed in 2024. Why this isn't optional anymore. The two deadlines (April 2026 for large entities, April 2027 for small).
2. `concept` — "What This Means for Your Institution": Who is covered (all public colleges and universities). What must be accessible (websites, documents, course materials, LMS content). What "WCAG 2.1 AA conformance" means in practice.
3. `example` — "A Real Compliance Timeline": Walk through what a mid-size state university's compliance journey actually looks like — the audit, the remediation plan, the training mandate.
4. `summary`

**Gate Quiz Topics:**
- Q1: What conformance level does Title II require? (AA)
- Q2: Scenario — a faculty member says "my department is too small to worry about this." Is that correct under Title II?

**Free-Text Prompt:**
"Look up your own institution's accessibility policy or statement (most institutions have one linked from their website footer). Does it reference Title II, WCAG, or specific conformance levels? What did you find — or not find? What questions does this raise for you?"

> 📷 **Image opportunity:** Timeline infographic showing Title II deadlines, enforcement milestones
> 📚 **Source opportunity:** DOJ final rule summary, actual Title II regulatory text, OCR resolution agreements with universities

---

### Section 1.2: Real Student Stories That Stick

**Learning Objectives:**
- Describe at least three ways inaccessible materials create barriers for students
- Distinguish between visible and non-visible disabilities in the classroom context
- Explain why "just ask for accommodations" is not a sufficient institutional response

**Key Terms:**
- Screen reader
- Assistive technology
- Invisible/non-visible disability
- Universal Design for Learning (UDL)
- Accommodations vs. accessibility
- Barrier (in the accessibility context)

**Content Blocks:**
1. `concept` — "Who Are We Talking About?": The range of disabilities that intersect with digital course materials — vision, hearing, motor, cognitive, temporary, situational. The numbers: ~19% of undergraduates report a disability (NCES data).
2. `example` — "Four Students, Four Barriers": Composite case studies grounded in real patterns. A blind student whose PDF syllabus is a scanned image. A deaf student whose lecture videos have auto-captions full of errors. A student with ADHD whose course page has no heading structure. A student with a motor disability who can't complete a drag-and-drop quiz.
3. `concept` — "Accommodations vs. Accessibility": Why retrofitting accommodations one student at a time is more expensive and less effective than building accessible materials from the start. The "curb cut effect" — accessibility improvements that help everyone.
4. `summary`

**Gate Quiz Topics:**
- Q1: What percentage of undergraduates report a disability? (~19%)
- Q2: Scenario — distinguishing between an accommodation (reactive, individual) and accessibility (proactive, universal)

**Free-Text Prompt:**
"Think about your own courses. Have you ever had a student who struggled with your materials in a way that might have been an accessibility issue — even if it wasn't framed that way at the time? Describe the situation. Knowing what you know now, what might have helped?"

> 📷 **Image opportunity:** Diagram showing the spectrum of disabilities that affect digital content use; "curb cut effect" visual
> 📚 **Source opportunity:** NCES disability statistics, NFB or AHEAD student testimonials, UDL framework (CAST)

**Discussion Prompt (Module 1):**
"Share one thing about Title II compliance or student accessibility that surprised you in this module. Then describe one specific document or material in your current course that you suspect might have accessibility issues — and why you think so. (Don't worry about fixing it yet — that's coming.)"

---

## Module 2: WCAG 2.2 Without the Jargon

**Module Learning Objectives:**
- Explain the four WCAG principles (POUR) in plain language
- Identify which of the 13 new WCAG 2.2 criteria are most relevant to faculty work
- Recognize common WCAG violations in everyday course materials
- Use WCAG success criteria numbers to communicate about specific issues

### Section 2.1: The Four Principles — POUR

**Learning Objectives:**
- Define Perceivable, Operable, Understandable, and Robust in the context of course materials
- Give a faculty-relevant example of a violation for each principle
- Explain why these four categories cover virtually all accessibility issues

**Key Terms:**
- POUR (Perceivable, Operable, Understandable, Robust)
- Success criterion
- Sufficient technique
- Normative vs. informative (in WCAG)

**Content Blocks:**
1. `concept` — "The Four Questions Every Material Must Answer": Perceivable = Can every student perceive the content? Operable = Can every student navigate and interact? Understandable = Can every student comprehend? Robust = Does it work with assistive technology? Faculty-friendly framing for each.
2. `example` — "POUR in a Typical Syllabus": Take a single syllabus and show one violation per POUR principle — an image with no alt text (P), a table of links that can't be tabbed through (O), jargon-heavy policies with no glossary (U), a PDF that crashes a screen reader (R).
3. `concept` — "How WCAG Is Organized": Principles → Guidelines → Success Criteria → Techniques. Just enough structure so faculty can read a criterion number like "1.4.3" and know it's about Perceivable content. They don't need to memorize the tree — they need to navigate it.
4. `summary`

**Gate Quiz Topics:**
- Q1: Match a scenario to the correct POUR principle
- Q2: What does the "1" in success criterion 1.4.3 refer to? (Perceivable)

**Free-Text Prompt:**
"Pick one of the four POUR principles and find an example of a violation in your own course materials, your institution's website, or a website you use regularly. Describe what the violation is and which principle it falls under."

> 📷 **Image opportunity:** POUR principles diagram/infographic; annotated syllabus showing violations
> 📚 **Source opportunity:** W3C WCAG 2.2 overview page, WebAIM POUR explanation

---

### Section 2.2: The 13 New Criteria in WCAG 2.2

**Learning Objectives:**
- List the WCAG 2.2 success criteria that are new since 2.1
- Identify which new criteria most directly affect faculty-created materials
- Explain Focus Appearance, Dragging Movements, and Accessible Authentication in plain language

**Key Terms:**
- Focus indicator / focus appearance
- Dragging movements (alternative input)
- Accessible authentication
- Target size (minimum)
- Consistent help
- Redundant entry

**Content Blocks:**
1. `concept` — "What's New in 2.2": Overview of the 9 new success criteria added in WCAG 2.2 (note: some were removed between drafts). Why 2.2 was released (October 2023) and why it matters even though Title II references 2.1 AA. Institutions aiming for best practice target 2.2.
2. `concept` — "The Criteria That Matter Most for Faculty": Deep dive into the 4–5 criteria faculty are most likely to encounter: 2.4.11 Focus Appearance, 2.4.12 Focus Not Obscured, 2.5.7 Dragging Movements (think: drag-and-drop quiz questions), 2.5.8 Target Size Minimum (tiny clickable elements), 3.3.8 Accessible Authentication (CAPTCHAs and login flows).
3. `example` — "Drag-and-Drop Quizzes: A 2.2 Case Study": A common Canvas/Blackboard quiz type that violates 2.5.7. What a compliant alternative looks like. How to build the same assessment without drag-and-drop.
4. `summary`

**Gate Quiz Topics:**
- Q1: Which WCAG 2.2 criterion does a drag-and-drop matching quiz most likely violate? (2.5.7 Dragging Movements)
- Q2: True/False — Title II specifically requires WCAG 2.2 compliance (False — it requires 2.1 AA, but 2.2 is best practice)

**Free-Text Prompt:**
"Have you ever used a drag-and-drop quiz, a CAPTCHA, or another interactive element in your courses? Describe it. Based on what you've learned about WCAG 2.2, do you think it would pass or fail — and why?"

> 📷 **Image opportunity:** Table or visual comparing WCAG 2.0 → 2.1 → 2.2 additions; screenshot of a drag-and-drop quiz with annotations
> 📚 **Source opportunity:** W3C "What's New in WCAG 2.2" page, Deque or TPGi explainers on new criteria

---

### Section 2.3: Spotting WCAG Issues in Your Materials

**Learning Objectives:**
- Identify the 5 most common WCAG violations in faculty-created documents
- Use a simple mental checklist to evaluate any material for obvious issues
- Distinguish between issues you can fix yourself and issues that need technical help

**Key Terms:**
- Color contrast ratio
- Alternative text (alt text)
- Heading structure
- Link text (descriptive vs. "click here")
- Reading order

**Content Blocks:**
1. `concept` — "The Top 5 Issues (and Why They Keep Showing Up)": Missing alt text, poor heading structure, insufficient color contrast, non-descriptive link text, missing document language. These five account for the majority of document-level WCAG failures. Why they're so common — default tools don't enforce them.
2. `example` — "Before and After": Side-by-side examples of a faculty handout with all five issues, then the same handout with all five fixed. Concrete, visual, discipline-neutral.
3. `concept` — "The 60-Second Scan": A quick mental checklist any faculty member can run on any document: (1) Are there headings? (2) Do images have alt text? (3) Are links descriptive? (4) Is there enough color contrast? (5) Can I navigate without a mouse? What to do when you find an issue vs. when to escalate.
4. `summary`

**Gate Quiz Topics:**
- Q1: Which of these is an example of non-descriptive link text? ("Click here" vs. "Download the syllabus (PDF)")
- Q2: A faculty member uses red and green to distinguish required vs. optional readings. Which WCAG principle does this violate?

**Free-Text Prompt:**
"Run the '60-Second Scan' on one of your own documents — a syllabus, a handout, or a slide deck. Report what you found: which of the five checks passed, which failed, and what surprised you."

> 📷 **Image opportunity:** Before/after document comparison; the "60-Second Scan" checklist as a visual card
> 📚 **Source opportunity:** WebAIM Million report (most common failures), WebAIM contrast checker

**Discussion Prompt (Module 2):**
"You've now learned about POUR, the new WCAG 2.2 criteria, and the five most common document issues. Which single accessibility issue do you think is most widespread in your department's materials? Why do you think it persists — is it a knowledge gap, a tool limitation, or something else?"

---

## Module 3: Accessible Documents (Word, PDF, PowerPoint)

**Module Learning Objectives:**
- Apply correct heading structure to a Word document
- Write effective alt text for images in documents and slides
- Build accessible tables with proper header rows
- Create descriptive hyperlinks
- Check and fix reading order in PowerPoint
- Use the built-in Accessibility Checker in Microsoft Office

### Section 3.1: Headings, Structure, and Reading Order

**Learning Objectives:**
- Explain why heading structure matters for screen reader users
- Apply Heading 1, 2, 3 styles correctly in Word (not just bold/large text)
- Set and verify reading order in PowerPoint slides

**Key Terms:**
- Heading hierarchy (H1–H6)
- Semantic structure
- Reading order (in PowerPoint/PDF)
- Document outline
- Styles pane (in Word)

**Content Blocks:**
1. `concept` — "Why Headings Aren't Just Formatting": Screen readers use heading structure to navigate. Bold 14pt text is not a heading — it just looks like one. The difference between visual formatting and semantic structure. Why this is the single highest-impact fix for most documents.
2. `example` — "Fixing a Real Syllabus": Step-by-step walkthrough — take a syllabus that uses bold text for section titles, convert to proper Heading styles, show the resulting document outline. Before/after screen reader experience.
3. `concept` — "Reading Order in PowerPoint": Slides have a visual layout and a read order — they're often different. How to check reading order in PowerPoint's Selection Pane. Common gotchas: text boxes added out of order, decorative elements read aloud.
4. `summary`

**Gate Quiz Topics:**
- Q1: A document uses bold 16pt text for section titles instead of Heading styles. Is this accessible? (No — screen readers can't detect it as a heading)
- Q2: Where in PowerPoint do you check and fix reading order? (Selection Pane / Accessibility tab)

**Free-Text Prompt:**
"Open a Word document or PowerPoint file you use in your teaching. Check: are the headings using actual Heading styles, or just visual formatting (bold/large)? In PowerPoint, check the reading order in the Selection Pane. Report what you found."

> 📷 **Image opportunity:** Screenshot of Word Styles pane; PowerPoint Selection Pane reading order; before/after document outline
> 📚 **Source opportunity:** Microsoft Office accessibility documentation, WebAIM document accessibility guides

---

### Section 3.2: Alt Text, Images, and Tables

**Learning Objectives:**
- Write concise, meaningful alt text for different types of images (photos, charts, diagrams, decorative)
- Mark decorative images correctly so screen readers skip them
- Build accessible data tables with header rows and avoid using tables for layout

**Key Terms:**
- Alternative text (alt text)
- Decorative image
- Complex image (charts, diagrams)
- Long description
- Table header row
- Layout table vs. data table

**Content Blocks:**
1. `concept` — "The Art of Alt Text": What alt text is and who relies on it. The decision tree: Is it decorative? Mark as decorative. Is it a simple image? Write a concise description. Is it a complex chart or diagram? Provide a summary plus a long description. Common mistakes: "image of...", filename as alt text, alt text that's too long or too vague.
2. `example` — "Alt Text in Different Disciplines": Examples from STEM (a chemistry diagram), humanities (a historical photograph), social sciences (a bar chart of survey data). Shows how context changes what good alt text looks like.
3. `concept` — "Tables That Work": When to use a table (data) vs. when not to (layout). How to designate a header row in Word/PowerPoint. Why merged cells cause screen reader problems. Simple rules: keep tables simple, always declare headers, avoid nested tables.
4. `summary`

**Gate Quiz Topics:**
- Q1: Which alt text is best for a bar chart showing student enrollment by year? (One that summarizes the trend, not "bar chart" or the raw data)
- Q2: A faculty member uses a table to lay out their office hours in a two-column format. What's the accessibility concern?

**Free-Text Prompt:**
"Find three images in your course materials. Write alt text for each one, explaining your reasoning. If any are decorative, explain why you'd mark them that way instead of writing alt text."

> 📷 **Image opportunity:** Alt text decision tree flowchart; examples of good vs. bad alt text; accessible vs. inaccessible table comparison
> 📚 **Source opportunity:** W3C alt text decision tree, WebAIM alt text guide, Diagram Center guidelines for complex images

---

### Section 3.3: Links, Color, and the Accessibility Checker

**Learning Objectives:**
- Convert "click here" and bare URLs into descriptive hyperlinks
- Check color contrast ratios and avoid using color as the sole conveyor of meaning
- Run the built-in Accessibility Checker in Word, PowerPoint, and Acrobat
- Interpret checker results and know which issues to fix first

**Key Terms:**
- Descriptive link text
- Color contrast ratio (4.5:1 for normal text, 3:1 for large)
- Color as sole indicator
- Microsoft Accessibility Checker
- Adobe Acrobat Accessibility Checker
- PDF tags

**Content Blocks:**
1. `concept` — "Links That Make Sense": Why "click here" and bare URLs fail. How screen reader users navigate by pulling up a list of links — if they all say "click here," the list is useless. How to write link text that works in context and out of context.
2. `concept` — "Color Contrast and Color Meaning": The 4.5:1 contrast ratio requirement and how to check it. Why "red means required" fails if a colorblind student can't see red. Always pair color with another indicator (bold, asterisk, icon).
3. `example` — "Running the Checker — What You'll See": Walk through the Microsoft Accessibility Checker on a real Word document. Show what the results panel looks like, how to interpret errors vs. warnings vs. tips, and how to fix the top three most common findings.
4. `concept` — "PDF Accessibility: The Hard Truth": Why "Save as PDF" doesn't guarantee an accessible PDF. What PDF tags are and why they matter. When to use Adobe Acrobat's checker. When to ask for help (scanned PDFs, complex forms).
5. `summary`

**Gate Quiz Topics:**
- Q1: What is the minimum color contrast ratio for normal-sized text under WCAG? (4.5:1)
- Q2: A faculty member exports a Word doc to PDF. Is the PDF automatically accessible? (Not necessarily — depends on whether the Word doc was structured correctly and how it was exported)

**Free-Text Prompt:**
"Run the Microsoft Accessibility Checker on one of your Word documents or PowerPoint files. List the top three issues it found. For each, describe whether you know how to fix it based on what you've learned in this module."

> 📷 **Image opportunity:** Screenshots of Accessibility Checker panel in Word and PowerPoint; color contrast comparison examples; descriptive vs. non-descriptive links side by side
> 📚 **Source opportunity:** WebAIM contrast checker tool, Microsoft accessibility checker documentation, Adobe Acrobat accessibility guide

**Discussion Prompt (Module 3):**
"You've now audited your own document and run the Accessibility Checker. What was the most common issue in your materials? Share one before/after fix you made (or plan to make). Did anything about the process surprise you — easier or harder than expected?"

---

## Module 4: Accessible Course Materials

**Module Learning Objectives:**
- Apply accessibility principles to syllabi, handouts, slides, and assigned readings
- Identify discipline-specific accessibility challenges and solutions
- Evaluate third-party materials (textbook publisher content, OER) for accessibility
- Build a simple accessibility checklist for course material review

### Section 4.1: Syllabi and Handouts

**Learning Objectives:**
- Identify the most common accessibility failures in syllabi
- Apply a syllabus accessibility checklist covering structure, links, tables, and language
- Make handouts accessible regardless of discipline

**Key Terms:**
- Syllabus accessibility checklist
- Plain language
- Readability level
- Document properties (title, author, language)

**Content Blocks:**
1. `concept` — "The Syllabus: Your Most-Read Document": Why the syllabus is the single most important accessibility target. Common failures: scanned PDFs, no headings, schedule tables without headers, "click here" links to policies, no alt text on logos/department images.
2. `example` — "A Syllabus Makeover": Side-by-side comparison of a real-format syllabus (anonymized) before and after accessibility remediation. Show every change and explain the rationale.
3. `concept` — "Handouts That Work for Everyone": Applying the same principles to shorter documents. Special considerations: worksheets with fill-in blanks (how do screen readers handle them?), handouts with heavy formatting, discipline-specific materials (music scores, mathematical notation, lab protocols).
4. `summary`

**Gate Quiz Topics:**
- Q1: Which of these is the single highest-impact accessibility fix for most syllabi? (Adding proper heading structure)
- Q2: A handout uses a form field for students to "fill in the blank." What accessibility concern should the faculty member consider?

**Free-Text Prompt:**
"Using the syllabus accessibility checklist from this section, audit your own syllabus (or a course handout if you don't have a syllabus handy). List three specific changes you would make and explain why each one matters."

> 📷 **Image opportunity:** Annotated syllabus before/after; syllabus accessibility checklist as a visual card
> 📚 **Source opportunity:** AHEAD syllabus accessibility guide, institution-specific examples (anonymized)

---

### Section 4.2: Slides and Presentations

**Learning Objectives:**
- Build accessible slides using built-in layouts (not blank slides with text boxes)
- Apply slide-specific accessibility practices: alt text, reading order, transitions, speaker notes
- Recognize when a slide deck needs a companion document

**Key Terms:**
- Slide layout (vs. blank slide)
- Slide master
- Speaker notes as alternative format
- Animation and transition accessibility
- Unique slide titles

**Content Blocks:**
1. `concept` — "Why 'Death by PowerPoint' Is Also an Accessibility Problem": Overcrowded slides fail everyone, but especially assistive technology users. The case for simple slides with built-in layouts. Why every slide needs a unique title (even if you hide it visually). How slide masters enforce consistency and accessibility.
2. `example` — "The Blank Slide Trap": A faculty member builds beautiful slides by placing text boxes, images, and shapes on blank layouts. It looks great — but a screen reader reads the elements in random order. Show the Selection Pane reading order and how to fix it.
3. `concept` — "When Slides Need a Companion": Highly visual presentations (architecture, design, art history) may need a companion document or detailed speaker notes. How to provide equivalent content without rebuilding the entire presentation. When to offer slides in advance.
4. `summary`

**Gate Quiz Topics:**
- Q1: Why should you use built-in slide layouts instead of placing text boxes on blank slides? (Reading order, semantic structure)
- Q2: A faculty member's slides use animations that auto-advance every 5 seconds. What accessibility issue does this create?

**Free-Text Prompt:**
"Open one of your slide decks and check: (1) Are you using built-in layouts or blank slides with text boxes? (2) Does every slide have a unique title? (3) Check the reading order in the Selection Pane for one slide. Report your findings."

> 📷 **Image opportunity:** Side-by-side of built-in layout vs. blank-slide-with-text-boxes; Selection Pane reading order
> 📚 **Source opportunity:** Microsoft accessible presentations guide, University of Washington DO-IT

---

### Section 4.3: Readings, OER, and Third-Party Content

**Learning Objectives:**
- Evaluate whether assigned readings (PDFs, e-texts, OER) are accessible
- Know what to do when a publisher's content is not accessible
- Understand the Chafee Amendment and library accommodations for copyrighted materials

**Key Terms:**
- Born-digital vs. scanned PDF
- OCR (Optical Character Recognition)
- Chafee Amendment
- Publisher accessibility (VPAT/ACR)
- Voluntary Product Accessibility Template (VPAT)
- Alternative format request

**Content Blocks:**
1. `concept` — "Not All PDFs Are Created Equal": The difference between born-digital PDFs (usually remediable) and scanned image PDFs (need OCR first). How to tell the difference. Why course packs and legacy readings are the biggest problem area for most faculty.
2. `example` — "Evaluating a Textbook Publisher's Accessibility": How to ask for a VPAT/Accessibility Conformance Report. What to look for. Real examples of publisher accessibility statements (good and bad). What to do when the textbook is inaccessible: escalate to your institution's accessibility office, request alternative formats, consider OER alternatives.
3. `concept` — "OER and Library Resources": Why OER accessibility varies wildly. How to evaluate OER before adopting it. The Chafee Amendment: what it allows for students with print disabilities. How your library can help with alternative format requests.
4. `summary`

**Gate Quiz Topics:**
- Q1: How can you quickly tell if a PDF is a scanned image or a born-digital document? (Try to select/search text)
- Q2: What document should you request from a textbook publisher to evaluate their product's accessibility? (VPAT/Accessibility Conformance Report)

**Free-Text Prompt:**
"Identify one reading you assign that is a PDF. Is it born-digital or scanned? If you're not sure, try selecting the text. Then look at the publisher or source — do they have an accessibility statement or VPAT? Report what you found and what questions it raised."

> 📷 **Image opportunity:** Born-digital vs. scanned PDF comparison; sample VPAT excerpt
> 📚 **Source opportunity:** VPAT repository (ITIC), Chafee Amendment summary, OER accessibility guidance (BCcampus Open Education Accessibility Toolkit)

**Discussion Prompt (Module 4):**
"What is the most challenging course material in your discipline from an accessibility standpoint — and why? Is it highly visual content, mathematical notation, a legacy scanned document, or something else? How would you approach making it more accessible based on what you've learned?"

---

## Module 5: Accessible Multimedia

**Module Learning Objectives:**
- Determine when captions, transcripts, and audio descriptions are required vs. recommended
- Evaluate the quality of auto-generated captions and edit them effectively
- Apply accessibility principles to video, audio, and interactive media in courses

### Section 5.1: Captions and Transcripts

**Learning Objectives:**
- Distinguish between open captions, closed captions, and transcripts
- Explain when captions are required (pre-recorded, live, audio-only)
- Evaluate auto-generated captions for accuracy and edit common errors
- Identify tools for captioning faculty-created video content

**Key Terms:**
- Closed captions vs. open captions
- Transcript
- Auto-generated captions (ASR)
- Caption accuracy rate
- Synchronous (live) captioning
- CART (Communication Access Realtime Translation)

**Content Blocks:**
1. `concept` — "Captions, Transcripts, and the Law": When captions are legally required under Title II. The difference between captions (synchronized with video) and transcripts (standalone text). Why auto-captions alone don't satisfy compliance — the accuracy threshold and the problem of technical vocabulary, proper nouns, and accented speech.
2. `example` — "Auto-Captions Gone Wrong": Real (anonymized) examples of auto-caption failures in academic contexts — organic chemistry terms, Spanish-language content, a professor with an accent. Shows why editing is essential, not optional.
3. `concept` — "Practical Captioning Workflow": Tools faculty can actually use: YouTube Studio's caption editor, Otter.ai, Microsoft Stream, Zoom auto-transcription. A decision tree: did you record it yourself? → use [tool]. Is it a publisher video? → check for captions, request if missing. Is it a live session? → plan for CART or live auto-captions.
4. `summary`

**Gate Quiz Topics:**
- Q1: Are auto-generated captions sufficient for WCAG compliance without review? (No — accuracy must be verified)
- Q2: What is the difference between a caption and a transcript? (Captions are synchronized with video; transcripts are standalone text)

**Free-Text Prompt:**
"Do you use video in your courses — your own recordings or publisher/YouTube content? Check one video for captions. If captions exist, evaluate the first 2 minutes for accuracy. If no captions exist, describe what captioning tool you would use and why."

> 📷 **Image opportunity:** Side-by-side of accurate vs. auto-caption failures; captioning tool comparison chart
> 📚 **Source opportunity:** FCC caption quality standards, 3PlayMedia captioning guides, DCMP captioning key

---

### Section 5.2: Audio Descriptions and Interactive Media

**Learning Objectives:**
- Explain what audio descriptions are and when they're required
- Determine whether multimedia content in courses needs audio descriptions
- Apply accessibility principles to embedded media, simulations, and interactive content

**Key Terms:**
- Audio description
- Extended audio description
- Media alternative (text-based)
- Interactive content accessibility
- Keyboard trap

**Content Blocks:**
1. `concept` — "Audio Descriptions: What Faculty Need to Know": What audio descriptions are (narration of visual-only information during pauses in dialogue). When they're required under WCAG (pre-recorded video with visual information not conveyed through audio). The practical reality: most faculty videos (talking head + slides) don't need AD if the slides are described verbally. The ones that do: science demonstrations, art history lectures, medical procedures.
2. `example` — "Does This Video Need Audio Description?": Decision tree with four real examples — a lecture capture (usually no), a chemistry lab demo (yes), a documentary film (yes), a screen recording with voiceover (usually no if narrated well). How to provide AD or an equivalent alternative (detailed transcript).
3. `concept` — "Interactive Media and Embeds": Third-party content embedded in your LMS (H5P, PhET simulations, publisher interactive modules). How to evaluate: can it be used with keyboard only? Does it work with a screen reader? What to do when it doesn't: contact the publisher, find an alternative, provide an equivalent exercise.
4. `summary`

**Gate Quiz Topics:**
- Q1: A faculty member records a lecture where they describe every slide as they present it. Does this video require a separate audio description? (Generally no — the visual content is being narrated)
- Q2: What's the first thing to test when evaluating an interactive simulation for accessibility? (Can it be operated with keyboard only?)

**Free-Text Prompt:**
"Think about the multimedia content in your courses — videos, simulations, interactive elements. Pick one and evaluate it: does it have captions? Would it need audio descriptions? Can it be navigated by keyboard? Describe what you found and any gaps."

> 📷 **Image opportunity:** Audio description decision tree; keyboard navigation test illustration
> 📚 **Source opportunity:** W3C multimedia accessibility FAQ, DCMP audio description guidelines, National Center on Accessible Media

**Discussion Prompt (Module 5):**
"Multimedia accessibility can feel like the most daunting part of compliance. What is the one multimedia accessibility issue in your courses that you think will be hardest to solve — and what resources or support would make it easier? Respond to a colleague's post with a suggestion or shared experience."

---

## Module 6: Accessible Assessments and Quizzes

**Module Learning Objectives:**
- Build quizzes in Canvas/Blackboard that work with screen readers and keyboard navigation
- Design assessments that are valid for students using extended time or assistive technology
- Avoid common assessment patterns that create accessibility barriers
- Apply WCAG 2.2 requirements (especially Dragging Movements) to quiz design

### Section 6.1: Quiz Design for Screen Readers and Keyboards

**Learning Objectives:**
- Identify quiz question types that work well with assistive technology
- Avoid question types and patterns that create barriers (drag-and-drop, image-based matching without alt text, timed auto-submit)
- Build accessible quizzes in Canvas and/or Blackboard

**Key Terms:**
- Keyboard navigation (in quizzes)
- Focus management
- ARIA roles (quiz context)
- Auto-submit timer
- Question type accessibility matrix

**Content Blocks:**
1. `concept` — "Which Question Types Work?": Multiple choice, true/false, short answer, and essay questions generally work well with assistive technology. Drag-and-drop, hotspot, image-based matching, and fill-in-the-blank (depending on implementation) often do not. A practical matrix of question types × accessibility.
2. `example` — "The Same Assessment, Two Ways": A matching quiz built with drag-and-drop in Canvas, then rebuilt as a dropdown-matching question. Both test the same knowledge; one is accessible, one isn't. Step-by-step in Canvas (with notes for Blackboard).
3. `concept` — "Keyboard Navigation and Focus": What it means to navigate a quiz by keyboard only. The Tab key, Enter/Space for selection, and why focus must be visible. How to test your own quizzes with keyboard only (a 2-minute check you can run every time).
4. `summary`

**Gate Quiz Topics:**
- Q1: Which quiz type is most likely to create accessibility barriers? (Drag-and-drop matching)
- Q2: How can a faculty member quickly test whether their quiz is keyboard-accessible? (Try completing it using only the Tab, Enter, and Space keys)

**Free-Text Prompt:**
"Open one of your existing quizzes in your LMS. Try navigating it using only your keyboard (Tab, Enter, Space — no mouse). Report what happened: could you complete every question? Where did you get stuck?"

> 📷 **Image opportunity:** Question type accessibility matrix; Canvas quiz builder showing drag-and-drop vs. dropdown matching
> 📚 **Source opportunity:** Canvas accessibility documentation, Blackboard Ally documentation, QAA accessible assessment guidelines

---

### Section 6.2: Extended Time, Accommodations, and Assessment Validity

**Learning Objectives:**
- Configure extended time accommodations correctly in your LMS
- Design timed assessments that remain valid for students with extended time
- Avoid assessment designs that penalize accommodation use

**Key Terms:**
- Extended time (time-and-a-half, double time)
- Accommodation flag (in LMS)
- Assessment validity
- Testing center / proctoring accommodations
- Reduced distraction environment

**Content Blocks:**
1. `concept` — "Setting Up Extended Time Correctly": Step-by-step for Canvas and Blackboard: where to set individual student accommodations, how multipliers work, common mistakes (setting extra time on one quiz but not the final). Why you should set accommodations at the student level, not the quiz level, when your LMS supports it.
2. `example` — "When Extended Time Breaks Your Design": Scenario: a faculty member designs a 50-question, 50-minute quiz with an auto-submit timer. A student with double time gets 100 minutes — but the quiz locks after the class period ends at 75 minutes. How to avoid this. Best practices: generous base time, no hard end-time lockouts, multi-day windows.
3. `concept` — "Proactive Assessment Design": Build assessments that work for everyone from the start. Strategies: untimed or generous-time quizzes, chunked assessments (three 20-minute quizzes vs. one 60-minute exam), take-home or project-based alternatives, and how these align with UDL principles.
4. `summary`

**Gate Quiz Topics:**
- Q1: In Canvas, where should you set extended time — on each quiz individually or at the student level? (Student level, when available, to avoid missing one)
- Q2: Scenario — A quiz auto-submits at a fixed clock time. Why does this create an accommodation problem?

**Free-Text Prompt:**
"Review how you currently set up timed assessments. Do you use auto-submit? Do your time windows accommodate extended time? Describe one change you could make to your assessment setup that would be more proactively accessible."

> 📷 **Image opportunity:** Canvas accommodation settings screenshot; timeline diagram showing extended-time collision with fixed end time
> 📚 **Source opportunity:** Canvas/Blackboard accommodation documentation, CAST UDL assessment guidelines

---

### Section 6.3: Accessible Assessment Content

**Learning Objectives:**
- Write quiz questions with accessible formatting (images, math, tables in questions)
- Provide alt text for images used in quiz questions
- Handle mathematical notation, scientific formulas, and other specialized content in assessments

**Key Terms:**
- MathML / LaTeX (in quiz context)
- Image-based question
- Accessible equation editor
- Answer choice formatting

**Content Blocks:**
1. `concept` — "Images in Quiz Questions": When you use an image in a quiz question (a graph, a diagram, a photo), it needs alt text just like in a document — but quiz builders don't always make this obvious. How to add alt text in Canvas quiz editor and Blackboard. When an image is essential (a chart-reading question) vs. decorative (a stock photo next to a question).
2. `example` — "A STEM Quiz, Made Accessible": A chemistry or math quiz with molecular diagrams, equations, and a data table. Show how to provide alt text for the diagram, use MathML/LaTeX for equations (not images of equations), and format the data table accessibly within the quiz builder.
3. `concept` — "Specialized Content in Assessments": Music, art, foreign languages, and other disciplines with non-text content in assessments. Practical approaches: text-based descriptions of visual stimuli, audio clips with transcripts for music courses, extended-time considerations for language assessments. When to partner with Disability Services for specialized accommodations.
4. `summary`

**Gate Quiz Topics:**
- Q1: You include a graph in a quiz question asking students to interpret a trend. What must you add? (Alt text describing the graph, or a long description)
- Q2: Why should mathematical equations in quizzes use MathML or LaTeX rather than images? (Screen readers can read MathML/LaTeX; they cannot read an image of an equation)

**Free-Text Prompt:**
"If you use any images, graphs, equations, or specialized content in your assessments, describe how you currently include them. Based on what you've learned, would a student using a screen reader be able to answer those questions? What changes would you make?"

> 📷 **Image opportunity:** Canvas quiz editor with alt text field highlighted; equation rendered as image vs. MathML
> 📚 **Source opportunity:** Canvas rich content editor accessibility, MathJax accessibility documentation, Benetech DIAGRAM Center

**Discussion Prompt (Module 6):**
"Try the keyboard-only quiz test on one of your own assessments and share what happened. If you don't have a quiz readily available, try it on any web form or interactive page. What did you learn about the experience of navigating without a mouse?"

---

## Module 7: Working with Disability Services

**Module Learning Objectives:**
- Respond appropriately and confidently to accommodation letters
- Build a proactive relationship with your Disability Services office
- Avoid the most common accessibility-related grievances and complaints
- Know when to handle a situation yourself vs. escalate to DS

### Section 7.1: Accommodation Letters and Faculty Responsibilities

**Learning Objectives:**
- Explain what an accommodation letter is and what it legally requires of you
- Implement common accommodations (extended time, note-takers, alternative formats) correctly
- Identify what accommodation letters do NOT require (modifying essential course requirements)

**Key Terms:**
- Accommodation letter
- Disability Services (DS) / Office of Accessibility
- Essential course requirements / fundamental alteration
- Interactive process
- Confidentiality (what you can and cannot ask)

**Content Blocks:**
1. `concept` — "What the Letter Says and What It Means": Anatomy of a typical accommodation letter. What faculty must do (implement the listed accommodations), what faculty may do (discuss implementation details with DS), and what faculty must not do (ask about the student's diagnosis, refuse accommodations, publicly identify the student).
2. `example` — "Five Common Accommodations and How to Implement Them": Extended time on exams (LMS setup), note-taking assistance (how to arrange without outing the student), alternative format for materials (who provides this — you or the library/DS office?), preferential seating (easy), recorded lectures (when and how).
3. `concept` — "What Accommodations Don't Require": The 'fundamental alteration' standard. You are not required to remove essential course requirements. If a learning objective requires oral presentation, you're not required to waive it — but you may need to allow a different modality. When you disagree with an accommodation: the interactive process with DS, not unilateral refusal.
4. `summary`

**Gate Quiz Topics:**
- Q1: A student gives you an accommodation letter. Can you ask them what their disability is? (No — you implement the listed accommodations without knowing the diagnosis)
- Q2: Scenario — An accommodation letter says "extended time on exams" but doesn't specify how much. What do you do? (Contact Disability Services to clarify)

**Free-Text Prompt:**
"Have you received an accommodation letter before? Describe how you handled it. If you haven't, imagine you receive one tomorrow that says 'extended time on exams, note-taking assistance, and materials in alternative format.' What specific steps would you take?"

> 📷 **Image opportunity:** Annotated sample accommodation letter (template, not real); flowchart of faculty response process
> 📚 **Source opportunity:** AHEAD accommodation best practices, JAN (Job Accommodation Network) higher-ed resources, OCR guidance letters

---

### Section 7.2: Building Proactive Relationships and Avoiding Grievances

**Learning Objectives:**
- Identify the most common accessibility-related complaints and how to prevent them
- Build a proactive working relationship with your DS office before problems arise
- Include accessibility information in your syllabus and first-day-of-class communication
- Know when to handle an issue yourself vs. refer to DS

**Key Terms:**
- Proactive accessibility statement (syllabus)
- Grievance / complaint process
- OCR complaint (Office for Civil Rights)
- Early outreach
- Faculty-DS collaboration

**Content Blocks:**
1. `concept` — "The Top 5 Accessibility Complaints (and How to Prevent Them)": Late implementation of accommodations, inaccessible materials posted without alternatives, faculty questioning accommodations or diagnosis, public disclosure of disability, inflexible attendance/participation policies. For each: what goes wrong, what the student experiences, and the simple prevention.
2. `concept` — "Your Accessibility Statement and First-Day Practices": What to include in your syllabus (accessibility statement, DS contact information, how to request accommodations). What to say on the first day. How to make early outreach without singling students out. Template language faculty can adopt.
3. `example` — "The Escalation Decision Tree": Scenario-based guide. Student says their screen reader can't read your quiz → you can fix this (Module 6 skills). Student needs a sign language interpreter for a lab → refer to DS. Student says your textbook is inaccessible → start with the library, then DS. Student is unhappy with an accommodation → interactive process with DS, not solo negotiation.
4. `summary`

**Gate Quiz Topics:**
- Q1: What is the most common reason accessibility-related complaints are filed against faculty? (Failure to implement accommodations in a timely manner)
- Q2: Scenario — A student tells you their screen reader can't navigate your syllabus. Is this a "refer to DS" situation or something you can handle? (You can handle it — fix the syllabus structure)

**Free-Text Prompt:**
"Review your current syllabus. Does it include an accessibility statement? Does it tell students how to request accommodations and who to contact? If yes, evaluate it against the guidance in this section. If no, draft a 3–4 sentence accessibility statement you could add."

> 📷 **Image opportunity:** Escalation decision tree flowchart; sample syllabus accessibility statement
> 📚 **Source opportunity:** OCR resolution agreements (anonymized examples), AHEAD faculty guidance, institution DS office websites

**Discussion Prompt (Module 7):**
"What is one thing your institution's Disability Services office offers that you didn't know about before this module — or one thing you wish they offered? If you're not sure, look up your DS office's website and explore. Share what you found and how it might change your approach."

---

## Module 8: Tools and Workflows

**Module Learning Objectives:**
- Use accessibility checking tools confidently (Microsoft Accessibility Checker, Acrobat, Canvas Ally, Document Ally Pro)
- Build a personal accessibility workflow you can apply every semester
- Know which free and institutional tools are available and when to use each
- Create an accessibility maintenance plan for ongoing compliance

### Section 8.1: Accessibility Checkers and What They Catch

**Learning Objectives:**
- Run the Microsoft Accessibility Checker and interpret its results
- Understand what automated checkers catch and what they miss
- Use Document Ally Pro for bulk document remediation
- Know when to use free tools vs. institutional tools

**Key Terms:**
- Automated accessibility checking
- False positive / false negative
- Microsoft Accessibility Checker
- Canvas Ally / Blackboard Ally
- Document Ally Pro
- WAVE (web accessibility evaluation tool)
- axe (accessibility testing engine)

**Content Blocks:**
1. `concept` — "What Automated Checkers Can and Can't Do": Automated tools catch ~30–40% of WCAG issues (the structural, detectable ones). They cannot evaluate alt text quality, reading comprehension, or whether content makes sense. The role of automated checking: first pass, not final answer. Why you still need human judgment.
2. `example` — "A Tool-by-Tool Walkthrough": Microsoft Accessibility Checker (your first line for Office documents), Canvas Ally (institutional LMS integration — shows accessibility scores per file), Document Ally Pro (bulk upload and remediation for your department), WAVE browser extension (for web pages and online content). For each: what it does, when to use it, and a quick demo scenario.
3. `concept` — "Free Tools You Can Start Using Today": WAVE browser extension, WebAIM contrast checker, Hemingway Editor (readability), Microsoft's built-in checker. These cost nothing, require no institutional license, and handle the most common checks. When to step up to institutional tools.
4. `summary`

**Gate Quiz Topics:**
- Q1: Approximately what percentage of WCAG issues can automated checkers detect? (~30–40%)
- Q2: The Microsoft Accessibility Checker says your document has "no accessibility issues found." Is the document definitely accessible? (No — automated checkers miss many issues)

**Free-Text Prompt:**
"Pick one tool from this section that you haven't used before. Install it or open it, and run it on one of your course materials. Describe: which tool you chose, what it found, and whether the results matched your expectations from the '60-Second Scan' you did in Module 2."

> 📷 **Image opportunity:** Side-by-side screenshots of different checker tools; "what checkers catch vs. miss" diagram
> 📚 **Source opportunity:** GovA11y or DHS Trusted Tester documentation on automated vs. manual testing, WebAIM WAVE documentation, Document Ally Pro documentation

---

### Section 8.2: Building Your Personal Workflow

**Learning Objectives:**
- Design a repeatable accessibility workflow for creating and updating course materials
- Integrate accessibility checks into your existing course preparation process
- Create a semester-start accessibility checklist

**Key Terms:**
- Accessibility workflow
- Semester-start checklist
- Retroactive remediation vs. born-accessible
- Batch processing

**Content Blocks:**
1. `concept` — "Born Accessible vs. Retrofit": The most expensive and frustrating way to do accessibility is to fix everything at the end. The most efficient way is to build it right from the start. How to shift from "fix after complaints" to "build accessible from day one." This section reframes accessibility as workflow, not extra work.
2. `concept` — "A Semester-Start Workflow": A concrete, step-by-step process: (1) Run Accessibility Checker on your syllabus, (2) Check all uploaded documents in your LMS, (3) Verify video captions, (4) Test one quiz with keyboard only, (5) Update your accessibility statement, (6) Review accommodation letters. Estimated time: 60–90 minutes per course, once per semester.
3. `example` — "A Faculty Member's Real Workflow": Narrative walkthrough of a faculty member (composite) preparing a course. They use a template syllabus that's already accessible, check PowerPoint reading order as they build each lecture, upload documents through Document Ally Pro for batch checking, and run a 10-minute quiz check before publishing each exam.
4. `summary`

**Gate Quiz Topics:**
- Q1: What is the most efficient approach to document accessibility — remediating after publication or building accessible from the start? (Building accessible from the start)
- Q2: How long does the semester-start accessibility checklist in this section estimate for a single course? (~60–90 minutes)

**Free-Text Prompt:**
"Draft your own semester-start accessibility checklist. Based on what you've learned in this course, list the specific steps you would take — in order — to prepare your course materials for accessibility before the first day of class. Include which tools you'll use for each step."

> 📷 **Image opportunity:** Workflow diagram; semester-start checklist as a visual card; timeline showing "born accessible" vs. "retrofit" effort comparison
> 📚 **Source opportunity:** University accessibility workflow guides (e.g., University of Washington, Penn State), EDUCAUSE accessibility resources

---

### Section 8.3: Ongoing Compliance and Your Action Plan

**Learning Objectives:**
- Create a personal action plan for the next 30 days
- Identify institutional resources for ongoing accessibility support
- Understand how accessibility standards evolve and how to stay current
- Know where to go for help after this course ends

**Key Terms:**
- Action plan
- Institutional accessibility office
- WCAG 3.0 (upcoming — awareness only)
- Professional development credit
- Accessibility community of practice

**Content Blocks:**
1. `concept` — "Your 30-Day Action Plan": A structured framework for what to do in the first month after completing this course. Week 1: Fix your syllabus and one high-use document. Week 2: Audit your quizzes with keyboard testing. Week 3: Check all videos for captions. Week 4: Share what you've learned with a colleague. The goal: build the habit before the semester gets busy.
2. `concept` — "Staying Current Without Drowning": Accessibility standards evolve (WCAG 3.0 is in development). How to stay informed without making it a second job: follow 2–3 accessibility blogs, attend your institution's accessibility training, join a community of practice if your institution has one. Resources list.
3. `example` — "From This Course to Your Institution": How to leverage this course's completion certificate. How to advocate for department-wide accessibility training. How to work with your CTL to build accessibility into course design workshops. The business case for faculty accessibility training (reduced complaints, reduced accommodation workload, better student outcomes).
4. `summary`

**Gate Quiz Topics:**
- Q1: In the 30-Day Action Plan, what is the recommended first-week priority? (Fix your syllabus and one high-use document)
- Q2: Why is accessibility an ongoing process rather than a one-time fix? (Standards evolve, course materials change each semester, and new tools/content need evaluation)

**Free-Text Prompt:**
"Write your personal 30-Day Action Plan. Be specific: which documents will you fix in Week 1? Which quizzes will you test in Week 2? Which videos will you check in Week 3? Who will you share this with in Week 4? Make it concrete and realistic for your teaching load."

> 📷 **Image opportunity:** 30-Day Action Plan template as a visual card; "Where to Go for Help" resource map
> 📚 **Source opportunity:** W3C WCAG 3.0 development page, WebAIM blog, A11y Project, AHEAD resources

**Discussion Prompt (Module 8):**
"Share your 30-Day Action Plan (or a summary of it). What's your highest-priority accessibility fix? What do you think will be the hardest habit to build? Respond to a colleague's plan with an encouraging note or a suggestion based on your own experience in this course."

---

## Appendix: Content Architecture Reference

### File Structure (matches Entrepreneurship repo)

```
content/
├── chapters/
│   ├── ch01/                          # Module 1: Why Accessibility Matters
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 1.1.json              # Title II in Plain English
│   │   │   └── 1.2.json              # Real Student Stories
│   │   ├── quizzes/
│   │   │   ├── gate-1.1.json
│   │   │   └── gate-1.2.json
│   │   └── discussion.json
│   ├── ch02/                          # Module 2: WCAG 2.2 Without the Jargon
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 2.1.json              # The Four Principles — POUR
│   │   │   ├── 2.2.json              # The 13 New Criteria in WCAG 2.2
│   │   │   └── 2.3.json              # Spotting WCAG Issues
│   │   ├── quizzes/
│   │   │   ├── gate-2.1.json
│   │   │   ├── gate-2.2.json
│   │   │   └── gate-2.3.json
│   │   └── discussion.json
│   ├── ch03/                          # Module 3: Accessible Documents
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 3.1.json              # Headings, Structure, Reading Order
│   │   │   ├── 3.2.json              # Alt Text, Images, Tables
│   │   │   └── 3.3.json              # Links, Color, Accessibility Checker
│   │   ├── quizzes/
│   │   │   ├── gate-3.1.json
│   │   │   ├── gate-3.2.json
│   │   │   └── gate-3.3.json
│   │   └── discussion.json
│   ├── ch04/                          # Module 4: Accessible Course Materials
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 4.1.json              # Syllabi and Handouts
│   │   │   ├── 4.2.json              # Slides and Presentations
│   │   │   └── 4.3.json              # Readings, OER, Third-Party Content
│   │   ├── quizzes/
│   │   │   ├── gate-4.1.json
│   │   │   ├── gate-4.2.json
│   │   │   └── gate-4.3.json
│   │   └── discussion.json
│   ├── ch05/                          # Module 5: Accessible Multimedia
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 5.1.json              # Captions and Transcripts
│   │   │   └── 5.2.json              # Audio Descriptions & Interactive Media
│   │   ├── quizzes/
│   │   │   ├── gate-5.1.json
│   │   │   └── gate-5.2.json
│   │   └── discussion.json
│   ├── ch06/                          # Module 6: Accessible Assessments
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 6.1.json              # Quiz Design for Screen Readers
│   │   │   ├── 6.2.json              # Extended Time & Accommodations
│   │   │   └── 6.3.json              # Accessible Assessment Content
│   │   ├── quizzes/
│   │   │   ├── gate-6.1.json
│   │   │   ├── gate-6.2.json
│   │   │   └── gate-6.3.json
│   │   └── discussion.json
│   ├── ch07/                          # Module 7: Working with Disability Services
│   │   ├── meta.json
│   │   ├── sections/
│   │   │   ├── 7.1.json              # Accommodation Letters
│   │   │   └── 7.2.json              # Proactive Relationships & Grievances
│   │   ├── quizzes/
│   │   │   ├── gate-7.1.json
│   │   │   └── gate-7.2.json
│   │   └── discussion.json
│   └── ch08/                          # Module 8: Tools and Workflows
│       ├── meta.json
│       ├── sections/
│       │   ├── 8.1.json              # Accessibility Checkers
│       │   ├── 8.2.json              # Building Your Personal Workflow
│       │   └── 8.3.json              # Ongoing Compliance & Action Plan
│       ├── quizzes/
│       │   ├── gate-8.1.json
│       │   ├── gate-8.2.json
│       │   └── gate-8.3.json
│       └── discussion.json
└── assignments/
    ├── assignment-1.json              # After Module 3: Audit & fix syllabus + document
    ├── assignment-2.json              # After Module 6: Accessible materials, multimedia, quiz
    └── assignment-3.json              # After Module 8: Workflow & action plan
```

### Course Config Highlights

```
title: "WCAG 2.2 for Higher Ed"
subtitle: "Accessible Course Materials for Faculty"
textbook: null (original content — no OER source)
capstone.enabled: true
capstone.title: "Accessible Course Materials Portfolio"
capstone.route: "/portfolio"
aiTutor.role: "accessibility specialist with higher-ed faculty development experience"
aiTutor.tone: "warm, practical, judgment-free"
attribution.enabled: false (original content, no CC source)
```

### Section Count Summary

| Module | Sections | Gate Quizzes | Total Questions |
|--------|----------|-------------|-----------------|
| 1 | 2 | 2 | 4 |
| 2 | 3 | 3 | 6 |
| 3 | 3 | 3 | 6 |
| 4 | 3 | 3 | 6 |
| 5 | 2 | 2 | 4 |
| 6 | 3 | 3 | 6 |
| 7 | 2 | 2 | 4 |
| 8 | 3 | 3 | 6 |
| **Total** | **21** | **21** | **42** |

---

## Source & Image Research Plan

After outline approval, the next step is a targeted research pass to find:

### Priority Sources (to cite/reference in content)
1. **DOJ Title II Final Rule** — exact regulatory text and summary
2. **W3C WCAG 2.2** — official specification and "What's New" page
3. **WebAIM Million Report** — most common accessibility failures (annual data)
4. **NCES Disability Statistics** — percentage of students with disabilities in higher ed
5. **OCR Resolution Agreements** — real enforcement examples (anonymized for case studies)
6. **Canvas & Blackboard Accessibility Docs** — LMS-specific how-to references
7. **Microsoft Office Accessibility Docs** — checker documentation, how-to guides
8. **AHEAD Resources** — accommodation best practices, faculty guidance
9. **CAST UDL Framework** — Universal Design for Learning principles
10. **W3C Alt Text Decision Tree** — for the alt text section

### Priority Images/Diagrams to Create or Source
1. Title II compliance timeline infographic
2. POUR principles diagram
3. Alt text decision tree flowchart
4. Before/after document comparisons (syllabus, handout)
5. Accessibility Checker screenshots (Word, PowerPoint, Canvas)
6. Question type accessibility matrix
7. Escalation decision tree (DS referral)
8. Semester-start workflow diagram
9. 30-Day Action Plan template
10. "What checkers catch vs. miss" Venn diagram

### Image Sourcing Strategy
- **Create original diagrams** for decision trees, flowcharts, and infographics (SVG or designed graphics)
- **Screenshot from tools** for Accessibility Checker walkthrough content (will need to be created during content development)
- **Source from CC-licensed repositories** for any stock imagery needed
- **Avoid copyrighted images** — all visuals should be original or CC-BY licensed

---

## Next Steps

1. ✅ **Review this outline** — Brooks approves structure, section breakdown, and pacing
2. 🔍 **Research pass** — Find and compile high-quality sources for each section
3. 🏗️ **Content generation** — Build JSON files module by module, starting with Module 1
4. 🧪 **Validation** — Run content validation script to ensure schema compliance
5. 📸 **Image creation** — Design diagrams and source screenshots for content blocks
