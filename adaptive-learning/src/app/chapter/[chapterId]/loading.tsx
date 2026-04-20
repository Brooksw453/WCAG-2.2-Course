export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Header skeleton */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mt-1" />
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      {/* Chapter navigation bar skeleton */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-1.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress overview skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 animate-pulse" />
        </div>

        {/* Section cards skeleton */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
