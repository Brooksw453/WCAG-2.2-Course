'use client';

import { useState, useCallback, useMemo } from 'react';
import type { FreeTextPrompt as FreeTextPromptType } from '@/lib/types';
import type { TTSBlock } from '@/hooks/useTextToSpeech';
import MicrophoneButton from '@/components/MicrophoneButton';
import TTSController from '@/components/TTSController';
import { courseConfig } from '@/lib/course.config';

interface FreeTextPromptProps {
  prompt: FreeTextPromptType;
  chapterId: number;
  sectionId: string;
  onResult: (passed: boolean, score: number) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function FreeTextPrompt({
  prompt,
  chapterId,
  sectionId,
  onResult,
}: FreeTextPromptProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState(false);
  const [showTTS, setShowTTS] = useState(false);

  const ttsBlocks: TTSBlock[] = useMemo(() => [{
    label: 'Written Response Prompt',
    text: prompt.prompt,
  }], [prompt.prompt]);

  const wordCount = countWords(response);
  const meetsMinimum = wordCount >= prompt.minWords;
  const passed = evaluation ? evaluation.score >= courseConfig.thresholds.freeTextPass : false;

  // Mic glow hint counter (Improvement 1)
  const [micHintCount, setMicHintCount] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('mic-hint-count') || '0', 10);
    }
    return 0;
  });

  const handleMicTranscript = useCallback((text: string) => {
    setResponse(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
    // Increment mic hint counter
    setMicHintCount(prev => {
      if (prev < 3) {
        const newCount = prev + 1;
        localStorage.setItem('mic-hint-count', String(newCount));
        return newCount;
      }
      return prev;
    });
  }, []);

  async function handleSubmit() {
    if (!meetsMinimum) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/free-text/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          sectionId,
          promptId: prompt.id,
          responseText: response,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setEvaluation(data.evaluation);
      setLoading(false);
    } catch (err) {
      setError('Failed to evaluate response. Please try again.');
      setLoading(false);
      console.error(err);
    }
  }

  function handleContinue() {
    if (evaluation) {
      onResult(passed, evaluation.score);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Written Response
          </h3>
          {courseConfig.features.textToSpeech && (
            <button
              onClick={() => setShowTTS(!showTTS)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showTTS
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600 animate-listen-glow'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              {showTTS ? 'Close Player' : 'Listen'}
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Demonstrate your understanding by responding to the prompt below.
          Your response will be evaluated by AI. You need {courseConfig.thresholds.freeTextPass}% or higher to proceed.
        </p>
      </div>

      {/* Prompt */}
      <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-5">
        <p className="text-indigo-900 dark:text-indigo-200 leading-relaxed">{prompt.prompt}</p>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
          Minimum {prompt.minWords} words required.
        </p>
      </div>

      {/* Evaluation Criteria */}
      {prompt.rubric && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRubric(!showRubric)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              What we&apos;re looking for
            </span>
            <svg className={`w-4 h-4 transition-transform ${showRubric ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showRubric && (
            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{prompt.rubric}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Focus on demonstrating understanding — spelling and grammar are not graded.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Response textarea */}
      <div>
        <label htmlFor="free-text-response" className="sr-only">Your written response</label>
        <div className="relative">
          <textarea
            id="free-text-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={!!evaluation}
            rows={8}
            aria-describedby="word-count"
            className="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400 resize-y text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 text-base sm:text-sm"
            placeholder="Type or tap the mic to speak your response..."
          />
          <MicrophoneButton
            onTranscript={handleMicTranscript}
            disabled={!!evaluation}
            className="absolute top-3 right-3"
            showStatus
          />
        </div>
        <div className="flex justify-between mt-2">
          <span id="word-count" className={`text-sm ${meetsMinimum ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
            {!meetsMinimum && ` (${prompt.minWords - wordCount} more needed)`}
          </span>
        </div>
        {micHintCount < 3 && (
          <p className="text-xs text-blue-400 mt-1 text-right">Tap the mic to speak your response</p>
        )}
      </div>

      {error && (
        <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit button */}
      {!evaluation && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!meetsMinimum || loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Evaluating...
              </span>
            ) : (
              'Submit for Evaluation'
            )}
          </button>
        </div>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div role="status" aria-live="polite" className={`rounded-lg border p-6 ${
          passed ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              {passed ? '✅ Well done!' : '📝 Needs improvement'}
            </h4>
            <span className={`text-2xl font-bold ${
              passed ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
            }`}>
              {evaluation.score}%
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">{evaluation.feedback}</p>

          {evaluation.strengths.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">Strengths:</h5>
              <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.improvements.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">Areas for improvement:</h5>
              <ul className="list-disc list-inside text-sm text-orange-700 dark:text-orange-400 space-y-1">
                {evaluation.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            {passed ? (
              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Complete Section
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEvaluation(null);
                    setError(null);
                  }}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                >
                  Revise & Resubmit
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TTS Controller - fixed bottom bar */}
      {showTTS && (
        <TTSController
          blocks={ttsBlocks}
          mediaTitle="Written Response"
          autoPlay
          onClose={() => setShowTTS(false)}
        />
      )}
    </div>
  );
}
