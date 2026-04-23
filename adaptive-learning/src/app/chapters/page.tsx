import { createClient } from '@/lib/supabase/server';
import { getAllChapters, getAllAssignments } from '@/lib/content';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { SectionProgress, AssignmentDraft } from '@/lib/types';
import JoinClass from './JoinClass';
import Announcements from './Announcements';
import ActivityTimeline from './ActivityTimeline';
import FeedbackPopup from './FeedbackPopup';
import MilestoneBanner from './MilestoneBanner';
import ThemeToggle from '@/components/ThemeToggle';
import { courseConfig, COURSE_ID } from '@/lib/course.config';

interface QuizAttempt {
  score: number;
  passed: boolean;
  chapter_id: number;
  section_id: string;
}

interface FreeTextResponse {
  ai_evaluation: { score: number } | null;
  chapter_id: number;
  section_id: string;
}

export default async function ChaptersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Role-based redirect: instructors go to instructor dashboard
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile query error:', profileError.message);
  }

  if (userProfile?.role === 'instructor') {
    redirect('/instructor');
  }

  const chapters = getAllChapters();
  const assignments = getAllAssignments();

  // Load all data for this user in parallel
  const [
    { data: progressData },
    { data: quizData },
    { data: freeTextData },
    { data: assignmentDraftsData },
  ] = await Promise.all([
    supabase.from('section_progress').select('*').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('quiz_attempts').select('score, passed, chapter_id, section_id').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('free_text_responses').select('ai_evaluation, chapter_id, section_id').eq('user_id', user.id).eq('course_id', COURSE_ID),
    supabase.from('assignment_drafts').select('assignment_id, section_key, draft_number, ai_feedback, submitted_at').eq('user_id', user.id).eq('course_id', COURSE_ID),
  ]);


  // Load enrolled classes (handle table not existing yet)
  let enrolledClasses: Array<{ name: string; instructor_name: string }> = [];
  try {
    const { data: enrollmentData } = await supabase
      .from('class_enrollments')
      .select('class_id, classes(name, instructor_id)')
      .eq('student_id', user.id);

    if (enrollmentData && enrollmentData.length > 0) {
      // Get instructor names
      const instructorIds = enrollmentData
        .map((e: any) => e.classes?.instructor_id)
        .filter(Boolean);

      let instructorNames: Record<string, string> = {};
      if (instructorIds.length > 0) {
        const { data: instructors } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', instructorIds);

        instructorNames = (instructors || []).reduce((acc: Record<string, string>, p: { id: string; full_name: string }) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {});
      }

      enrolledClasses = enrollmentData.map((e: any) => ({
        name: e.classes?.name || 'Unknown Class',
        instructor_name: instructorNames[e.classes?.instructor_id] || '',
      }));
    }
  } catch {
    // Tables may not exist yet if migration hasn't been run
  }

  // Load announcements for this student
  let studentAnnouncements: Array<{ id: string; title: string; body: string; created_at: string; instructor_name: string }> = [];
  try {
    const classIds = (enrolledClasses.length > 0)
      ? await (async () => {
          const { data: enr } = await supabase
            .from('class_enrollments')
            .select('class_id')
            .eq('student_id', user.id);
          return (enr || []).map((e: { class_id: string }) => e.class_id);
        })()
      : [];

    let allAnnouncements: Array<{ id: string; title: string; body: string; created_at: string; instructor_id: string }> = [];

    if (classIds.length > 0) {
      const { data: classAnns } = await supabase
        .from('announcements')
        .select('id, title, body, created_at, instructor_id')
        .eq('announcement_type', 'class')
        .eq('course_id', COURSE_ID)
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(20);
      if (classAnns) allAnnouncements = [...classAnns];
    }

    const { data: individualAnns } = await supabase
      .from('announcements')
      .select('id, title, body, created_at, instructor_id')
      .eq('announcement_type', 'individual')
      .eq('course_id', COURSE_ID)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (individualAnns) allAnnouncements = [...allAnnouncements, ...individualAnns];

    allAnnouncements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    allAnnouncements = allAnnouncements.slice(0, 20);

    if (allAnnouncements.length > 0) {
      const instrIds = [...new Set(allAnnouncements.map(a => a.instructor_id))];
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instrIds);
      const instrNames = (instructors || []).reduce((acc: Record<string, string>, p: { id: string; full_name: string }) => {
        acc[p.id] = p.full_name;
        return acc;
      }, {});

      studentAnnouncements = allAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        created_at: a.created_at,
        instructor_name: instrNames[a.instructor_id] || 'Instructor',
      }));
    }
  } catch {
    // Announcements table may not exist yet
  }

  // Load read receipts for announcements
  let readAnnouncementIds: Set<string> = new Set();
  try {
    if (studentAnnouncements.length > 0) {
      const annIds = studentAnnouncements.map(a => a.id);
      const { data: readData } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', annIds);
      if (readData) {
        readAnnouncementIds = new Set(readData.map((r: { announcement_id: string }) => r.announcement_id));
      }
    }
  } catch {
    // Table may not exist yet
  }

  // Filter out dismissed (read) announcements — dismissing = permanently hidden
  const announcementsWithReadStatus = studentAnnouncements
    .filter(a => !readAnnouncementIds.has(a.id))
    .map(a => ({ ...a, read: false }));

  // Load recent activity
  let recentActivities: Array<{ id: string; activity_type: string; details: Record<string, string | number>; created_at: string }> = [];
  try {
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('id, activity_type, details, created_at')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false })
      .limit(50);
    if (activityData) {
      recentActivities = activityData;
    }
  } catch {
    // Table may not exist yet
  }

  // Load completed feedback points
  let completedFeedbackPoints: string[] = [];
  try {
    const { data: feedbackData } = await supabase
      .from('student_feedback')
      .select('trigger_point')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID);
    if (feedbackData) {
      completedFeedbackPoints = feedbackData.map((f: { trigger_point: string }) => f.trigger_point);
    }
  } catch {
    // Table may not exist yet
  }

  // Group assignment drafts by assignment — latest per section
  const assignmentProgress = new Map<number, { submitted: number; total: number; avgScore: number }>();
  assignments.forEach(a => {
    interface DraftRow { assignment_id: number; section_key: string; draft_number: number; ai_feedback: AssignmentDraft['ai_feedback'] }
    const drafts = (assignmentDraftsData || []).filter((d: DraftRow) => d.assignment_id === a.assignmentId);
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
    assignmentProgress.set(a.assignmentId, {
      submitted: withFeedback.length,
      total: a.sections.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    });
  });

  // Group progress by chapter
  const progressByChapter = new Map<number, SectionProgress[]>();
  (progressData || []).forEach((p: SectionProgress) => {
    const list = progressByChapter.get(p.chapter_id) || [];
    list.push(p);
    progressByChapter.set(p.chapter_id, list);
  });

  // Calculate stats
  const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  const completedSections = (progressData || []).filter(
    (p: SectionProgress) => p.status === 'completed'
  ).length;
  const overallPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  // Quiz stats
  const quizAttempts = (quizData || []) as QuizAttempt[];
  const passedQuizzes = quizAttempts.filter(q => q.passed);
  const avgQuizScore = passedQuizzes.length > 0
    ? Math.round(passedQuizzes.reduce((sum, q) => sum + q.score, 0) / passedQuizzes.length)
    : 0;

  // Free text stats
  const freeTextResponses = (freeTextData || []) as FreeTextResponse[];
  const scoredResponses = freeTextResponses.filter(
    f => f.ai_evaluation && typeof f.ai_evaluation === 'object' && 'score' in f.ai_evaluation
  );
  const avgFreeTextScore = scoredResponses.length > 0
    ? Math.round(scoredResponses.reduce((sum, f) => sum + ((f.ai_evaluation as { score: number }).score || 0), 0) / scoredResponses.length)
    : 0;

  // Mastery scores
  const masteryScores = (progressData || [])
    .filter((p: SectionProgress) => p.mastery_score !== null && p.mastery_score !== undefined)
    .map((p: SectionProgress) => p.mastery_score as number);
  const avgMastery = masteryScores.length > 0
    ? Math.round(masteryScores.reduce((sum, s) => sum + s, 0) / masteryScores.length)
    : 0;

  // Chapters completed
  const chaptersCompleted = chapters.filter(ch => {
    const chProgress = progressByChapter.get(ch.chapterId) || [];
    return chProgress.filter(p => p.status === 'completed').length === ch.sections.length;
  }).length;

  // Time tracking — blended estimate from section progress + assignment work.
  //
  // Wall-clock (completed_at - started_at) is unreliable on its own: a student
  // who starts a section, closes the tab, and finishes it the next day has a
  // diff of 24+ hours, which would either inflate or get dropped entirely.
  // And it misses assignment and in-progress time completely.
  //
  // Strategy: use wall-clock only when it falls in a plausible single-session
  // range; otherwise credit a per-section default. Partial credit for
  // in-progress sections, plus credit per submitted assignment section.
  const SECTION_MIN_CREDIT = 3;          // below this, wall-clock is probably a skim / reopen
  const SECTION_DEFAULT = 10;            // credit when wall-clock is missing or implausible
  const SECTION_MAX_CREDIT = 30;         // cap — anything longer is an idle tab
  const IN_PROGRESS_CREDIT = 5;          // partial credit for sections still in progress
  const ASSIGNMENT_SECTION_CREDIT = 15;  // per submitted assignment section with AI feedback

  let totalMinutes = 0;
  (progressData || []).forEach((p: SectionProgress) => {
    if (p.status === 'completed' && p.started_at && p.completed_at) {
      const diffMin = (new Date(p.completed_at).getTime() - new Date(p.started_at).getTime()) / (1000 * 60);
      if (diffMin >= SECTION_MIN_CREDIT && diffMin <= SECTION_MAX_CREDIT) {
        totalMinutes += diffMin;
      } else {
        totalMinutes += SECTION_DEFAULT;
      }
    } else if (p.status === 'completed') {
      totalMinutes += SECTION_DEFAULT;
    } else if (p.status === 'in_progress') {
      totalMinutes += IN_PROGRESS_CREDIT;
    }
  });

  const assignmentSectionsSubmitted = Array.from(assignmentProgress.values())
    .reduce((sum, p) => sum + p.submitted, 0);
  totalMinutes += assignmentSectionsSubmitted * ASSIGNMENT_SECTION_CREDIT;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);
  const timeStudiedLabel = totalMinutes > 0
    ? (totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`)
    : '—';

  // Daily activity density for the last 14 days — shared with the Activity
  // Timeline chart so students see events + minutes per day linked together.
  const DAYS_BACK = 14;
  const activityDayBuckets: Array<{ dateKey: string; label: string; events: number; minutes: number }> = [];
  {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = DAYS_BACK - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(start.getDate() - i);
      activityDayBuckets.push({
        dateKey: d.toDateString(),
        label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        events: 0,
        minutes: 0,
      });
    }
    const idxMap = new Map(activityDayBuckets.map((b, i) => [b.dateKey, i]));
    recentActivities.forEach(a => {
      const idx = idxMap.get(new Date(a.created_at).toDateString());
      if (idx !== undefined) activityDayBuckets[idx].events += 1;
    });
    (progressData || []).forEach((p: SectionProgress) => {
      if (p.status !== 'completed' || !p.completed_at) return;
      const idx = idxMap.get(new Date(p.completed_at).toDateString());
      if (idx === undefined) return;
      let mins = SECTION_DEFAULT;
      if (p.started_at) {
        const diff = (new Date(p.completed_at).getTime() - new Date(p.started_at).getTime()) / 60000;
        mins = (diff >= SECTION_MIN_CREDIT && diff <= SECTION_MAX_CREDIT) ? diff : SECTION_DEFAULT;
      }
      activityDayBuckets[idx].minutes += mins;
    });
    // Attribute assignment minutes to the day of each submitted section's
    // latest draft (only drafts that received AI feedback count, matching
    // how totalMinutes is computed).
    interface DraftWithTime { assignment_id: number; section_key: string; draft_number: number; ai_feedback: AssignmentDraft['ai_feedback']; submitted_at: string }
    const latestPerSection = new Map<string, DraftWithTime>();
    (assignmentDraftsData || []).forEach((d: DraftWithTime) => {
      if (d.assignment_id === 0) return;
      const key = `${d.assignment_id}:${d.section_key}`;
      const existing = latestPerSection.get(key);
      if (!existing || d.draft_number > existing.draft_number) latestPerSection.set(key, d);
    });
    latestPerSection.forEach(d => {
      if (!d.ai_feedback || !d.submitted_at) return;
      const idx = idxMap.get(new Date(d.submitted_at).toDateString());
      if (idx === undefined) return;
      activityDayBuckets[idx].minutes += ASSIGNMENT_SECTION_CREDIT;
    });
  }

  // Daily streak: consecutive days with at least 1 section completed
  const completionDates = new Set<string>();
  (progressData || []).forEach((p: SectionProgress) => {
    if (p.status === 'completed' && p.completed_at) {
      completionDates.add(new Date(p.completed_at).toDateString());
    }
  });

  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (completionDates.has(d.toDateString())) {
      currentStreak++;
    } else if (i === 0) {
      // Today doesn't count against streak if they haven't done anything yet today
      continue;
    } else {
      break;
    }
  }

  // Activity heatmap data (last 12 weeks)
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const count = (progressData || []).filter(
      (p: SectionProgress) => p.status === 'completed' && p.completed_at && new Date(p.completed_at).toDateString() === dateStr
    ).length;
    heatmapData.push({ date: d.toISOString().split('T')[0], count });
  }

  // Achievements
  const achievements = [];
  if (completedSections >= 1) achievements.push({ icon: '🎯', label: 'First Step', desc: 'Complete your first section' });
  if (completedSections >= 5) achievements.push({ icon: '⭐', label: 'Rising Star', desc: 'Complete 5 sections' });
  if (completedSections >= 10) achievements.push({ icon: '🔥', label: 'On Fire', desc: 'Complete 10 sections' });
  if (completedSections >= 20) achievements.push({ icon: '🏆', label: 'Scholar', desc: 'Complete 20 sections' });
  if (chaptersCompleted >= 1) achievements.push({ icon: '📖', label: 'Chapter Master', desc: 'Complete a full chapter' });
  if (chaptersCompleted >= 4) achievements.push({ icon: '🎓', label: 'Overachiever', desc: 'Complete 4 chapters' });
  if (avgMastery >= 90) achievements.push({ icon: '💎', label: 'Perfectionist', desc: 'Average mastery 90%+' });
  if (currentStreak >= 8) achievements.push({ icon: '🔗', label: 'Unstoppable', desc: 'Complete 8 sections in a row' });
  if (quizAttempts.length > 0 && passedQuizzes.length === quizAttempts.length) {
    achievements.push({ icon: '🎯', label: 'Sharpshooter', desc: 'Pass every quiz on first try' });
  }

  // Certificate eligible check
  const allSectionsComplete = completedSections >= totalSections && totalSections > 0;

  // Locked achievements (show what's next)
  const lockedAchievements = [];
  if (completedSections < 1) lockedAchievements.push({ icon: '🔒', label: 'First Step', desc: 'Complete your first section' });
  if (completedSections < 5 && completedSections >= 1) lockedAchievements.push({ icon: '🔒', label: 'Rising Star', desc: 'Complete 5 sections' });
  if (completedSections < 10 && completedSections >= 5) lockedAchievements.push({ icon: '🔒', label: 'On Fire', desc: 'Complete 10 sections' });
  if (chaptersCompleted < 1 && completedSections >= 1) lockedAchievements.push({ icon: '🔒', label: 'Chapter Master', desc: 'Complete a full chapter' });

  // Grade projection (40% mastery + 30% quiz + 30% assignment)
  const allAssignmentScores = Array.from(assignmentProgress.values())
    .filter(a => a.avgScore > 0)
    .map(a => a.avgScore);
  const avgAssignmentScore = allAssignmentScores.length > 0
    ? Math.round(allAssignmentScores.reduce((s, v) => s + v, 0) / allAssignmentScores.length)
    : 0;
  const hasGradeData = avgMastery > 0 || avgQuizScore > 0 || avgAssignmentScore > 0;
  const projectedGrade = hasGradeData
    ? Math.round(avgMastery * 0.4 + avgQuizScore * 0.3 + avgAssignmentScore * 0.3)
    : null;
  const projectedLetter = projectedGrade !== null
    ? (projectedGrade >= 90 ? 'A' : projectedGrade >= 80 ? 'B' : projectedGrade >= 70 ? 'C' : projectedGrade >= 60 ? 'D' : 'F')
    : null;

  // Sign out handler
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Determine feedback trigger point
  const assignmentOneDrafts = (assignmentDraftsData || []).filter(
    (d: { assignment_id: number }) => d.assignment_id === 1
  );
  const assignmentOneSectionsSubmitted = new Set(assignmentOneDrafts.map((d: { section_key: string }) => d.section_key)).size;
  const chapter1Sections = chapters.find(ch => ch.chapterId === 1)?.sections || [];
  const chapter1Complete = chapter1Sections.every(secId => {
    const prog = (progressData || []).find(
      (p: SectionProgress) => p.chapter_id === 1 && p.section_id === secId && p.status === 'completed'
    );
    return !!prog;
  });

  let feedbackTriggerPoint: string | null = null;
  const feedbackCandidates: string[] = [];
  if (completedSections >= 115) feedbackCandidates.push('near-end');
  if (completedSections >= 64) feedbackCandidates.push('mid-course');
  if (assignmentOneSectionsSubmitted >= 3) feedbackCandidates.push('after-assignment-1');
  if (chapter1Complete && chapter1Sections.length > 0) feedbackCandidates.push('after-chapter-1');

  // Pick the most relevant unshown trigger point (first candidate not already completed)
  for (const candidate of feedbackCandidates) {
    if (!completedFeedbackPoints.includes(candidate)) {
      feedbackTriggerPoint = candidate;
      break;
    }
  }

  // Determine milestone
  const milestoneDefinitions = [
    { type: 'course-complete', title: 'Course Complete!', message: "Congratulations! You've finished all 16 chapters!", check: () => completedSections >= totalSections && totalSections > 0 },
    { type: 'three-quarter', title: '75% Complete!', message: "You're in the home stretch!", check: () => completedSections >= Math.floor(totalSections * 0.75) },
    { type: 'half', title: 'Halfway There!', message: "You've completed half the course. Incredible progress!", check: () => completedSections >= Math.floor(totalSections * 0.5) },
    { type: 'quarter', title: '25% Complete!', message: "You're a quarter of the way through the course!", check: () => completedSections >= Math.floor(totalSections * 0.25) },
    { type: 'chapter-complete', title: 'Chapter Complete!', message: 'Great work finishing a full chapter!', check: () => chaptersCompleted >= 1 },
    { type: 'first-section', title: 'First Steps!', message: "You've completed your first section. Keep going!", check: () => completedSections >= 1 },
  ];

  let currentMilestone: { type: string; title: string; message: string } | null = null;
  for (const m of milestoneDefinitions) {
    if (m.check()) {
      currentMilestone = { type: m.type, title: m.title, message: m.message };
      break;
    }
  }

  // Get user display name
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{courseConfig.title}</h1>
                <p className="text-blue-200 text-sm">Adaptive Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm text-blue-200">Hi, {displayName}</span>
              <Link
                href="/search"
                className="text-blue-200 hover:text-white transition-colors"
                aria-label="Search course content"
                title="Search"
              >
                <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </Link>
              <ThemeToggle compact className="text-blue-200 hover:text-white hover:bg-white/10" />
              <Link
                href="/profile"
                className="text-blue-200 hover:text-white transition-colors"
                aria-label="Your profile"
                title="Your profile"
              >
                <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs sm:text-sm text-blue-200 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        {/* Milestone Banner */}
        <MilestoneBanner milestone={currentMilestone} />

        {/* Feedback Popup */}
        {feedbackTriggerPoint && (
          <FeedbackPopup
            triggerPoint={feedbackTriggerPoint}
            completedFeedbackPoints={completedFeedbackPoints}
          />
        )}

        {/* Join a Class */}
        <JoinClass enrolledClasses={enrolledClasses} />

        {/* Announcements */}
        <Announcements initialAnnouncements={announcementsWithReadStatus} />

        {/* Welcome Banner for New Students */}
        {completedSections === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-3">👋</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to {courseConfig.title}!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-lg mx-auto">
              Start your learning journey by diving into Chapter 1. Each section includes reading material,
              a knowledge check quiz, and a written response — all powered by AI to help you learn.
            </p>
            <a
              href="/chapter/1"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Chapter 1
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        )}

        {/* Overall Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Progress</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/grades"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Gradebook
              </Link>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {completedSections} of {totalSections} sections complete ({overallPercent}%)
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
              role="progressbar"
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
            />
          </div>
        </div>

        {/* Hero Stats + Collapsible Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
          {/* Hero: 3 key metrics */}
          <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
            <div className="p-4 sm:p-5 text-center">
              <div className="text-3xl font-bold text-blue-600">{overallPercent}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall Progress</div>
            </div>
            <div className="p-4 sm:p-5 text-center">
              <div className="text-3xl font-bold text-green-600">{chaptersCompleted}/{chapters.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chapters Done</div>
            </div>
            <div className="p-4 sm:p-5 text-center">
              <div className="text-3xl font-bold text-orange-500">{currentStreak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Section Streak</div>
            </div>
          </div>
          {/* Collapsible detailed stats */}
          <details className="border-t border-gray-200 dark:border-gray-700">
            <summary className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors select-none">
              Detailed Stats
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{avgMastery > 0 ? `${avgMastery}%` : '—'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Mastery</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{avgQuizScore > 0 ? `${avgQuizScore}%` : '—'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Quiz Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {totalMinutes > 0
                    ? (totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`)
                    : '—'
                  }
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Time Studied</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">{avgFreeTextScore > 0 ? `${avgFreeTextScore}%` : '—'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Writing Score</div>
              </div>
            </div>
            {/* Activity Heatmap */}
            {completedSections > 0 && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Activity (last 12 weeks)</div>
                <div className="flex gap-[3px] flex-wrap">
                  {heatmapData.map(d => (
                    <div
                      key={d.date}
                      className={`w-3 h-3 rounded-sm ${
                        d.count >= 3 ? 'bg-green-600' :
                        d.count === 2 ? 'bg-green-400' :
                        d.count === 1 ? 'bg-green-200 dark:bg-green-800' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}
                      title={`${d.date}: ${d.count} section${d.count !== 1 ? 's' : ''} completed`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
                  <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
                  <div className="w-3 h-3 rounded-sm bg-green-400" />
                  <div className="w-3 h-3 rounded-sm bg-green-600" />
                  <span>More</span>
                </div>
              </div>
            )}
          </details>
        </div>

        {/* Grade Projection */}
        {projectedGrade !== null && projectedLetter && completedSections >= 3 && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2 ${
              projectedLetter === 'A' ? 'bg-green-100 text-green-800 border-green-200' :
              projectedLetter === 'B' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              projectedLetter === 'C' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-orange-100 text-orange-800 border-orange-200'
            }`}>{projectedLetter}</div>
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                On track for a <strong>{projectedLetter}</strong> ({projectedGrade}%)
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Based on mastery (40%), quizzes (30%), and assignments (30%).
                {projectedGrade < 90 && ` Keep going — ${projectedGrade >= 80 ? 'a few more strong sections could push you to an A!' : 'consistent work will raise your grade!'}`}
              </p>
            </div>
          </div>
        )}

        {/* Achievements */}
        {(achievements.length > 0 || lockedAchievements.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Achievements</h3>
            <div className="flex flex-wrap gap-3">
              {achievements.map((a, i) => (
                <div
                  key={i}
                  className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                  tabIndex={0}
                  role="group"
                  aria-label={`Achievement: ${a.label}. ${a.desc}`}
                >
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg px-3 py-2 cursor-default">
                    <span className="text-lg" aria-hidden="true">{a.icon}</span>
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">{a.label}</span>
                  </div>
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-10"
                    aria-hidden="true"
                  >
                    <div className="font-semibold mb-0.5">{a.label}</div>
                    <div className="text-gray-300">{a.desc}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              ))}
              {lockedAchievements.map((a, i) => (
                <div
                  key={`locked-${i}`}
                  className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                  tabIndex={0}
                  role="group"
                  aria-label={`Locked achievement: ${a.label}. ${a.desc}`}
                >
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 opacity-50 cursor-default">
                    <span className="text-lg" aria-hidden="true">{a.icon}</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{a.label}</span>
                  </div>
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-10"
                    aria-hidden="true"
                  >
                    <div className="font-semibold mb-0.5">{a.label}</div>
                    <div className="text-gray-300">{a.desc}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Banner */}
        {allSectionsComplete && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Course Complete! Certificate Earned</h3>
                <p className="text-xs text-amber-700">Congratulations! You&apos;ve completed all {totalSections} sections.</p>
              </div>
            </div>
            <Link
              href="/certificate"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              View Certificate
            </Link>
          </div>
        )}

        {/* Chapter Cards with Assignment Milestones */}
        <div className="space-y-4">
          {(() => {
            // Map: which assignment appears after which chapter
            const assignmentAfterChapter: Record<number, number> = { 3: 1, 6: 2, 8: 3 };
            const items: React.ReactNode[] = [];

            chapters.forEach((chapter) => {
              const chapterProgress = progressByChapter.get(chapter.chapterId) || [];
              const completed = chapterProgress.filter(p => p.status === 'completed').length;
              const total = chapter.sections.length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isStarted = chapterProgress.length > 0;
              const isComplete = completed === total;

              // Chapter card
              items.push(
                <Link
                  key={`ch-${chapter.chapterId}`}
                  href={`/chapter/${chapter.chapterId}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                >
                  <div className="p-5 flex items-center gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      isComplete ? 'bg-green-500' :
                      isStarted ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}>
                      {isComplete ? (
                        <svg className="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        chapter.chapterId
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                        Chapter {chapter.chapterId}: {chapter.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {total} sections &bull; {chapter.reading}
                      </p>
                      {isStarted && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isComplete ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percent}%` }}
                              role="progressbar"
                              aria-valuenow={percent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Chapter ${chapter.chapterId} progress`}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {completed}/{total}
                          </span>
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );

              // Insert assignment card after the designated chapter
              const assignmentNum = assignmentAfterChapter[chapter.chapterId];
              if (assignmentNum) {
                const a = assignments.find(x => x.assignmentId === assignmentNum);
                if (a) {
                  const prog = assignmentProgress.get(a.assignmentId);
                  const aSubmitted = prog?.submitted || 0;
                  const aTotal = prog?.total || a.sections.length;
                  const aScore = prog?.avgScore || 0;
                  const aComplete = aSubmitted === aTotal && aSubmitted > 0;
                  const aStarted = aSubmitted > 0;

                  items.push(
                    <Link
                      key={`asgn-${a.assignmentId}`}
                      href={`/assignment/${a.assignmentId}`}
                      className="block bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all"
                    >
                      <div className="p-5 flex items-center gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                          aComplete ? 'bg-green-500' :
                          aStarted ? 'bg-purple-500' :
                          'bg-purple-300'
                        }`}>
                          {aComplete ? (
                            <svg className="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                              ASSIGNMENT
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{a.points} pts</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {a.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{a.sections.length} sections &bull; {courseConfig.capstone.labels?.assignmentTag || 'Portfolio Component'}</p>
                          {aStarted && (
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 bg-purple-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${aComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                                  style={{ width: `${Math.round((aSubmitted / aTotal) * 100)}%` }}
                                  role="progressbar"
                                  aria-valuenow={Math.round((aSubmitted / aTotal) * 100)}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`Assignment ${a.assignmentId} progress`}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {aSubmitted}/{aTotal} {aScore > 0 && `• ${aScore}%`}
                              </span>
                            </div>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-purple-400 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                }
              }
            });

            // Check portfolio submission status
            const portfolioIsSubmitted = (assignmentDraftsData || []).some(
              (d: { assignment_id: number; section_key: string }) => d.assignment_id === 0 && d.section_key === 'portfolio-submitted'
            );

            // Add Final Business Plan capstone card if student has submitted at least 1 section
            const hasAnySubmission = Array.from(assignmentProgress.values()).some(p => p.submitted > 0);
            if (hasAnySubmission) {
              items.push(
                <Link
                  key="capstone-business-plan"
                  href="/business-plan"
                  className={`block rounded-lg shadow-md hover:shadow-lg transition-all ${
                    portfolioIsSubmitted
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 ring-2 ring-green-400 ring-offset-2 dark:ring-offset-gray-900'
                      : 'bg-gradient-to-r from-purple-600 to-amber-500'
                  }`}
                >
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {portfolioIsSubmitted ? (
                        <svg className="w-7 h-7 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                          {portfolioIsSubmitted ? 'COMPLETE' : 'CAPSTONE'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-lg truncate">
                        {courseConfig.capstone.labels?.finalTitle || 'Final Portfolio'}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {portfolioIsSubmitted
                          ? 'Portfolio submitted — view, edit, or download anytime'
                          : courseConfig.capstone.labels?.compileDescription || 'Compile your complete portfolio from all assignments'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-white/70 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            }

            return items;
          })()}
        </div>

        {/* Activity Timeline */}
        <div className="mt-6">
          <ActivityTimeline
            initialActivities={recentActivities}
            dayBuckets={activityDayBuckets}
            totalLabel={timeStudiedLabel}
          />
        </div>
      </main>
    </div>
  );
}
