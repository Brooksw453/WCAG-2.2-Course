import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DASHBOARD_URL, COURSE_SLUG } from '@/lib/sso';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check role and redirect appropriately
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (['instructor', 'admin', 'super_admin'].includes(profile?.role)) {
      redirect('/instructor');
    }
    redirect('/chapters');
  }

  // Not logged in → send to dashboard course page for signup/enrollment
  redirect(`${DASHBOARD_URL}/courses/${COURSE_SLUG}`);
}
