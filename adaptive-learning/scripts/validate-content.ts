/**
 * Content Validation Script
 *
 * Walks the content/ directory and validates that all JSON files
 * match the expected TypeScript interfaces and structure.
 *
 * Run with: npx tsx scripts/validate-content.ts
 */

import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'chapters');
const ASSIGNMENTS_DIR = path.join(process.cwd(), 'content', 'assignments');

let errors = 0;
let warnings = 0;
let totalFiles = 0;

function error(msg: string) {
  console.error(`  ❌ ${msg}`);
  errors++;
}

function warn(msg: string) {
  console.warn(`  ⚠️  ${msg}`);
  warnings++;
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function readJSON(filePath: string): unknown | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    totalFiles++;
    return JSON.parse(raw);
  } catch (e) {
    error(`Failed to parse ${filePath}: ${e}`);
    return null;
  }
}

function validateMeta(chapterDir: string, chapterId: number) {
  const metaPath = path.join(chapterDir, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    error(`Missing meta.json in ${chapterDir}`);
    return null;
  }

  const meta = readJSON(metaPath) as Record<string, unknown> | null;
  if (!meta) return null;

  if (meta.chapterId !== chapterId) {
    error(`meta.json chapterId (${meta.chapterId}) doesn't match directory (ch${String(chapterId).padStart(2, '0')})`);
  }
  if (!meta.title || typeof meta.title !== 'string') {
    error(`meta.json missing or invalid title`);
  }
  if (typeof meta.weekNum !== 'number') {
    error(`meta.json missing or invalid weekNum`);
  }
  if (!Array.isArray(meta.sections) || meta.sections.length === 0) {
    error(`meta.json missing or empty sections array`);
  }
  if (!Array.isArray(meta.learningObjectives) || meta.learningObjectives.length === 0) {
    warn(`meta.json has no learningObjectives`);
  }

  ok(`meta.json — ${meta.title} (${(meta.sections as string[]).length} sections)`);
  return meta;
}

function validateSection(chapterDir: string, chapterId: number, sectionId: string) {
  const sectionPath = path.join(chapterDir, 'sections', `${sectionId}.json`);
  if (!fs.existsSync(sectionPath)) {
    error(`Missing section file: sections/${sectionId}.json`);
    return;
  }

  const section = readJSON(sectionPath) as Record<string, unknown> | null;
  if (!section) return;

  if (section.sectionId !== sectionId) {
    error(`Section ${sectionId}: sectionId field (${section.sectionId}) doesn't match filename`);
  }
  if (section.chapterId !== chapterId) {
    error(`Section ${sectionId}: chapterId (${section.chapterId}) doesn't match directory`);
  }
  if (!section.title || typeof section.title !== 'string') {
    error(`Section ${sectionId}: missing title`);
  }
  if (!Array.isArray(section.contentBlocks) || section.contentBlocks.length === 0) {
    error(`Section ${sectionId}: missing or empty contentBlocks`);
  }
  if (!Array.isArray(section.keyTerms)) {
    warn(`Section ${sectionId}: missing keyTerms array`);
  }

  const prompt = section.freeTextPrompt as Record<string, unknown> | undefined;
  if (!prompt || !prompt.prompt || typeof prompt.minWords !== 'number') {
    error(`Section ${sectionId}: missing or invalid freeTextPrompt`);
  }

  ok(`sections/${sectionId}.json — ${section.title}`);
}

