import { createClient } from '@/lib/supabase/server';
import { getAllChapters, getAllAssignments } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GradebookTable from './GradebookTable';
import { courseConfig, COURSE_ID } from '@/lib/course.config';
import { getLetterGrade } from '@/lib/scoreUtils';

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
}

interface ProgressRow {
  user_id: string;
  chapter_id: number;
  section_id: string;
  status: string;
  mastery_score: number | null;
}

interface QuizRow {
  user_id: string;
  score: number;
  passed: boolean;
  chapter_id: number;
  section_id: string;
}

interface DraftRow {
  user_id: string;
  assignment_id: number;
  section_key: string;
  draft_number: number;
  ai_feedback: { score: number } | null;
}

export default async function InstructorGradebook() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verify instructor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
    redirect('/chapters');
  }

  const chapters = getAllChapters();
  const assignments = getAllAssignments();

  // Load all course-scoped student data
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

  let studentList: StudentRow[] = [];
  if (courseUserIds.size > 0) {
    const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', Array.from(courseUserIds)).order('full_name');
    studentList = (data || []) as StudentRow[];
  }
  const progressList = (allProgress || []) as ProgressRow[];
  const quizList = (allQuizzes || []) as QuizRow[];
  const draftList = (allDrafts || []) as DraftRow[];

  // Calculate grades for each student
  const studentGrades = studentList.map(student => {
    // 1. MASTERY (40%) - Average mastery across completed sections
    const progress = progressList.filter(p => p.user_id === student.id);
    const masteryScores = progress
      .filter(p => p.mastery_score !== null && p.mastery_score !== undefined)
      .map(p => p.mastery_score as number);
    const avgMastery = masteryScores.length > 0
      ? Math.round(masteryScores.reduce((s, v) => s + v, 0) / masteryScores.length)
      : null;

    // 2. QUIZ SCORES (30%) - Average of best gate quiz scores per section, grouped by chapter
    const studentQuizzes = quizList.filter(q => q.user_id === student.id);
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
    const avgQuiz = chapterQuizScores.length > 0
      ? Math.round(chapterQuizScores.reduce((s, v) => s + v, 0) / chapterQuizScores.length)
      : null;

    // 3. ASSIGNMENTS (30%) - Average of assignment scores
    const studentDrafts = draftList.filter(d => d.user_id === student.id);
    const assignmentScores: number[] = [];
    assignments.forEach(a => {
      const aDrafts = studentDrafts.filter(d => d.assignment_id === a.assignmentId);
      const latestBySection = new Map<string, DraftRow>();
      aDrafts.forEach(d => {
        const existing = latestBySection.get(d.section_key);
        if (!existing || d.draft_number > existing.draft_number) {
          latestBySection.set(d.section_key, d);
        }
      });
      const withFeedback = Array.from(latestBySection.values()).filter(d => d.ai_feedback);
      const scores = withFeedback.map(d => d.ai_feedback?.score || 0);
      if (scores.length > 0) {
        assignmentScores.push(Math.round(scores.reduce((s, v) => s + v, 0) / scores.length));
      }
    });
    const avgAssignment = assignmentScores.length > 0
      ? Math.round(assignmentScores.reduce((s, v) => s + v, 0) / assignmentScores.length)
      : null;

    // FINAL GRADE
    const hasAnyGrade = avgMastery !== null || avgQuiz !== null || avgAssignment !== null;
    const masteryComponent = avgMastery !== null ? avgMastery * 0.4 : 0;
    const quizComponent = avgQuiz !== null ? avgQuiz * 0.3 : 0;
    const assignmentComponent = avgAssignment !== null ? avgAssignment * 0.3 : 0;
    const finalGrade = hasAnyGrade ? Math.round(masteryComponent + quizComponent + assignmentComponent) : null;
    const letterGrade = finalGrade !== null ? getLetterGrade(finalGrade) : null;

    return {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      avgMastery,
      avgQuiz,
      avgAssignment,
      finalGrade,
      letterGrade,
    };
  });

  // Class-level summary
  const gradedStudents = studentGrades.filter(s => s.finalGrade !== null);
  const classAvgGrade = gradedStudents.length > 0
    ? Math.round(gradedStudents.reduce((s, st) => s + (st.finalGrade || 0), 0) / gradedStudents.length)
    : null;

  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  gradedStudents.forEach(s => {
    if (s.letterGrade) {
      gradeDistribution[s.letterGrade as keyof typeof gradeDistribution]++;
    }
  });

  // Sign out handler
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gradebook</h1>
              <p className="text-indigo-200 text-sm">{courseConfig.title} &bull; Final Grade Report</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/instructor"
                className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Back to Dashboard
              </Link>
              <a
                href="/api/instructor/export"
                className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Export CSV
              </a>
              <form action={signOut}>
                <button type="submit" className="text-sm text-indigo-200 hover:text-white transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{studentGrades.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Students</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {classAvgGrade !== null ? `${classAvgGrade}%` : '\u2014'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Class Average</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{gradedStudents.length}</div>
            <div className="text-xs text-gray-500 mt-1">Students Graded</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {classAvgGrade !== null ? getLetterGrade(classAvgGrade) : '\u2014'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Class Letter Grade</div>
          </div>
        </div>

        {/* Grade Distribution */}
        {gradedStudents.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Grade Distribution</h3>
            <div className="flex items-end gap-3 h-24">
              {Object.entries(gradeDistribution).map(([letter, count]) => {
                const maxCount = Math.max(...Object.values(gradeDistribution), 1);
                const height = (count / maxCount) * 100;
                const colors: Record<string, string> = {
                  A: 'bg-green-500',
                  B: 'bg-blue-500',
                  C: 'bg-yellow-500',
                  D: 'bg-orange-500',
                  F: 'bg-red-500',
                };
                return (
                  <div key={letter} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700">{count}</span>
                    <div
                      className={`w-full rounded-t-md ${colors[letter]} transition-all`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs font-bold text-gray-600">{letter}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Student Grades Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Grades</h2>
            <p className="text-sm text-gray-500 mt-1">
              Weighted: Mastery 40% + Quiz 30% + Assignment 30%
            </p>
          </div>
          <GradebookTable students={studentGrades} />
        </div>
      </main>
    </div>
  );
}
