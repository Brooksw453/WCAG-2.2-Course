import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COURSE_ID } from '@/lib/course.config';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, body, announcement_type, class_id, recipient_id, created_at')
      .eq('instructor_id', user.id)
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ announcements: announcements || [] });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { classId, recipientId, title, body, type } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    if (type !== 'class' && type !== 'individual') {
      return NextResponse.json({ error: 'Type must be "class" or "individual"' }, { status: 400 });
    }

    if (type === 'class' && !classId) {
      return NextResponse.json({ error: 'Class ID is required for class announcements' }, { status: 400 });
    }

    if (type === 'individual' && !recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required for individual announcements' }, { status: 400 });
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        instructor_id: user.id,
        course_id: COURSE_ID,
        class_id: type === 'class' ? classId : null,
        recipient_id: type === 'individual' ? recipientId : null,
        title: title.trim(),
        body: body.trim(),
        announcement_type: type,
      })
      .select('id, title, body, announcement_type, class_id, recipient_id, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create announcement: ${message}` }, { status: 500 });
  }
}
