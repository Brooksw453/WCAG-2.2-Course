'use client';

interface DownloadPDFButtonProps {
  /** CSS selector for the element to capture (not used currently — prints full page) */
  targetSelector?: string;
  /** Output filename suggestion */
  filename?: string;
  /** Button label */
  label?: string;
  className?: string;
}

export default function DownloadPDFButton({
  label = 'Download as PDF',
  className = '',
}: DownloadPDFButtonProps) {
  function handleDownload() {
    // Trigger browser print dialog — user can "Save as PDF"
    // The print stylesheets are already optimized for clean PDF output
    window.print();
  }

  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  );
}
