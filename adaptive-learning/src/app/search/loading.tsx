export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50" role="status" aria-label="Loading">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse" />
            <div>
              <div className="h-6 w-40 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-56 bg-white/10 rounded mt-1 animate-pulse" />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
