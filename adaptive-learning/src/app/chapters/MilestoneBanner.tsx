'use client';

import { useState, useEffect } from 'react';

interface MilestoneBannerProps {
  milestone: {
    type: string;
    title: string;
    message: string;
  } | null;
}

const gradientMap: Record<string, string> = {
  'first-section': 'from-blue-500 to-blue-600',
  'chapter-complete': 'from-green-500 to-green-600',
  'quarter': 'from-indigo-500 to-indigo-600',
  'half': 'from-purple-500 to-purple-600',
  'three-quarter': 'from-amber-500 to-amber-600',
  'course-complete': 'from-yellow-400 via-amber-500 to-yellow-500',
};

const iconColorMap: Record<string, string> = {
  'first-section': 'text-blue-200',
  'chapter-complete': 'text-green-200',
  'quarter': 'text-indigo-200',
  'half': 'text-purple-200',
  'three-quarter': 'text-amber-200',
  'course-complete': 'text-yellow-200',
};

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M7.73 9.728a6.726 6.726 0 002.748 1.35m3.044 0a6.726 6.726 0 002.749-1.35m0 0a15.353 15.353 0 01-4.27.602c-1.465 0-2.9-.146-4.27-.602" />
    </svg>
  );
}

function StarBurstIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

export default function MilestoneBanner({ milestone }: MilestoneBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!milestone) return;

    const dismissedKey = `milestone-dismissed-${milestone.type}`;
    if (sessionStorage.getItem(dismissedKey)) return;

    setVisible(true);
  }, [milestone]);

  const handleDismiss = () => {
    if (milestone) {
      sessionStorage.setItem(`milestone-dismissed-${milestone.type}`, 'true');
    }
    setVisible(false);
  };

  if (!milestone || !visible) return null;

  const gradient = gradientMap[milestone.type] || 'from-blue-500 to-blue-600';
  const iconColor = iconColorMap[milestone.type] || 'text-blue-200';
  const isCourseComplete = milestone.type === 'course-complete';

  return (
    <div className={`mb-6 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg overflow-hidden animate-slideDown`} role="alert">
      <div className="relative px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
        {isCourseComplete && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-2 -left-2 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute top-1 right-20 w-8 h-8 bg-white/10 rounded-full" />
          </div>
        )}

        <div className={`flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center ${isCourseComplete ? 'ring-2 ring-white/40' : ''}`}>
          {isCourseComplete ? (
            <StarBurstIcon className={`w-7 h-7 ${iconColor}`} />
          ) : (
            <TrophyIcon className={`w-7 h-7 ${iconColor}`} />
          )}
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <h3 className="font-bold text-base sm:text-lg">{milestone.title}</h3>
          <p className="text-white/90 text-xs sm:text-sm">{milestone.message}</p>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors relative z-10"
          aria-label="Dismiss milestone banner"
        >
          <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
