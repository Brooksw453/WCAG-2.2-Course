import { courseConfig } from '@/lib/course.config';

interface CertificateDocumentProps {
  studentName: string;
  totalSections: number;
  finalGrade: number | null;
  letterGrade: string | null;
  formattedDate: string;
  verificationId: string;
}

/**
 * The printable certificate card. Shared by the student-facing /certificate
 * page and the public /verify/[certId] page so the two never drift.
 */
export default function CertificateDocument({
  studentName,
  totalSections,
  finalGrade,
  letterGrade,
  formattedDate,
  verificationId,
}: CertificateDocumentProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-8 print:px-0 print:pb-0 print:max-w-none">
      <div id="certificate-content" className="bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none overflow-hidden">
        {/* Outer decorative border */}
        <div className="border-[12px] border-amber-500/20 m-4 print:m-0 print:border-[16px]">
          {/* Inner decorative border */}
          <div className="border-2 border-navy-800 p-6 sm:p-12 print:p-16" style={{ borderColor: '#1e3a5f' }}>
            {/* Corner ornaments */}
            <div className="relative" aria-label="Certificate of completion" role="region">
              {/* Issuer wordmark — ES Designs (navy with teal underline under "ES") */}
              <div className="flex justify-center mb-6">
                <div
                  aria-label={`Issued by ${courseConfig.issuer.name}`}
                  className="inline-flex items-baseline text-2xl sm:text-3xl font-bold"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: '-0.01em' }}
                >
                  <span style={{ color: '#1e3a5f', borderBottom: '3px solid #0d9488', paddingBottom: '2px' }}>ES</span>
                  <span style={{ color: '#1e3a5f', marginLeft: '0.35rem' }}>Designs</span>
                </div>
              </div>

              {/* Top decorative line */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <div className="mx-4">
                  <svg aria-hidden="true" className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>

              {/* Certificate content */}
              <div className="text-center">
                <h2 className="text-sm font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}>
                  This is to certify that
                </h2>

                <div className="my-6">
                  <h1
                    className="text-3xl sm:text-5xl font-bold mb-2"
                    style={{
                      color: '#1e3a5f',
                      fontFamily: 'Georgia, "Times New Roman", serif',
                    }}
                  >
                    {studentName}
                  </h1>
                  <div className="w-64 h-px bg-amber-400 mx-auto" />
                </div>

                <p className="text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: '#374151', fontFamily: 'Georgia, serif' }}>
                  has successfully completed all requirements of the
                </p>

                <h2
                  className="text-2xl sm:text-4xl font-bold mb-2"
                  style={{
                    color: '#1e3a5f',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  {courseConfig.title}
                </h2>
                <p className="text-lg mb-8" style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>
                  {courseConfig.subtitle}
                </p>

                <p className="text-sm max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>
                  This certifies that {studentName} has successfully completed all {totalSections} sections
                  of the {courseConfig.title} adaptive learning course, demonstrating proficiency
                  in the course material.
                </p>

                {/* Grade display */}
                {finalGrade !== null && letterGrade && (
                  <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 flex-wrap">
                    <div className="text-center">
                      <div
                        className="text-4xl font-bold"
                        style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}
                      >
                        {letterGrade}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Final Grade</div>
                    </div>
                    <div className="w-px h-12 bg-gray-300" />
                    <div className="text-center">
                      <div
                        className="text-4xl font-bold"
                        style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}
                      >
                        {Math.round(finalGrade)}%
                      </div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Score</div>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="mb-8">
                  <div className="text-sm" style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>
                    Awarded on
                  </div>
                  <div
                    className="text-lg font-semibold mt-1"
                    style={{ color: '#1e3a5f', fontFamily: 'Georgia, serif' }}
                  >
                    {formattedDate}
                  </div>
                </div>

                {/* Signature line */}
                <div className="flex items-end justify-center gap-8 sm:gap-16 mt-12 flex-wrap">
                  <div className="text-center">
                    <div className="w-48 border-b border-gray-400 mb-2" />
                    <div className="text-xs uppercase tracking-wider text-gray-500">Instructor</div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b border-gray-400 mb-2" />
                    <div className="text-xs uppercase tracking-wider text-gray-500">Date</div>
                  </div>
                </div>
              </div>

              {/* Verification code */}
              <div className="mt-8 text-center">
                <p className="text-[10px] tracking-wider text-gray-500 dark:text-gray-400" style={{ fontFamily: 'monospace' }}>
                  Verification ID: {verificationId}
                </p>
              </div>

              {/* Bottom decorative line */}
              <div className="flex items-center justify-center mt-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <div className="mx-4">
                  <svg aria-hidden="true" className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
