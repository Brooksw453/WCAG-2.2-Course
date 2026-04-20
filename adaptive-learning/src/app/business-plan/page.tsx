import { createClient } from '@/lib/supabase/server';
import { getAllAssignments } from '@/lib/content';
import { redirect } from 'next/navigation';
import type { AssignmentDraft } from '@/lib/types';
import { COURSE_ID } from '@/lib/course.config';
import BusinessPlanWorkspace from './BusinessPlanWorkspace';

export default async function BusinessPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const allAssignments = getAllAssignments();

  // Load all assignment drafts for this user (assignments 1-4)
  const { data: draftsData } = await supabase
    .from('assignment_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', COURSE_ID)
    .in('assignment_id', [0, 1, 2, 3, 4])
    .order('draft_number', { ascending: false });

  // Get latest draft per assignment+section (highest draft_number)
  const latestDrafts = new Map<string, AssignmentDraft>();
  (draftsData || []).forEach((d: AssignmentDraft) => {
    const key = `${d.assignment_id}-${d.section_key}`;
    if (!latestDrafts.has(key)) {
      latestDrafts.set(key, d);
    }
  });

  // Build assignments prop
  const assignments = allAssignments.map((a) => ({
    assignmentId: a.assignmentId,
    title: a.title,
    sections: a.sections.map((s) => {
      const draft = latestDrafts.get(`${a.assignmentId}-${s.key}`);
      return {
        key: s.key,
        title: s.title,
        content: draft?.content || '',
        score: draft?.ai_feedback?.score ?? null,
      };
    }),
  }));

  // Get saved intro and summary (assignment_id = 0)
  const savedIntro = latestDrafts.get('0-introduction')?.content || '';
  const savedSummary = latestDrafts.get('0-exec-summary')?.content || '';

  // Check if portfolio has been submitted
  const isSubmitted = latestDrafts.has('0-portfolio-submitted');

  // Get user display name
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';

  return (
    <BusinessPlanWorkspace
      studentName={displayName}
      assignments={assignments}
      savedIntro={savedIntro}
      savedSummary={savedSummary}
      isSubmitted={isSubmitted}
    />
  );
}
