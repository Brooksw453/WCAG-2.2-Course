export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="h-7 w-40 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-48 bg-white/10 rounded animate-pulse mt-1" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="h-9 w-10 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse mt-1" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link skeleton */}
        <div className="mb-6">
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Final Grade card skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-2" />
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grade breakdown cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chapter grades table skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment grades table skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="h-6 w-44 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
