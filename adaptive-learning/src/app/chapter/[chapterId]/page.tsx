import { createClient } from '@/lib/supabase/server';
import { getChapterMeta, getSectionContent, getAllChapters } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import type { SectionProgress } from '@/lib/types';
import { COURSE_ID } from '@/lib/course.config';

// Status indicator colors and labels
const statusConfig = {
  not_started: { color: 'bg-gray-200', label: 'Not Started', icon: '○' },
  in_progress: { color: 'bg-yellow-400', label: 'In Progress', icon: '◐' },
  needs_remediation: { color: 'bg-orange-400', label: 'Needs Review', icon: '◑' },
  completed: { color: 'bg-green-500', label: 'Completed', icon: '●' },
};

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId: chapterIdStr } = await params;
  const chapterId = parseInt(chapterIdStr, 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load chapter metadata and available chapters
  const chapter = getChapterMeta(chapterId);
  const allChapters = getAllChapters();
  const currentIndex = allChapters.findIndex(c => c.chapterId === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Load section titles
  const sections = chapter.sections.map((sectionId) => {
    const content = getSectionContent(chapterId, sectionId);
    return { sectionId, title: content.title };
  });

  // Load student progress for all sections in this chapter
  const { data: progressData } = await supabase
    .from('section_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', COURSE_ID)
    .eq('chapter_id', chapterId);

  const progressMap = new Map<string, SectionProgress>();
  (progressData || []).forEach((p: SectionProgress) => {
    progressMap.set(p.section_id, p);
  });

  // Determine which sections are unlocked
  // A section is unlocked if:
  // - It's the first section, OR
  // - The previous section is completed
  const sectionStates = sections.map((section, index) => {
    const progress = progressMap.get(section.sectionId);
    const status = progress?.status || 'not_started';

    let locked = false;
    if (index > 0) {
      const prevSection = sections[index - 1];
      const prevProgress = progressMap.get(prevSection.sectionId);
      locked = !prevProgress || prevProgress.status !== 'completed';
    }

    return {
      ...section,
      status,
      locked,
      masteryScore: progress?.mastery_score || null,
    };
  });

  const completedCount = sectionStates.filter((s) => s.status === 'completed').length;
  const totalSections = sectionStates.length;
  const progressPercent = Math.round((completedCount / totalSections) * 100);

  // Sign out handler needs to be a server action
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Chapter {chapterId}: {chapter.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{chapter.reading}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700" />
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Chapter Navigation Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {prevChapter ? (
              <Link
                href={`/chapter/${prevChapter.chapterId}`}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Ch {prevChapter.chapterId}</span>
              </Link>
            ) : (
              <span className="text-sm text-gray-400">&nbsp;</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <Link
              href="/chapters"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
              title="Course Dashboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
              </svg>
            </Link>
            <span className="text-gray-300 dark:text-gray-600 mx-0.5">|</span>
            {allChapters.map((ch) => (
              <Link
                key={ch.chapterId}
                href={`/chapter/${ch.chapterId}`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                  ch.chapterId === chapterId
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                }`}
                title={`Chapter ${ch.chapterId}: ${ch.title}`}
              >
                {ch.chapterId}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {nextChapter ? (
              <Link
                href={`/chapter/${nextChapter.chapterId}`}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span className="hidden sm:inline">Ch {nextChapter.chapterId}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="text-sm text-gray-400">&nbsp;</span>
            )}
          </div>
        </div>
      </div>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h2>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {completedCount} of {totalSections} sections complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-3">
            Learning Objectives
          </h3>
          <ul className="space-y-2">
            {chapter.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-200">
                <span className="mt-0.5 text-blue-500 flex-shrink-0">&bull;</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>

        {/* Section List */}
        <div className="space-y-3">
          {sectionStates.map((section) => {
            const config = statusConfig[section.status as keyof typeof statusConfig];

            return (
              <div
                key={section.sectionId}
                className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all ${
                  section.locked
                    ? 'border-gray-200 dark:border-gray-700 opacity-60'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                {section.locked ? (
                  <div className="p-5 flex items-center gap-4" aria-label="Locked section">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-400 dark:text-gray-500">
                        {section.sectionId} &mdash; {section.title}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Complete the previous section to unlock</p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/chapter/${chapterId}/${section.sectionId}`}
                    className="block p-5 flex items-center gap-4"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      section.status === 'completed' ? 'bg-green-500' :
                      section.status === 'in_progress' ? 'bg-yellow-500' :
                      section.status === 'needs_remediation' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {section.status === 'completed' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{section.sectionId}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {section.sectionId} &mdash; {section.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.label}
                        {section.masteryScore !== null && (
                          <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                            Mastery: {section.masteryScore}%
                          </span>
                        )}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Chapter Link */}
        {completedCount === totalSections && nextChapter && (
          <div className="mt-8 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <p className="text-green-800 dark:text-green-300 font-semibold mb-2">
              🎉 Chapter {chapterId} Complete!
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              Great work! You&apos;ve mastered all sections in this chapter.
            </p>
            <Link
              href={`/chapter/${nextChapter.chapterId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Continue to Chapter {nextChapter.chapterId}: {nextChapter.title}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
