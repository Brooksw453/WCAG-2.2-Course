import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAllChapters } from '@/lib/content';
import { courseConfig } from '@/lib/course.config';
import { formatVerificationId } from '@/lib/certUtils';
import CertificateDocument from '@/components/CertificateDocument';

export const dynamic = 'force-dynamic';

interface CertificateRow {
  id: string;
  student_name: string;
  final_grade: number | null;
  letter_grade: string | null;
  issued_at: string;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;

  // Public read via service-role client (bypasses RLS — the table has no
  // public SELECT policy). An invalid uuid simply yields no row.
  const admin = createAdminClient();
  const { data } = await admin
    .from('certificates')
    .select('id, student_name, final_grade, letter_grade, issued_at')
    .eq('id', certId)
    .maybeSingle();

  const cert = data as CertificateRow | null;

  if (!cert) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg aria-hidden="true" className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t find a certificate with that verification ID. Check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  const totalSections = getAllChapters().reduce((sum, ch) => sum + ch.sections.length, 0);
  const formattedDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Verified banner */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-center gap-2 text-center">
          <svg aria-hidden="true" className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Verified certificate issued by {courseConfig.issuer.name}
          </p>
        </div>
      </div>

      <CertificateDocument
        studentName={cert.student_name}
        totalSections={totalSections}
        finalGrade={cert.final_grade}
        letterGrade={cert.letter_grade}
        formattedDate={formattedDate}
        verificationId={formatVerificationId(cert.id)}
      />

      <div className="max-w-4xl mx-auto px-4 pb-10 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 underline">
          Learn more about {courseConfig.title}
        </Link>
      </div>
    </div>
  );
}
