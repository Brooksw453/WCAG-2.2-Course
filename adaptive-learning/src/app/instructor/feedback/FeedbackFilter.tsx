'use client';

import { useState } from 'react';

interface FeedbackItem {
  id: string;
  studentName: string;
  triggerPoint: string;
  triggerLabel: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface TriggerOption {
  value: string;
  label: string;
}

interface FeedbackFilterProps {
  feedbackList: FeedbackItem[];
  triggerPoints: TriggerOption[];
}

export default function FeedbackFilter({ feedbackList, triggerPoints }: FeedbackFilterProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<string>('all');

  const filtered = selectedTrigger === 'all'
    ? feedbackList
    : feedbackList.filter(f => f.triggerPoint === selectedTrigger);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Feedback</h2>
        <label htmlFor="trigger-filter" className="sr-only">Filter by trigger point</label>
        <select
          id="trigger-filter"
          value={selectedTrigger}
          onChange={(e) => setSelectedTrigger(e.target.value)}
          aria-label="Filter by trigger point"
          className="w-full sm:w-auto text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Trigger Points</option>
          {triggerPoints.map(tp => (
            <option key={tp.value} value={tp.value}>{tp.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          No feedback found for this filter.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map(f => (
            <div key={f.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{f.studentName}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {f.triggerLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= f.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        viewBox="0 0 24 24"
                        fill={star <= f.rating ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={star <= f.rating ? 0 : 1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    ))}
                  </div>
                  {f.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{f.comment}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(f.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
