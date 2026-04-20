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

    const { data: drafts } = await supabase
      .from('assignment_drafts')
      .select('section_key, content, draft_number')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('assignment_id', 0)
      .order('draft_number', { ascending: false });

    // Get latest draft per section
    const result: Record<string, string> = {};
    (drafts || []).forEach((d: { section_key: string; content: string; draft_number: number }) => {
      if (!result[d.section_key]) {
        result[d.section_key] = d.content;
      }
    });

    return NextResponse.json({
      execSummary: result['exec-summary'] || '',
      introduction: result['introduction'] || '',
    });
  } catch (error) {
    console.error('Business plan GET error:', error);
    return NextResponse.json({ error: 'Failed to load business plan data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sectionKey, content } = await request.json();

    if (!sectionKey || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['exec-summary', 'introduction', 'portfolio-submitted'].includes(sectionKey)) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    // Get current draft number
    const { data: existing } = await supabase
      .from('assignment_drafts')
      .select('draft_number')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('assignment_id', 0)
      .eq('section_key', sectionKey)
      .order('draft_number', { ascending: false })
      .limit(1);

    const draftNumber = (existing?.[0]?.draft_number || 0) + 1;

    await supabase.from('assignment_drafts').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      assignment_id: 0,
      section_key: sectionKey,
      draft_number: draftNumber,
      content: content,
      ai_feedback: null,
    });

    return NextResponse.json({ success: true, draftNumber });
  } catch (error) {
    console.error('Business plan POST error:', error);
    return NextResponse.json({ error: 'Failed to save business plan data' }, { status: 500 });
  }
}
