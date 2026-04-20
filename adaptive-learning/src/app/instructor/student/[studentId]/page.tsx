import { createClient } from '@/lib/supabase/server';
import { getAllChapters, getAllAssignments } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CollapsibleSection from './CollapsibleSection';
import { courseConfig, COURSE_ID } from '@/lib/course.config';
import { getScoreColor } from '@/lib/scoreUtils';

interface ProgressRow {
  chapter_id: number;
  section_id: string;
  status: string;
  mastery_score: number | null;
  updated_at: string;
}

interface QuizRow {
  chapter_id: number;
  section_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  submitted_at: string;
}

interface FreeTextRow {
  chapter_id: number;
  section_id: string;
  response_text: string;
  ai_evaluation: { score: number; feedback: string; strengths: string[]; improvements: string[] } | null;
  ai_model: string;
  submitted_at: string;
}

interface DraftRow {
  assignment_id: number;
  section_key: string;
  draft_number: number;
  content: string;
  ai_feedback: { score: number; feedback: string; strengths: string[]; improvements: string[] } | null;
  submitted_at: string;
}

interface AIInteractionRow {
  id: string;
  interaction_type: string;
  context: Record<string, string | number>;
  prompt_sent: string;
  response_received: string;
  tokens_used: number | null;
  created_at: string;
}

interface ActivityRow {
  id: string;
  activity_type: string;
  details: Record<string, string | number>;
  created_at: string;
}

// SVG icon components for inline use (all decorative, aria-hidden applied at usage)
function ChapterIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  );
}

