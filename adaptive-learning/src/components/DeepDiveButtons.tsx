'use client';

import { useState } from 'react';
import { renderMarkdown } from '@/lib/renderMarkdown';

interface DeepDiveButtonsProps {
  chapterId: number;
  sectionId: string;
  blockTitle: string;
  blockBody: string;
  onAskQuestion?: (blockTitle: string, blockBody: string) => void;
}

type DiveType = 'dive_deeper' | 'real_world_example';

export default function DeepDiveButtons({
  chapterId,
  sectionId,
  blockTitle,
  blockBody,
  onAskQuestion,
}: DeepDiveButtonsProps) {
  const [expandedType, setExpandedType] = useState<DiveType | null>(null);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleClick(type: DiveType) {
    // Toggle if already showing this type
    if (expandedType === type && responses[type]) {
      setExpandedType(null);
      return;
    }

    // If we already have the response cached, just show it
    if (responses[type]) {
      setExpandedType(type);
      return;
    }

    setExpandedType(type);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          sectionId,
          type,
          blockTitle,
          blockBody,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setResponses((prev) => ({ ...prev, [type]: data.content }));
      setLoading(false);
    } catch {
      setError('Failed to load content. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Button Row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleClick('dive_deeper')}
          aria-expanded={expandedType === 'dive_deeper'}
          className={`text-sm px-3 py-2.5 sm:py-1.5 min-h-[44px] rounded-lg border transition-colors flex items-center gap-1.5 ${
            expandedType === 'dive_deeper'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
          }`}
        >
          <span>🔍</span> Dive Deeper
        </button>
        <button
          onClick={() => handleClick('real_world_example')}
          aria-expanded={expandedType === 'real_world_example'}
          className={`text-sm px-3 py-2.5 sm:py-1.5 min-h-[44px] rounded-lg border transition-colors flex items-center gap-1.5 ${
            expandedType === 'real_world_example'
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'
          }`}
        >
          <span>💡</span> Real-World Example
        </button>
        {onAskQuestion && (
          <button
            onClick={() => onAskQuestion(blockTitle, blockBody)}
            className="text-sm px-3 py-2.5 sm:py-1.5 min-h-[44px] rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors flex items-center gap-1.5"
          >
            <span>💬</span> Ask a Question
          </button>
        )}
      </div>

      {/* Expansion Area */}
      {expandedType && (
        <div className="mt-3 overflow-hidden">
          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {expandedType === 'dive_deeper' ? 'Generating deeper explanation...' : 'Finding a great example...'}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!loading && !error && responses[expandedType] && (
            <div className={`rounded-lg p-5 border ${
              expandedType === 'dive_deeper'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
            }`}>
              <h4 className={`text-sm font-semibold mb-2 ${
                expandedType === 'dive_deeper' ? 'text-indigo-800 dark:text-indigo-300' : 'text-amber-800 dark:text-amber-300'
              }`}>
                {expandedType === 'dive_deeper' ? '🔍 Deeper Explanation' : '💡 Real-World Example'}
              </h4>
              <div className={`text-sm ${
                expandedType === 'dive_deeper' ? 'text-indigo-900 dark:text-indigo-200' : 'text-amber-900 dark:text-amber-200'
              }`}>
                {renderMarkdown(responses[expandedType])}
              </div>
              <button
                onClick={() => setExpandedType(null)}
                className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
