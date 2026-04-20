'use client';

import { useState } from 'react';

interface RemediationContent {
  title: string;
  introduction: string;
  explanations: {
    concept: string;
    explanation: string;
    example: string;
    tip: string;
  }[];
  summary: string;
}

interface RemediationPanelProps {
  chapterId: number;
  sectionId: string;
  missedQuestionIds: string[];
  studentAnswers?: Record<string, number>;
  quizScore: number;
  passThreshold: number;
  remediationCount: number;
  onReadyToRetry: () => void;
  onSkip?: () => void;
}

export default function RemediationPanel({
  chapterId,
  sectionId,
  missedQuestionIds,
  studentAnswers,
  quizScore,
  passThreshold,
  remediationCount,
  onReadyToRetry,
  onSkip,
}: RemediationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<RemediationContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasReadContent, setHasReadContent] = useState(false);

  const canSkip = remediationCount >= 3;

  async function generateRemediation() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/remediation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          sectionId,
          missedQuestionIds,
          studentAnswers,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setContent(data.remediation);
      setLoading(false);
    } catch (err) {
      setError('Failed to load supplementary content. Please try again.');
      setLoading(false);
      console.error(err);
    }
  }

  // Auto-generate on first render
  if (!content && !loading && !error) {
    generateRemediation();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📖</div>
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300">
              Let&apos;s Review Together
            </h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
              You scored {Math.round(quizScore)}% on the quiz (need {passThreshold}% to pass).
              {remediationCount > 1
                ? ` This is attempt ${remediationCount}. `
                : ' '}
              Here&apos;s some extra help with the concepts you missed.
            </p>
            {canSkip && (
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-2 font-medium">
                You&apos;ve shown great dedication with {remediationCount} attempts! You can move ahead to the writing section
                where you&apos;ll demonstrate your understanding in your own words — that&apos;s a great way to solidify these concepts.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generating personalized study material...</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">This takes a few seconds</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <button
            onClick={generateRemediation}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Remediation Content */}
      {content && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            {/* Title */}
            <div className="bg-blue-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">{content.title}</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Introduction */}
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                {content.introduction}
              </p>

              {/* Explanations */}
              {content.explanations.map((item, index) => (
                <div key={index} className="border-l-4 border-blue-400 pl-5 space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.concept}
                  </h4>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {item.explanation}
                  </div>

                  {/* Real-world Example */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                          Real-World Example
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">{item.example}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🔑</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                          Key Takeaway
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">{item.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Quick Summary
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {content.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={hasReadContent}
                onChange={(e) => setHasReadContent(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              I&apos;ve reviewed the material above
            </label>

            <div className="flex gap-3">
              {canSkip && onSkip && (
                <button
                  onClick={onSkip}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Continue to Written Response
                </button>
              )}
              <button
                onClick={onReadyToRetry}
                disabled={!hasReadContent}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retake the Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
