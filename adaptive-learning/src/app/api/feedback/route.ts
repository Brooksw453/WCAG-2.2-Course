import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COURSE_ID } from '@/lib/course.config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { triggerPoint, rating, comment } = await request.json();

    if (!triggerPoint || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const { error } = await supabase.from('student_feedback').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      trigger_point: triggerPoint,
      rating,
      comment: comment || '',
    });

    if (error) {
      console.error('Feedback insert error:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
      // Instructors get all feedback with student names
      const { data: feedback, error } = await supabase
        .from('student_feedback')
        .select('id, user_id, trigger_point, rating, comment, created_at, profiles(full_name)')
        .eq('course_id', COURSE_ID)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Feedback fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
      }

      return NextResponse.json({ feedback: feedback || [] });
    } else {
      // Students get only their own feedback trigger points
      const { data: feedback, error } = await supabase
        .from('student_feedback')
        .select('trigger_point')
        .eq('user_id', user.id)
        .eq('course_id', COURSE_ID);

      if (error) {
        console.error('Feedback fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
      }

      const completedPoints = (feedback || []).map((f: { trigger_point: string }) => f.trigger_point);
      return NextResponse.json({ completedPoints });
    }
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
