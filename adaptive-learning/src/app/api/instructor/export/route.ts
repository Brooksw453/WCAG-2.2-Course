import { createClient } from '@/lib/supabase/server';
import { getAllChapters, getAllAssignments } from '@/lib/content';
import { NextResponse } from 'next/server';
import { COURSE_ID } from '@/lib/course.config';
import { getLetterGrade } from '@/lib/scoreUtils';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify instructor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const chapters = getAllChapters();
  const assignments = getAllAssignments();
  const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);

  // Load all data
  // Load all course-scoped data
  const [
    { data: allProgress },
    { data: allQuizzes },
    { data: allDrafts },
  ] = await Promise.all([
    supabase.from('section_progress').select('user_id, chapter_id, section_id, status, mastery_score').eq('course_id', COURSE_ID),
    supabase.from('quiz_attempts').select('user_id, score, passed, chapter_id, section_id').eq('course_id', COURSE_ID),
    supabase.from('assignment_drafts').select('user_id, assignment_id, section_key, draft_number, ai_feedback').eq('course_id', COURSE_ID),
  ]);

  // Get students who have activity in THIS course
  const courseUserIds = new Set<string>();
  (allProgress || []).forEach((p: { user_id: string }) => courseUserIds.add(p.user_id));
  (allQuizzes || []).forEach((q: { user_id: string }) => courseUserIds.add(q.user_id));
  (allDrafts || []).forEach((d: { user_id: string }) => courseUserIds.add(d.user_id));

  let studentList: { id: string; full_name: string; email: string }[] = [];
  if (courseUserIds.size > 0) {
    const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', Array.from(courseUserIds)).order('full_name');
    studentList = data || [];
  }

  // Build CSV header
  const assignmentHeaders = assignments.map(a => `Assignment ${a.assignmentId} Avg`).join(',');
  const header = `Student Name,Email,Sections Completed,Total Sections,Progress %,Avg Mastery %,Avg Quiz %,${assignmentHeaders},Mastery Avg (40%),Quiz Avg (30%),Assignment Avg (30%),Final Grade (%),Letter Grade`;

  // Build CSV rows
  const rows = studentList.map(student => {
    const progress = (allProgress || []).filter((p: { user_id: string }) => p.user_id === student.id);
    const completed = progress.filter((p: { status: string }) => p.status === 'completed').length;
    const masteryScores = progress
      .filter((p: { mastery_score: number | null }) => p.mastery_score !== null)
      .map((p: { mastery_score: number | null }) => p.mastery_score as number);
    const avgMastery = masteryScores.length > 0
      ? Math.round(masteryScores.reduce((s: number, v: number) => s + v, 0) / masteryScores.length)
      : 0;

    const quizzes = (allQuizzes || []).filter((q: { user_id: string }) => q.user_id === student.id);
    const passedQuizzes = quizzes.filter((q: { passed: boolean }) => q.passed);
    const avgQuiz = passedQuizzes.length > 0
      ? Math.round(passedQuizzes.reduce((s: number, q: { score: number }) => s + q.score, 0) / passedQuizzes.length)
      : 0;

    const progressPercent = Math.round((completed / totalSections) * 100);

    // Per-assignment averages
    const assignmentAvgs = assignments.map(a => {
      const aDrafts = (allDrafts || []).filter((d: { user_id: string; assignment_id: number }) => d.user_id === student.id && d.assignment_id === a.assignmentId);
      const latestDrafts = new Map<string, { draft_number: number; ai_feedback: { score: number } | null }>();
      aDrafts.forEach((d: { section_key: string; draft_number: number; ai_feedback: { score: number } | null }) => {
        const existing = latestDrafts.get(d.section_key);
        if (!existing || d.draft_number > existing.draft_number) {
          latestDrafts.set(d.section_key, d);
        }
      });
      const scores = Array.from(latestDrafts.values())
        .filter(d => d.ai_feedback?.score)
        .map(d => d.ai_feedback!.score);
      return scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : 0;
    });

    // --- Final grade calculation (weighted) ---
    // Mastery Avg (40%): average mastery across completed sections
    const masteryAvgForGrade = masteryScores.length > 0
      ? Math.round(masteryScores.reduce((s, v) => s + v, 0) / masteryScores.length)
      : null;

    // Quiz Avg (30%): average of best gate quiz scores per section, grouped by chapter
    const studentQuizzes = (allQuizzes || []).filter(
      (q: { user_id: string }) => q.user_id === student.id
    ) as Array<{ user_id: string; score: number; passed: boolean; chapter_id: number; section_id: string }>;
    const chapterQuizScores: number[] = [];
    chapters.forEach(ch => {
      const chQuizzes = studentQuizzes.filter(q => q.chapter_id === ch.chapterId);
      const bestBySection = new Map<string, number>();
      chQuizzes.forEach(q => {
        const existing = bestBySection.get(q.section_id);
        if (existing === undefined || q.score > existing) {
          bestBySection.set(q.section_id, q.score);
        }
      });
      const sectionBests = Array.from(bestBySection.values());
      if (sectionBests.length > 0) {
        chapterQuizScores.push(sectionBests.reduce((s, v) => s + v, 0) / sectionBests.length);
      }
    });
    const quizAvgForGrade = chapterQuizScores.length > 0
      ? Math.round(chapterQuizScores.reduce((s, v) => s + v, 0) / chapterQuizScores.length)
      : null;

    // Assignment Avg (30%): average of per-assignment averages
    const assignmentScoresForGrade = assignmentAvgs.filter(s => s > 0);
    const assignmentAvgForGrade = assignmentScoresForGrade.length > 0
      ? Math.round(assignmentScoresForGrade.reduce((s, v) => s + v, 0) / assignmentScoresForGrade.length)
      : null;

    // Final weighted grade
    const hasAnyGrade = masteryAvgForGrade !== null || quizAvgForGrade !== null || assignmentAvgForGrade !== null;
    const masteryComponent = masteryAvgForGrade !== null ? masteryAvgForGrade * 0.4 : 0;
    const quizComponent = quizAvgForGrade !== null ? quizAvgForGrade * 0.3 : 0;
    const assignmentComponent = assignmentAvgForGrade !== null ? assignmentAvgForGrade * 0.3 : 0;
    const finalGrade = hasAnyGrade ? Math.round(masteryComponent + quizComponent + assignmentComponent) : '';
    const letterGrade = finalGrade !== '' ? getLetterGrade(finalGrade as number) : '';

    const escapedName = `"${(student.full_name || '').replace(/"/g, '""')}"`;
    const escapedEmail = `"${(student.email || '').replace(/"/g, '""')}"`;

    return `${escapedName},${escapedEmail},${completed},${totalSections},${progressPercent},${avgMastery},${avgQuiz},${assignmentAvgs.join(',')},${masteryAvgForGrade ?? ''},${quizAvgForGrade ?? ''},${assignmentAvgForGrade ?? ''},${finalGrade},${letterGrade}`;
  });

  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="grades-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
