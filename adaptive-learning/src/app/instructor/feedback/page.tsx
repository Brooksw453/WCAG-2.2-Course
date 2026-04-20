import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FeedbackFilter from './FeedbackFilter';
import { courseConfig, COURSE_ID } from '@/lib/course.config';

interface FeedbackRow {
  id: string;
  user_id: string;
  trigger_point: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default async function InstructorFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
    redirect('/chapters');
  }

  let feedbackList: FeedbackRow[] = [];
  try {
    const { data } = await supabase
      .from('student_feedback')
      .select('id, user_id, trigger_point, rating, comment, created_at, profiles(full_name)')
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false });
    if (data) {
      feedbackList = data as unknown as FeedbackRow[];
    }
  } catch {
    // Table may not exist yet
  }

  // Compute stats
  const totalFeedback = feedbackList.length;
  const avgRating = totalFeedback > 0
    ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalFeedback)
    : 0;

  // Rating distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackList.forEach(f => {
    distribution[f.rating] = (distribution[f.rating] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(distribution), 1);

  // Trigger point labels
  const triggerLabels: Record<string, string> = {
    'after-chapter-1': 'After Chapter 1',
    'after-assignment-1': 'After Assignment 1',
    'mid-course': 'Mid-Course (50%)',
    'near-end': 'Near End (90%)',
  };

  // Unique trigger points for filtering
  const triggerPoints = [...new Set(feedbackList.map(f => f.trigger_point))];

  // Satisfaction by course stage (for trends)
  const triggerOrder = ['after-chapter-1', 'after-assignment-1', 'mid-course', 'near-end'];
  const stageSatisfaction = triggerOrder
    .map(tp => {
      const items = feedbackList.filter(f => f.trigger_point === tp);
      if (items.length === 0) return null;
      const avg = items.reduce((s, f) => s + f.rating, 0) / items.length;
      return { trigger: tp, label: triggerLabels[tp] || tp, avg: Math.round(avg * 10) / 10, count: items.length };
    })
    .filter(Boolean) as { trigger: string; label: string; avg: number; count: number }[];

  // Sign out handler
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Student Feedback</h1>
              <p className="text-indigo-200 text-xs sm:text-sm">{courseConfig.title} -- {courseConfig.subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/instructor"
                className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Dashboard
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm text-indigo-200 hover:text-white transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {totalFeedback === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Feedback Yet</h2>
            <p className="text-gray-500 dark:text-gray-400">Student feedback will appear here as students progress through the course.</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Average Rating */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{avgRating.toFixed(1)}</div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      viewBox="0 0 24 24"
                      fill={star <= Math.round(avgRating) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={star <= Math.round(avgRating) ? 0 : 1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating ({totalFeedback} responses)</p>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Rating Distribution</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{star}</span>
                      <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className="bg-yellow-400 h-3 rounded-full transition-all"
                          style={{ width: `${(distribution[star] / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{distribution[star]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Satisfaction by Course Stage */}
            {stageSatisfaction.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Satisfaction by Course Stage</h3>
                <div className="flex items-end gap-4 justify-center">
                  {stageSatisfaction.map((stage, i) => {
                    const prev = i > 0 ? stageSatisfaction[i - 1] : null;
                    const diff = prev ? stage.avg - prev.avg : 0;
                    return (
                      <div key={stage.trigger} className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                        <div className={`text-2xl font-bold ${stage.avg >= 4 ? 'text-green-600' : stage.avg >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {stage.avg}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${stage.avg >= 4 ? 'bg-green-500' : stage.avg >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${(stage.avg / 5) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium">{stage.label}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{stage.count} responses</div>
                        {diff !== 0 && (
                          <span className={`text-xs font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                          </span>
                        )}
                        {i < stageSatisfaction.length - 1 && (
                          <div className="hidden" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  if (stageSatisfaction.length >= 2) {
                    const first = stageSatisfaction[0];
                    const last = stageSatisfaction[stageSatisfaction.length - 1];
                    const overallDiff = last.avg - first.avg;
                    if (Math.abs(overallDiff) >= 0.3) {
                      return (
                        <p className={`text-sm mt-4 text-center ${overallDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {overallDiff > 0
                            ? `Satisfaction improved +${overallDiff.toFixed(1)} from ${first.label} to ${last.label}`
                            : `Satisfaction dropped ${overallDiff.toFixed(1)} from ${first.label} to ${last.label}`
                          }
                        </p>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Recent Feedback with Filter */}
            <FeedbackFilter
              feedbackList={feedbackList.map(f => ({
                id: f.id,
                studentName: f.profiles?.full_name || 'Unknown Student',
                triggerPoint: f.trigger_point,
                triggerLabel: triggerLabels[f.trigger_point] || f.trigger_point,
                rating: f.rating,
                comment: f.comment,
                createdAt: f.created_at,
              }))}
              triggerPoints={triggerPoints.map(tp => ({
                value: tp,
                label: triggerLabels[tp] || tp,
              }))}
            />
          </>
        )}
      </main>
    </div>
  );
}
