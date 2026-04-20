import { createClient } from '@/lib/supabase/server';
import { getAllChapters, getAllAssignments } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { SectionProgress, AssignmentDraft } from '@/lib/types';
import PrintButton from './PrintButton';
import DownloadPDFButton from '@/components/DownloadPDFButton';
import { courseConfig, COURSE_ID } from '@/lib/course.config';
import { getLetterGrade } from '@/lib/scoreUtils';

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

export default async function CertificatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const chapters = getAllChapters();
  const assignments = getAllAssignments();
  const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);

  // Load progress and grade data in parallel
  const [
    { data: progressData },
    { data: quizData },
    { data: assignmentDraftsData },
  ] = await Promise.all([
    supabase.from('section_progress').select('*').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('quiz_attempts').select('score, passed, chapter_id, section_id').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('assignment_drafts').select('assignment_id, section_key, draft_number, ai_feedback').eq('user_id', user.id).eq('course_id', COURSE_ID),
  ]);

  const completedSections = (progressData || []).filter(
    (p: SectionProgress) => p.status === 'completed'
  ).length;

  const allSectionsComplete = completedSections >= totalSections;

  // Check all assignments have at least 1 graded section
  const ungradedAssignments: number[] = [];
  assignments.forEach(a => {
    const drafts = (assignmentDraftsData || []).filter(
      (d: DraftRow) => d.assignment_id === a.assignmentId
    );
    const hasGraded = drafts.some((d: DraftRow) => d.ai_feedback);
    if (!hasGraded) ungradedAssignments.push(a.assignmentId);
  });
  const allAssignmentsGraded = ungradedAssignments.length === 0 && assignments.length > 0;

  // Check portfolio submitted
  const portfolioSubmitted = (assignmentDraftsData || []).some(
    (d: DraftRow) => d.assignment_id === 0 && d.section_key === 'portfolio-submitted'
  );

  const allComplete = allSectionsComplete && allAssignmentsGraded && portfolioSubmitted;

  if (!allComplete) {
    // Build remaining items list
    const remainingItems: string[] = [];
    if (!allSectionsComplete) {
      remainingItems.push(`Complete all sections (${completedSections}/${totalSections} done)`);
    }
    if (ungradedAssignments.length > 0) {
      remainingItems.push(`Submit Assignment${ungradedAssignments.length > 1 ? 's' : ''} ${ungradedAssignments.join(', ')}`);
    }
    if (!portfolioSubmitted) {
      remainingItems.push('Submit your Final Business Plan (capstone)');
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg aria-hidden="true" className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Certificate Not Yet Available</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete the following to earn your certificate:
          </p>
          <ul className="text-left space-y-2 mb-6">
            {remainingItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          {allSectionsComplete && (
            <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-3 mb-6">
              <div className="bg-green-500 h-3 rounded-full w-full" />
            </div>
          )}
          {!allSectionsComplete && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                role="progressbar"
                aria-valuenow={Math.round((completedSections / totalSections) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${completedSections} of ${totalSections} sections completed`}
                style={{ width: `${Math.round((completedSections / totalSections) * 100)}%` }}
              />
            </div>
          )}
          <Link
            href="/chapters"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate final grade (same as gradebook)
  const quizAttempts = (quizData || []) as QuizAttempt[];
  const masteryScores = (progressData || [])
    .filter((p: SectionProgress) => p.mastery_score !== null && p.mastery_score !== undefined)
    .map((p: SectionProgress) => p.mastery_score as number);
  const avgMastery = masteryScores.length > 0
    ? masteryScores.reduce((sum, s) => sum + s, 0) / masteryScores.length
    : null;

  // Average best gate quiz score per section, grouped by chapter
  const chapterQuizScores = chapters.map(ch => {
    const chQuizzes = quizAttempts.filter(q => q.chapter_id === ch.chapterId);
    const bestBySection = new Map<string, number>();
    chQuizzes.forEach(q => {
      const existing = bestBySection.get(q.section_id);
      if (existing === undefined || q.score > existing) {
        bestBySection.set(q.section_id, q.score);
      }
    });
    const sectionBests = Array.from(bestBySection.values());
    return sectionBests.length > 0
      ? sectionBests.reduce((s, v) => s + v, 0) / sectionBests.length
      : null;
  }).filter((s): s is number => s !== null);

  const avgQuiz = chapterQuizScores.length > 0
    ? chapterQuizScores.reduce((sum, s) => sum + s, 0) / chapterQuizScores.length
    : null;

  // Assignment scores
  const assignmentScores = assignments.map(a => {
    const drafts = (assignmentDraftsData || []).filter(
      (d: DraftRow) => d.assignment_id === a.assignmentId
    );
    const latestBySection = new Map<string, DraftRow>();
    drafts.forEach((d: DraftRow) => {
      const existing = latestBySection.get(d.section_key);
      if (!existing || d.draft_number > existing.draft_number) {
        latestBySection.set(d.section_key, d);
      }
    });
    const withFeedback = Array.from(latestBySection.values()).filter(d => d.ai_feedback);
    const scores = withFeedback.map(d => d.ai_feedback?.score || 0);
    return scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null;
  }).filter((s): s is number => s !== null);

  const avgAssignment = assignmentScores.length > 0
    ? assignmentScores.reduce((sum, s) => sum + s, 0) / assignmentScores.length
    : null;

  const hasAnyGrade = avgMastery !== null || avgQuiz !== null || avgAssignment !== null;
  const masteryComponent = avgMastery !== null ? avgMastery * 0.4 : 0;
  const quizComponent = avgQuiz !== null ? avgQuiz * 0.3 : 0;
  const assignmentComponent = avgAssignment !== null ? avgAssignment * 0.3 : 0;
  const finalGrade = hasAnyGrade ? masteryComponent + quizComponent + assignmentComponent : null;
  const letterGrade = finalGrade !== null ? getLetterGrade(Math.round(finalGrade)) : null;

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';

  // Find completion date (latest completed_at)
  const completionDates = (progressData || [])
    .filter((p: SectionProgress) => p.completed_at)
    .map((p: SectionProgress) => new Date(p.completed_at!).getTime());
  const completionDate = completionDates.length > 0
    ? new Date(Math.max(...completionDates))
    : new Date();

  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white">
      {/* Screen-only controls */}
      <div className="print:hidden max-w-4xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/chapters"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <DownloadPDFButton
            targetSelector="#certificate-content"
            filename={`certificate-${courseConfig.title.toLowerCase().replace(/\s+/g, '-')}`}
            label="Download PDF"
          />
          <PrintButton />
        </div>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto px-4 pb-8 print:px-0 print:pb-0 print:max-w-none">
        <div id="certificate-content" className="bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none overflow-hidden">
          {/* Outer decorative border */}
          <div className="border-[12px] border-amber-500/20 m-4 print:m-0 print:border-[16px]">
            {/* Inner decorative border */}
            <div className="border-2 border-navy-800 p-6 sm:p-12 print:p-16" style={{ borderColor: '#1e3a5f' }}>
              {/* Corner ornaments */}
              <div className="relative" aria-label="Certificate of completion" role="region">
                {/* Top decorative line */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <div className="mx-4">
                    <svg aria-hidden="true" className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </div>

                {/* Certificate content */}
                <div className="text-center">
                  <h2 className="text-sm font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}>
                    This is to certify that
                  </h2>

                  <div className="my-6">
                    <h1
                      className="text-3xl sm:text-5xl font-bold mb-2"
                      style={{
                        color: '#1e3a5f',
                        fontFamily: 'Georgia, "Times New Roman", serif',
                      }}
                    >
                      {displayName}
                    </h1>
                    <div className="w-64 h-px bg-amber-400 mx-auto" />
                  </div>

                  <p className="text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: '#374151', fontFamily: 'Georgia, serif' }}>
                    has successfully completed all requirements of the
                  </p>

                  <h2
                    className="text-2xl sm:text-4xl font-bold mb-2"
                    style={{
                      color: '#1e3a5f',
                      fontFamily: 'Georgia, "Times New Roman", serif',
                    }}
                  >
                    {courseConfig.title}
                  </h2>
                  <p className="text-lg mb-8" style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>
                    {courseConfig.subtitle}
                  </p>

                  <p className="text-sm max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>
                    This certifies that {displayName} has successfully completed all {totalSections} sections
                    of the {courseConfig.title} adaptive learning course, demonstrating proficiency
                    in the course material.
                  </p>

                  {/* Grade display */}
                  {finalGrade !== null && letterGrade && (
                    <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 flex-wrap">
                      <div className="text-center">
                        <div
                          className="text-4xl font-bold"
                          style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}
                        >
                          {letterGrade}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Final Grade</div>
                      </div>
                      <div className="w-px h-12 bg-gray-300" />
                      <div className="text-center">
                        <div
                          className="text-4xl font-bold"
                          style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}
                        >
                          {Math.round(finalGrade)}%
                        </div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Score</div>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="mb-8">
                    <div className="text-sm" style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>
                      Awarded on
                    </div>
                    <div
                      className="text-lg font-semibold mt-1"
                      style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}
                    >
                      {formattedDate}
                    </div>
                  </div>

                  {/* Signature line */}
                  <div className="flex items-end justify-center gap-8 sm:gap-16 mt-12 flex-wrap">
                    <div className="text-center">
                      <div className="w-48 border-b border-gray-400 mb-2" />
                      <div className="text-xs uppercase tracking-wider text-gray-500">Instructor</div>
                    </div>
                    <div className="text-center">
                      <div className="w-48 border-b border-gray-400 mb-2" />
                      <div className="text-xs uppercase tracking-wider text-gray-500">Date</div>
                    </div>
                  </div>
                </div>

                {/* Verification code */}
                <div className="mt-8 text-center">
                  <p className="text-[10px] tracking-wider text-gray-400" style={{ fontFamily: 'monospace' }}>
                    Verification ID: {user.id.slice(0, 8).toUpperCase()}-{Math.abs(completionDate.getTime() % 9999).toString().padStart(4, '0')}
                  </p>
                </div>

                {/* Bottom decorative line */}
                <div className="flex items-center justify-center mt-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <div className="mx-4">
                    <svg aria-hidden="true" className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="print:hidden max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Share Your Achievement</h3>
          <div className="flex justify-center gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(`I completed ${courseConfig.title}!`)}&summary=${encodeURIComponent(`I earned a ${letterGrade || ''} (${finalGrade ? Math.round(finalGrade) : ''}%) in ${courseConfig.title} - ${courseConfig.subtitle}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
