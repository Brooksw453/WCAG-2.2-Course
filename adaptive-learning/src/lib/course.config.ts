// ============================================================
// Course Configuration — Single source of truth
// ============================================================
// Update this file when creating a new course from the template.
// All pages and API routes import from here instead of hardcoding.

/** Course slug used for course_id scoping in the shared database */
export const COURSE_ID = process.env.COURSE_SLUG || 'wcag-2-2-higher-ed';

export const courseConfig = {
  // Core identity
  title: "WCAG 2.2 for Higher Ed",
  subtitle: "Accessible Course Materials for Faculty",
  description:
    "A plain-English accessibility course built for faculty — not web developers. In 4–6 hours, faculty learn how to build accessible syllabi, slides, quizzes, and course materials. No crash-course in HTML or ARIA. Real examples from actual college classrooms. Completion certificate suitable for professional development credit.",

  // Textbook info — this course is ORIGINAL CONTENT, no external textbook
  textbook: {
    name: null,
    pdfFilename: null,
  },

  // Capstone project (set enabled: false if the course has no capstone)
  capstone: {
    enabled: true,
    title: "Accessible Course Materials Portfolio",
    route: "/portfolio",
    navLabel: "Portfolio",
    // Labels used throughout the capstone/portfolio UI (customize per course)
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

  // AI tutor personality (used in system prompts for all AI endpoints)
  aiTutor: {
    role: "a friendly accessibility specialist who has worked in higher-ed faculty development and understands the realities of teaching loads, LMS frustrations, and Title II compliance pressure",
    tone: "warm, practical, and judgment-free — like a colleague who happens to know a lot about accessibility",
  },

  // Pass/fail thresholds (used across quizzes, free-text, grades)
  thresholds: {
    freeTextPass: 70,       // Minimum % to pass a free-text written response
    gradeA: 90,
    gradeB: 80,
    gradeC: 70,
    gradeD: 60,
  },

  // Feature toggles (disable features that don't apply to certain courses)
  features: {
    textToSpeech: true,
    speechToText: true,
    deepDive: true,
    askQuestion: true,
    draftChat: true,
  },

  // Attribution — ORIGINAL CONTENT, no OER source.
  // enabled: false short-circuits the Attribution component; empty strings
  // preserve the inferred string types for src/components/Attribution.tsx.
  attribution: {
    enabled: false,
    sourceTitle: "",
    sourceAuthors: "",
    sourceUrl: "",
    sourcePublisher: "",
    license: "",
    licenseUrl: "",
    accessLine: "",
    adaptedBy: "ES Designs",
    adaptationNote: "Original content created by ES Designs for the WCAG 2.2 for Higher Ed course.",
  },
};
