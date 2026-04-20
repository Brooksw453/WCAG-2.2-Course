import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileWorkspace from './ProfileWorkspace';
import { COURSE_ID } from '@/lib/course.config';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, created_at')
    .eq('id', user.id)
    .single();

  // Fetch stats in parallel
  const [
    { count: completedSections },
    { count: quizAttempts },
    { count: assignmentsSubmitted },
  ] = await Promise.all([
    supabase
      .from('section_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('status', 'completed'),
    supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID),
    supabase
      .from('assignment_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .not('score', 'is', null),
  ]);

  return (
    <ProfileWorkspace
      email={user.email || ''}
      fullName={profile?.full_name || ''}
      role={profile?.role || 'student'}
      memberSince={profile?.created_at || user.created_at || ''}
      completedSections={completedSections || 0}
      quizAttempts={quizAttempts || 0}
      assignmentsSubmitted={assignmentsSubmitted || 0}
    />
  );
}