function validateQuiz(chapterDir: string, chapterId: number, sectionId: string) {
  const quizPath = path.join(chapterDir, 'quizzes', `gate-${sectionId}.json`);
  if (!fs.existsSync(quizPath)) {
    error(`Missing quiz file: quizzes/gate-${sectionId}.json`);
    return;
  }

  const quiz = readJSON(quizPath) as Record<string, unknown> | null;
  if (!quiz) return;

  if (quiz.sectionId !== sectionId) {
    error(`Quiz gate-${sectionId}: sectionId field (${quiz.sectionId}) doesn't match filename`);
  }
  if (quiz.chapterId !== chapterId) {
    error(`Quiz gate-${sectionId}: chapterId (${quiz.chapterId}) doesn't match directory`);
  }

  const questions = quiz.questions as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(questions) || questions.length === 0) {
    error(`Quiz gate-${sectionId}: missing or empty questions array`);
    return;
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question || typeof q.question !== 'string') {
      error(`Quiz gate-${sectionId} Q${i + 1}: missing question text`);
    }
    const options = q.options as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(options) || options.length < 2) {
      error(`Quiz gate-${sectionId} Q${i + 1}: needs at least 2 options`);
    } else {
      const correctCount = options.filter(o => o.correct === true).length;
      if (correctCount !== 1) {
        error(`Quiz gate-${sectionId} Q${i + 1}: has ${correctCount} correct answers (expected 1)`);
      }
    }
    if (!q.explanation || typeof q.explanation !== 'string') {
      warn(`Quiz gate-${sectionId} Q${i + 1}: missing explanation`);
    }
  }

  ok(`quizzes/gate-${sectionId}.json — ${questions.length} questions`);
}

function validateAssignment(filePath: string) {
  const assignment = readJSON(filePath) as Record<string, unknown> | null;
  if (!assignment) return;

  if (typeof assignment.assignmentId !== 'number') {
    error(`Assignment: missing assignmentId`);
  }
  if (!assignment.title || typeof assignment.title !== 'string') {
    error(`Assignment: missing title`);
  }
  if (!Array.isArray(assignment.sections) || assignment.sections.length === 0) {
    error(`Assignment ${assignment.assignmentId}: missing or empty sections`);
  }

  ok(`${path.basename(filePath)} — ${assignment.title} (${(assignment.sections as unknown[]).length} sections)`);
}

// Main
console.log('\n📚 Validating course content...\n');

// Validate chapters
if (!fs.existsSync(CONTENT_DIR)) {
  console.error('❌ content/chapters/ directory not found!');
  process.exit(1);
}

const chapterDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.startsWith('ch'))
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`Found ${chapterDirs.length} chapters\n`);

for (const dir of chapterDirs) {
  const chapterId = parseInt(dir.name.replace('ch', ''), 10);
  const chapterDir = path.join(CONTENT_DIR, dir.name);

  console.log(`\n📖 Chapter ${chapterId} (${dir.name}/)`);

  const meta = validateMeta(chapterDir, chapterId);
  if (!meta) continue;

  const sections = meta.sections as string[];
  for (const sectionId of sections) {
    validateSection(chapterDir, chapterId, sectionId);
    validateQuiz(chapterDir, chapterId, sectionId);
  }
}

// Validate assignments
console.log('\n\n📝 Validating assignments...\n');
if (fs.existsSync(ASSIGNMENTS_DIR)) {
  const assignmentFiles = fs.readdirSync(ASSIGNMENTS_DIR)
    .filter(f => f.startsWith('assignment-') && f.endsWith('.json'))
    .sort();

  if (assignmentFiles.length === 0) {
    warn('No assignment files found');
  } else {
    for (const file of assignmentFiles) {
      validateAssignment(path.join(ASSIGNMENTS_DIR, file));
    }
  }
} else {
  warn('content/assignments/ directory not found');
}

// Summary
console.log('\n\n' + '='.repeat(50));
console.log(`📊 Validation Summary`);
console.log(`   Files checked: ${totalFiles}`);
console.log(`   Errors: ${errors}`);
console.log(`   Warnings: ${warnings}`);
console.log('='.repeat(50));

if (errors > 0) {
  console.log('\n❌ Validation FAILED — fix the errors above.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Validation passed with warnings.\n');
} else {
  console.log('\n✅ All content is valid!\n');
}
