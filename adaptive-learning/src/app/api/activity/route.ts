import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { COURSE_ID } from '@/lib/course.config';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { activityType, details } = await request.json();

    const validTypes = [
      'login', 'section_start', 'section_complete', 'quiz_attempt',
      'assignment_submit', 'draft_chat', 'page_view',
    ];

    if (!activityType || !validTypes.includes(activityType)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    const { error } = await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        course_id: COURSE_ID,
        activity_type: activityType,
        details: details || {},
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, activity_type, details, created_at')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activities: data || [] });
  } catch {
    return NextResponse.json({ activities: [] });
  }
}
