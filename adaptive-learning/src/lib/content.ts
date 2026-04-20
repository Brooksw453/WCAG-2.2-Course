import fs from 'fs';
import path from 'path';
import type { ChapterMeta, SectionContent, GateQuiz, DiscussionConfig, AssignmentConfig } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'chapters');

export function getChapterMeta(chapterId: number): ChapterMeta {
  const filePath = path.join(CONTENT_DIR, `ch${String(chapterId).padStart(2, '0')}`, 'meta.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getSectionContent(chapterId: number, sectionId: string): SectionContent {
  const filePath = path.join(
    CONTENT_DIR,
    `ch${String(chapterId).padStart(2, '0')}`,
    'sections',
    `${sectionId}.json`
  );
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getGateQuiz(chapterId: number, sectionId: string): GateQuiz {
  const filePath = path.join(
    CONTENT_DIR,
    `ch${String(chapterId).padStart(2, '0')}`,
    'quizzes',
    `gate-${sectionId}.json`
  );
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getDiscussion(chapterId: number): DiscussionConfig {
  const filePath = path.join(CONTENT_DIR, `ch${String(chapterId).padStart(2, '0')}`, 'discussion.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getAllSectionIds(chapterId: number): string[] {
  const meta = getChapterMeta(chapterId);
  return meta.sections;
}

const ASSIGNMENTS_DIR = path.join(process.cwd(), 'content', 'assignments');

export function getAssignment(assignmentId: number): AssignmentConfig {
  const filePath = path.join(ASSIGNMENTS_DIR, `assignment-${assignmentId}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getAllAssignments(): AssignmentConfig[] {
  const assignments: AssignmentConfig[] = [];
  if (!fs.existsSync(ASSIGNMENTS_DIR)) return assignments;
  const entries = fs.readdirSync(ASSIGNMENTS_DIR);
  for (const entry of entries) {
    if (entry.startsWith('assignment-') && entry.endsWith('.json')) {
      assignments.push(JSON.parse(fs.readFileSync(path.join(ASSIGNMENTS_DIR, entry), 'utf-8')));
    }
  }
  return assignments.sort((a, b) => a.assignmentId - b.assignmentId);
}

export function getAllChapters(): ChapterMeta[] {
  const chapters: ChapterMeta[] = [];
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('ch')) {
      const metaPath = path.join(CONTENT_DIR, entry.name, 'meta.json');
      if (fs.existsSync(metaPath)) {
        chapters.push(JSON.parse(fs.readFileSync(metaPath, 'utf-8')));
      }
    }
  }

  return chapters.sort((a, b) => a.chapterId - b.chapterId);
}
