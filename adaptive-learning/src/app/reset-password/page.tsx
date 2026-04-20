import { redirect } from 'next/navigation';
import { DASHBOARD_URL } from '@/lib/sso';

export default function ResetPasswordPage() {
  // All auth is handled by the course dashboard
  redirect(`${DASHBOARD_URL}/reset-password`);
}
