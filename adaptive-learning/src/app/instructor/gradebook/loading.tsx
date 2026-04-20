export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-label="Loading" role="status">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 w-36 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-64 bg-white/10 rounded animate-pulse mt-1" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-9 w-36 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mx-auto mt-2" />
            </div>
          ))}
        </div>

        {/* Grade distribution skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex items-end gap-3 h-24">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="h-3 w-4 bg-gray-200 rounded animate-pulse" />
                <div
                  className="w-full bg-gray-200 rounded-t-md animate-pulse"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
                <div className="h-3 w-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Student grades table skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['w-36', 'w-20', 'w-20', 'w-24', 'w-16', 'w-12'].map((w, i) => (
                    <th key={i} className="text-left py-3 px-4">
                      <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {['w-32', 'w-16', 'w-16', 'w-20', 'w-12', 'w-8'].map((w, j) => (
                      <td key={j} className="py-3 px-4">
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
