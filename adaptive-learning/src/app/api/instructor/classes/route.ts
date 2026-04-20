import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COURSE_ID } from '@/lib/course.config';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    // Get classes with enrollment count
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, join_code, created_at')
      .eq('instructor_id', user.id)
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get enrollment counts for each class
    const classIds = (classes || []).map(c => c.id);
    let enrollmentCounts: Record<string, number> = {};

    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .in('class_id', classIds);

      enrollmentCounts = (enrollments || []).reduce((acc: Record<string, number>, e: { class_id: string }) => {
        acc[e.class_id] = (acc[e.class_id] || 0) + 1;
        return acc;
      }, {});
    }

    const result = (classes || []).map(c => ({
      id: c.id,
      name: c.name,
      join_code: c.join_code,
      student_count: enrollmentCounts[c.id] || 0,
      created_at: c.created_at,
    }));

    return NextResponse.json({ classes: result });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
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

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Generate a unique join code (retry if collision)
    let joinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('join_code', joinCode)
        .eq('course_id', COURSE_ID)
        .single();

      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        instructor_id: user.id,
        course_id: COURSE_ID,
        name: name.trim(),
        join_code: joinCode,
      })
      .select('id, name, join_code, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      class: {
        id: newClass.id,
        name: newClass.name,
        join_code: newClass.join_code,
        student_count: 0,
        created_at: newClass.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating class:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create class: ${message}` }, { status: 500 });
  }
}
