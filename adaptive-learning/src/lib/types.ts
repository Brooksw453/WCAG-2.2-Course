// ============================================================
// Content Types (loaded from JSON files)
// ============================================================

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface ContentBlock {
  type: 'concept' | 'example' | 'summary' | 'image';
  title?: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
}

export interface FreeTextPrompt {
  id: string;
  prompt: string;
  minWords: number;
  rubric: string;
}

export interface SectionContent {
  sectionId: string;
  chapterId: number;
  title: string;
  learningObjectives: string[];
  keyTerms: KeyTerm[];
  contentBlocks: ContentBlock[];
  freeTextPrompt: FreeTextPrompt;
}

export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
}

export interface GateQuiz {
  sectionId: string;
  chapterId: number;
  questions: QuizQuestion[];
  passThreshold: number;
}

export interface ChapterMeta {
  chapterId: number;
  title: string;
  weekNum: number;
  reading: string;
  learningObjectives: string[];
  sections: string[];
}

export interface DiscussionConfig {
  chapterId: number;
  weekNum: number;
  title: string;
  prompt: string;
  requirements: {
    initialPost: { minWords: number; maxWords: number; dueDay: string; dueTime: string };
    replies: { count: number; minWords: number; maxWords: number; dueDay: string; dueTime: string };
  };
}

// ============================================================
// Database Types (from Supabase)
// ============================================================

export type ProgressStatus = 'not_started' | 'in_progress' | 'needs_remediation' | 'completed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'instructor';
  created_at: string;
  updated_at: string;
}

export interface SectionProgress {
  id: string;
  user_id: string;
  chapter_id: number;
  section_id: string;
  status: ProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  mastery_score: number | null;
  remediation_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  chapter_id: number;
  section_id: string;
  attempt_number: number;
  answers: Record<string, string>;
  score: number;
  passed: boolean;
  submitted_at: string;
}

export interface FreeTextResponse {
  id: string;
  user_id: string;
  chapter_id: number;
  section_id: string;
  prompt_id: string;
  response_text: string;
  ai_evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null;
  ai_model: string | null;
  submitted_at: string;
}

export interface DiscussionPost {
  id: string;
  user_id: string;
  chapter_id: number;
  parent_id: string | null;
  content: string;
  ai_quality_score: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: { full_name: string };
}

// ============================================================
// Assignment Types
// ============================================================

export interface AssignmentSection {
  key: string;
  title: string;
  instructions: string;
  minWords: number;
  maxWords: number;
  rubric: string;
  tips: string[];
}

export interface AssignmentConfig {
  assignmentId: number;
  title: string;
  points: number;
  description: string;
  relatedChapters: number[];
  context?: {
    purpose: string;
    goals: string[];
    whatToExpect: string;
  };
  sections: AssignmentSection[];
}

export interface AssignmentDraft {
  id: string;
  user_id: string;
  assignment_id: number;
  section_key: string;
  draft_number: number;
  content: string;
  ai_feedback: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null;
  submitted_at: string;
}

// ============================================================
// Adaptive Engine Types
// ============================================================

export type NextAction =
  | 'read_content'
  | 'take_quiz'
  | 'review_content'
  | 'free_text_prompt'
  | 'revise_free_text'
  | 'instructor_flag'
  | 'next_section'
  | 'chapter_complete';

export interface ProgressEvaluation {
  status: ProgressStatus;
  next: NextAction;
  masteryScore?: number;
  feedback?: string;
  canSkip?: boolean;
}
