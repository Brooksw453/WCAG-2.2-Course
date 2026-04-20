export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 w-56 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-72 bg-white/10 rounded animate-pulse mt-1" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="h-9 w-28 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto mt-2" />
            </div>
          ))}
        </div>

        {/* Classes section skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements section skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Student roster table skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['w-32', 'w-48', 'w-20', 'w-20', 'w-20'].map((w, i) => (
                    <th key={i} className="text-left py-3 px-2">
                      <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {['w-28', 'w-40', 'w-16', 'w-16', 'w-16'].map((w, j) => (
                      <td key={j} className="py-3 px-2">
                        <div className={`h-4 ${w} bg-gray-100 rounded animate-pulse`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
