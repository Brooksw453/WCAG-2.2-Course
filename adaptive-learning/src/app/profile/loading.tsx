export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl" />
              <div>
                <div className="h-6 w-32 bg-white/20 rounded mb-1" />
                <div className="h-4 w-48 bg-white/10 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-white/20 rounded" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Account Info skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-44 bg-gray-200 rounded mb-4" />
          <div className="space-y-4">
            <div>
              <div className="h-4 w-12 bg-gray-200 rounded mb-1" />
              <div className="h-5 w-48 bg-gray-100 rounded" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
              <div className="h-5 w-36 bg-gray-100 rounded" />
            </div>
            <div>
              <div className="h-4 w-10 bg-gray-200 rounded mb-1" />
              <div className="h-5 w-16 bg-gray-100 rounded" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
              <div className="h-5 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

        {/* Password skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
          <div className="space-y-4 max-w-md">
            <div className="h-9 w-full bg-gray-100 rounded-lg" />
            <div className="h-9 w-full bg-gray-100 rounded-lg" />
            <div className="h-9 w-32 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mx-auto mb-2" />
                <div className="h-7 w-10 bg-gray-200 rounded mx-auto mb-1" />
                <div className="h-4 w-28 bg-gray-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded mb-4" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </main>
    </div>
  );
}
