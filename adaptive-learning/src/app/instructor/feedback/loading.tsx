export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="h-7 w-44 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-72 bg-white/10 rounded animate-pulse mt-1" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Average rating card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <div className="h-12 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mx-auto" />
          </div>

          {/* Rating distribution card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 bg-gray-200 rounded-full h-3 animate-pulse" />
                  <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Feedback cards skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
