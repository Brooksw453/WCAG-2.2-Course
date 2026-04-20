import { createClient } from '@/lib/supabase/server';
import { getSectionContent, getGateQuiz, getChapterMeta } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SectionLearningFlow from './SectionLearningFlow';
import { courseConfig, COURSE_ID } from '@/lib/course.config';
import ThemeToggle from '@/components/ThemeToggle';

export default async function SectionPage({
  params,
}: {
  params: Promise<{ chapterId: string; sectionId: string }>;
}) {
  const { chapterId: chapterIdStr, sectionId } = await params;
  const chapterId = parseInt(chapterIdStr, 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load content
  const section = getSectionContent(chapterId, sectionId);
  const quiz = getGateQuiz(chapterId, sectionId);
  const chapter = getChapterMeta(chapterId);

  // Check if this section is unlocked
  const sectionIndex = chapter.sections.indexOf(sectionId);
  if (sectionIndex > 0) {
    const prevSectionId = chapter.sections[sectionIndex - 1];
    const { data: prevProgress } = await supabase
      .from('section_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('chapter_id', chapterId)
      .eq('section_id', prevSectionId)
      .single();

    if (!prevProgress || prevProgress.status !== 'completed') {
      redirect(`/chapter/${chapterId}`);
    }
  }

  // Load current progress
  const { data: progress } = await supabase
    .from('section_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', COURSE_ID)
    .eq('chapter_id', chapterId)
    .eq('section_id', sectionId)
    .single();

  // Determine next and previous sections
  const prevSection = sectionIndex > 0 ? chapter.sections[sectionIndex - 1] : null;
  const nextSection = sectionIndex < chapter.sections.length - 1 ? chapter.sections[sectionIndex + 1] : null;

  // Check if student already passed the quiz for this section
  const { data: passedQuiz } = await supabase
    .from('quiz_attempts')
    .select('score')
    .eq('user_id', user.id)
    .eq('course_id', COURSE_ID)
    .eq('chapter_id', chapterId)
    .eq('section_id', sectionId)
    .eq('passed', true)
    .limit(1)
    .single();

  // Check if student already submitted a passing free-text response
  const { data: passedFreeText } = await supabase
    .from('free_text_responses')
    .select('ai_evaluation')
    .eq('user_id', user.id)
    .eq('course_id', COURSE_ID)
    .eq('chapter_id', chapterId)
    .eq('section_id', sectionId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  const hasPassedQuiz = !!passedQuiz;
  const hasPassedFreeText = passedFreeText?.ai_evaluation &&
    typeof passedFreeText.ai_evaluation === 'object' &&
    'score' in passedFreeText.ai_evaluation &&
    (passedFreeText.ai_evaluation as { score: number }).score >= courseConfig.thresholds.freeTextPass;

  // Mark section as started if not already
  if (!progress) {
    await supabase.from('section_progress').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      chapter_id: chapterId,
      section_id: sectionId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href={`/chapter/${chapterId}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Sections
            </Link>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chapter {chapterId}</p>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {sectionId} &mdash; {section.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <ThemeToggle compact className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700" />
            {prevSection && (
              <Link
                href={`/chapter/${chapterId}/${prevSection}`}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center dark:text-gray-300"
              >
                &larr; Prev
              </Link>
            )}
            {nextSection && progress?.status === 'completed' && (
              <Link
                href={`/chapter/${chapterId}/${nextSection}`}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        <SectionLearningFlow
          section={section}
          quiz={quiz}
          chapterId={chapterId}
          sectionId={sectionId}
          initialStatus={progress?.status || 'in_progress'}
          hasPassedQuiz={hasPassedQuiz}
          hasPassedFreeText={!!hasPassedFreeText}
          savedQuizScore={passedQuiz?.score || null}
          nextSectionUrl={nextSection ? `/chapter/${chapterId}/${nextSection}` : null}
          chapterUrl={`/chapter/${chapterId}`}
        />
      </main>
    </div>
  );
}
