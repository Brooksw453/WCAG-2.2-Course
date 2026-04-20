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

    const { joinCode } = await request.json();

    if (!joinCode || typeof joinCode !== 'string' || joinCode.trim().length === 0) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
    }

    // Look up the class by join code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', joinCode.trim().toUpperCase())
      .eq('course_id', COURSE_ID)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Invalid join code. Please check and try again.' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', classData.id)
      .eq('student_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        message: 'You are already enrolled in this class.',
        className: classData.name,
        alreadyEnrolled: true,
      });
    }

    // Enroll the student
    const { error: enrollError } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classData.id,
        student_id: user.id,
      });

    if (enrollError) throw enrollError;

    return NextResponse.json({
      message: 'Successfully joined the class!',
      className: classData.name,
      alreadyEnrolled: false,
    });
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json({ error: 'Failed to join class' }, { status: 500 });
  }
}
