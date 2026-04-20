import { createClient } from '@/lib/supabase/server';
import { getAllChapters } from '@/lib/content';
import { NextRequest, NextResponse } from 'next/server';
import { COURSE_ID } from '@/lib/course.config';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if instructor is requesting for a specific student
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');

  let targetUserId = user.id;

  if (requestedUserId && requestedUserId !== user.id) {
    // Verify current user is instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Only instructors can view other students\' certificates' }, { status: 403 });
    }
    targetUserId = requestedUserId;
  }

  const chapters = getAllChapters();
  const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);

  const { data: progressData } = await supabase
    .from('section_progress')
    .select('status')
    .eq('user_id', targetUserId)
    .eq('course_id', COURSE_ID)
    .eq('status', 'completed');

  const completedSections = (progressData || []).length;

  if (completedSections < totalSections) {
    return NextResponse.json({
      error: `Course not yet complete. ${completedSections} of ${totalSections} sections completed.`,
      completedSections,
      totalSections,
    }, { status: 400 });
  }

  // Get student profile
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', targetUserId)
    .single();

  return NextResponse.json({
    eligible: true,
    studentName: studentProfile?.full_name || studentProfile?.email || 'Student',
    completedSections,
    totalSections,
  });
}
