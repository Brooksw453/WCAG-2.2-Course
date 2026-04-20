import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://courses.esdesigns.org';
const COURSE_SLUG = process.env.COURSE_SLUG || 'introduction-to-business';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/';

  // API routes handle their own auth (return 401 JSON, not a redirect).
  // Redirecting API calls to the dashboard login page breaks fetch() callers
  // because they get back HTML instead of JSON/audio.
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  // If user is not signed in and trying to access protected page routes,
  // redirect to the course dashboard for signup/enrollment
  if (!user && !isPublicRoute && !isApiRoute) {
    const dashboardCourseUrl = `${DASHBOARD_URL}/courses/${COURSE_SLUG}`;
    return NextResponse.redirect(dashboardCourseUrl);
  }

  // If user is signed in and on landing page, redirect based on role
  if (user && request.nextUrl.pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = ['instructor', 'admin', 'super_admin'].includes(profile?.role) ? '/instructor' : '/chapters';
    return NextResponse.redirect(url);
  }

  // Role-based routing for logged-in users
  if (user && (
    request.nextUrl.pathname === '/chapters' ||
    request.nextUrl.pathname.startsWith('/chapter/') ||
    request.nextUrl.pathname.startsWith('/instructor')
  )) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isInstructor = ['instructor', 'admin', 'super_admin'].includes(profile?.role);
    const onInstructorPage = request.nextUrl.pathname.startsWith('/instructor');
    const onStudentPage = request.nextUrl.pathname === '/chapters' || request.nextUrl.pathname.startsWith('/chapter/');

    // Redirect instructors away from student pages
    if (isInstructor && onStudentPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/instructor';
      return NextResponse.redirect(url);
    }

    // Block students from instructor pages
    if (!isInstructor && onInstructorPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/chapters';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
