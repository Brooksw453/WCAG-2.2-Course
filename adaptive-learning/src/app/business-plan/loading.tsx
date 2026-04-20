export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="h-7 w-56 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress bar skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex justify-between mb-3">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 animate-pulse" />
        </div>

        {/* Executive Summary textarea skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-32 w-full bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mt-2" />
        </div>

        {/* Introduction textarea skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-32 w-full bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mt-2" />
        </div>

        {/* Assignment parts skeleton */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
