import { courseConfig } from '@/lib/course.config';

/**
 * Displays proper attribution for OER/Creative Commons content.
 * Required by CC BY 4.0: attribution must appear on every page view.
 *
 * Two variants:
 * - "footer" (default): compact single-line for page footers
 * - "full": expanded block with all attribution details
 */
export default function Attribution({ variant = 'footer' }: { variant?: 'footer' | 'full' }) {
  const attr = courseConfig.attribution;
  if (!attr?.enabled) return null;

  if (variant === 'full') {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Attribution</p>
        <p>
          This course adapts content from{' '}
          <a href={attr.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">
            {attr.sourceTitle}
          </a>{' '}
          by {attr.sourceAuthors}, {attr.sourcePublisher}, licensed under{' '}
          <a href={attr.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">
            {attr.license}
          </a>.
        </p>
        {attr.adaptationNote && (
          <p className="mt-2">{attr.adaptationNote}</p>
        )}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          {attr.accessLine}
        </p>
      </div>
    );
  }

  // Compact footer variant
  return (
    <footer className="print:hidden text-center py-4 px-4 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-800">
      Content adapted from{' '}
      <a href={attr.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">
        {attr.sourceTitle}
      </a>{' '}
      by {attr.sourceAuthors} ({attr.sourcePublisher}) |{' '}
      <a href={attr.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">
        {attr.license}
      </a>{' '}
      | {attr.accessLine}
    </footer>
  );
}
