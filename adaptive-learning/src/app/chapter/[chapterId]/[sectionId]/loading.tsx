export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Sticky header skeleton */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse flex-shrink-0" />
            <div className="h-1 w-1 bg-gray-300 rounded-full flex-shrink-0" />
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 w-1/3 bg-gray-200 animate-pulse" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Section title skeleton */}
        <div className="mb-8">
          <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Content area skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Quiz / action area skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
