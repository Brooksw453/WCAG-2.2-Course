export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" aria-label="Loading" role="status">
      <div className="max-w-2xl w-full">
        {/* Certificate card skeleton */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 sm:p-12 text-center">
          {/* Badge icon placeholder */}
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse mx-auto mb-6" />

          {/* Title placeholder */}
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
          <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mx-auto mb-8" />

          {/* Divider */}
          <div className="h-px w-full bg-gray-200 mb-8" />

          {/* Student name placeholder */}
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mx-auto mb-2" />
          <div className="h-7 w-56 bg-gray-200 rounded animate-pulse mx-auto mb-6" />

          {/* Course info placeholder */}
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mx-auto mb-2" />
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse mx-auto mb-8" />

          {/* Grade section placeholder */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Date and buttons placeholder */}
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mx-auto mb-6" />
          <div className="flex justify-center gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
