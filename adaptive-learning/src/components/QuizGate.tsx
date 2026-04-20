'use client';

import { useState } from 'react';
import type { GateQuiz } from '@/lib/types';

interface QuizGateProps {
  quiz: GateQuiz;
  chapterId: number;
  sectionId: string;
  onResult: (passed: boolean, score: number, missedQuestionIds?: string[], studentAnswers?: Record<string, number>) => void;
}

export default function QuizGate({ quiz, chapterId, sectionId, onResult }: QuizGateProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: Record<string, number>;
  } | null>(null);

  const allAnswered = quiz.questions.length > 0 && Object.keys(answers).length === quiz.questions.length;

  async function handleSubmit() {
    if (!allAnswered) return;
    setLoading(true);

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          sectionId,
          answers,
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error('Quiz submission error:', data.error);
        setLoading(false);
        return;
      }

      setResults({
        score: data.score,
        passed: data.passed,
        correctAnswers: data.correctAnswers,
      });
      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setLoading(false);
    }
  }

  function handleContinue() {
    if (results) {
      // Find which questions the student got wrong
      const missedIds = quiz.questions
        .filter((q) => answers[q.id] !== results.correctAnswers[q.id])
        .map((q) => q.id);
      onResult(results.passed, results.score, missedIds, answers);
    }
  }

  if (quiz.questions.length === 0) {
    // No quiz questions for this section — auto-pass
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <p className="text-green-800 dark:text-green-300 font-medium">
          No quiz for this section. You can proceed to the written response.
        </p>
        <button
          onClick={() => onResult(true, 100)}
          className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Knowledge Check
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''} &bull; {quiz.passThreshold}% to pass
        </span>
      </div>

      {quiz.questions.map((question, qIndex) => {
        const selectedOption = answers[question.id];
        const isCorrect = results ? results.correctAnswers[question.id] === selectedOption : null;
        const correctIdx = results?.correctAnswers[question.id];

        return (
          <div
            key={question.id}
            className={`border rounded-lg p-5 transition-colors ${
              submitted
                ? isCorrect
                  ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30'
                  : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <p id={`question-${question.id}`} className="font-medium text-gray-900 dark:text-white mb-4">
              {qIndex + 1}. {question.question}
            </p>

            <div className="space-y-2" role="radiogroup" aria-labelledby={`question-${question.id}`}>
              {question.options.map((option, oIndex) => {
                const isSelected = selectedOption === oIndex;
                const isCorrectOption = submitted && correctIdx === oIndex;
                const isWrongSelection = submitted && isSelected && !isCorrectOption;

                return (
                  <label
                    key={oIndex}
                    className={`flex items-center gap-3 p-3 min-h-[44px] rounded-lg border cursor-pointer transition-all ${
                      submitted
                        ? isCorrectOption
                          ? 'border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-900/40'
                          : isWrongSelection
                            ? 'border-red-400 bg-red-100 dark:border-red-600 dark:bg-red-900/40'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60'
                        : isSelected
                          ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${submitted ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={isSelected}
                      onChange={() => {
                        if (!submitted) {
                          setAnswers((prev) => ({ ...prev, [question.id]: oIndex }));
                        }
                      }}
                      disabled={submitted}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className={`flex-1 ${
                      submitted && isCorrectOption ? 'font-semibold text-green-800 dark:text-green-300' :
                      submitted && isWrongSelection ? 'text-red-800 dark:text-red-300' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.text}
                    </span>
                    {submitted && isCorrectOption && (
                      <svg className="w-5 h-5 text-green-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {submitted && isWrongSelection && (
                      <svg className="w-5 h-5 text-red-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Show explanation after submission */}
            {submitted && question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit / Results */}
      {!submitted ? (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      ) : results && (
        <div className={`rounded-lg p-6 text-center ${
          results.passed ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
        }`}>
          <div className="text-3xl font-bold mb-2 dark:text-white">
            {Math.round(results.score)}%
          </div>
          <p className={`text-lg font-medium mb-4 ${
            results.passed ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'
          }`}>
            {results.passed
              ? 'Great job! You passed the knowledge check.'
              : 'You need a bit more review. Let\'s go over the material again.'
            }
          </p>
          <button
            onClick={handleContinue}
            className={`px-6 py-3 font-medium rounded-lg shadow-sm transition-colors text-white ${
              results.passed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {results.passed ? 'Continue to Written Response' : 'Review Material'}
          </button>
        </div>
      )}
    </div>
  );
}
