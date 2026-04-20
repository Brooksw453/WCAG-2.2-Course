import { createClient } from '@/lib/supabase/server';
import { getAssignment } from '@/lib/content';
import { redirect } from 'next/navigation';
import type { AssignmentDraft } from '@/lib/types';
import { COURSE_ID } from '@/lib/course.config';
import AssignmentWorkspace from './AssignmentWorkspace';

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId: idStr } = await params;
  const assignmentId = parseInt(idStr, 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load assignment config
  let assignment;
  try {
    assignment = getAssignment(assignmentId);
  } catch {
    redirect('/chapters');
  }

  // Load existing drafts for this assignment
  const { data: draftsData } = await supabase
    .from('assignment_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', COURSE_ID)
    .eq('assignment_id', assignmentId)
    .order('section_key', { ascending: true })
    .order('draft_number', { ascending: false });

  // Get the latest draft per section
  const latestDrafts = new Map<string, AssignmentDraft>();
  (draftsData || []).forEach((d: AssignmentDraft) => {
    if (!latestDrafts.has(d.section_key)) {
      latestDrafts.set(d.section_key, d);
    }
  });

  const draftsMap: Record<string, AssignmentDraft> = {};
  latestDrafts.forEach((draft, key) => {
    draftsMap[key] = draft;
  });

  // Build score history per section (all drafts with scores, chronological)
  const scoreHistory: Record<string, { draft: number; score: number }[]> = {};
  (draftsData || []).forEach((d: AssignmentDraft) => {
    if (d.ai_feedback?.score != null) {
      if (!scoreHistory[d.section_key]) scoreHistory[d.section_key] = [];
      scoreHistory[d.section_key].push({ draft: d.draft_number, score: d.ai_feedback.score });
    }
  });
  // Sort each section's history ascending by draft number
  Object.values(scoreHistory).forEach(arr => arr.sort((a, b) => a.draft - b.draft));

  return (
    <AssignmentWorkspace
      assignment={assignment}
      savedDrafts={draftsMap}
      scoreHistory={scoreHistory}
    />
  );
}
