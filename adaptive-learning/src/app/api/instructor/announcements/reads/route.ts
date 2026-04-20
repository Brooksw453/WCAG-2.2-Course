import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { COURSE_ID } from '@/lib/course.config';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify instructor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get all announcements by this instructor
    const { data: announcements } = await supabase
      .from('announcements')
      .select('id')
      .eq('instructor_id', user.id)
      .eq('course_id', COURSE_ID);

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({ readCounts: {} });
    }

    const announcementIds = announcements.map(a => a.id);

    // Get read counts per announcement
    const { data: reads } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .in('announcement_id', announcementIds);

    const readCounts: Record<string, number> = {};
    (reads || []).forEach((r: { announcement_id: string }) => {
      readCounts[r.announcement_id] = (readCounts[r.announcement_id] || 0) + 1;
    });

    // Get total student count (enrolled in instructor's classes)
    const { data: classData } = await supabase
      .from('classes')
      .select('id')
      .eq('instructor_id', user.id)
      .eq('course_id', COURSE_ID);

    let totalStudents = 0;
    if (classData && classData.length > 0) {
      const classIds = classData.map(c => c.id);
      const { count } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds);
      totalStudents = count || 0;
    }

    return NextResponse.json({ readCounts, totalStudents });
  } catch {
    return NextResponse.json({ readCounts: {}, totalStudents: 0 });
  }
}
