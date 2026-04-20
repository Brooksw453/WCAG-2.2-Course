import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'announcementId is required' }, { status: 400 });
    }

    // Upsert to avoid duplicates
    const { error } = await supabase
      .from('announcement_reads')
      .upsert(
        {
          announcement_id: announcementId,
          user_id: user.id,
        },
        {
          onConflict: 'announcement_id,user_id',
        }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
