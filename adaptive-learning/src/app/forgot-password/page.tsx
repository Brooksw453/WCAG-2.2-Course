import { redirect } from 'next/navigation';
import { DASHBOARD_URL } from '@/lib/sso';

export default function ForgotPasswordPage() {
  // All auth is handled by the course dashboard
  redirect(`${DASHBOARD_URL}/forgot-password`);
}