const AI_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  deep_dive: { label: 'Deep Dive', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🔍' },
  quiz_remediation: { label: 'Remediation', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🔄' },
  free_text_eval: { label: 'Writing Eval', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: '✏' },
  assignment_coaching: { label: 'Assignment Coach', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '📝' },
  content_generation: { label: 'Content Gen', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: '📄' },
  business_plan_draft: { label: 'BP Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '💼' },
};

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  login: { label: 'Logged in', color: 'bg-gray-100 text-gray-600', icon: '🔑' },
  section_start: { label: 'Started section', color: 'bg-blue-100 text-blue-700', icon: '▶' },
  section_complete: { label: 'Completed section', color: 'bg-green-100 text-green-700', icon: '✓' },
  quiz_attempt: { label: 'Quiz attempt', color: 'bg-purple-100 text-purple-700', icon: '?' },
  assignment_submit: { label: 'Assignment submitted', color: 'bg-indigo-100 text-indigo-700', icon: '📄' },
  draft_chat: { label: 'AI drafting assistant', color: 'bg-amber-100 text-amber-700', icon: '💬' },
  page_view: { label: 'Page view', color: 'bg-gray-100 text-gray-500', icon: '👁' },
  free_text_submit: { label: 'Written response', color: 'bg-teal-100 text-teal-700', icon: '✏' },
};

const ASSIGNMENT_TITLES: Record<number, string> = {
  1: 'Business Concept & Environment Analysis',
  2: 'Organizational & Management Plan',
  3: 'Marketing & Technology Strategy',
  4: 'Financial Overview & Funding Strategy',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verify instructor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) redirect('/chapters');

  // Load student profile
  const { data: student } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('id', studentId)
    .single();

  if (!student) redirect('/instructor');

  const chapters = getAllChapters();
  const assignments = getAllAssignments();

  // Load all student data in parallel
  const [
    { data: progressData },
    { data: quizData },
    { data: freeTextData },
    { data: draftData },
    { data: aiData },
  ] = await Promise.all([
    supabase.from('section_progress').select('chapter_id, section_id, status, mastery_score, updated_at').eq('user_id', studentId).eq('course_id', COURSE_ID).order('chapter_id').order('section_id'),
    supabase.from('quiz_attempts').select('chapter_id, section_id, score, passed, attempt_number, submitted_at').eq('user_id', studentId).eq('course_id', COURSE_ID).order('submitted_at', { ascending: false }),
    supabase.from('free_text_responses').select('chapter_id, section_id, response_text, ai_evaluation, ai_model, submitted_at').eq('user_id', studentId).eq('course_id', COURSE_ID).order('submitted_at', { ascending: false }),
    supabase.from('assignment_drafts').select('assignment_id, section_key, draft_number, content, ai_feedback, submitted_at').eq('user_id', studentId).eq('course_id', COURSE_ID).order('submitted_at', { ascending: false }),
    supabase.from('ai_interactions').select('id, interaction_type, context, prompt_sent, response_received, tokens_used, created_at').eq('user_id', studentId).eq('course_id', COURSE_ID).order('created_at', { ascending: false }).limit(50),
  ]);

  const progress = (progressData || []) as ProgressRow[];
  const quizzes = (quizData || []) as QuizRow[];
  const freeTexts = (freeTextData || []) as FreeTextRow[];
  const drafts = (draftData || []) as DraftRow[];
  const aiInteractions = (aiData || []) as AIInteractionRow[];

  // Load activity log (table may not exist)
  let studentActivities: ActivityRow[] = [];
  try {
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('id, activity_type, details, created_at')
      .eq('user_id', studentId)
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false })
      .limit(20);
    if (activityData) {
      studentActivities = activityData;
    }
  } catch {
    // Table may not exist yet
  }

  // ── Compute summary stats ──
  const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  const completedSections = progress.filter(p => p.status === 'completed').length;
  const progressPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  const masteryScores = progress.filter(p => p.mastery_score !== null).map(p => p.mastery_score as number);
  const avgMastery = masteryScores.length > 0
    ? Math.round(masteryScores.reduce((s, v) => s + v, 0) / masteryScores.length)
    : 0;

  const passedQuizzes = quizzes.filter(q => q.passed);
  const quizPassRate = quizzes.length > 0
    ? Math.round((passedQuizzes.length / quizzes.length) * 100)
    : 0;
  const avgQuizScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length)
    : 0;

  // AI interaction stats
  const totalTokens = aiInteractions.reduce((sum, ai) => sum + (ai.tokens_used || 0), 0);
  const aiByType = new Map<string, number>();
  aiInteractions.forEach(ai => {
    aiByType.set(ai.interaction_type, (aiByType.get(ai.interaction_type) || 0) + 1);
  });

  // Last active
  const allDates = [
    ...quizzes.map(q => q.submitted_at),
    ...freeTexts.map(ft => ft.submitted_at),
    ...drafts.map(d => d.submitted_at),
    ...aiInteractions.map(ai => ai.created_at),
    ...studentActivities.map(a => a.created_at),
  ].filter(Boolean);
  const lastActive = allDates.length > 0
    ? formatRelativeTime(allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0])
    : 'Never';

  // ── Chapter-by-chapter breakdown ──
  const chapterBreakdown = chapters.map(ch => {
    const chProgress = progress.filter(p => p.chapter_id === ch.chapterId);
    const completed = chProgress.filter(p => p.status === 'completed').length;
    const inProgress = chProgress.filter(p => p.status === 'in_progress' || p.status === 'needs_remediation').length;
    const chMastery = chProgress.filter(p => p.mastery_score !== null).map(p => p.mastery_score as number);
    const avg = chMastery.length > 0
      ? Math.round(chMastery.reduce((s, v) => s + v, 0) / chMastery.length)
      : null;
    return {
      chapterId: ch.chapterId,
      title: ch.title,
      totalSections: ch.sections.length,
      completed,
      inProgress,
      avgMastery: avg,
    };
  });

  // ── Assignment breakdown ──
  const assignmentBreakdown = assignments.map(a => {
    const aDrafts = drafts.filter(d => d.assignment_id === a.assignmentId);
    const latestDrafts = new Map<string, DraftRow>();
    aDrafts.forEach(d => {
      const existing = latestDrafts.get(d.section_key);
      if (!existing || d.draft_number > existing.draft_number) {
        latestDrafts.set(d.section_key, d);
      }
    });

    const sectionResults = a.sections.map(s => {
      const draft = latestDrafts.get(s.key);
      const content = draft?.content || '';
      const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
      return {
        key: s.key,
        title: s.title,
        draftNumber: draft?.draft_number || 0,
        score: draft?.ai_feedback?.score || null,
        feedback: draft?.ai_feedback?.feedback || null,
        strengths: draft?.ai_feedback?.strengths || [],
        improvements: draft?.ai_feedback?.improvements || [],
        hasContent: !!draft?.content,
        content,
        wordCount,
        contentPreview: draft?.content ? draft.content.slice(0, 200) : null,
        updatedAt: draft?.submitted_at || null,
      };
    });

    const scores = sectionResults.filter(s => s.score !== null).map(s => s.score as number);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

    return {
      assignmentId: a.assignmentId,
      title: ASSIGNMENT_TITLES[a.assignmentId] || a.title,
      points: a.points,
      totalSections: a.sections.length,
      sectionsSubmitted: sectionResults.filter(s => s.score !== null).length,
      avgScore,
      sectionResults,
    };
  });

  // ── Quiz performance summary ──
  const quizByChapter = new Map<number, QuizRow[]>();
  quizzes.forEach(q => {
    const existing = quizByChapter.get(q.chapter_id) || [];
    existing.push(q);
    quizByChapter.set(q.chapter_id, existing);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/instructor"
                className="text-sm text-indigo-200 hover:text-white flex items-center gap-1 mb-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold">{student.full_name}</h1>
              <p className="text-indigo-200 text-sm">{student.email}</p>
              <p className="text-indigo-300 text-xs mt-1">
                Enrolled {new Date(student.created_at).toLocaleDateString()} &middot; Last active {lastActive}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{progressPercent}%</div>
              <div className="text-indigo-200 text-sm">Overall Progress</div>
              <div className="w-32 bg-indigo-900/30 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full bg-white/80 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedSections}/{totalSections}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sections Done</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${avgMastery >= 80 ? 'text-green-600' : avgMastery >= 70 ? 'text-yellow-600' : avgMastery > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {avgMastery > 0 ? `${avgMastery}%` : '\u2014'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Mastery</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${avgQuizScore >= 80 ? 'text-green-600' : avgQuizScore >= 70 ? 'text-yellow-600' : avgQuizScore > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {avgQuizScore > 0 ? `${avgQuizScore}%` : '\u2014'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Quiz</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{quizzes.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quiz Attempts</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${quizPassRate >= 80 ? 'text-green-600' : quizPassRate >= 60 ? 'text-yellow-600' : quizPassRate > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {quizzes.length > 0 ? `${quizPassRate}%` : '\u2014'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pass Rate</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{freeTexts.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Written Responses</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{aiInteractions.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI Interactions</div>
          </div>
        </div>

        {/* ── Section 1: Chapter Progress ── */}
        <CollapsibleSection
          title="Chapter Progress"
          icon={<ChapterIcon />}
          defaultOpen={true}
          badge={`${completedSections}/${totalSections}`}
          badgeColor="bg-blue-100 text-blue-700"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Chapter</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Progress</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Mastery</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Quizzes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {chapterBreakdown.map(ch => {
                  const pct = ch.totalSections > 0 ? Math.round((ch.completed / ch.totalSections) * 100) : 0;
                  const chQuizzes = quizzes.filter(q => q.chapter_id === ch.chapterId);
                  return (
                    <tr key={ch.chapterId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Ch {ch.chapterId}: {ch.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ch.completed}/{ch.totalSections}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ch.avgMastery !== null ? (
                          <span className={`text-sm font-medium ${
                            ch.avgMastery >= 80 ? 'text-green-600' :
                            ch.avgMastery >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {ch.avgMastery}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">{'\u2014'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {chQuizzes.length > 0 ? (
                          <span className="text-sm text-purple-600 font-medium">{chQuizzes.length}</span>
                        ) : (
                          <span className="text-sm text-gray-400">{'\u2014'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ch.completed === 0 && ch.inProgress === 0 ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Not Started</span>
                        ) : pct >= 100 ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Complete</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">In Progress</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* ── Section 2: Assignment Submissions ── */}
        <CollapsibleSection
          title="Assignment Submissions"
          icon={<ClipboardIcon />}
          defaultOpen={true}
          badge={drafts.length > 0 ? `${drafts.length} drafts` : null}
          badgeColor="bg-indigo-100 text-indigo-700"
        >
          {assignmentBreakdown.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No assignments configured.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {assignmentBreakdown.map(a => (
                <div key={a.assignmentId} className="p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Assignment {a.assignmentId}: {a.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {a.points} points &middot; {a.sectionsSubmitted}/{a.totalSections} sections graded
                      </p>
                    </div>
                    {a.avgScore !== null && (
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        a.avgScore >= 80 ? 'bg-green-100 text-green-700' :
                        a.avgScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {a.avgScore}%
                      </div>
                    )}
                  </div>
                  {/* Section cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {a.sectionResults.map(s => (
                      <div
                        key={s.key}
                        className={`p-3 rounded-lg border ${
                          s.score !== null && s.score >= courseConfig.thresholds.gradeB
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : s.score !== null
                            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                            : s.hasContent
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{s.title}</div>
                          {s.score !== null && (
                            <span className={`text-xs font-bold ml-2 ${s.score >= courseConfig.thresholds.gradeB ? 'text-green-600' : 'text-yellow-600'}`}>
                              {s.score}%
                            </span>
                          )}
                        </div>
                        {s.contentPreview && (
                          <p className="text-xs text-gray-600 line-clamp-3 mt-1">
                            {s.contentPreview}{s.contentPreview.length >= 200 ? '...' : ''}
                          </p>
                        )}
                        {s.feedback && (
                          <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                            {s.feedback.slice(0, 150)}{s.feedback.length > 150 ? '...' : ''}
                          </p>
                        )}
                        {!s.hasContent && (
                          <p className="text-xs text-gray-400 mt-1">Not started</p>
                        )}
                        {s.hasContent && s.score === null && (
                          <p className="text-xs text-blue-500 mt-1">Draft saved (Draft {s.draftNumber})</p>
                        )}
                        {s.score !== null && (
                          <p className="text-xs text-gray-400 mt-1">Draft {s.draftNumber}</p>
                        )}
                        {s.hasContent && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{s.wordCount} words</span>
                            {s.updatedAt && (
                              <>
                                <span>&middot;</span>
                                <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* ── Section 3: Quiz Performance ── */}
        <CollapsibleSection
          title="Quiz Performance"
          icon={<QuizIcon />}
          defaultOpen={false}
          badge={quizzes.length > 0 ? `${quizPassRate}% pass rate` : null}
          badgeColor={quizPassRate >= 80 ? 'bg-green-100 text-green-700' : quizPassRate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
        >
          {quizzes.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No quiz attempts yet.
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{quizzes.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{passedQuizzes.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${quizPassRate >= 80 ? 'text-green-600' : quizPassRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {quizPassRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pass Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${avgQuizScore >= 80 ? 'text-green-600' : avgQuizScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {avgQuizScore}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score</div>
                </div>
              </div>
              {/* Recent attempts table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Chapter</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Section</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Attempt</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Score</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Result</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {quizzes.slice(0, 20).map((q, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Ch {q.chapter_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{q.section_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center">#{q.attempt_number}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${getScoreColor(q.score)}`}>
                            {q.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {q.passed ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Pass</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Fail</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 text-right">
                          {new Date(q.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {quizzes.length > 20 && (
                <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                  Showing 20 of {quizzes.length} attempts
                </div>
              )}
            </>
          )}
        </CollapsibleSection>

        {/* ── Section 4: Written Responses ── */}
        <CollapsibleSection
          title="Written Responses"
          icon={<PencilIcon />}
          defaultOpen={false}
          badge={freeTexts.length > 0 ? freeTexts.length : null}
          badgeColor="bg-teal-100 text-teal-700"
        >
          {freeTexts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No written responses yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {freeTexts.slice(0, 15).map((ft, i) => {
                const ftScore = ft.ai_evaluation?.score ?? null;
                return (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        Ch {ft.chapter_id} &middot; {ft.section_id}
                      </span>
                      {ftScore !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          ftScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          ftScore >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {ftScore}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(ft.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Student response */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {ft.response_text.length > 300 ? ft.response_text.slice(0, 300) + '...' : ft.response_text}
                    </p>
                  </div>
                  {/* AI Feedback */}
                  {ft.ai_evaluation && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                      <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">AI Feedback</p>
                      <p className="text-xs text-indigo-900/70 dark:text-indigo-200/70 line-clamp-2">
                        {ft.ai_evaluation.feedback || JSON.stringify(ft.ai_evaluation).slice(0, 200)}
                      </p>
                    </div>
                  )}
                </div>
                );
              })}
              {freeTexts.length > 15 && (
                <div className="px-4 py-2 text-xs text-gray-400 text-center">
                  Showing 15 of {freeTexts.length} responses
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* ── Section 5: AI Interactions ── */}
        <CollapsibleSection
          title="AI Interactions"
          icon={<AIIcon />}
          defaultOpen={false}
          badge={aiInteractions.length > 0 ? `${aiInteractions.length}${aiInteractions.length >= 50 ? '+' : ''}` : null}
          badgeColor="bg-amber-100 text-amber-700"
        >
          {aiInteractions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No AI interactions yet.
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
                {Array.from(aiByType.entries()).map(([type, count]) => {
                  const config = AI_TYPE_CONFIG[type] || { label: type, color: 'bg-gray-100 text-gray-600', icon: '•' };
                  return (
                    <span key={type} className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                      {config.icon} {config.label}: {count}
                    </span>
                  );
                })}
                {totalTokens > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {totalTokens.toLocaleString()} tokens used
                  </span>
                )}
              </div>
              {/* Interaction list */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {aiInteractions.slice(0, 25).map((ai) => {
                  const config = AI_TYPE_CONFIG[ai.interaction_type] || { label: ai.interaction_type, color: 'bg-gray-100 text-gray-600', icon: '•' };
                  const context = ai.context || {};
                  const contextStr = [
                    context.chapterId ? `Ch ${context.chapterId}` : null,
                    context.sectionId || null,
                    context.blockTitle || context.type || null,
                  ].filter(Boolean).join(' · ');

                  return (
                    <div key={ai.id} className="p-4">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                          {contextStr && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{contextStr}</span>
                          )}
                          {ai.tokens_used && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">{ai.tokens_used.toLocaleString()} tokens</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatRelativeTime(ai.created_at)}</span>
                      </div>
                      {/* Prompt */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Prompt</p>
                        <p className="text-xs text-blue-900/70 dark:text-blue-200/70 line-clamp-2">
                          {ai.prompt_sent.length > 300 ? ai.prompt_sent.slice(0, 300) + '...' : ai.prompt_sent}
                        </p>
                      </div>
                      {/* Response */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">AI Response</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                          {ai.response_received.length > 400 ? ai.response_received.slice(0, 400) + '...' : ai.response_received}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {aiInteractions.length > 25 && (
                <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100 dark:border-gray-700">
                  Showing 25 of {aiInteractions.length} interactions
                </div>
              )}
            </>
          )}
        </CollapsibleSection>

        {/* ── Section 6: Activity Timeline ── */}
        <CollapsibleSection
          title="Activity Timeline"
          icon={<ClockIcon />}
          defaultOpen={false}
          badge={studentActivities.length > 0 ? `${studentActivities.length} recent` : null}
          badgeColor="bg-gray-100 text-gray-600"
        >
          {studentActivities.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              <p>No activity recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Activity tracking may not be enabled for this student.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {studentActivities.map((activity, idx) => {
                  const activityDate = new Date(activity.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                  const prevDate = idx > 0 ? new Date(studentActivities[idx - 1].created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : null;
                  const showDateHeader = idx === 0 || activityDate !== prevDate;
                  const config = ACTIVITY_TYPE_CONFIG[activity.activity_type] || {
                    label: activity.activity_type,
                    color: 'bg-gray-100 text-gray-600',
                    icon: '\u2022',
                  };
                  const details = activity.details || {};
                  const detailParts: string[] = [];
                  if (details.section_name) detailParts.push(String(details.section_name));
                  if (details.chapter_id) detailParts.push(`Ch ${details.chapter_id}`);
                  if (details.score !== undefined) detailParts.push(`Score: ${details.score}%`);
                  if (details.page) detailParts.push(String(details.page));
                  if (details.assignment_id) detailParts.push(`Assignment ${details.assignment_id}`);
                  const detailStr = detailParts.join(' \u00b7 ');

                  return (
                    <div key={activity.id}>
                      {showDateHeader && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{activityDate}</span>
                        </div>
                      )}
                      <div className="px-4 py-3 flex items-start gap-3 relative">
                        <div className="w-8 flex-shrink-0 flex items-center justify-center relative z-10">
                          <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs" aria-hidden="true">
                            {config.icon}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
                          <div className="min-w-0">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
                              {config.label}
                            </span>
                            {detailStr && (
                              <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{detailStr}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatRelativeTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CollapsibleSection>
      </main>
    </div>
  );
}
