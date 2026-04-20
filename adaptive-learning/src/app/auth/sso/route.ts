import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifySSOToken } from '@/lib/sso';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing-token`);
  }

  let payload;
  try {
    payload = await verifySSOToken(token);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=invalid-token`);
  }

  const isInstructorRole = ['instructor', 'admin', 'super_admin'].includes(payload.role);
  const landingPage = isInstructorRole ? '/instructor' : '/chapters';

  const adminSupabase = createAdminClient();
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: payload.email,
  });

  if (linkError || !linkData) {
    console.error('SSO generateLink failed:', linkError);
    return NextResponse.redirect(`${origin}/login?error=session-failed`);
  }

  const response = NextResponse.redirect(`${origin}${landingPage}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email: payload.email,
    token: linkData.properties.email_otp,
    type: 'email',
  });

  if (verifyError) {
    console.error('SSO verifyOtp failed:', verifyError);
    return NextResponse.redirect(`${origin}/login?error=session-failed`);
  }

  // Update profile with role and name from SSO payload
  if (verifyData?.user) {
    const courseRole = isInstructorRole ? 'instructor' : 'student';
    await adminSupabase
      .from('profiles')
      .upsert({
        id: verifyData.user.id,
        email: payload.email,
        full_name: payload.full_name || payload.email,
        role: courseRole,
      }, { onConflict: 'id' });
  }

  return response;
}
