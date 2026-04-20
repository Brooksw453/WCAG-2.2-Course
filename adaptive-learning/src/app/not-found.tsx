import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-white/20 mb-2" aria-hidden="true">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-blue-100 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/chapters"
          className="inline-block px-6 py-3 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
