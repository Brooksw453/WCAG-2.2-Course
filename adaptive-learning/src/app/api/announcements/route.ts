import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COURSE_ID } from '@/lib/course.config';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get classes the student is enrolled in
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', user.id);

    const classIds = (enrollments || []).map((e: { class_id: string }) => e.class_id);

    // Build combined query: class announcements for enrolled classes + individual announcements
    let announcements: Array<{
      id: string;
      title: string;
      body: string;
      created_at: string;
      instructor_id: string;
      announcement_type: string;
    }> = [];

    // Get class announcements
    if (classIds.length > 0) {
      const { data: classAnnouncements } = await supabase
        .from('announcements')
        .select('id, title, body, created_at, instructor_id, announcement_type')
        .eq('course_id', COURSE_ID)
        .eq('announcement_type', 'class')
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (classAnnouncements) {
        announcements = [...classAnnouncements];
      }
    }

    // Get individual announcements
    const { data: individualAnnouncements } = await supabase
      .from('announcements')
      .select('id, title, body, created_at, instructor_id, announcement_type')
      .eq('course_id', COURSE_ID)
      .eq('announcement_type', 'individual')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (individualAnnouncements) {
      announcements = [...announcements, ...individualAnnouncements];
    }

    // Sort by date descending, limit to 20
    announcements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    announcements = announcements.slice(0, 20);

    // Get instructor names
    const instructorIds = [...new Set(announcements.map(a => a.instructor_id))];
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

    const result = announcements.map(a => ({
      id: a.id,
      title: a.title,
      body: a.body,
      created_at: a.created_at,
      instructor_name: instructorNames[a.instructor_id] || 'Instructor',
    }));

    return NextResponse.json({ announcements: result });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ announcements: [] });
  }
}
