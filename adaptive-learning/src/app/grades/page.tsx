import { createClient } from '@/lib/supabase/server';
import { getAllChapters, getAllAssignments } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { SectionProgress, AssignmentDraft } from '@/lib/types';
import { courseConfig, COURSE_ID } from '@/lib/course.config';
import { getLetterGrade, getGradeColor, getGradeBg } from '@/lib/scoreUtils';

interface QuizAttempt {
  score: number;
  passed: boolean;
  chapter_id: number;
  section_id: string;
}

interface DraftRow {
  assignment_id: number;
  section_key: string;
  draft_number: number;
  ai_feedback: AssignmentDraft['ai_feedback'];
}

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Role-based redirect: instructors go to instructor gradebook
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (['instructor', 'admin', 'super_admin'].includes(userProfile?.role)) {
    redirect('/instructor/gradebook');
  }

  const chapters = getAllChapters();
  const assignments = getAllAssignments();

  // Load all data in parallel
  const [
    { data: progressData },
    { data: quizData },
    { data: assignmentDraftsData },
  ] = await Promise.all([
    supabase.from('section_progress').select('*').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('quiz_attempts').select('score, passed, chapter_id, section_id').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('assignment_drafts').select('assignment_id, section_key, draft_number, ai_feedback').eq('user_id', user.id).eq('course_id', COURSE_ID),
  ]);

  const quizAttempts = (quizData || []) as QuizAttempt[];

  // Total sections for certificate check
  const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  const totalCompletedSections = (progressData || []).filter(
    (p: SectionProgress) => p.status === 'completed'
  ).length;

  // ============================================================
  // 1. CHAPTER MASTERY (40%) - Average mastery score across all completed sections
  // ============================================================
  const masteryScores = (progressData || [])
    .filter((p: SectionProgress) => p.mastery_score !== null && p.mastery_score !== undefined)
    .map((p: SectionProgress) => p.mastery_score as number);
  const avgMastery = masteryScores.length > 0
    ? masteryScores.reduce((sum, s) => sum + s, 0) / masteryScores.length
    : null;

  // Per-chapter mastery data
  const chapterGrades = chapters.map(ch => {
    const chapterProgress = (progressData || []).filter(
      (p: SectionProgress) => p.chapter_id === ch.chapterId
    );
    const completedSections = chapterProgress.filter(
      (p: SectionProgress) => p.status === 'completed'
    ).length;
    const chMastery = chapterProgress
      .filter((p: SectionProgress) => p.mastery_score !== null && p.mastery_score !== undefined)
      .map((p: SectionProgress) => p.mastery_score as number);
    const avgChMastery = chMastery.length > 0
      ? Math.round(chMastery.reduce((s, v) => s + v, 0) / chMastery.length)
      : null;

    // Average best gate quiz score per section for this chapter
    const chapterQuizzes = quizAttempts.filter(q => q.chapter_id === ch.chapterId);
    const bestBySection = new Map<string, number>();
    chapterQuizzes.forEach(q => {
      const existing = bestBySection.get(q.section_id);
      if (existing === undefined || q.score > existing) {
        bestBySection.set(q.section_id, q.score);
      }
    });
    const sectionBestScores = Array.from(bestBySection.values());
    const bestQuizScore = sectionBestScores.length > 0
      ? sectionBestScores.reduce((sum, s) => sum + s, 0) / sectionBestScores.length
      : null;

    return {
      chapterId: ch.chapterId,
      title: ch.title,
      totalSections: ch.sections.length,
      completedSections,
      mastery: avgChMastery,
      quizScore: bestQuizScore !== null ? Math.round(bestQuizScore) : null,
    };
  });

  // ============================================================
  // 2. QUIZ SCORES (30%) - Average of best gate quiz scores per chapter
  // ============================================================
  const quizScoresByChapter = chapterGrades
    .filter(ch => ch.quizScore !== null)
    .map(ch => ch.quizScore as number);
  const avgQuiz = quizScoresByChapter.length > 0
    ? quizScoresByChapter.reduce((sum, s) => sum + s, 0) / quizScoresByChapter.length
    : null;

  // ============================================================
  // 3. ASSIGNMENTS (30%) - Average of all 4 assignment scores
  // ============================================================
  const assignmentGrades = assignments.map(a => {
    const drafts = (assignmentDraftsData || []).filter(
      (d: DraftRow) => d.assignment_id === a.assignmentId
    );
    // Get latest draft per section
    const latestBySection = new Map<string, DraftRow>();
    drafts.forEach((d: DraftRow) => {
      const existing = latestBySection.get(d.section_key);
      if (!existing || d.draft_number > existing.draft_number) {
        latestBySection.set(d.section_key, d);
      }
    });
    const withFeedback = Array.from(latestBySection.values()).filter(d => d.ai_feedback);
    const scores = withFeedback.map(d => d.ai_feedback?.score || 0);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null;

    return {
      assignmentId: a.assignmentId,
      title: a.title,
      totalSections: a.sections.length,
      submittedSections: withFeedback.length,
      avgScore,
    };
  });

  const assignmentScores = assignmentGrades
    .filter(a => a.avgScore !== null)
    .map(a => a.avgScore as number);
  const avgAssignment = assignmentScores.length > 0
    ? assignmentScores.reduce((sum, s) => sum + s, 0) / assignmentScores.length
    : null;

  // ============================================================
  // FINAL GRADE CALCULATION
  // ============================================================
  const hasAnyGrade = avgMastery !== null || avgQuiz !== null || avgAssignment !== null;
  const masteryComponent = avgMastery !== null ? avgMastery * 0.4 : 0;
  const quizComponent = avgQuiz !== null ? avgQuiz * 0.3 : 0;
  const assignmentComponent = avgAssignment !== null ? avgAssignment * 0.3 : 0;
  const finalGrade = hasAnyGrade ? masteryComponent + quizComponent + assignmentComponent : null;
  const letterGrade = finalGrade !== null ? getLetterGrade(Math.round(finalGrade)) : null;

  // Sign out handler
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';

  // Check if all sections are complete (for certificate link)
  const allSectionsComplete = totalCompletedSections >= totalSections && totalSections > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">My Gradebook</h1>
              <p className="text-blue-200 text-sm">{courseConfig.title}</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {finalGrade !== null && letterGrade && (
                <div className="text-right">
                  <div className="text-3xl font-bold">{letterGrade}</div>
                  <div className="text-blue-200 text-sm">{Math.round(finalGrade)}%</div>
                </div>
              )}
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm text-blue-200">Hi, {displayName}</span>
                <form action={signOut}>
                  <button type="submit" className="text-sm text-blue-200 hover:text-white transition-colors">
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link
            href="/chapters"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Certificate Link */}
        {allSectionsComplete && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg aria-hidden="true" className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Course Complete!</h3>
                <p className="text-xs text-amber-700">You&apos;ve completed all sections. Your certificate is ready.</p>
              </div>
            </div>
            <Link
              href="/certificate"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              View Certificate
            </Link>
          </div>
        )}

        {/* Final Grade Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Final Grade</h2>
          {finalGrade !== null && letterGrade ? (
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-2 ${getGradeBg(letterGrade)}`}>
                {letterGrade}
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{Math.round(finalGrade)}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weighted Final Grade</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p>No grades recorded yet. Complete sections, quizzes, and assignments to see your grade.</p>
            </div>
          )}

          {/* Grade Breakdown */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Grade Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg aria-hidden="true" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Chapter Mastery</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">40% weight</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {avgMastery !== null ? `${Math.round(avgMastery)}%` : '\u2014'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {avgMastery !== null ? `${(avgMastery * 0.4).toFixed(1)} pts` : '\u2014'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg aria-hidden="true" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Quiz Scores</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">30% weight</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {avgQuiz !== null ? `${Math.round(avgQuiz)}%` : '\u2014'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {avgQuiz !== null ? `${(avgQuiz * 0.3).toFixed(1)} pts` : '\u2014'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg aria-hidden="true" className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Assignments</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">30% weight</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {avgAssignment !== null ? `${Math.round(avgAssignment)}%` : '\u2014'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {avgAssignment !== null ? `${(avgAssignment * 0.3).toFixed(1)} pts` : '\u2014'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter-by-Chapter Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chapter Grades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Chapter</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Sections</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Mastery</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Quiz Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {chapterGrades.map(ch => (
                  <tr key={ch.chapterId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Ch {ch.chapterId}: {ch.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                      {ch.completedSections}/{ch.totalSections}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ch.mastery !== null ? (
                        <span className={`text-sm font-medium ${
                          ch.mastery >= courseConfig.thresholds.gradeA ? 'text-green-600' :
                          ch.mastery >= courseConfig.thresholds.gradeB ? 'text-blue-600' :
                          ch.mastery >= courseConfig.thresholds.gradeC ? 'text-yellow-600' :
                          ch.mastery >= courseConfig.thresholds.gradeD ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {ch.mastery}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">{'\u2014'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ch.quizScore !== null ? (
                        <span className={`text-sm font-medium ${
                          ch.quizScore >= courseConfig.thresholds.gradeA ? 'text-green-600' :
                          ch.quizScore >= courseConfig.thresholds.gradeB ? 'text-blue-600' :
                          ch.quizScore >= courseConfig.thresholds.gradeC ? 'text-yellow-600' :
                          ch.quizScore >= courseConfig.thresholds.gradeD ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {ch.quizScore}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">{'\u2014'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignment Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment Grades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Assignment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Sections Submitted</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Average Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {assignmentGrades.map(a => (
                  <tr key={a.assignmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                      {a.submittedSections}/{a.totalSections}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.avgScore !== null ? (
                        <span className={`text-sm font-medium ${
                          a.avgScore >= courseConfig.thresholds.gradeA ? 'text-green-600' :
                          a.avgScore >= courseConfig.thresholds.gradeB ? 'text-blue-600' :
                          a.avgScore >= courseConfig.thresholds.gradeC ? 'text-yellow-600' :
                          a.avgScore >= courseConfig.thresholds.gradeD ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {a.avgScore}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">{'\u2014'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Scale Reference */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Grade Scale</h3>
          <div className="flex flex-wrap gap-3">
            <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">A: 90-100</span>
            <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">B: 80-89</span>
            <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">C: 70-79</span>
            <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">D: 60-69</span>
            <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">F: Below 60</span>
          </div>
        </div>
      </main>
    </div>
  );
}
